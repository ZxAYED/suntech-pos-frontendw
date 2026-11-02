import type { PaymentMethod } from "@/types/domain";

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: "Cash",
  CARD: "Card",
  BKASH: "bKash",
  NAGAD: "Nagad",
  BANK: "Bank / Card",
  BANK_TRANSFER: "Bank Transfer",
  COD: "Cash (COD)",
};

export const PAYMENT_METHOD_OPTIONS = (
  Object.entries(PAYMENT_METHOD_LABELS) as Array<[PaymentMethod, string]>
).map(([value, label]) => ({ value, label }));

export function getPaymentMethodLabel(method: PaymentMethod): string {
  return PAYMENT_METHOD_LABELS[method] ?? method;
}
