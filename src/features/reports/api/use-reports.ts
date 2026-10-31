"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { apiClient } from "@/lib/api-client";
import { useTenantScope } from "@/features/tenant/hooks/use-tenant-scope";
import { mapOrderToOrderRow } from "@/features/pos/view-models";
import type { CategoryMetric, DashboardSummary, Order, PaymentMethod } from "@/types/domain";
import type { RootState } from "@/redux/types";

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
  month?: number;
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

function useUserId() {
  return useSelector((state: RootState) => state.auth.user?.id ?? "anonymous");
}

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
  const orderCount = raw.ordersCount ?? 0;
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

function buildReportQueryParams(
  params?: ReportDateParams,
  tenantBusinessId?: string,
  tenantLocationId?: string,
): Record<string, unknown> {
  const queryParams: Record<string, unknown> = {};
  if (params?.range && params.range !== "all") {
    queryParams.range = params.range;
  }
  if (params?.month && params.month !== "all") {
    queryParams.month = String(params.month);
  }
  if (params?.week && params.week !== "all") {
    queryParams.week = String(params.week);
  }
  if (params?.year && String(params.year) !== "all") {
    const y = Number(params.year);
    if (!Number.isNaN(y)) queryParams.year = y;
  }
  const businessId = params?.businessId || tenantBusinessId;
  if (businessId) {
    queryParams.businessId = businessId;
  }
  const locationId = params?.locationId !== undefined ? params.locationId : tenantLocationId;
  if (locationId && locationId !== "all") {
    queryParams.locationId = locationId;
  }
  return queryParams;
}

export function useDashboardReport(params?: ReportDateParams, enabled = true) {
  const userId = useUserId();
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
  const userId = useUserId();
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
  const userId = useUserId();
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
      const now = new Date();
      const month = params.month ?? now.getMonth() + 1;
      const year = params.year ?? now.getFullYear();
      const businessId = params.businessId ?? tenant.businessId;
      const locationId = params.locationId ?? tenant.locationId;

      const queryParams: Record<string, unknown> = {
        type: params.type,
        format: params.format.toLowerCase(),
        month,
        year,
      };
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
      link.download = `${params.type}_report_${year}_${String(month).padStart(2, "0")}.${extension}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      return true;
    },
  });
}

