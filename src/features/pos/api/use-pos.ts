"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { useCategories, useProducts, useVariants, type CatalogScope } from "@/features/catalog/api/use-catalog";
import { mapVariantToRegisterItem, type RegisterCatalogItem } from "@/features/catalog/view-models";
import { mapOrderToOrderRow, type OrderRowViewModel } from "@/features/pos/view-models";
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
  businessId?: string;
  locationId?: string;
  scope?: "all" | "my" | "own";
  ownOrders?: boolean;
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

  const variantItems = useMemo<RegisterCatalogItem[]>(() => {
    const categoryRows = categories.data ?? [];
    const productRows = products.data ?? [];
    const variantRows = variants.data ?? [];
    return variantRows
      .filter((variant) => variant.isActive !== false)
      .map((variant) => mapVariantToRegisterItem(variant, productRows, categoryRows));
  }, [categories.data, products.data, variants.data]);

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
        .filter((variant) => variant.productId === product.id && variant.isActive !== false)
        .map((variant) => mapVariantToRegisterItem(variant, productRows, categoryRows)),
    })).filter((product) => product.variants.length > 0);
  }, [categories.data, products.data, variants.data]);

  return {
    data,
    variants: variantItems,
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


export interface RefundOrderInput {
  orderId: string;
  items: Array<{ orderItemId: string; quantity: number }>;
  reason?: string;
  idempotencyKey?: string;
}

export interface OrdersQueryResult {
  rows: OrderRowViewModel[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const orderKeys = {
  all: (userId: string) => ["orders", userId] as const,
  list: (userId: string, filters: Partial<OrderFilters>) => ["orders", userId, "list", filters] as const,
};

export function useOrders(filters: Partial<OrderFilters> = {}, enabled = true) {
  const userId = useSelector((state: RootState) => state.auth.user?.id ?? "anonymous");
  return useQuery({
    queryKey: orderKeys.list(userId, filters),
    queryFn: async ({ signal }): Promise<OrdersQueryResult> => {
      const response = await apiClient.get<unknown>("/orders", { params: filters, signal });
      const raw = response.data as { items?: unknown[]; data?: unknown[]; total?: number; page?: number; limit?: number; meta?: { total?: number; page?: number; limit?: number } };
      const rawItems: Array<Record<string, unknown>> = Array.isArray(raw)
        ? (raw as Array<Record<string, unknown>>)
        : Array.isArray(raw?.items)
          ? (raw.items as Array<Record<string, unknown>>)
          : Array.isArray(raw?.data)
            ? (raw.data as Array<Record<string, unknown>>)
            : [];
      const total = typeof raw?.total === "number" ? raw.total : (raw?.meta?.total ?? rawItems.length);
      const page = typeof raw?.page === "number" ? raw.page : (raw?.meta?.page ?? filters.page ?? 1);
      const limit = typeof raw?.limit === "number" ? raw.limit : (raw?.meta?.limit ?? filters.limit ?? 20);
      const totalPages = Math.max(1, Math.ceil(total / limit));
      const rows = rawItems.map((item) => {
        const linesRaw = Array.isArray(item.lines) ? (item.lines as Array<Record<string, unknown>>) : [];
        const order: Order = {
          id: String(item.id ?? ""),
          invoiceNumber: String(item.invoiceNumber || item.receiptNumber || item.id || ""),
          type: (item.orderType || item.type || "CATALOG") as Order["type"],
          status: (item.status as Order["status"]) ?? "PAID",
          paymentMethod: (item.paymentMethod as PaymentMethod) ?? "COD",
          businessId: String(item.businessId || ""),
          businessName: (item.location as { business?: { name?: string } })?.business?.name || (item.business as { name?: string })?.name || (item.businessName ? String(item.businessName) : undefined),
          locationId: String(item.locationId || ""),
          locationName: (item.location as { name?: string })?.name || (item.locationName ? String(item.locationName) : (item.branchName ? String(item.branchName) : undefined)),
          shiftId: item.shiftId ? String(item.shiftId) : null,
          cashierId: item.cashierId ? String(item.cashierId) : null,
          cashierName: (item.cashier as { fullName?: string })?.fullName || (item.cashierName ? String(item.cashierName) : undefined),
          customerName: item.customerName ? String(item.customerName) : undefined,
          customerPhone: item.customerPhone ? String(item.customerPhone) : undefined,
          lines: linesRaw.map((line) => {
            const qty = Number(line.quantity ?? 0);
            const price = Number(line.unitPrice ?? 0);
            const subtotal = line.subtotal != null ? Number(line.subtotal) : (qty * price);
            const refundedQuantity = line.refundedQuantity != null
              ? Number(line.refundedQuantity)
              : Array.isArray(line.refundItems)
                ? (line.refundItems as Array<{ quantity?: number }>).reduce((acc, r) => acc + (r.quantity ?? 0), 0)
                : 0;
            const refundableQuantity = line.refundableQuantity != null
              ? Number(line.refundableQuantity)
              : Math.max(0, qty - refundedQuantity);
            const refundedAmount = line.refundedAmount != null
              ? Number(line.refundedAmount)
              : Array.isArray(line.refundItems)
                ? (line.refundItems as Array<{ refundAmount?: number }>).reduce((acc, r) => acc + (r.refundAmount ?? 0), 0)
                : 0;
            return {
              id: String(line.id ?? ""),
              orderId: line.orderId ? String(line.orderId) : String(item.id ?? ""),
              variantId: line.variantId ? String(line.variantId) : null,
              productName: String(line.productName || "Item"),
              variantName: line.variantName ? String(line.variantName) : null,
              sku: line.sku ? String(line.sku) : null,
              quantity: qty,
              unitPrice: price,
              subtotal,
              refundedQuantity,
              refundableQuantity,
              refundedAmount,
            };
          }),
          subtotal: Number(item.subtotal ?? item.totalAmount ?? 0),
          totalAmount: Number(item.totalAmount ?? 0),
          tenderedAmount: item.tenderedAmount != null ? Number(item.tenderedAmount) : null,
          changeDue: item.changeDue != null ? Number(item.changeDue) : null,
          createdAt: String(item.occurredAt || item.createdAt || ""),
        };
        return mapOrderToOrderRow(order);
      });
      return { rows, total, page, limit, totalPages };
    },
    enabled: enabled && userId !== "anonymous",
  });
}

export function useRefundOrder() {
  const userId = useSelector((state: RootState) => state.auth.user?.id ?? "anonymous");
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, items, reason, idempotencyKey }: RefundOrderInput) => {
      const key = idempotencyKey || globalThis.crypto.randomUUID();
      const headers = { "Idempotency-Key": key };
      return (await apiClient.post(`/orders/${orderId}/refunds`, { items, reason }, { headers })).data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["orders", userId] }),
        queryClient.invalidateQueries({ queryKey: ["catalog", userId] }),
        queryClient.invalidateQueries({ queryKey: ["reports"] }),
        queryClient.invalidateQueries({ queryKey: ["shifts", userId] }),
      ]);
    },
  });
}

export const useCatalogCheckout = () => useCheckoutMutation<CatalogCheckoutInput>("/orders/catalog", true);
export const useCreateCustomOrder = () => useCheckoutMutation<CustomCheckoutInput>("/orders/custom", false);

