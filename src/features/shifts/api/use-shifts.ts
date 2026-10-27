"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { mapShiftToViewModel, type ShiftApiRecord } from "@/features/shifts/view-models";
import { apiClient } from "@/lib/api-client";
import type { RootState } from "@/redux/types";
import { ApiClientError } from "@/types/api";

export interface ShiftScope { businessId?: string; locationId?: string }
export interface ShiftFilters extends ShiftScope { status?: "OPEN" | "CLOSED"; page?: number; limit?: number }
interface ShiftListResponse { data: ShiftApiRecord[]; meta: { total: number; page: number; limit: number; totalPages: number } }

export const shiftKeys = {
  all: (userId: string) => ["shifts", userId] as const,
  active: (userId: string) => ["shifts", userId, "active"] as const,
  list: (userId: string, filters: ShiftFilters) => ["shifts", userId, "list", filters] as const,
};

function useShiftUserId() {
  return useSelector((state: RootState) => state.auth.user?.id ?? "anonymous");
}

export function useActiveShift(enabled = true) {
  const userId = useShiftUserId();
  return useQuery({
    queryKey: shiftKeys.active(userId),
    queryFn: async ({ signal }) => {
      try {
        const shift = (await apiClient.get<ShiftApiRecord>("/shifts/active", { signal })).data;
        return mapShiftToViewModel(shift);
      } catch (error) {
        if (error instanceof ApiClientError && error.status === 404) return null;
        throw error;
      }
    },
    enabled: enabled && userId !== "anonymous",
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
}

export function useShifts(filters: ShiftFilters = {}, enabled = true) {
  const userId = useShiftUserId();
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
  const userId = useShiftUserId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: shiftKeys.all(userId) }),
        queryClient.invalidateQueries({ queryKey: ["orders"] }),
        queryClient.invalidateQueries({ queryKey: ["reports"] }),
      ]);
    },
  });
}

export const useOpenShift = () => useShiftMutation(async ({ idempotencyKey, ...body }: { startingAmount: number; locationId?: string; autoClosePrevious?: boolean; idempotencyKey: string }) =>
  mapShiftToViewModel((await apiClient.post<ShiftApiRecord>("/shifts/open", body, { headers: { "Idempotency-Key": idempotencyKey } })).data),
);

export const useCloseShift = () => useShiftMutation(async ({ idempotencyKey, ...body }: { closingAmount: number; notes?: string; idempotencyKey: string }) =>
  mapShiftToViewModel((await apiClient.post<ShiftApiRecord>("/shifts/close", body, { headers: { "Idempotency-Key": idempotencyKey } })).data),
);

// Kept temporarily for the Phase 9/10 dashboard caller; data is real.
export function useShiftRows() {
  const query = useShifts({ page: 1, limit: 10 });
  return { ...query, data: query.data?.rows ?? [] };
}
