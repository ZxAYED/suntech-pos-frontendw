"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useCurrentUserId } from "@/features/auth/hooks/use-current-user-id";
import { apiClient } from "@/lib/api-client";
import { useTenantScope } from "@/features/tenant/hooks/use-tenant-scope";
import { mapOrderToOrderRow } from "@/features/pos/view-models";
import { getBusinessDateParts } from "@/lib/business-time";
import type { CategoryMetric, DashboardSummary, Order, PaymentMethod } from "@/types/domain";

export interface ReportDateParams {
  range?: string;
  month?: string | number;
  week?: string | number;
  year?: number | string;
  businessId?: string;
  locationId?: string;
}

export interface TransactionReportFilters extends ReportDateParams {
  search?: string;
  page?: number;
  limit?: number;
}

export interface ReportsDashboardData {
  summary: DashboardSummary;
  categories: CategoryMetric[];
  recentTickets?: unknown[];
}

export interface ExportReportParams {
  type: "sales" | "payroll";
  format: "csv" | "pdf";
  range?: string;
  month?: number | string;
  week?: number | string;
  year?: number;
  search?: string;
  locationId?: string;
  businessId?: string;
}

interface RawPaymentBreakdown {
  cashAmount?: number;
  cashPercentage?: number;
  byMethod?: {
    BKASH?: number;
    NAGAD?: number;
    BANK?: number;
  };
}

interface RawCategoryItem {
  id?: string;
  name?: string;
  revenue?: number;
  quantity?: number;
  percentage?: number;
}

interface RawDashboardPayload {
  periodRevenue?: number;
  globalDailyRevenue?: number;
  grossRevenue?: number;
  averageTicketValue?: number;
  ordersCount?: number;
  grossMarginPercent?: number;
  paymentBreakdown?: RawPaymentBreakdown;
  topCategories?: RawCategoryItem[];
  recentTickets?: unknown[];
  myDailyRevenue?: number;
  myMonthlyRevenue?: number;
  myDailyUnitsSold?: number;
  myDailyOrdersCount?: number;
}

export const reportKeys = {
  all: ["reports"] as const,
  dashboard: (userId: string, params: Record<string, unknown>) =>
    ["reports", userId, "dashboard", params] as const,
  analytics: (userId: string, params: Record<string, unknown>) =>
    ["reports", userId, "analytics", params] as const,
  transactions: (userId: string, params: Record<string, unknown>) =>
    ["reports", userId, "transactions", params] as const,
};

