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
  items: ReceiptLine[];
  subtotal: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  createdAt: string;
  businessName?: string;
  locationName?: string;
}

export interface RefundFormValue {
  reason?: string;
  items: RefundItemInput[];
}

export function mapOrderToOrderRow(order: Order, locationName?: string): OrderRowViewModel {
  const first = order.lines[0];
  const summary = first
    ? `${first.productName}${first.variantName ? ` · ${first.variantName}` : ""}${order.lines.length > 1 ? ` +${order.lines.length - 1} more` : ""}`
    : "No line items";
  return {
    id: order.id,
    invoiceNumber: order.invoiceNumber,
    customerName: order.customerName ?? undefined,
    customerPhone: order.customerPhone ?? undefined,
    summary,
    itemCount: order.lines.reduce((sum, line) => sum + line.quantity, 0),
    paymentMethod: order.paymentMethod,
    paymentLabel: getPaymentMethodLabel(order.paymentMethod),
    totalAmount: order.totalAmount,
    status: order.status,
    createdAt: order.createdAt,
    cashierName: order.cashierName ?? undefined,
    locationName,
    order,
  };
}
