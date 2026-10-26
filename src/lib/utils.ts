import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const bdtFormatter = new Intl.NumberFormat("en-BD", {
  maximumFractionDigits: 0,
});

export function formatBDT(value: number): string {
  const safeValue = Number.isFinite(value) ? Math.round(value) : 0;
  return `${bdtFormatter.format(safeValue)} BDT`;
}

export function formatBDTAmount(value: number): string {
  const safeValue = Number.isFinite(value) ? Math.round(value) : 0;
  return bdtFormatter.format(safeValue);
}

export function parseBDT(value: string | number): number {
  if (typeof value === "number") return Number.isFinite(value) ? Math.round(value) : 0;
  const normalized = value.replace(/[^0-9-]/g, "");
  if (!normalized || normalized === "-") return 0;
  const parsed = Number.parseInt(normalized, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}
