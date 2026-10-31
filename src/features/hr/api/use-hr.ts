"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { apiClient } from "@/lib/api-client";
import { useTenantScope } from "@/features/tenant/hooks/use-tenant-scope";
import type { RootState } from "@/redux/types";
import type { AccountStatus, Cashier } from "@/types/domain";
import {
  mapCashierToStaffRow,
  type AdvanceRowViewModel,
  type PayrollRowViewModel,
} from "@/features/hr/view-models";

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

export interface PayrollPeriodParams {
  month?: number;
  year?: number;
  locationId?: string;
  businessId?: string;
}

export interface ProcessPayrollInput {
  cashierId: string;
  month: number;
  year: number;
  businessId?: string;
  idempotencyKey?: string;
}

export interface DisbursePayrollInput {
  month: number;
  year: number;
  locationId?: string;
  businessId?: string;
  idempotencyKey?: string;
}

export interface AdvanceFilters {
  locationId?: string;
  cashierId?: string;
  month?: number;
  year?: number;
  status?: "PENDING" | "DEDUCTED";
  businessId?: string;
}

export interface CreateAdvanceInput {
  amount: number;
  reason?: string;
  idempotencyKey?: string;
}

interface PayrollEmployeePayload {
  id: string;
  employeeName: string;
  employeeCode?: string;
  role?: string;
  baseSalary?: number;
  advancesDeducted?: number;
  netPay?: number;
  status?: "PAID" | "DUE";
  paidAt?: string | null;
}

interface PayrollSummaryResponse {
  totalMonthlyPayroll?: number;
  disbursementStatus?: string;
  totalStaff?: number;
  month: number;
  year: number;
  employees?: PayrollEmployeePayload[];
}

interface PayrollHistoryItem {
  id: string;
  cashierId: string;
  month: number;
  year: number;
  baseSalary: number;
  totalAdvancesDeducted: number;
  netPaid: number;
  status: string;
  createdAt: string;
  cashier?: { id: string; fullName: string; publicId: string | null } | null;
}

interface AdvanceBackendItem {
  id: string;
  cashierId: string;
  amount: number;
  reason?: string | null;
  note?: string | null;
  takenAt?: string | null;
  createdAt?: string;
  status?: "ACTIVE" | "VOIDED" | "SETTLED" | "PENDING" | "DEDUCTED";
  cashier?: { id: string; fullName: string; publicId: string | null } | null;
  cashierName?: string | null;
}

export const hrKeys = {
  staff: (userId: string, filters: StaffFilters) => ["staff", userId, "list", filters] as const,
  payrollSummary: (userId: string, params: PayrollPeriodParams) =>
    ["payroll", userId, "summary", params] as const,
  payrollHistory: (userId: string, params: PayrollPeriodParams) =>
    ["payroll", userId, "history", params] as const,
  advances: (userId: string, filters: AdvanceFilters) =>
    ["advances", userId, "list", filters] as const,
  advancesSummary: (userId: string, params: Record<string, unknown>) =>
    ["advances", userId, "summary", params] as const,
};

function useUserId() {
  return useSelector((state: RootState) => state.auth.user?.id ?? "anonymous");
}

export function useStaff(filters: StaffFilters = {}, enabled = true) {
  const userId = useUserId();
  return useQuery({
    queryKey: hrKeys.staff(userId, filters),
    queryFn: async ({ signal }) => {
      const cashiers = (
        await apiClient.get<Cashier[]>("/users/cashiers", { params: filters, signal })
      ).data;
      return cashiers.map(mapCashierToStaffRow);
    },
    enabled: enabled && userId !== "anonymous" && Boolean(filters.businessId),
  });
}

function useStaffMutation<TVariables>(mutationFn: (variables: TVariables) => Promise<unknown>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["staff"] }),
        queryClient.invalidateQueries({ queryKey: ["shifts"] }),
        queryClient.invalidateQueries({ queryKey: ["payroll"] }),
      ]);
    },
  });
}

export const useCreateCashier = () =>
  useStaffMutation(async (body: CreateCashierInput) =>
    (await apiClient.post<Cashier>("/users/cashiers", body)).data,
  );

export const useUpdateCashier = () =>
  useStaffMutation(async ({ id, ...body }: UpdateCashierInput) =>
    (await apiClient.patch<Cashier>(`/users/cashiers/${id}`, body)).data,
  );