function mapDashboardPayload(raw: RawDashboardPayload | null | undefined): ReportsDashboardData {
  if (!raw) {
    return {
      summary: {
        grossSales: 0,
        averageTicket: 0,
        orderCount: 0,
        grossMargin: 0,
        paymentBreakdown: [],
      },
      categories: [],
    };
  }

  // Handle Admin Dashboard payload
  if ("periodRevenue" in raw || "globalDailyRevenue" in raw) {
    const grossSales = raw.periodRevenue ?? raw.globalDailyRevenue ?? 0;
    const paymentBreakdown = raw.paymentBreakdown
      ? [
          {
            method: "COD" as PaymentMethod,
            amount: raw.paymentBreakdown.cashAmount ?? 0,
            percentage: raw.paymentBreakdown.cashPercentage ?? 0,
          },
          {
            method: "BKASH" as PaymentMethod,
            amount: raw.paymentBreakdown.byMethod?.BKASH ?? 0,
            percentage: Math.round(
              ((raw.paymentBreakdown.byMethod?.BKASH ?? 0) / (grossSales || 1)) * 100,
            ),
          },
          {
            method: "NAGAD" as PaymentMethod,
            amount: raw.paymentBreakdown.byMethod?.NAGAD ?? 0,
            percentage: Math.round(
              ((raw.paymentBreakdown.byMethod?.NAGAD ?? 0) / (grossSales || 1)) * 100,
            ),
          },
          {
            method: "BANK" as PaymentMethod,
            amount: raw.paymentBreakdown.byMethod?.BANK ?? 0,
            percentage: Math.round(
              ((raw.paymentBreakdown.byMethod?.BANK ?? 0) / (grossSales || 1)) * 100,
            ),
          },
        ]
      : [];

    const categories: CategoryMetric[] = (raw.topCategories || []).map((cat, idx) => ({
      categoryId: cat.id || cat.name || String(idx),
      categoryName: cat.name || "General",
      revenue: cat.revenue ?? 0,
      quantity: cat.quantity ?? 0,
      percentage: cat.percentage ?? 0,
    }));

    return {
      summary: {
        grossSales,
        averageTicket: raw.averageTicketValue ?? 0,
        orderCount: raw.ordersCount ?? 0,
        grossMargin: raw.grossMarginPercent ?? 0,
        paymentBreakdown,
      },
      categories,
      recentTickets: raw.recentTickets,
    };
  }

  // Handle Analytics payload
  if ("grossRevenue" in raw) {
    const grossSales = raw.grossRevenue ?? 0;
    const paymentBreakdown = raw.paymentBreakdown
      ? [
          {
            method: "COD" as PaymentMethod,
            amount: raw.paymentBreakdown.cashAmount ?? 0,
            percentage: raw.paymentBreakdown.cashPercentage ?? 0,
          },
          {
            method: "BKASH" as PaymentMethod,
            amount: raw.paymentBreakdown.byMethod?.BKASH ?? 0,
            percentage: Math.round(
              ((raw.paymentBreakdown.byMethod?.BKASH ?? 0) / (grossSales || 1)) * 100,
            ),
          },
          {
            method: "NAGAD" as PaymentMethod,
            amount: raw.paymentBreakdown.byMethod?.NAGAD ?? 0,
            percentage: Math.round(
              ((raw.paymentBreakdown.byMethod?.NAGAD ?? 0) / (grossSales || 1)) * 100,
            ),
          },
          {
            method: "BANK" as PaymentMethod,
            amount: raw.paymentBreakdown.byMethod?.BANK ?? 0,
            percentage: Math.round(
              ((raw.paymentBreakdown.byMethod?.BANK ?? 0) / (grossSales || 1)) * 100,
            ),
          },
        ]
      : [];

    const categories: CategoryMetric[] = (raw.topCategories || []).map((cat, idx) => ({
      categoryId: cat.id || cat.name || String(idx),
      categoryName: cat.name || "General",
      revenue: cat.revenue ?? 0,
      quantity: cat.quantity ?? 0,
      percentage: cat.percentage ?? 0,
    }));

    return {
      summary: {
        grossSales,
        averageTicket: raw.averageTicketValue ?? 0,
        orderCount: raw.ordersCount ?? 0,
        grossMargin: raw.grossMarginPercent ?? 0,
        paymentBreakdown,
      },
      categories,
    };
  }

  // Handle Cashier dashboard payload
  const mySales = raw.myDailyRevenue ?? raw.myMonthlyRevenue ?? 0;
  const orderCount = raw.myDailyOrdersCount ?? raw.ordersCount ?? 0;
  const avgTicket = raw.averageTicketValue ?? (orderCount > 0 ? Math.round(mySales / orderCount) : 0);
  return {
    summary: {
      grossSales: mySales,
      averageTicket: avgTicket,
      orderCount,
      grossMargin: 0,
      paymentBreakdown: [],
    },
    categories: [],
  };
}

export function buildReportQueryParams(
  params?: ReportDateParams,
  tenantBusinessId?: string,
  tenantLocationId?: string,
): Record<string, unknown> {
  const queryParams: Record<string, unknown> = {};

  const businessId = params?.businessId || tenantBusinessId;
  if (businessId) {
    queryParams.businessId = businessId;
  }

  // Location handling: explicit 'all' omits locationId to query business-wide
  const locationId = params?.locationId !== undefined ? params.locationId : tenantLocationId;
  if (locationId && locationId !== "all") {
    queryParams.locationId = locationId;
  }

  if (!params) return queryParams;

  // Normalization of date parameters:
  // 1. Explicit calendar month selection
  if (params.month && params.month !== "all") {
    queryParams.month = String(params.month);
    if (params.year && String(params.year) !== "all") {
      const y = Number(params.year);
      if (!Number.isNaN(y)) queryParams.year = y;
    }
    return queryParams;
  }

  // 2. Explicit calendar week selection
  if (params.week && params.week !== "all") {
    queryParams.week = String(params.week);
    if (params.year && String(params.year) !== "all") {
      const y = Number(params.year);
      if (!Number.isNaN(y)) queryParams.year = y;
    }
    return queryParams;
  }

  // 3. Calendar year selection
  if (params.range === "year") {
    queryParams.range = "year";
    if (params.year && String(params.year) !== "all") {
      const y = Number(params.year);
      if (!Number.isNaN(y)) queryParams.year = y;
    }
    return queryParams;
  }

  // 4. Rolling presets (today, yesterday, daily, weekly, monthly, quarterly)
  if (params.range && params.range !== "all") {
    queryParams.range = params.range;
    // Omit incidental year/month/week so backend does not override rolling range with calendar year
    return queryParams;
  }

  // 5. Fallback if only year is provided
  if (params.year && String(params.year) !== "all") {
    const y = Number(params.year);
    if (!Number.isNaN(y)) queryParams.year = y;
  }

  return queryParams;
}

