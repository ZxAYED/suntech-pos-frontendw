import type { Order, PaymentMethod, RefundItemInput } from "@/types/domain";
import { getPaymentMethodLabel } from "@/lib/payment-methods";

export interface CartLine {
  variantId: string;
  name: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  stock: number;
}

export interface HeldTicket {
  id: string;
  label: string;
  lines: CartLine[];
  createdAt: string;
}

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
  createdAt: string;
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
  createdAt: string;
  businessName?: string;
  locationName?: string;
}

export function mapOrderToReceipt(
  order: Order | {
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
    occurredAt?: string;
  },
  businessName?: string,
  locationName?: string,
): ReceiptViewModel {
  return {
    orderId: order.id,
    invoiceNumber: ("receiptNumber" in order && order.receiptNumber) ? order.receiptNumber : order.invoiceNumber,
    customerName: order.customerName ?? undefined,
    customerPhone: order.customerPhone ?? undefined,
    cashierName: ("cashier" in order && order.cashier?.fullName) ? order.cashier.fullName : (order.cashierName ?? undefined),
    tenderedAmount: order.tenderedAmount,
    changeDue: order.changeDue,
    status: order.status,
    items: order.lines.map((line) => ({
      id: line.id,
      name: `${line.productName}${line.variantName ? ` · ${line.variantName}` : ""}`,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      subtotal: line.subtotal,
    })),
    subtotal: order.subtotal,
    totalAmount: order.totalAmount,
    paymentMethod: order.paymentMethod,
    createdAt: ("occurredAt" in order && order.occurredAt) ? String(order.occurredAt) : (order.createdAt || ""),
    businessName:
      businessName ||
      ("businessName" in order && order.businessName ? String(order.businessName) : undefined) ||
      (order as Record<string, unknown> & { location?: { business?: { name?: string } }; business?: { name?: string } }).location?.business?.name ||
      (order as Record<string, unknown> & { business?: { name?: string } }).business?.name,
    locationName:
      locationName ||
      ("locationName" in order && order.locationName ? String(order.locationName) : undefined) ||
      (order as Record<string, unknown> & { location?: { name?: string }; branchName?: string }).location?.name ||
      (order as Record<string, unknown> & { branchName?: string }).branchName,
  };
}

export interface RefundFormValue {
  reason?: string;
  items: RefundItemInput[];
}

interface LegacyOrderFields {
  items?: Order["lines"];
  occurredAt?: string;
  cashier?: { fullName?: string; role?: string };
  location?: { name?: string };
  branchName?: string;
}

export function mapOrderToOrderRow(order: Order, locationName?: string): OrderRowViewModel {
  const legacyOrder = order as unknown as LegacyOrderFields;
  const lines = Array.isArray(order?.lines)
    ? order.lines
    : Array.isArray(legacyOrder.items)
      ? legacyOrder.items
      : [];
  const first = lines[0] as (typeof lines[0] & { customItemName?: string }) | undefined;
  const summary = first
    ? `${first.productName || first.customItemName || "Item"}${first.variantName ? ` · ${first.variantName}` : ""}${lines.length > 1 ? ` +${lines.length - 1} more` : ""}`
    : "No line items";
  return {
    id: order.id,
    invoiceNumber: order.invoiceNumber,
    customerName: order.customerName ?? undefined,
    customerPhone: order.customerPhone ?? undefined,
    summary,
    itemCount: lines.reduce((sum: number, line: { quantity?: number }) => sum + (line.quantity ?? 1), 0),
    paymentMethod: order.paymentMethod,
    paymentLabel: getPaymentMethodLabel(order.paymentMethod),
    totalAmount: order.totalAmount,
    status: order.status,
    createdAt: legacyOrder.occurredAt ? String(legacyOrder.occurredAt) : order.createdAt,
    cashierName:
      order.sellerName ??
      order.cashierName ??
      legacyOrder.cashier?.fullName ??
      undefined,
    sellerName:
      order.sellerName ??
      order.cashierName ??
      legacyOrder.cashier?.fullName ??
      undefined,
    sellerRole:
      order.sellerRole ??
      legacyOrder.cashier?.role ??
      undefined,
    locationName:
      order.locationName ??
      legacyOrder.location?.name ??
      legacyOrder.branchName ??
      locationName,
    order: {
      ...order,
      lines,
    },
  };
}
