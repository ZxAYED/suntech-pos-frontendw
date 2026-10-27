"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { mockAdvances, mockPayrollRecords } from "@/mocks/payroll/data";
import { useMockQuery } from "@/mocks/query";
import { apiClient } from "@/lib/api-client";
import type { RootState } from "@/redux/types";
import type { AccountStatus, Cashier } from "@/types/domain";
import { mapAdvanceToAdvanceRow, mapCashierToStaffRow, mapPayrollToPayrollRow } from "@/features/hr/view-models";

export interface StaffFilters {
  businessId?: string;
  locationId?: string;
  search?: string;
  status?: AccountStatus;
}

export interface CreateCashierInput {
  fullName: string;
  email?: string;
  phoneNumber?: string;
  password: string;
  locationId: string;
  monthlySalary: number;
}

export interface UpdateCashierInput {
  id: string;
  fullName?: string;
  phoneNumber?: string;
  password?: string;
  locationId?: string;
  monthlySalary?: number;
}

export const staffKeys = {
  all: (userId: string) => ["staff", userId] as const,
  list: (userId: string, filters: StaffFilters) => ["staff", userId, "list", filters] as const,
};

function useStaffUserId() {
  return useSelector((state: RootState) => state.auth.user?.id ?? "anonymous");
}

export function useStaff(filters: StaffFilters = {}, enabled = true) {
  const userId = useStaffUserId();
  return useQuery({
    queryKey: staffKeys.list(userId, filters),
    queryFn: async ({ signal }) => {
      const cashiers = (await apiClient.get<Cashier[]>("/users/cashiers", { params: filters, signal })).data;
      return cashiers.map(mapCashierToStaffRow);
    },
    enabled: enabled && userId !== "anonymous" && Boolean(filters.businessId),
  });
}

function useStaffMutation<TVariables>(mutationFn: (variables: TVariables) => Promise<unknown>) {
  const userId = useStaffUserId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: staffKeys.all(userId) }),
        queryClient.invalidateQueries({ queryKey: ["shifts"] }),
        queryClient.invalidateQueries({ queryKey: ["payroll"] }),
      ]);
    },
  });
}

export const useCreateCashier = () => useStaffMutation(async (body: CreateCashierInput) =>
  (await apiClient.post<Cashier>("/users/cashiers", body)).data,
);

export const useUpdateCashier = () => useStaffMutation(async ({ id, ...body }: UpdateCashierInput) =>
  (await apiClient.patch<Cashier>(`/users/cashiers/${id}`, body)).data,
);

export const useUpdateCashierStatus = () => useStaffMutation(async ({ id, status, statusReason }: { id: string; status: "ACTIVE" | "SUSPENDED" | "REJECTED"; statusReason?: string }) =>
  (await apiClient.patch<Cashier>(`/users/${id}/status`, { status, statusReason })).data,
);

export const useDeleteCashier = () => useStaffMutation(async (id: string) =>
  (await apiClient.delete<{ id: string; deletedAt: string }>(`/users/cashiers/${id}`)).data,
);

// Payroll remains a later phase. Its current preview can consume the real staff roster
// without reintroducing fake cashier accounts on the production staff screen.
export function useMockStaff(search = "") {
  const businessId = useSelector((state: RootState) => state.tenant.selectedBusiness?.id);
  const query = useStaff({ businessId, search: search || undefined }, Boolean(businessId));
  return { ...query, data: query.data ?? [] };
}

export function useMockPayroll() {
  return useMockQuery(mockPayrollRecords.map(mapPayrollToPayrollRow));
}

export function useMockAdvances() {
  return useMockQuery(mockAdvances.map(mapAdvanceToAdvanceRow));
}