export function useDashboardReport(params?: ReportDateParams, enabled = true) {
  const userId = useCurrentUserId();
  const tenant = useTenantScope("admin");

  const queryParams = buildReportQueryParams(params, tenant.businessId, tenant.locationId);

  return useQuery({
    queryKey: reportKeys.dashboard(userId, queryParams),
    queryFn: async ({ signal }) => {
      const res = await apiClient.get<RawDashboardPayload>("/reports/dashboard", {
        params: queryParams,
        signal,
      });
      return mapDashboardPayload(res.data);
    },
    enabled: enabled && userId !== "anonymous" && tenant.isTenantReady,
    staleTime: 60_000,
  });
}

export function useAnalyticsReport(params?: ReportDateParams, enabled = true) {
  const userId = useCurrentUserId();
  const tenant = useTenantScope("admin");

  const queryParams = buildReportQueryParams(params, tenant.businessId, tenant.locationId);

  return useQuery({
    queryKey: reportKeys.analytics(userId, queryParams),
    queryFn: async ({ signal }) => {
      const res = await apiClient.get<RawDashboardPayload>("/reports/analytics", {
        params: queryParams,
        signal,
      });
      return mapDashboardPayload(res.data);
    },
    enabled: enabled && userId !== "anonymous" && tenant.isTenantReady,
    staleTime: 60_000,
  });
}

export function useTransactionsReport(filters?: TransactionReportFilters, enabled = true) {
  const userId = useCurrentUserId();
  const tenant = useTenantScope("admin");

  const queryParams = buildReportQueryParams(filters, tenant.businessId, tenant.locationId);
  queryParams.page = filters?.page ?? 1;
  queryParams.limit = filters?.limit ?? 20;
  if (filters?.search?.trim()) {
    queryParams.search = filters.search.trim();
  }

  return useQuery({
    queryKey: reportKeys.transactions(userId, queryParams),
    queryFn: async ({ signal }) => {
      const res = await apiClient.get<{
        total?: number;
        page?: number;
        limit?: number;
        totalPages?: number;
        items?: Order[];
      }>("/reports/transactions", {
        params: queryParams,
        signal,
      });

      const items = res.data?.items ?? [];
      const rows = items.map((order) => mapOrderToOrderRow(order));
      const total = res.data?.total ?? rows.length;
      const limit = Number(res.data?.limit ?? queryParams.limit ?? 20);
      const page = Number(res.data?.page ?? queryParams.page ?? 1);
      const totalPages = res.data?.totalPages ?? Math.max(1, Math.ceil(total / limit));

      return {
        rows,
        total,
        page,
        limit,
        totalPages,
      };
    },
    enabled: enabled && userId !== "anonymous" && tenant.isTenantReady,
    staleTime: 30_000,
  });
}

export function useExportReport() {
  const tenant = useTenantScope("admin");

  return useMutation({
    mutationFn: async (params: ExportReportParams) => {
      const dhakaParts = getBusinessDateParts(new Date());
      let month: number | undefined;
      if (params.month === "current") {
        month = dhakaParts.month;
      } else if (params.month != null && params.month !== "all") {
        const m = Number(params.month);
        if (!Number.isNaN(m) && m >= 1 && m <= 12) {
          month = m;
        }
      }

      const year = params.year ?? dhakaParts.year;
      const businessId = params.businessId ?? tenant.businessId;
      // Do not default locationId to tenant.locationId when exporting All Branches
      const locationId = params.locationId && params.locationId !== "all" ? params.locationId : undefined;

      // Backend ExportReportQueryDto only accepts numeric month and year, without range or week
      const queryParams: Record<string, unknown> = {
        type: params.type,
        format: params.format.toLowerCase(),
        year,
      };
      if (month != null) queryParams.month = month;
      if (businessId) queryParams.businessId = businessId;
      if (locationId) queryParams.locationId = locationId;
      if (params.search) queryParams.search = params.search;

      const response = await apiClient.get<Blob>("/reports/export", {
        params: queryParams,
        responseType: "blob",
      });

      const extension = params.format.toLowerCase();
      const mimeType = extension === "pdf" ? "application/pdf" : "text/csv;charset=utf-8;";
      const blob = new Blob([response.data], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const monthLabel = month ? `_${String(month).padStart(2, "0")}` : "";
      const branchLabel = locationId ? `_branch_${locationId.slice(0, 8)}` : "_all_branches";
      link.download = `${params.type}_report_${year}${monthLabel}${branchLabel}.${extension}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      return true;
    },
  });
}

