import type { CategoryMetric, DashboardSummary } from "@/types/domain";

export const mockDashboardSummary: DashboardSummary = {
  grossSales: 148200,
  averageTicket: 1576,
  orderCount: 94,
  grossMargin: 24.2,
  paymentBreakdown: [
    { method: "COD", amount: 91884, percentage: 62 },
    { method: "BKASH", amount: 29640, percentage: 20 },
    { method: "NAGAD", amount: 14820, percentage: 10 },
    { method: "BANK", amount: 11856, percentage: 8 },
  ],
};

export const mockCategoryMetrics: CategoryMetric[] = [
  { categoryId: "cat-smartphones", categoryName: "Smartphones", revenue: 84997, quantity: 18, percentage: 57.3 },
  { categoryId: "cat-chargers", categoryName: "Chargers & Adapters", revenue: 26500, quantity: 42, percentage: 17.9 },
  { categoryId: "cat-earbuds", categoryName: "Earbuds & Audio", revenue: 19850, quantity: 15, percentage: 13.4 },
  { categoryId: "cat-cables", categoryName: "Cables & Connectors", revenue: 11250, quantity: 54, percentage: 7.6 },
  { categoryId: "cat-accessories", categoryName: "Accessories", revenue: 5603, quantity: 31, percentage: 3.8 },
];
