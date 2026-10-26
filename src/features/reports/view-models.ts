import type { CategoryMetric, DashboardSummary, PaymentMethod } from "@/types/domain";

export interface DashboardSummaryViewModel {
  grossSales: number;
  averageTicket: number;
  orderCount: number;
  grossMargin?: number;
}

export interface AnalyticsSummaryViewModel extends DashboardSummaryViewModel {
  paymentTotal: number;
}

export type CategoryMetricViewModel = CategoryMetric;
export interface PaymentBreakdownViewModel {
  method: PaymentMethod;
  amount: number;
  percentage: number;
}

export interface TransactionFilters {
  search: string;
  range: "daily" | "weekly" | "monthly" | "quarterly";
  paymentMethod?: PaymentMethod;
  page: number;
  limit: number;
}

export interface ExportOptions {
  format: "CSV" | "PDF";
  range: TransactionFilters["range"];
}

export function mapDashboardSummary(summary: DashboardSummary): DashboardSummaryViewModel {
  return {
    grossSales: summary.grossSales,
    averageTicket: summary.averageTicket,
    orderCount: summary.orderCount,
    grossMargin: summary.grossMargin,
  };
}
