"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCurrentUserId } from "@/features/auth/hooks/use-current-user-id";
import { useCategories, useInfiniteVariants, type CatalogScope } from "@/features/catalog/api/use-catalog";
import { mapVariantToRegisterItem, type RegisterCatalogItem } from "@/features/catalog/view-models";
import { mapOrderToOrderRow, type OrderRowViewModel } from "@/features/pos/view-models";
import { apiClient } from "@/lib/api-client";
import { createIdempotencyKey, idempotencyHeaders } from "@/lib/idempotency";
import { parsePaymentMethod } from "@/lib/payment-methods";
import type { Order, PaymentMethod, Variant } from "@/types/domain";

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

export interface RegisterCatalogScope extends CatalogScope {
  search?: string;
  categoryId?: string;
  limit?: number;
}

export function useRegisterCatalog(scope: RegisterCatalogScope, enabled = true) {
  const categories = useCategories(scope, enabled);
  const infiniteVariants = useInfiniteVariants(
    {
      businessId: scope.businessId,
      locationId: scope.locationId,
      search: scope.search,
      categoryId: scope.categoryId,
      limit: scope.limit ?? 30,
    },
    enabled,
  );

  const infinitePages = infiniteVariants.data?.pages;
  const allVariants = useMemo<Variant[]>(() => {
    if (!infinitePages) return [];
    return infinitePages.flat();
  }, [infinitePages]);

  const variantItems = useMemo<RegisterCatalogItem[]>(() => {
    const categoryRows = categories.data ?? [];
    return allVariants
      .filter((variant) => variant.isActive !== false)
      .map((variant) => mapVariantToRegisterItem(variant, [], categoryRows));
  }, [categories.data, allVariants]);

  return {
    variants: variantItems,
    categories: categories.data ?? [],
    isLoading: categories.isLoading || (infiniteVariants.isLoading && allVariants.length === 0),
    isError: categories.isError || infiniteVariants.isError,
    error: categories.error ?? infiniteVariants.error,
    isFetchingNextPage: infiniteVariants.isFetchingNextPage,
    hasNextPage: Boolean(infiniteVariants.hasNextPage),
    fetchNextPage: infiniteVariants.fetchNextPage,
    refetch: async () => Promise.all([categories.refetch(), infiniteVariants.refetch()]),
    refetchVariants: infiniteVariants.refetch,
  };
}

export interface RawOrderLineApiPayload {
  id?: string;
  orderId?: string;
  variantId?: string | null;
  productName?: string;
  variantName?: string | null;
  sku?: string | null;
  quantity?: number;
  unitPrice?: number;
  subtotal?: number;
  refundedQuantity?: number;
  refundableQuantity?: number;
  refundedAmount?: number;
  refundItems?: Array<{ quantity?: number; refundAmount?: number }>;
}

export interface RawOrderApiPayload {
  id?: string;
  invoiceNumber?: string;
  receiptNumber?: string;
  orderType?: Order["type"];
  type?: Order["type"];
  status?: Order["status"];
  paymentMethod?: PaymentMethod;
  businessId?: string;
  businessName?: string;
  locationId?: string;
  locationName?: string;
  branchName?: string;
  business?: { name?: string };
  location?: { name?: string; business?: { name?: string } };
  shiftId?: string | null;
  cashierId?: string | null;
  cashierName?: string;
  cashier?: { id?: string; fullName?: string; role?: string };
  customerName?: string;
  customerPhone?: string;
  lines?: RawOrderLineApiPayload[];
  subtotal?: number;
  totalAmount?: number;
  tenderedAmount?: number | null;
  changeDue?: number | null;
  refundStatus?: Order["refundStatus"];
  occurredAt?: string;
  createdAt?: string;
}

export interface RawOrdersApiResponse {
  items?: RawOrderApiPayload[];
  data?: RawOrderApiPayload[];
  total?: number;
  page?: number;
  limit?: number;
  meta?: { total?: number; page?: number; limit?: number };
}

