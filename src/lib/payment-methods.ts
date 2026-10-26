import type { PaymentMethod } from "@/types/domain";

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  COD: "Cash",
  BKASH: "bKash",
  NAGAD: "Nagad",
  BANK: "Bank / Card",
};

export const PAYMENT_METHOD_OPTIONS = (
  Object.entries(PAYMENT_METHOD_LABELS) as Array<[PaymentMethod, string]>
).map(([value, label]) => ({ value, label }));

export function getPaymentMethodLabel(method: PaymentMethod): string {
  return PAYMENT_METHOD_LABELS[method];
}
