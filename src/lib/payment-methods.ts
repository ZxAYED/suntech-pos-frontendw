import type { LegacyPaymentMethod, PaymentMethod } from "@/types/domain";

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  COD: "Cash (COD)",
  BKASH: "bKash",
  NAGAD: "Nagad",
  BANK: "Bank / Card",
};

export const REGISTER_PAYMENT_METHODS: PaymentMethod[] = ["COD", "BKASH", "NAGAD", "BANK"];

export const PAYMENT_METHOD_OPTIONS = REGISTER_PAYMENT_METHODS.map((value) => ({
  value,
  label: PAYMENT_METHOD_LABELS[value],
}));

export const ALL_PAYMENT_METHOD_OPTIONS = PAYMENT_METHOD_OPTIONS;

export const LEGACY_PAYMENT_METHOD_LABELS: Record<LegacyPaymentMethod, string> = {
  COD: "Cash (COD)",
  BKASH: "bKash",
  NAGAD: "Nagad",
  BANK: "Bank / Card",
  CASH: "Cash (COD)",
  CARD: "Bank / Card",
  BANK_TRANSFER: "Bank Transfer",
};

export function getPaymentMethodLabel(method: string): string {
  return (LEGACY_PAYMENT_METHOD_LABELS as Record<string, string>)[method] ?? method;
}

export function parsePaymentMethod(value: unknown): PaymentMethod {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Invalid payment method from backend: ${String(value)}`);
  }
  const upper = value.toUpperCase().trim();
  if (upper === "COD" || upper === "CASH") return "COD";
  if (upper === "BKASH") return "BKASH";
  if (upper === "NAGAD") return "NAGAD";
  if (upper === "BANK" || upper === "CARD" || upper === "BANK_TRANSFER") return "BANK";
  throw new Error(`Invalid payment method from backend: ${String(value)}`);
}

export function normalizePaymentMethod(method?: string | null): PaymentMethod {
  const upper = method?.toUpperCase()?.trim();
  if (upper === "CASH") return "COD";
  if (upper === "CARD" || upper === "BANK_TRANSFER") return "BANK";
  if (upper === "BKASH") return "BKASH";
  if (upper === "NAGAD") return "NAGAD";
  if (upper === "BANK") return "BANK";
  return "COD";
}

