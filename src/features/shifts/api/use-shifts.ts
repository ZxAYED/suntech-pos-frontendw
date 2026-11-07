"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCurrentUserId } from "@/features/auth/hooks/use-current-user-id";
import { mapShiftToViewModel, type ShiftApiRecord } from "@/features/shifts/view-models";
import { apiClient } from "@/lib/api-client";
import { createIdempotencyKey, idempotencyHeaders } from "@/lib/idempotency";
import { ApiClientError } from "@/types/api";

export interface ShiftScope { businessId?: string; locationId?: string }
export interface ShiftFilters extends ShiftScope {
  status?: "OPEN" | "CLOSED";
  cashierId?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}
interface ShiftListResponse { data: ShiftApiRecord[]; meta: { total: number; page: number; limit: number; totalPages: number } }

export const shiftKeys = {
  all: (userId: string) => ["shifts", userId] as const,
  active: (userId: string, scope?: string | ShiftScope) => ["shifts", userId, "active", scope] as const,
  list: (userId: string, filters: ShiftFilters) => ["shifts", userId, "list", filters] as const,
};

export function useActiveShift(
  scopeOrLocationIdOrEnabled?: string | ShiftScope | boolean,
  enabled = true,
) {
  const userId = useCurrentUserId();
  const scope: ShiftScope =
    typeof scopeOrLocationIdOrEnabled === "string"
      ? { locationId: scopeOrLocationIdOrEnabled }
      : typeof scopeOrLocationIdOrEnabled === "object" && scopeOrLocationIdOrEnabled !== null
        ? scopeOrLocationIdOrEnabled
        : {};
  const isEnabled =
    typeof scopeOrLocationIdOrEnabled === "boolean"
      ? scopeOrLocationIdOrEnabled
      : enabled;

  const queryParams: Record<string, unknown> = {};
  if (scope.locationId) queryParams.locationId = scope.locationId;
  if (scope.businessId) queryParams.businessId = scope.businessId;

  return useQuery({
    queryKey: shiftKeys.active(userId, scope),
    queryFn: async ({ signal }) => {
      try {
        const shift = (
          await apiClient.get<ShiftApiRecord>("/shifts/active", {
            params: Object.keys(queryParams).length > 0 ? queryParams : undefined,
            signal,
          })
        ).data;
        return mapShiftToViewModel(shift);
      } catch (error) {
        if (error instanceof ApiClientError && error.status === 404) return null;
        throw error;
      }
    },
    enabled: isEnabled && userId !== "anonymous",
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
}

export function useShifts(filters: ShiftFilters = {}, enabled = true) {
  const userId = useCurrentUserId();
  return useQuery({
    queryKey: shiftKeys.list(userId, filters),
    queryFn: async ({ signal }) => {
      const result = (await apiClient.get<ShiftListResponse>("/shifts", { params: filters, signal })).data;
      return { rows: result.data.map(mapShiftToViewModel), meta: result.meta };
    },
    enabled: enabled && userId !== "anonymous",
  });
}

function useShiftMutation<TVariables>(mutationFn: (variables: TVariables) => Promise<unknown>) {
  const userId = useCurrentUserId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: shiftKeys.all(userId) }),
        queryClient.invalidateQueries({ queryKey: ["orders"] }),
        queryClient.invalidateQueries({ queryKey: ["reports"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] }),
      ]);
    },
  });
}

export const useOpenShift = () => useShiftMutation(async ({ idempotencyKey, ...body }: { startingAmount: number; locationId?: string; businessId?: string; autoClosePrevious?: boolean; idempotencyKey?: string }) => {
  const key = idempotencyKey || createIdempotencyKey();
  return mapShiftToViewModel((await apiClient.post<ShiftApiRecord>("/shifts/open", body, { headers: idempotencyHeaders(key) })).data);
});

export interface CloseShiftInput {
  shiftId?: string;
  closingAmount?: number;
  actualCash?: number;
  notes?: string;
  businessId?: string;
  idempotencyKey?: string;
}

export const useCloseShift = () =>
  useShiftMutation(async ({ idempotencyKey, shiftId, ...body }: CloseShiftInput) => {
    const cash = body.actualCash ?? body.closingAmount ?? 0;
    const payload = {
      ...body,
      actualCash: cash,
      closingAmount: body.closingAmount ?? cash,
    };
    const path = shiftId ? `/shifts/${shiftId}/close` : "/shifts/close";
    const key = idempotencyKey || createIdempotencyKey();
    return mapShiftToViewModel(
      (
        await apiClient.post<ShiftApiRecord>(
          path,
          payload,
          { headers: idempotencyHeaders(key) },
        )
      ).data,
    );
  });

// Dashboard and terminal shift telemetry; data is real.
export function useShiftRows(scope?: ShiftScope) {
  const query = useShifts({ page: 1, limit: 10, ...scope });
  return { ...query, data: query.data?.rows ?? [] };
}
