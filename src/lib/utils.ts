import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCentsToCurrency(
  cents: number,
  currency = "USD",
  locale = "en-US",
) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(cents / 100);
}

export function dollarsToCents(value: string | number): number {
  if (typeof value === "number") {
    return Math.round(value * 100);
  }
  const normalized = value.replace(/[^0-9.]/g, "");
  if (!normalized) return 0;
  return Math.round(Number.parseFloat(normalized) * 100);
}

export function centsToDollarInput(cents: number): string {
  return (cents / 100).toFixed(2);
}

export const AUTH_STORAGE_KEY = "suntech.auth";
