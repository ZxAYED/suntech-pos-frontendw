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
      // 1. Fetch today's report
      const reportRes = await apiClient.get<Record<string, unknown>>("/reports/dashboard", {
        params: {
          range: "today",
          businessId: scope.businessId,
          locationId: scope.locationId,
        },
        signal,
      });
      const report = reportRes.data || {};

      // 2. Fetch active shift (if any)
      let shift: Record<string, unknown> | null = null;
      try {
        const shiftRes = await apiClient.get<Record<string, unknown>>("/shifts/active", {
          params: { locationId: scope.locationId },
          signal,
        });
        shift = shiftRes.data;
      } catch {
        shift = null;
      }

      // 3. Fetch branch expenses
      let todayExpenseTotal = 0;
      try {
        const expensesRes = await apiClient.get<Array<{ amount?: number }>>("/expenses", {
          params: {
            businessId: scope.businessId,
            locationId: scope.locationId,
          },
          signal,
        });
        if (Array.isArray(expensesRes.data)) {
          todayExpenseTotal = expensesRes.data.reduce((sum, e) => sum + (e.amount || 0), 0);
        }
      } catch {
        todayExpenseTotal = 0;
      }

      const todayGross = Number(report.periodRevenue ?? report.globalDailyRevenue ?? 0);
      const todayOrders = Number(report.ordersCount ?? 0);
      const avgTicket = Number(
        report.averageTicketValue ?? (todayOrders > 0 ? Math.round(todayGross / todayOrders) : 0),
      );

      const hasShift = Boolean(shift && (shift.status === "OPEN" || shift.status === undefined));
      const cashier = shift?.cashier as { fullName?: string; publicId?: string } | undefined;

      return {
        date: new Date().toISOString().split("T")[0],
        businessId: scope.businessId || "",
        locationId: scope.locationId || "",
        locationName: "",
        kpis: {
          todayGrossSales: todayGross,
          todayNetSales: todayGross,
          todayOrderCount: todayOrders,
          averageTicketValue: avgTicket,
          todayRefundCount: 0,
          todayRefundedAmount: 0,
          todayExpenseTotal,
          netCashflowToday: todayGross - todayExpenseTotal,
        },
        drawer: {
          hasActiveShift: hasShift,
          shiftId: (shift?.id as string) || null,
          cashierName: cashier?.fullName || null,
          cashierPublicId: cashier?.publicId || null,
          openedAt: (shift?.openedAt as string) || null,
          openingFloat: Number(shift?.openingFloat ?? shift?.startingAmount ?? 0),
          cashCollected: Number(shift?.cashSales ?? 0),
          cashPaidOut: Number(shift?.advancesOut ?? 0),
          expectedCashInDrawer: Number(shift?.expectedCash ?? shift?.expectedAmount ?? 0),
          currency: "BDT",
        },
      };
    },
    enabled: isReady,
    staleTime: 30_000,
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
      const response = await apiClient.get<Array<Record<string, unknown>>>(
        "/catalog/variants",
        {
          params: {
            businessId: scope.businessId,
            locationId: scope.locationId,
            lowStockOnly: "true",
          },
          signal,
        },
      );
      const rawList = Array.isArray(response.data) ? response.data : [];
      let lowCount = 0;
      let outCount = 0;
      const criticalItems: CriticalStockItem[] = [];

      for (const item of rawList) {
        let currentStock = typeof item.stock === "number" ? item.stock : 0;
        if (Array.isArray(item.locationStocks) && item.locationStocks.length > 0) {
          const locStock = (item.locationStocks as Array<{ locationId?: string; stock?: number }>).find(
            (ls) => ls.locationId === scope.locationId,
          );
          if (locStock && typeof locStock.stock === "number") {
            currentStock = locStock.stock;
          }
        }

        if (currentStock <= 0) {
          outCount++;
        } else if (currentStock <= 5) {
          lowCount++;
        }

        const product = item.product as { name?: string } | undefined;
        criticalItems.push({
          variantId: (item.id as string) || "",
          productName: product?.name || (item.name as string) || "Unknown Item",
          variantName: (item.name as string) || "",
          sku: (item.sku as string) || "",
          currentStock,
          reorderLevel: 5,
        });
      }

      return {
        lowStockThreshold: 5,
        lowStockCount: lowCount,
        outOfStockCount: outCount,
        criticalItems: criticalItems.slice(0, 10),
      };
    },
    enabled: isReady,
    staleTime: 60_000,
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
      const response = await apiClient.get<Record<string, unknown>>("/reports/dashboard", {
        params: {
          range: "today",
          businessId: scope.businessId,
          locationId: scope.locationId,
        },
        signal,
      });

      const rawTickets = Array.isArray(response.data?.recentTickets)
        ? (response.data.recentTickets as Array<Record<string, unknown>>)
        : [];

      const tickets: DashboardRecentTicket[] = rawTickets.slice(0, limit).map((t) => ({
        id: (t.id as string) || "",
        invoiceNumber: (t.invoiceNumber as string) || (t.receiptNumber as string) || "INV-—",
        customerName: (t.customerName as string) || null,
        customerPhone: (t.customerPhone as string) || null,
        itemsSummary: (t.itemsSummary as string) || null,
        paymentMethod: (t.paymentMethod as string) || "CASH",
        paymentLabel: (t.paymentMethod as string) || "Cash",
        totalAmount: Number(t.totalAmount || 0),
        status: (t.status as string) || "PAID",
        occurredAt: (t.occurredAt as string) || (t.createdAt as string) || "",
      }));

      return { tickets };
    },
    enabled: isReady,
    staleTime: 15_000,
  });
}
