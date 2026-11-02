"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCurrentUserId } from "@/features/auth/hooks/use-current-user-id";
import { apiClient } from "@/lib/api-client";
import { createIdempotencyKey, idempotencyHeaders } from "@/lib/idempotency";
import { useTenantScope } from "@/features/tenant/hooks/use-tenant-scope";

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

export type ExpenseSourceType = "MANUAL" | "PAYROLL_NET";

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
  sourceType?: ExpenseSourceType;
  type?: ExpenseSourceType;
  payrollId?: string | null;
  location?: { id: string; name: string } | null;
  user?: { id: string; fullName: string; publicId: string | null } | null;
}

export interface ExpenseFilters {
  month?: number;
  year?: number;
  locationId?: string;
  category?: ExpenseCategory;
  type?: ExpenseSourceType;
  search?: string;
  businessId?: string;
}

export interface ExpenseSummaryParams {
  month?: number;
  year?: number;
  locationId?: string;
  category?: ExpenseCategory;
  type?: ExpenseSourceType;
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
    byType?: Array<{
      type: ExpenseSourceType;
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
  idempotencyKey?: string;
}

export const expenseKeys = {
  all: ["expenses"] as const,
  list: (userId: string, filters: ExpenseFilters) => ["expenses", userId, "list", filters] as const,
  summary: (userId: string, params: ExpenseSummaryParams) =>
    ["expenses", userId, "summary", params] as const,
};

export interface ExpensesResponse {
  items: ExpenseRecord[];
  totalCount: number;
  totalAmount: number;
}

export function useExpenses(filters: ExpenseFilters = {}, enabled = true) {
  const userId = useCurrentUserId();
  const tenant = useTenantScope("admin");

  const queryParams: Record<string, unknown> = {};
  if (filters.month) queryParams.month = filters.month;
  if (filters.year) queryParams.year = filters.year;
  if (filters.category) queryParams.category = filters.category;
  if (filters.type) queryParams.type = filters.type;
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

export function normalizeMonthlyExpenseSummary(
  raw: unknown,
  fallbackMonth: number,
  fallbackYear: number,
): MonthlyExpenseSummary {
  if (!raw || typeof raw !== "object") {
    return {
      month: fallbackMonth,
      year: fallbackYear,
      summary: {
        totalExpenses: 0,
        expenseCount: 0,
        byCategory: [],
        byType: [],
      },
      items: [],
    };
  }

  const data = raw as Record<string, unknown>;
  const nestedSummary = (data.summary && typeof data.summary === "object" ? data.summary : null) as Record<string, unknown> | null;

  const totalExpenses = Number(
    data.totalExpenses ?? nestedSummary?.totalExpenses ?? 0,
  );
  const expenseCount = Number(
    data.totalCount ?? nestedSummary?.expenseCount ?? (Array.isArray(data.items) ? data.items.length : 0),
  );

  const rawByCategory = (nestedSummary?.byCategory ?? data.byCategory) as unknown;
  let byCategory: Array<{ category: ExpenseCategory; total: number; count: number }> = [];

  if (Array.isArray(rawByCategory)) {
    byCategory = rawByCategory.map((item) => ({
      category: (item?.category ?? "OTHER") as ExpenseCategory,
      total: Number(item?.total ?? 0),
      count: Number(item?.count ?? 1),
    }));
  } else if (rawByCategory && typeof rawByCategory === "object") {
    byCategory = Object.entries(rawByCategory).map(([cat, val]) => ({
      category: cat as ExpenseCategory,
      total: Number(val ?? 0),
      count: 1,
    }));
  }

  const rawByType = (nestedSummary?.byType ?? data.byType) as unknown;
  let byType: Array<{ type: ExpenseSourceType; total: number; count: number }> = [];

  if (Array.isArray(rawByType)) {
    byType = rawByType.map((item) => ({
      type: (item?.type ?? "MANUAL") as ExpenseSourceType,
      total: Number(item?.total ?? 0),
      count: Number(item?.count ?? 1),
    }));
  } else if (rawByType && typeof rawByType === "object") {
    byType = Object.entries(rawByType).map(([typ, val]) => ({
      type: typ as ExpenseSourceType,
      total: Number(val ?? 0),
      count: 1,
    }));
  }

  return {
    month: Number(data.month ?? fallbackMonth),
    year: Number(data.year ?? fallbackYear),
    summary: {
      totalExpenses,
      expenseCount,
      byCategory,
      byType,
    },
    items: Array.isArray(data.items) ? (data.items as ExpenseRecord[]) : [],
  };
}

export function useExpenseSummary(params: ExpenseSummaryParams = {}, enabled = true) {
  const userId = useCurrentUserId();
  const tenant = useTenantScope("admin");
  const now = new Date();
  const month = params.month ?? now.getMonth() + 1;
  const year = params.year ?? now.getFullYear();

  const queryParams: Record<string, unknown> = {
    month,
    year,
  };
  if (params.category) queryParams.category = params.category;
  if (params.type) queryParams.type = params.type;
  if (params.locationId || tenant.locationId) {
    queryParams.locationId = params.locationId || tenant.locationId;
  }
  if (params.businessId || tenant.businessId) {
    queryParams.businessId = params.businessId || tenant.businessId;
  }

  return useQuery({
    queryKey: expenseKeys.summary(userId, queryParams),
    queryFn: async ({ signal }) => {
      const res = await apiClient.get<unknown>("/expenses/summary", {
        params: queryParams,
        signal,
      });
      return normalizeMonthlyExpenseSummary(res.data, month, year);
    },
    enabled: enabled && userId !== "anonymous" && tenant.isTenantReady,
    staleTime: 30_000,
  });
}

export interface UpdateExpenseInput {
  id: string;
  amount?: number;
  title?: string;
  category?: ExpenseCategory;
  note?: string;
  spentAt?: string;
  locationId?: string | null;
  businessId?: string;
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  const tenant = useTenantScope("admin");

  return useMutation({
    mutationFn: async (input: CreateExpenseInput) => {
      const { idempotencyKey, ...rest } = input;
      const payload = {
        ...rest,
        businessId: rest.businessId || tenant.businessId,
        locationId: rest.locationId || tenant.locationId,
      };
      const key = idempotencyKey || createIdempotencyKey();
      const res = await apiClient.post<ExpenseRecord>("/expenses", payload, {
        headers: idempotencyHeaders(key),
      });
      return res.data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["expenses"] }),
        queryClient.invalidateQueries({ queryKey: ["reports"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] }),
      ]);
    },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();
  const tenant = useTenantScope("admin");

  return useMutation({
    mutationFn: async (input: UpdateExpenseInput) => {
      const { id, ...data } = input;
      const payload = {
        ...data,
        businessId: data.businessId || tenant.businessId,
        locationId: data.locationId !== undefined ? data.locationId : (tenant.locationId || undefined),
      };
      const res = await apiClient.patch<ExpenseRecord>(`/expenses/${id}`, payload);
      return res.data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["expenses"] }),
        queryClient.invalidateQueries({ queryKey: ["reports"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] }),
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
        queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] }),
      ]);
    },
  });
}