export const useUpdateCashierStatus = () =>
  useStaffMutation(
    async ({
      id,
      status,
      statusReason,
    }: {
      id: string;
      status: "ACTIVE" | "SUSPENDED" | "REJECTED";
      statusReason?: string;
    }) =>
      (
        await apiClient.patch<Cashier>(`/users/${id}/status`, {
          status,
          statusReason,
        })
      ).data,
  );

export const useDeleteCashier = () =>
  useStaffMutation(async (id: string) =>
    (await apiClient.delete<{ id: string; deletedAt: string }>(`/users/cashiers/${id}`)).data,
  );

export function usePayrollSummary(params?: PayrollPeriodParams, enabled = true) {
  const userId = useUserId();
  const tenant = useTenantScope("admin");
  const now = new Date();
  const month = params?.month ?? now.getMonth() + 1;
  const year = params?.year ?? now.getFullYear();

  const queryParams: Record<string, unknown> = {
    month,
    year,
  };
  if (params?.locationId || tenant.locationId) {
    queryParams.locationId = params?.locationId || tenant.locationId;
  }
  if (params?.businessId || tenant.businessId) {
    queryParams.businessId = params?.businessId || tenant.businessId;
  }

  return useQuery({
    queryKey: hrKeys.payrollSummary(userId, queryParams),
    queryFn: async ({ signal }) => {
      const res = await apiClient.get<PayrollSummaryResponse>("/payroll/summary", {
        params: queryParams,
        signal,
      });
      const data = res.data;
      const employees = data?.employees || [];
      const rows: PayrollRowViewModel[] = employees.map((emp) => {
        const date = new Date(year, month - 1, 1);
        return {
          id: emp.id,
          cashierId: emp.id,
          employeeName: emp.employeeName,
          employeePublicId: emp.employeeCode,
          periodLabel: date.toLocaleDateString("en-BD", { month: "long", year: "numeric" }),
          baseSalary: emp.baseSalary ?? 0,
          advancesTotal: emp.advancesDeducted ?? 0,
          netPayable: emp.netPay ?? 0,
          processed: emp.status === "PAID",
          status: emp.status,
          paidAt: emp.paidAt ?? undefined,
          disbursedAt: emp.paidAt ?? undefined,
        };
      });

      return {
        totalMonthlyPayroll: data?.totalMonthlyPayroll ?? 0,
        disbursementStatus: data?.disbursementStatus ?? "PENDING",
        totalStaff: data?.totalStaff ?? employees.length,
        month,
        year,
        rows,
      };
    },
    enabled: enabled && userId !== "anonymous" && tenant.isTenantReady,
  });
}

export function usePayrollHistory(params?: PayrollPeriodParams, enabled = true) {
  const userId = useUserId();
  const tenant = useTenantScope("admin");

  const queryParams: Record<string, unknown> = {};
  if (params?.month) queryParams.month = params.month;
  if (params?.year) queryParams.year = params.year;
  if (params?.locationId || tenant.locationId) {
    queryParams.locationId = params?.locationId || tenant.locationId;
  }
  if (params?.businessId || tenant.businessId) {
    queryParams.businessId = params?.businessId || tenant.businessId;
  }

  return useQuery({
    queryKey: hrKeys.payrollHistory(userId, queryParams),
    queryFn: async ({ signal }) => {
      const res = await apiClient.get<PayrollHistoryItem[]>("/payroll/history", {
        params: queryParams,
        signal,
      });
      return res.data.map((record) => {
        const date = new Date(record.year, record.month - 1, 1);
        return {
          id: record.id,
          cashierId: record.cashierId,
          employeeName: record.cashier?.fullName || "Employee",
          employeePublicId: record.cashier?.publicId ?? undefined,
          periodLabel: date.toLocaleDateString("en-BD", { month: "long", year: "numeric" }),
          baseSalary: record.baseSalary,
          advancesTotal: record.totalAdvancesDeducted,
          netPayable: record.netPaid,
          processed: true,
          disbursedAt: record.createdAt,
        } as PayrollRowViewModel;
      });
    },
    enabled: enabled && userId !== "anonymous" && tenant.isTenantReady,
  });
}

export function useProcessPayroll() {
  const queryClient = useQueryClient();
  const tenant = useTenantScope("admin");

  return useMutation({
    mutationFn: async (dto: ProcessPayrollInput) => {
      const { idempotencyKey, ...rest } = dto;
      const payload = {
        ...rest,
        businessId: rest.businessId || tenant.businessId,
      };
      const key = idempotencyKey || globalThis.crypto.randomUUID();
      const res = await apiClient.post<Record<string, unknown>>("/payroll/process", payload, {
        headers: {
          "Idempotency-Key": key,
        },
      });
      return res.data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["payroll"] }),
        queryClient.invalidateQueries({ queryKey: ["advances"] }),
      ]);
    },
  });
}

