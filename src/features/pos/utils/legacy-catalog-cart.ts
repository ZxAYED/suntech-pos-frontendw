import type { ScopedFinancialOperation } from "@/lib/financial-operation";
import { OfflineError } from "@/features/offline/core/scope";
import { registerData, type RegisterData } from "./durable-register-session";

/** Display a missing old cart from its original request; never change the request itself. */
export function legacyCatalogCart(operation: ScopedFinancialOperation): RegisterData {
  const value = operation.payloadSnapshot;
  const snapshot = value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
  if (!snapshot || !Array.isArray(snapshot.lines) || !snapshot.lines.length || !snapshot.paymentMethod) {
    throw new OfflineError("LEGACY_SNAPSHOT_MISSING", "The original checkout snapshot needs administrator recovery. Its identity was kept.");
  }
  const lines = snapshot.lines.map((value: unknown) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new OfflineError("LEGACY_SNAPSHOT_MISSING", "The original checkout line cannot be read safely.");
    const line = value as Record<string, unknown>;
    return {
      variantId: line.variantId, quantity: line.quantity, unitPrice: line.unitPrice,
      name: typeof line.productName === "string" ? line.productName : "Original sale item",
      sku: typeof line.sku === "string" ? line.sku : "", stock: 0,
    };
  });
  return registerData({
    lines, customerName: snapshot.customerName ?? "", customerPhone: snapshot.customerPhone ?? "",
    showCustomerInput: Boolean(snapshot.customerName || snapshot.customerPhone),
    paymentMethod: snapshot.paymentMethod, tendered: String(snapshot.tenderedAmount ?? ""),
  });
}
