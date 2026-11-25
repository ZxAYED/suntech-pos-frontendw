import type { Order, PaymentMethod } from "@/types/domain";
import { apiClient } from "@/lib/api-client";
import { offlineDb } from "../db/offline-db";
import { commitLocalSale, readSaleReceipt } from "../core/checkout";
import { markOfflinePermissionRejected, verifySavedPermission } from "../core/grant";
import { canonicalJson, OfflineError, scopeKey } from "../core/scope";
import type { OfflineScope, SaleLine, SaleType } from "../core/types";
import { ApiClientError } from "@/types/api";

export interface LocalCheckoutRequest {
  idempotencyKey: string; cartKey?: string; cartRevision?: number;
  shiftId?: string | null; paymentMethod: PaymentMethod; tenderedAmount: number;
  customerName?: string; customerPhone?: string; notes?: string;
  lines: SaleLine[]; businessId?: string; locationId?: string;
}
export type LocalCreatedOrder = Order & { orderType: SaleType; localStatus: "PENDING" | "SYNCED" | "NEEDS_REVIEW"; clientOrderId: string; cashier?: { id: string; fullName: string; role: string } };
const comparable = (input: LocalCheckoutRequest | { shiftId: string | null; paymentMethod: PaymentMethod; tenderedAmount: number; customerName?: string; customerPhone?: string; notes?: string; lines: SaleLine[] }, type: SaleType) => ({
  shiftId: input.shiftId ?? null, paymentMethod: input.paymentMethod, tenderedAmount: input.tenderedAmount,
  customerName: input.customerName || undefined, customerPhone: input.customerPhone || undefined, notes: input.notes || undefined,
  lines: input.lines.map(line => type === "CATALOG" ? { variantId: line.variantId, quantity: line.quantity, unitPrice: line.unitPrice } : { productName: line.productName?.trim(), variantName: line.variantName?.trim() || undefined, quantity: line.quantity, unitPrice: line.unitPrice }),
});

