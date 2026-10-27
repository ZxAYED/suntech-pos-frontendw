"use client";

import { useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { mockOrders } from "@/mocks/orders/data";
import { useMockQuery } from "@/mocks/query";
import { useCategories, useProducts, useVariants, type CatalogScope } from "@/features/catalog/api/use-catalog";
import { mapVariantToRegisterItem, type RegisterCatalogItem } from "@/features/catalog/view-models";
import { mapOrderToOrderRow } from "@/features/pos/view-models";
import { apiClient } from "@/lib/api-client";
import type { RootState } from "@/redux/types";
import type { Order, PaymentMethod } from "@/types/domain";

export interface OrderFilters {
  search: string;
  status?: string;
  paymentMethod?: PaymentMethod;
  orderType?: string;
  range?: string;
  page: number;
  limit: number;
}

export interface RegisterProduct {
  productId: string;
  name: string;
  categoryId: string;
  categoryName: string;
  variants: RegisterCatalogItem[];
}

export interface CreatedOrder extends Omit<Order, "type" | "cashierName"> {
  receiptNumber?: string | null;
  orderType: "CATALOG" | "CUSTOM";
  occurredAt?: string;
  cashier?: { id: string; fullName: string; role: string } | null;
}

export interface CatalogCheckoutInput extends CatalogScope {
  shiftId?: string;
  tenderedAmount: number;
  paymentMethod: PaymentMethod;
  customerName?: string;
  customerPhone?: string;
  notes?: string;
  lines: Array<{ variantId: string; quantity: number; unitPrice: number }>;
  idempotencyKey: string;
}

export interface CustomCheckoutInput extends CatalogScope {
  shiftId?: string;
  tenderedAmount: number;
  paymentMethod: PaymentMethod;
  customerName?: string;
  customerPhone?: string;
  notes?: string;
  lines: Array<{ productName: string; variantName?: string; quantity: number; unitPrice: number }>;
  idempotencyKey: string;
}

export function useRegisterCatalog(scope: CatalogScope, enabled = true) {
  const categories = useCategories(scope, enabled);
  const products = useProducts(scope, enabled);
  const variants = useVariants(scope, enabled);
  const data = useMemo<RegisterProduct[]>(() => {
    const categoryRows = categories.data ?? [];
    const productRows = products.data ?? [];
    const variantRows = variants.data ?? [];
    return productRows.map((product) => ({
      productId: product.id,
      name: product.name,
      categoryId: product.categoryId ?? "",
      categoryName: categoryRows.find((category) => category.id === product.categoryId)?.name ?? "Uncategorized",
      variants: variantRows
        .filter((variant) => variant.productId === product.id && variant.isActive)
        .map((variant) => {
          const item = mapVariantToRegisterItem(variant, productRows, categoryRows);
          return { ...item, imageUrl: variant.profileImageUrl ?? variant.images?.[0]?.url ?? item.imageUrl };
        }),
    })).filter((product) => product.variants.length > 0);
  }, [categories.data, products.data, variants.data]);

  return {
    data,
    categories: categories.data ?? [],
    isLoading: categories.isLoading || products.isLoading || variants.isLoading,
    isError: categories.isError || products.isError || variants.isError,
    error: categories.error ?? products.error ?? variants.error,
    refetch: async () => Promise.all([categories.refetch(), products.refetch(), variants.refetch()]),
    refetchVariants: variants.refetch,
  };
}

function useCheckoutMutation<TInput extends { idempotencyKey: string }>(path: "/orders/catalog" | "/orders/custom", invalidateCatalog: boolean) {
  const userId = useSelector((state: RootState) => state.auth.user?.id ?? "anonymous");
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ idempotencyKey, ...body }: TInput) =>
      (await apiClient.post<CreatedOrder>(path, body, { headers: { "Idempotency-Key": idempotencyKey } })).data,
    onSuccess: async () => {
      const invalidations = [
        queryClient.invalidateQueries({ queryKey: ["orders", userId] }),
        queryClient.invalidateQueries({ queryKey: ["shifts", userId] }),
        queryClient.invalidateQueries({ queryKey: ["reports"] }),
      ];
      if (invalidateCatalog) invalidations.push(queryClient.invalidateQueries({ queryKey: ["catalog", userId] }));
      await Promise.all(invalidations);
    },
  });
}

export const useCatalogCheckout = () => useCheckoutMutation<CatalogCheckoutInput>("/orders/catalog", true);
export const useCreateCustomOrder = () => useCheckoutMutation<CustomCheckoutInput>("/orders/custom", false);

// Order history is Phase 9 and deliberately remains isolated from Phase 7/8 checkout.
export function useMockOrders(filters: OrderFilters) {
  const rows = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    return mockOrders.map((order) => mapOrderToOrderRow(order))
      .filter((row) => !filters.status || row.status === filters.status)
      .filter((row) => !filters.paymentMethod || row.paymentMethod === filters.paymentMethod)
      .filter((row) => !filters.orderType || row.order.type === filters.orderType)
      .filter((row) => !search || row.invoiceNumber.toLowerCase().includes(search) || row.customerName?.toLowerCase().includes(search) || row.summary.toLowerCase().includes(search));
  }, [filters.orderType, filters.paymentMethod, filters.search, filters.status]);
  return useMockQuery(rows);
}