function useCheckoutMutation<TInput extends { idempotencyKey: string }>(path: "/orders/catalog" | "/orders/custom", invalidateCatalog: boolean) {
  const userId = useCurrentUserId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ idempotencyKey, ...body }: TInput) =>
      (await apiClient.post<CreatedOrder>(path, body, { headers: idempotencyHeaders(idempotencyKey) })).data,
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
  payoutShiftId?: string | null;
  businessId?: string;
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

export function validateAndMapOrder(item: RawOrderApiPayload): Order {
  if (!item || typeof item !== "object") {
    throw new Error("Invalid order record from API: expected object");
  }

  const id = item.id != null ? String(item.id).trim() : "";
  if (!id) {
    throw new Error("Invalid order record from API: missing essential field 'id'");
  }

  const rawType = item.type || item.orderType;
  if (!rawType || (rawType !== "CATALOG" && rawType !== "CUSTOM")) {
    throw new Error(`Invalid order record (ID: ${id}): missing or invalid 'type' (${String(rawType)})`);
  }

  const validStatuses: Order["status"][] = ["PENDING", "PAID", "REFUNDED", "PARTIALLY_REFUNDED"];
  const rawStatus = item.status as Order["status"] | undefined;
  if (!rawStatus || !validStatuses.includes(rawStatus)) {
    throw new Error(`Invalid order record (ID: ${id}): missing or invalid 'status' (${String(rawStatus)})`);
  }

  const rawPaymentMethod = item.paymentMethod as string | undefined;
  if (!rawPaymentMethod || typeof rawPaymentMethod !== "string" || !rawPaymentMethod.trim()) {
    throw new Error(`Invalid order record (ID: ${id}): missing essential field 'paymentMethod'`);
  }
  const paymentMethod = parsePaymentMethod(rawPaymentMethod);

  if (item.totalAmount == null && item.subtotal == null) {
    throw new Error(`Invalid order record (ID: ${id}): missing essential financial field 'totalAmount'`);
  }
  const totalAmount = Number(item.totalAmount ?? item.subtotal);
  if (!Number.isFinite(totalAmount)) {
    throw new Error(`Invalid order record (ID: ${id}): non-numeric 'totalAmount' (${String(item.totalAmount)})`);
  }
  if (totalAmount < 0) {
    throw new Error(`Invalid order record (ID: ${id}): negative 'totalAmount' (${String(item.totalAmount)})`);
  }

  const linesRaw = Array.isArray(item.lines) ? item.lines : [];
  const lines = linesRaw.map((line, idx) => {
    const rawLineId = line.id != null ? String(line.id).trim() : "";
    if (!rawLineId) {
      throw new Error(`Invalid order line #${idx + 1} in order ${id}: missing essential field 'id'`);
    }
    const qty = line.quantity != null ? Number(line.quantity) : NaN;
    if (!Number.isSafeInteger(qty) || qty <= 0) {
      throw new Error(`Invalid order line #${idx + 1} in order ${id}: quantity must be a positive integer`);
    }
    const price = line.unitPrice != null ? Number(line.unitPrice) : NaN;
    if (!Number.isFinite(price) || price < 0) {
      throw new Error(`Invalid order line #${idx + 1} in order ${id}: non-numeric or negative unitPrice`);
    }
    const subtotal = line.subtotal != null ? Number(line.subtotal) : qty * price;
    if (!Number.isFinite(subtotal) || subtotal < 0) {
      throw new Error(`Invalid order line #${idx + 1} in order ${id}: non-numeric or negative subtotal`);
    }
    const rawRefundedQty = line.refundedQuantity != null
      ? Number(line.refundedQuantity)
      : Array.isArray(line.refundItems)
        ? line.refundItems.reduce((acc, r) => acc + (r.quantity ?? 0), 0)
        : 0;
    const refundedQuantity = Number.isFinite(rawRefundedQty) && rawRefundedQty >= 0 ? rawRefundedQty : 0;

    const rawRefundableQty = line.refundableQuantity != null
      ? Number(line.refundableQuantity)
      : Math.max(0, qty - refundedQuantity);
    const refundableQuantity = Number.isFinite(rawRefundableQty) && rawRefundableQty >= 0 ? rawRefundableQty : 0;

    const rawRefundedAmt = line.refundedAmount != null
      ? Number(line.refundedAmount)
      : Array.isArray(line.refundItems)
        ? line.refundItems.reduce((acc, r) => acc + (r.refundAmount ?? 0), 0)
        : 0;
    const refundedAmount = Number.isFinite(rawRefundedAmt) && rawRefundedAmt >= 0 ? rawRefundedAmt : 0;

    return {
      id: rawLineId,
      orderId: line.orderId ? String(line.orderId) : id,
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
  });

  return {
    id,
    invoiceNumber: String(item.invoiceNumber || item.receiptNumber || id),
    type: rawType as Order["type"],
    status: rawStatus,
    paymentMethod,
    businessId: String(item.businessId || ""),
    businessName: item.location?.business?.name || item.business?.name || (item.businessName ? String(item.businessName) : undefined),
    locationId: String(item.locationId || ""),
    locationName: item.location?.name || (item.locationName ? String(item.locationName) : (item.branchName ? String(item.branchName) : undefined)),
    shiftId: item.shiftId ? String(item.shiftId) : null,
    cashierId: item.cashierId ? String(item.cashierId) : null,
    cashierName: item.cashier?.fullName || (item.cashierName ? String(item.cashierName) : undefined),
    customerName: item.customerName ? String(item.customerName) : undefined,
    customerPhone: item.customerPhone ? String(item.customerPhone) : undefined,
    lines,
    subtotal: Number(item.subtotal ?? totalAmount),
    totalAmount,
    tenderedAmount: item.tenderedAmount != null ? Number(item.tenderedAmount) : null,
    changeDue: item.changeDue != null ? Number(item.changeDue) : null,
    refundStatus: (item.refundStatus as Order["refundStatus"]) ?? null,
    createdAt: String(item.occurredAt || item.createdAt || ""),
  };
}

export function useOrders(filters: Partial<OrderFilters> = {}, enabled = true) {
  const userId = useCurrentUserId();
  return useQuery({
    queryKey: orderKeys.list(userId, filters),
    queryFn: async ({ signal }): Promise<OrdersQueryResult> => {
      const response = await apiClient.get<RawOrdersApiResponse | RawOrderApiPayload[]>("/orders", { params: filters, signal });
      const raw = response.data;
      let rawItems: RawOrderApiPayload[];
      if (Array.isArray(raw)) {
        rawItems = raw;
      } else if (raw && typeof raw === "object") {
        if (Array.isArray(raw.items)) {
          rawItems = raw.items;
        } else if (Array.isArray(raw.data)) {
          rawItems = raw.data;
        } else {
          throw new Error("Invalid orders API response: missing 'items' or 'data' array");
        }
      } else {
        throw new Error("Invalid orders API response: expected array or object payload");
      }
      const metaResponse = !Array.isArray(raw) ? raw : undefined;
      const total = typeof metaResponse?.total === "number" ? metaResponse.total : (metaResponse?.meta?.total ?? rawItems.length);
      const page = typeof metaResponse?.page === "number" ? metaResponse.page : (metaResponse?.meta?.page ?? filters.page ?? 1);
      const limit = typeof metaResponse?.limit === "number" ? metaResponse.limit : (metaResponse?.meta?.limit ?? filters.limit ?? 20);
      const totalPages = Math.max(1, Math.ceil(total / limit));
      const rows = rawItems.map((item) => {
        const order = validateAndMapOrder(item);
        return mapOrderToOrderRow(order);
      });
      return { rows, total, page, limit, totalPages };
    },
    enabled: enabled && userId !== "anonymous",
  });
}

export function useRefundOrder() {
  const userId = useCurrentUserId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      orderId,
      items,
      reason,
      payoutShiftId = null,
      businessId,
      idempotencyKey,
    }: RefundOrderInput) => {
      const key = idempotencyKey || createIdempotencyKey();
      return (
        await apiClient.post(
          `/orders/${orderId}/refunds`,
          {
            items,
            reason,
            payoutShiftId,
            businessId,
          },
          { headers: idempotencyHeaders(key) },
        )
      ).data;
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