export function useDisbursePayroll() {
  const queryClient = useQueryClient();
  const tenant = useTenantScope("admin");

  return useMutation({
    mutationFn: async (dto: DisbursePayrollInput) => {
      const { idempotencyKey, ...rest } = dto;
      const payload = {
        ...rest,
        businessId: rest.businessId || tenant.businessId,
        locationId: rest.locationId || tenant.locationId,
      };
      const key = idempotencyKey || globalThis.crypto.randomUUID();
      const res = await apiClient.post<Record<string, unknown>>("/payroll/disburse", payload, {
        headers: {
          "Idempotency-Key": key,
        },
      });
      return res.data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["payroll"] }),
        queryClient.invalidateQueries({ queryKey: ["advances"] }),
      ]);
    },
  });
}

export interface AdvancesSummaryData {
  totalActiveAdvances: number;
  pendingCount: number;
  deductedCount: number;
}

export interface AdvancesResponse {
  items: AdvanceRowViewModel[];
  summary: AdvancesSummaryData;
}

export function useAdvances(filters?: AdvanceFilters, enabled = true) {
  const userId = useUserId();
  const tenant = useTenantScope();

  const queryParams: Record<string, unknown> = {};
  if (filters?.cashierId) queryParams.cashierId = filters.cashierId;
  if (filters?.month) queryParams.month = filters.month;
  if (filters?.year) queryParams.year = filters.year;
  if (filters?.status) queryParams.status = filters.status;
  if (tenant.isAdmin) {
    if (filters?.locationId || tenant.locationId) {
      queryParams.locationId = filters?.locationId || tenant.locationId;
    }
    if (filters?.businessId || tenant.businessId) {
      queryParams.businessId = filters?.businessId || tenant.businessId;
    }
  }

  return useQuery<AdvancesResponse>({
    queryKey: hrKeys.advances(userId, queryParams),
    queryFn: async ({ signal }): Promise<AdvancesResponse> => {
      const res = await apiClient.get<unknown>("/advances", {
        params: queryParams,
        signal,
      });
      const data = res.data as { items?: AdvanceBackendItem[]; summary?: AdvancesSummaryData } | AdvanceBackendItem[] | undefined;
      const rawList = Array.isArray(data)
        ? data
        : Array.isArray(data?.items)
          ? data.items
          : [];

      const items: AdvanceRowViewModel[] = rawList.map((adv): AdvanceRowViewModel => ({
        id: String(adv.id),
        cashierId: String(adv.cashierId),
        cashierName: (adv as { employeeName?: string }).employeeName || adv.cashier?.fullName || adv.cashierName || undefined,
        amount: Number(adv.amount),
        note: adv.reason || adv.note || undefined,
        createdAt: String(adv.takenAt || adv.createdAt || new Date().toISOString()),
        status: adv.status,
      }));

      const summary: AdvancesSummaryData = (data && "summary" in data && data.summary) ? data.summary : {
        totalActiveAdvances: items.filter((a) => a.status === "PENDING").reduce((s, a) => s + a.amount, 0),
        pendingCount: items.filter((a) => a.status === "PENDING").length,
        deductedCount: items.filter((a) => a.status === "DEDUCTED").length,
      };

      return { items, summary };
    },
    enabled: enabled && userId !== "anonymous" && (tenant.isAdmin ? tenant.isTenantReady : true),
  });
}

export function useCreateAdvance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreateAdvanceInput) => {
      const { amount, reason, idempotencyKey } = dto;
      const key = idempotencyKey || globalThis.crypto.randomUUID();
      const res = await apiClient.post<Record<string, unknown>>("/advances", { amount, reason }, {
        headers: {
          "Idempotency-Key": key,
        },
      });
      return res.data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["advances"] }),
        queryClient.invalidateQueries({ queryKey: ["payroll"] }),
      ]);
    },
  });
}

export function useDeleteAdvance() {
  const queryClient = useQueryClient();
  const tenant = useTenantScope("admin");

  return useMutation({
    mutationFn: async ({ id, businessId }: { id: string; businessId?: string }) => {
      const res = await apiClient.delete<Record<string, unknown>>(`/advances/${id}`, {
        params: {
          businessId: businessId || tenant.businessId,
        },
      });
      return res.data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["advances"] }),
        queryClient.invalidateQueries({ queryKey: ["payroll"] }),
      ]);
    },
  });
}

