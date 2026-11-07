import type { Order, PaymentMethod, RefundItemInput } from "@/types/domain";
import { getPaymentMethodLabel } from "@/lib/payment-methods";
import { parseStrictEventInstant } from "@/lib/business-time";

export type OrderSaleTimeSource = "occurredAt" | "legacy-createdAt" | "unavailable";

/**
 * Authoritative sale-time selector (R1, R3):
 * 1. Prefers valid occurredAt.
 * 2. If occurredAt is present but invalid/malformed, returns unavailable (do NOT silently replace with createdAt).
 * 3. On legacy records where occurredAt is absent/null/empty, falls back to valid historical createdAt.
 */
export function selectOrderSaleTime(order: {
  occurredAt?: string | null;
  createdAt?: string | null;
}): { saleAt: string | null; source: OrderSaleTimeSource } {
  if (order.occurredAt && parseStrictEventInstant(order.occurredAt)) {
    return { saleAt: order.occurredAt, source: "occurredAt" };
  }
  // Present but invalid/malformed occurredAt
  if (order.occurredAt != null && order.occurredAt !== "") {
    return { saleAt: null, source: "unavailable" };
  }
  // Legacy record fallback: absent occurredAt with valid createdAt
  if (order.createdAt && parseStrictEventInstant(order.createdAt)) {
    return { saleAt: order.createdAt, source: "legacy-createdAt" };
  }
  return { saleAt: null, source: "unavailable" };
}

export interface CartLine {
  variantId: string;
  name: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  stock: number;
}

export interface SavedDraft {
  id: string;
  label: string;
  lines: CartLine[];
  customerName?: string;
  customerPhone?: string;
  paymentMethod?: PaymentMethod;
  subtotal?: number;
  itemCount?: number;
  createdAt: string;
  businessId?: string | null;
  locationId?: string | null;
  userId?: string | null;
}

export type HeldTicket = SavedDraft;

export interface CustomSaleLineForm {
  id: string;
  productName: string;
  variantName?: string;
  quantity: number;
  unitPrice: number | "";
}

export interface OrderRowViewModel {
  id: string;
  invoiceNumber: string;
  customerName?: string;
  customerPhone?: string;
  summary: string;
  itemCount: number;
  paymentMethod: PaymentMethod;
  paymentLabel: string;
  totalAmount: number;
  status: Order["status"];
  occurredAt?: string | null;
  createdAt: string;
  saleAt?: string | null;
  timeSource?: OrderSaleTimeSource;
  cashierName?: string;
  sellerName?: string;
  sellerRole?: string;
  locationName?: string;
  order: Order;
}

export interface ReceiptLine {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface ReceiptViewModel {
  orderId?: string;
  invoiceNumber?: string;
  customerName?: string;
  customerPhone?: string;
  cashierName?: string;
  tenderedAmount?: number | null;
  changeDue?: number | null;
  status?: string;
  items: ReceiptLine[];
  subtotal: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  occurredAt?: string | null;
  createdAt: string;
  saleAt?: string | null;
  timeSource?: OrderSaleTimeSource;
  businessName?: string;
  locationName?: string;
}

export interface OrderReceiptSource {
  id: string;
  invoiceNumber: string;
  receiptNumber?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  cashierName?: string | null;
  cashier?: { fullName?: string } | null;
  tenderedAmount?: number | null;
  changeDue?: number | null;
  status: Order["status"];
  lines: Order["lines"];
  subtotal: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  createdAt?: string;
  occurredAt?: string | null;
  businessName?: string | null;
  locationName?: string | null;
  branchName?: string | null;
  business?: { name?: string } | null;
  location?: { name?: string; business?: { name?: string } | null } | null;
}

export function mapOrderToReceipt(
  order: Order | OrderReceiptSource,
  businessName?: string,
  locationName?: string,
): ReceiptViewModel {
  const o = order as OrderReceiptSource;
  const timeInfo = selectOrderSaleTime({
    occurredAt: o.occurredAt,
    createdAt: o.createdAt,
  });
  return {
    orderId: o.id,
    invoiceNumber: o.receiptNumber || o.invoiceNumber,
    customerName: o.customerName ?? undefined,
    customerPhone: o.customerPhone ?? undefined,
    cashierName: o.cashier?.fullName || o.cashierName || undefined,
    tenderedAmount: o.tenderedAmount,
    changeDue: o.changeDue,
    status: o.status,
    items: o.lines.map((line) => ({
      id: line.id,
      name: `${line.productName}${line.variantName ? ` · ${line.variantName}` : ""}`,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      subtotal: line.subtotal,
    })),
    subtotal: o.subtotal,
    totalAmount: o.totalAmount,
    paymentMethod: o.paymentMethod,
    occurredAt: o.occurredAt ?? null,
    createdAt: o.createdAt || (timeInfo.saleAt ?? ""),
    saleAt: timeInfo.saleAt,
    timeSource: timeInfo.source,
    businessName:
      businessName ||
      (o.businessName ? String(o.businessName) : undefined) ||
      o.location?.business?.name ||
      o.business?.name,
    locationName:
      locationName ||
      (o.locationName ? String(o.locationName) : undefined) ||
      o.location?.name ||
      (o.branchName ? String(o.branchName) : undefined),
  };
}

export interface RefundFormValue {
  reason?: string;
  items: RefundItemInput[];
}

export interface OrderWithOptionalLegacyFields extends Order {
  items?: Order["lines"];
  occurredAt?: string | null;
}

export function mapOrderToOrderRow(order: Order, locationName?: string): OrderRowViewModel {
  const o = order as OrderWithOptionalLegacyFields;
  const lines = Array.isArray(o?.lines)
    ? o.lines
    : Array.isArray(o?.items)
      ? o.items
      : [];
  const first = lines[0] as (typeof lines[0] & { customItemName?: string }) | undefined;
  const summary = first
    ? `${first.productName || first.customItemName || "Item"}${first.variantName ? ` · ${first.variantName}` : ""}${lines.length > 1 ? ` +${lines.length - 1} more` : ""}`
    : "No line items";
  const timeInfo = selectOrderSaleTime({
    occurredAt: o.occurredAt,
    createdAt: o.createdAt,
  });
  return {
    id: o.id,
    invoiceNumber: o.invoiceNumber,
    customerName: o.customerName ?? undefined,
    customerPhone: o.customerPhone ?? undefined,
    summary,
    itemCount: lines.reduce((sum: number, line: { quantity?: number }) => sum + (line.quantity ?? 1), 0),
    paymentMethod: o.paymentMethod,
    paymentLabel: getPaymentMethodLabel(o.paymentMethod),
    totalAmount: o.totalAmount,
    status: o.status,
    occurredAt: o.occurredAt ?? null,
    createdAt: o.createdAt,
    saleAt: timeInfo.saleAt,
    timeSource: timeInfo.source,
    cashierName:
      o.sellerName ??
      o.cashierName ??
      o.cashier?.fullName ??
      undefined,
    sellerName:
      o.sellerName ??
      o.cashierName ??
      o.cashier?.fullName ??
      undefined,
    sellerRole:
      o.sellerRole ??
      o.cashier?.role ??
      undefined,
    locationName:
      o.locationName ??
      o.location?.name ??
      o.branchName ??
      locationName,
    order: {
      ...o,
      lines,
    },
  };
}
