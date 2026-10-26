"use client";

import { mockCategoryMetrics, mockDashboardSummary } from "@/mocks/reports/data";
import { mockOrders } from "@/mocks/orders/data";
import { useMockQuery } from "@/mocks/query";
import { mapOrderToOrderRow } from "@/features/pos/view-models";

export function useMockDashboardReport() {
  return useMockQuery({ summary: mockDashboardSummary, categories: mockCategoryMetrics });
}

export function useMockTransactions() {
  return useMockQuery(mockOrders.map((order) => mapOrderToOrderRow(order)));
}
