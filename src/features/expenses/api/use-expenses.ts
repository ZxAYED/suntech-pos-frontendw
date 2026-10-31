"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { apiClient } from "@/lib/api-client";
import { useTenantScope } from "@/features/tenant/hooks/use-tenant-scope";
import type { RootState } from "@/redux/types";

export type ExpenseCategory =
  | "RENT"
  | "UTILITIES"
  | "SALARIES"
  | "SUPPLIES"
  | "MAINTENANCE"
  | "MARKETING"
  | "TRANSPORT"
  | "INVENTORY"
  | "PERSONAL_DRAWING"
  | "OTHER";

export interface ExpenseRecord {
  id: string;
  amount: number;
  title: string;
  category: ExpenseCategory;
  note?: string | null;
  spentAt: string;
  locationId?: string | null;
  businessId: string;
  createdAt: string;
  location?: { id: string; name: string } | null;
  user?: { id: string; fullName: string; publicId: string | null } | null;
}

export interface ExpenseFilters {
  month?: number;
  year?: number;
  locationId?: string;
  category?: ExpenseCategory;
  search?: string;
  businessId?: string;
}

export interface ExpenseSummaryParams {
  month?: number;
  year?: number;
  locationId?: string;
  category?: ExpenseCategory;
  businessId?: string;
}

export interface MonthlyExpenseSummary {
  month: number;
  year: number;
  summary: {
    totalExpenses: number;
    expenseCount: number;
    byCategory: Array<{
      category: ExpenseCategory;
      total: number;
      count: number;
    }>;
  };
  items: ExpenseRecord[];
}

export interface CreateExpenseInput {
  amount: number;
  title: string;
  category?: ExpenseCategory;
  note?: string;
  spentAt?: string;
  locationId?: string;
  businessId?: string;
}

export const expenseKeys = {
  all: ["expenses"] as const,
  list: (userId: string, filters: ExpenseFilters) => ["expenses", userId, "list", filters] as const,
  summary: (userId: string, params: ExpenseSummaryParams) =>
    ["expenses", userId, "summary", params] as const,
};

function useUserId() {
  return useSelector((state: RootState) => state.auth.user?.id ?? "anonymous");
}

export interface ExpensesResponse {
  items: ExpenseRecord[];
  totalCount: number;
  totalAmount: number;
}

export function useExpenses(filters: ExpenseFilters = {}, enabled = true) {
  const userId = useUserId();
  const tenant = useTenantScope("admin");

  const queryParams: Record<string, unknown> = {};
  if (filters.month) queryParams.month = filters.month;
  if (filters.year) queryParams.year = filters.year;
  if (filters.category) queryParams.category = filters.category;
  if (filters.search?.trim()) queryParams.search = filters.search.trim();
  if (filters.locationId || tenant.locationId) {
    queryParams.locationId = filters.locationId || tenant.locationId;
  }
  if (filters.businessId || tenant.businessId) {
    queryParams.businessId = filters.businessId || tenant.businessId;
  }

  return useQuery({
    queryKey: expenseKeys.list(userId, queryParams),
    queryFn: async ({ signal }) => {
      const res = await apiClient.get<ExpensesResponse>("/expenses", {
        params: queryParams,
        signal,
      });
      return res.data ?? { items: [], totalCount: 0, totalAmount: 0 };
    },
    enabled: enabled && userId !== "anonymous" && tenant.isTenantReady,
    staleTime: 30_000,
  });
}

export function useExpenseSummary(params: ExpenseSummaryParams = {}, enabled = true) {
  const userId = useUserId();
  const tenant = useTenantScope("admin");
  const now = new Date();
  const month = params.month ?? now.getMonth() + 1;
  const year = params.year ?? now.getFullYear();

  const queryParams: Record<string, unknown> = {
    month,
    year,
  };
  if (params.category) queryParams.category = params.category;
  if (params.locationId || tenant.locationId) {
    queryParams.locationId = params.locationId || tenant.locationId;
  }
  if (params.businessId || tenant.businessId) {
    queryParams.businessId = params.businessId || tenant.businessId;
  }

  return useQuery({
    queryKey: expenseKeys.summary(userId, queryParams),
    queryFn: async ({ signal }) => {
      const res = await apiClient.get<MonthlyExpenseSummary>("/expenses/summary", {
        params: queryParams,
        signal,
      });
      return res.data;
    },
    enabled: enabled && userId !== "anonymous" && tenant.isTenantReady,
    staleTime: 30_000,
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  const tenant = useTenantScope("admin");

  return useMutation({
    mutationFn: async (input: CreateExpenseInput) => {
      const payload = {
        ...input,
        businessId: input.businessId || tenant.businessId,
        locationId: input.locationId || tenant.locationId,
      };
      const res = await apiClient.post<ExpenseRecord>("/expenses", payload);
      return res.data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["expenses"] }),
        queryClient.invalidateQueries({ queryKey: ["reports"] }),
      ]);
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();
  const tenant = useTenantScope("admin");

  return useMutation({
    mutationFn: async ({ id, businessId }: { id: string; businessId?: string }) => {
      const res = await apiClient.delete<{ id: string; deletedAt: string }>(`/expenses/${id}`, {
        params: {
          businessId: businessId || tenant.businessId,
        },
      });
      return res.data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["expenses"] }),
        queryClient.invalidateQueries({ queryKey: ["reports"] }),
      ]);
    },
  });
}