/** Only this adapter connects the existing checkout hooks to the durable writer. */
export async function saveNewCheckout(input: LocalCheckoutRequest, scope: OfflineScope, type: SaleType, mode: "ONLINE" | "OFFLINE", renew: () => Promise<void>): Promise<LocalCreatedOrder> {
  if ((input.businessId && input.businessId !== scope.businessId) || (input.locationId && input.locationId !== scope.locationId)) throw new OfflineError("SCOPE_CHANGED", "The selected branch changed. Reload the original saved register.");
  const existing = await offlineDb.localSales.get(input.idempotencyKey);
  if (existing) {
    if (existing.scopeKey !== scopeKey(scope) || existing.wire.orderType !== type || canonicalJson(comparable(existing.wire, type)) !== canonicalJson(comparable(input, type))) throw new OfflineError("SALE_ID_CONFLICT", "This saved sale has different content. Keep the original event for review.");
    return savedResult(scope, input.idempotencyKey, type);
  }
  if (process.env.NEXT_PUBLIC_OFFLINE_INTAKE === "false") throw new OfflineError("INTAKE_DISABLED", "New sales are paused for this release. Existing saved sales can still be synced, read or exported.");
  if (!input.cartKey || input.cartRevision === undefined) throw new OfflineError("CART_NOT_SAVED", "The cart has not finished saving. Keep it open and retry after storage is ready.");
  let effectiveMode = mode;
  if (mode === "ONLINE") {
    // A read-only check preserves the old immediate price-change warning.
    // It creates no order, reserves no financial ID and records no payment.
    const requestStartedAt = Date.now();
    try {
      await apiClient.post("/orders/sync-v2/validate", { deviceId: scope.deviceId, userId: scope.userId, businessId: scope.businessId, locationId: scope.locationId, shiftId: input.shiftId ?? null, orderType: type, paymentMethod: input.paymentMethod, tenderedAmount: input.tenderedAmount, lines: comparable(input, type).lines });
    } catch (cause) {
      // Wi-Fi being connected does not prove either application server works.
      // Only transport/unavailable responses can use separately approved and
      // locally unlocked offline authority. A price/auth/input rejection cannot.
      if (cause instanceof ApiClientError && [401, 403].includes(cause.status) && cause.code !== "SESSION_RENEWED_RETRY_REQUIRED") {
        await markOfflinePermissionRejected(offlineDb, scope, "The server rejected checkout authorization.", requestStartedAt);
      }
      if (!(cause instanceof ApiClientError) || ![0, 502, 503, 504].includes(cause.status)) throw cause;
      await verifySavedPermission(offlineDb, scope, "OFFLINE");
      effectiveMode = "OFFLINE";
      if (typeof window !== "undefined") window.dispatchEvent(new Event("suntech:reconnect"));
    }
  }
  let permission;
  try { permission = await verifySavedPermission(offlineDb, scope, effectiveMode); }
  catch (cause) {
    if (effectiveMode !== "ONLINE") throw cause;
    await renew(); permission = await verifySavedPermission(offlineDb, scope, "ONLINE");
  }
  const snapshot = await offlineDb.catalogSnapshots.get(scopeKey(scope));
  if (!snapshot) throw new OfflineError("CATALOG_NOT_READY", "Download the complete shop data before taking a new sale.");
  const lines: SaleLine[] = input.lines.map(line => {
    const variant = type === "CATALOG" ? snapshot.variants.find(item => item.id === line.variantId) : undefined;
    if (type === "CATALOG" && !variant) throw new OfflineError("VARIANT_NOT_IN_SNAPSHOT", "This variant is missing from the complete saved catalog. Refresh the shop data.");
    return { ...line, productName: variant?.product?.name || variant?.productName || line.productName, variantName: variant?.name || line.variantName, sku: variant?.sku || line.sku };
  });
  const committed = await commitLocalSale(offlineDb, {
    scope, clientOrderId: input.idempotencyKey, occurredAt: new Date().toISOString(), orderType: type,
    shiftId: input.shiftId ?? null, paymentMethod: input.paymentMethod, tenderedAmount: input.tenderedAmount,
    customerName: input.customerName, customerPhone: input.customerPhone, notes: input.notes,
    lines, pricePolicy: effectiveMode === "ONLINE" ? "CURRENT_PRICE" : "CAPTURED_PRICE", grantToken: permission.record.grantToken, mode: effectiveMode,
    cartKey: input.cartKey, cartRevision: input.cartRevision,
    businessName: snapshot.business.name, locationName: snapshot.location.name, cashierName: permission.record.user.fullName,
  });
  // No server/printing failure after this line may turn a durable save into a failed checkout.
  const result: LocalCreatedOrder = { ...committed.receipt.order, orderType: type, localStatus: "PENDING", clientOrderId: input.idempotencyKey, cashier: { id: scope.userId, fullName: permission.record.user.fullName, role: permission.record.user.role } };
  if (typeof window !== "undefined") window.dispatchEvent(new Event("suntech:sync"));
  return result;
}

async function savedResult(scope: OfflineScope, id: string, type: SaleType): Promise<LocalCreatedOrder> {
  const saved = await readSaleReceipt(offlineDb, scope, id);
  if (!saved) throw new OfflineError("RECEIPT_MISSING", "The saved sale exists but its receipt needs recovery. Do not collect payment again.");
  const order = saved.mapping?.order || saved.receipt.order;
  const outbox = await offlineDb.outbox.get(id);
  return { ...order, orderType: type, localStatus: saved.mapping ? "SYNCED" : outbox?.state === "NEEDS_REVIEW" ? "NEEDS_REVIEW" : "PENDING", clientOrderId: id,
    cashier: { id: scope.userId, fullName: order.cashierName || "", role: "" } };
}
