"use client";

import { useMemo } from "react";
import { mockCategories, mockProducts, mockVariants } from "@/mocks/catalog/data";
import { mockOrders } from "@/mocks/orders/data";
import { useMockMutation, useMockQuery } from "@/mocks/query";
import { mapVariantToRegisterItem } from "@/features/catalog/view-models";
import { mapOrderToOrderRow, type CustomOrderPayload, type ReceiptViewModel } from "@/features/pos/view-models";
import type { PaymentMethod } from "@/types/domain";

export interface OrderFilters {
  search: string;
  status?: string;
  paymentMethod?: PaymentMethod;
  orderType?: string;
  range?: string;
  page: number;
  limit: number;
}

export function useMockRegisterCatalog() {
  const items = useMemo(
    () => mockVariants.map((variant) => mapVariantToRegisterItem(variant, mockProducts, mockCategories)),
    [],
  );
  return { ...useMockQuery(items), categories: mockCategories };
}

export function useMockOrders(filters: OrderFilters) {
  const rows = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    return mockOrders
      .map((order) => mapOrderToOrderRow(order))
      .filter((row) => !filters.status || row.status === filters.status)
      .filter((row) => !filters.paymentMethod || row.paymentMethod === filters.paymentMethod)
      .filter((row) => !filters.orderType || row.order.type === filters.orderType)
      .filter(
        (row) =>
          !search ||
          row.invoiceNumber.toLowerCase().includes(search) ||
          row.customerName?.toLowerCase().includes(search) ||
          row.summary.toLowerCase().includes(search),
      );
  }, [filters.orderType, filters.paymentMethod, filters.search, filters.status]);
  return useMockQuery(rows);
}

export function useMockCreateCustomOrder() {
  return useMockMutation(async (payload: CustomOrderPayload) => ({
    id: `mock-order-${Date.now()}`,
    invoiceNumber: `MOCK-${Date.now()}`,
    ...payload,
  }));
}

export function useMockCheckout() {
  return useMockMutation(async (input: Omit<ReceiptViewModel, "orderId" | "invoiceNumber" | "createdAt">) => ({
    ...input,
    orderId: `mock-order-${Date.now()}`,
    invoiceNumber: `MOCK-${Date.now()}`,
    createdAt: new Date().toISOString(),
  }));
}
