import { apiClient } from "@/lib/api-client";
import type { ScopedFinancialOperation } from "@/lib/financial-operation";
import { validateAndMapOrder, type RawOrderApiPayload } from "@/features/pos/api/use-pos";
import type { Order } from "@/types/domain";
import { OfflineError } from "../core/scope";

export type LegacyCheckoutStatus = { status: "NOT_FOUND" | "UNKNOWN" } | { status: "CONFIRMED"; order: Order };

function object(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

/** A lookup never creates, retries, or releases a purchase identity. */
export async function readLegacyCheckoutStatus(operation: ScopedFinancialOperation): Promise<LegacyCheckoutStatus> {
  if ((operation.deliveryProtocol ?? "LEGACY_HTTP") !== "LEGACY_HTTP" || !["catalog_sale", "custom_sale"].includes(operation.operationType)) {
    throw new OfflineError("LEGACY_STATUS_UNSUPPORTED", "This purchase uses local receipt recovery, not the old checkout route.");
  }
  const response = await apiClient.get<unknown>(`/orders/legacy-status/${encodeURIComponent(operation.key)}`);
  const result = object(response.data);
  if (result?.canCreateReplacement !== false) throw new OfflineError("LEGACY_STATUS_INVALID", "The server did not return a reliable recovery result. Keep the original purchase identity.");
  if (result.status === "NOT_FOUND" || result.status === "UNKNOWN") return { status: result.status };
  if (result.status !== "CONFIRMED") throw new OfflineError("LEGACY_STATUS_INVALID", "The original purchase still needs administrator review.");

  const expectedType = operation.operationType === "catalog_sale" ? "CATALOG" : "CUSTOM";
  const route = typeof result.originalPath === "string" ? result.originalPath.match(/(?:^|\/)orders(?:\/(catalog|custom))?$/) : null;
  if (!route || (route[1] && route[1].toUpperCase() !== expectedType)) {
    throw new OfflineError("LEGACY_STATUS_MISMATCH", "The server response belongs to a different checkout route. The original identity was kept.");
  }
  const envelope = object(result.response);
  // Depending on interceptor order, the saved response can be the order or
  // the existing { success, data } envelope. Both carry the same server order.
  const raw = object(envelope?.success === true ? envelope.data : envelope);
  if (!raw) throw new OfflineError("LEGACY_STATUS_INVALID", "The confirmed order could not be read. Keep the original identity for recovery.");
  const order = validateAndMapOrder(raw as RawOrderApiPayload);
  if (order.type !== expectedType || !order.lines.length ||
      order.businessId !== operation.businessId || order.locationId !== operation.locationId ||
      order.cashierId !== operation.userId) {
    throw new OfflineError("LEGACY_STATUS_MISMATCH", "The confirmed order does not match this operator and branch. No local recovery record was changed.");
  }
  return { status: "CONFIRMED", order };
}
