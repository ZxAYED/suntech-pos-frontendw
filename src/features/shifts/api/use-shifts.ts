"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCurrentUserId } from "@/features/auth/hooks/use-current-user-id";
import {
  mapShiftToViewModel,
  type ShiftApiRecord,
  type ShiftViewModel,
} from "@/features/shifts/view-models";
import { apiClient } from "@/lib/api-client";
import { createIdempotencyKey, idempotencyHeaders } from "@/lib/idempotency";
import { ApiClientError } from "@/types/api";
import { useOffline } from "@/features/offline/ui/offline-provider";
import { offlineDb } from "@/features/offline/db/offline-db";
import { rememberActiveShift, readSavedActiveShift } from "@/features/offline/services/active-shift";
import { OfflineError } from "@/features/offline/core/scope";

export interface ShiftScope {
  businessId?: string;
  locationId?: string;
}
export interface ShiftFilters extends ShiftScope {
  status?: "OPEN" | "CLOSED";
  cashierId?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}
interface ShiftListResponse {
  data: ShiftApiRecord[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export const shiftKeys = {
  all: (userId: string) => ["shifts", userId] as const,
  active: (userId: string, scope?: string | ShiftScope) =>
    ["shifts", userId, "active", scope] as const,
  list: (userId: string, filters: ShiftFilters) =>
    ["shifts", userId, "list", filters] as const,
};

export function useActiveShift(
  scopeOrLocationIdOrEnabled?: string | ShiftScope | boolean,
  enabled = true,
) {
  const userId = useCurrentUserId();
  const offline = useOffline();
  const scope: ShiftScope =
    typeof scopeOrLocationIdOrEnabled === "string"
      ? { locationId: scopeOrLocationIdOrEnabled }
      : typeof scopeOrLocationIdOrEnabled === "object" &&
          scopeOrLocationIdOrEnabled !== null
        ? scopeOrLocationIdOrEnabled
        : {};
  const isEnabled =
    typeof scopeOrLocationIdOrEnabled === "boolean"
      ? scopeOrLocationIdOrEnabled
      : enabled;

  const queryParams: Record<string, unknown> = {};
  if (scope.locationId) queryParams.locationId = scope.locationId;
  if (scope.businessId) queryParams.businessId = scope.businessId;

  const localScope = offline.scope && (!scope.businessId || scope.businessId === offline.scope.businessId) && (!scope.locationId || scope.locationId === offline.scope.locationId) ? offline.scope : null;
  const query = useQuery({
    queryKey: [...shiftKeys.active(userId, scope), offline.mode],
    queryFn: async ({ signal }) => {
      if (offline.mode === "OFFLINE") {
        if (!localScope) throw new OfflineError("SHIFT_SCOPE_MISMATCH", "Choose the prepared branch to read its last known shift.");
        return { ...await readSavedActiveShift(offlineDb, localScope), source: "LOCAL" as const, cacheError: null };
      }
      const requestStartedAt=Date.now();
      let shift: ShiftViewModel | null;
      try {
        const raw = (
          await apiClient.get<ShiftApiRecord>("/shifts/active", {
            params:
              Object.keys(queryParams).length > 0 ? queryParams : undefined,
            signal,
          })
        ).data;
        shift = mapShiftToViewModel(raw);
      } catch (error) {
        if (error instanceof ApiClientError && error.status === 404) shift = null;
        else throw error;
      }
      let cacheError: string | null = null;
      if (localScope) {
        try { shift=await rememberActiveShift(offlineDb, localScope, shift,requestStartedAt); }
        catch (cause) { cacheError = cause instanceof Error ? cause.message : "Shift could not be saved for offline use."; }
      }
      return { shift, known: true, savedAt: null, source: "SERVER" as const, cacheError };
    },
    enabled: isEnabled && userId !== "anonymous",
    networkMode: "always",
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
  return { ...query, data: query.data?.shift, lastKnown: query.data?.source === "LOCAL", known: query.data?.known ?? false, savedAt: query.data?.savedAt, cacheError: query.data?.cacheError };
}

export function useShifts(filters: ShiftFilters = {}, enabled = true) {
  const userId = useCurrentUserId();
  return useQuery({
    queryKey: shiftKeys.list(userId, filters),
    queryFn: async ({ signal }) => {
      const result = (
        await apiClient.get<ShiftListResponse>("/shifts", {
          params: filters,
          signal,
        })
      ).data;
      return { rows: result.data.map(mapShiftToViewModel), meta: result.meta };
    },
    enabled: enabled && userId !== "anonymous",
  });
}

function useShiftMutation<TVariables>(
  mutationFn: (variables: TVariables) => Promise<unknown>,
) {
  const userId = useCurrentUserId();
  const queryClient = useQueryClient();
  const offline = useOffline();
  return useMutation({
    networkMode: "always",
    mutationFn: async (variables: TVariables) => {
      if (offline.mode === "OFFLINE" || (typeof navigator !== "undefined" && !navigator.onLine)) throw new OfflineError("SHIFT_REQUIRES_CONNECTION", "Opening or closing a shift needs the server. No shift change has been queued.");
      return mutationFn(variables);
    },
    onSuccess: async result => {
      const shift = result as ShiftViewModel;
      const tasks: Promise<unknown>[] = [
        queryClient.invalidateQueries({ queryKey: shiftKeys.all(userId) }),
        queryClient.invalidateQueries({ queryKey: ["orders"] }),
        queryClient.invalidateQueries({ queryKey: ["reports"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] }),
      ];
      if (offline.scope && shift?.locationId === offline.scope.locationId) tasks.push(rememberActiveShift(offlineDb, offline.scope, shift.status === "OPEN" ? shift : null));
      await Promise.allSettled(tasks);
    },
  });
}

export const useOpenShift = () =>
  useShiftMutation(
    async ({
      idempotencyKey,
      ...body
    }: {
      startingAmount: number;
      locationId?: string;
      businessId?: string;
      autoClosePrevious?: boolean;
      idempotencyKey?: string;
    }) => {
      const key = idempotencyKey || createIdempotencyKey();
      return mapShiftToViewModel(
        (
          await apiClient.post<ShiftApiRecord>("/shifts/open", body, {
            headers: idempotencyHeaders(key),
          })
        ).data,
      );
    },
  );

export interface CloseShiftInput {
  shiftId?: string;
  closingAmount?: number;
  actualCash?: number;
  notes?: string;
  businessId?: string;
  idempotencyKey?: string;
}

export const useCloseShift = () =>
  useShiftMutation(
    async ({ idempotencyKey, shiftId, ...body }: CloseShiftInput) => {
      const rawAmount = body.actualCash ?? body.closingAmount;
      if (rawAmount === undefined || rawAmount === null || Number.isNaN(Number(rawAmount))) {
        throw new Error("Counted closing cash amount is required to close shift.");
      }
      const cash = Math.round(Number(rawAmount));
      if (cash < 0) {
        throw new Error("Counted closing cash amount cannot be negative.");
      }
      const payload = {
        ...body,
        actualCash: cash,
        closingAmount: cash,
      };
      const path = shiftId ? `/shifts/${shiftId}/close` : "/shifts/close";
      const key = idempotencyKey || createIdempotencyKey();
      return mapShiftToViewModel(
        (
          await apiClient.post<ShiftApiRecord>(path, payload, {
            headers: idempotencyHeaders(key),
          })
        ).data,
      );
    },
  );

// Dashboard and terminal shift telemetry; data is real.
export function useShiftRows(scope?: ShiftScope) {
  const query = useShifts({ page: 1, limit: 10, ...scope });
  return { ...query, data: query.data?.rows ?? [] };
}
