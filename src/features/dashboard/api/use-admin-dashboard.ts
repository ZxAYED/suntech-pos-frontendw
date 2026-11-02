"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

// ==========================================
// 1. DASHBOARD OVERVIEW CONTRACT
// ==========================================
export interface DashboardOverviewKpis {
  todayGrossSales: number;
  todayNetSales: number;
  todayOrderCount: number;
  averageTicketValue: number;
  todayRefundCount: number;
  todayRefundedAmount: number;
  todayExpenseTotal: number;
  netCashflowToday: number;
}

export interface DashboardOverviewDrawer {
  hasActiveShift: boolean;
  shiftId: string | null;
  cashierName: string | null;
  cashierPublicId: string | null;
  openedAt: string | null;
  openingFloat: number;
  cashCollected: number;
  cashPaidOut: number;
  expectedCashInDrawer: number;
  currency: string;
}

export interface DashboardOverviewResponse {
  date: string;
  businessId: string;
  locationId: string;
  locationName: string;
  kpis: DashboardOverviewKpis;
  drawer: DashboardOverviewDrawer;
}

// ==========================================
// 2. INVENTORY ALERTS CONTRACT
// ==========================================
export interface CriticalStockItem {
  variantId: string;
  productName: string;
  variantName: string;
  sku: string;
  currentStock: number;
  reorderLevel: number;
}

export interface DashboardInventoryAlertsResponse {
  lowStockThreshold: number;
  lowStockCount: number;
  outOfStockCount: number;
  criticalItems: CriticalStockItem[];
}

// ==========================================
// 3. RECENT ACTIVITY CONTRACT
// ==========================================
export interface DashboardRecentTicket {
  id: string;
  invoiceNumber: string;
  customerName: string | null;
  customerPhone: string | null;
  itemsSummary: string | null;
  paymentMethod: string;
  paymentLabel: string;
  totalAmount: number;
  status: string;
  occurredAt: string;
}

export interface DashboardRecentActivityResponse {
  tickets: DashboardRecentTicket[];
}

// ==========================================
// QUERY KEYS
// ==========================================
export const dashboardKeys = {
  all: ["admin-dashboard"] as const,
  overview: (businessId?: string, locationId?: string) =>
    ["admin-dashboard", "overview", businessId ?? "", locationId ?? ""] as const,
  inventoryAlerts: (businessId?: string, locationId?: string) =>
    ["admin-dashboard", "inventory-alerts", businessId ?? "", locationId ?? ""] as const,
  recentActivity: (businessId?: string, locationId?: string, limit = 5) =>
    ["admin-dashboard", "recent-activity", businessId ?? "", locationId ?? "", limit] as const,
};

// ==========================================
// HOOKS
// ==========================================
export function useDashboardOverview(
  scope: { businessId?: string; locationId?: string },
  enabled = true,
) {
  const isReady = enabled && Boolean(scope.businessId && scope.locationId);
  return useQuery<DashboardOverviewResponse>({
    queryKey: dashboardKeys.overview(scope.businessId, scope.locationId),
    queryFn: async ({ signal }) => {
      const res = await apiClient.get<DashboardOverviewResponse>(
        "/admin/dashboard/overview",
        {
          params: {
            businessId: scope.businessId,
            locationId: scope.locationId,
          },
          signal,
        },
      );
      return res.data;
    },
    enabled: isReady,
    staleTime: 30_000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useDashboardInventoryAlerts(
  scope: { businessId?: string; locationId?: string },
  enabled = true,
) {
  const isReady = enabled && Boolean(scope.businessId && scope.locationId);
  return useQuery<DashboardInventoryAlertsResponse>({
    queryKey: dashboardKeys.inventoryAlerts(scope.businessId, scope.locationId),
    queryFn: async ({ signal }) => {
      const res = await apiClient.get<DashboardInventoryAlertsResponse>(
        "/admin/dashboard/inventory-alerts",
        {
          params: {
            businessId: scope.businessId,
            locationId: scope.locationId,
          },
          signal,
        },
      );
      return res.data;
    },
    enabled: isReady,
    staleTime: 60_000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useDashboardRecentActivity(
  scope: { businessId?: string; locationId?: string },
  limit = 5,
  enabled = true,
) {
  const isReady = enabled && Boolean(scope.businessId && scope.locationId);
  return useQuery<DashboardRecentActivityResponse>({
    queryKey: dashboardKeys.recentActivity(scope.businessId, scope.locationId, limit),
    queryFn: async ({ signal }) => {
      const res = await apiClient.get<DashboardRecentActivityResponse>(
        "/admin/dashboard/recent-activity",
        {
          params: {
            businessId: scope.businessId,
            locationId: scope.locationId,
            limit,
          },
          signal,
        },
      );
      return res.data;
    },
    enabled: isReady,
    staleTime: 15_000,
    gcTime: 10 * 60 * 1000,
  });
}

