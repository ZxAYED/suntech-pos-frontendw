import type { OfflineDatabase } from "../db/offline-db";
import type { LocalReceipt, LocalSale, OfflineScope, PricePolicy, SaleLine, SaleType, WireSale } from "./types";
import type { PaymentMethod } from "@/types/domain";
import { canonicalJson, isUuid, OfflineError, scopeKey, sha256 } from "./scope";
import { isTrustedWorkspaceActive, matchesOfflineUnlock, verifySavedPermission } from "./grant";

export interface LocalCheckoutInput {
  scope: OfflineScope; clientOrderId: string; occurredAt: string; orderType: SaleType;
  shiftId: string | null; paymentMethod: PaymentMethod; tenderedAmount: number; lines: SaleLine[];
  pricePolicy: PricePolicy; grantToken: string; mode: "ONLINE" | "OFFLINE";
  cartKey: string; cartRevision: number;
  customerName?: string; customerPhone?: string; notes?: string;
  businessName?: string; locationName?: string; cashierName?: string;
}
const INT_MAX = 2_147_483_647;
function money(value: number): void {
  if (!Number.isSafeInteger(value) || value < 0 || value > INT_MAX) throw new OfflineError("INVALID_MONEY", "Amounts must be whole BDT within the supported accounting range.");
}
function validateInput(input: LocalCheckoutInput): number {
  scopeKey(input.scope);
  if (!isUuid(input.clientOrderId) || !["CATALOG", "CUSTOM"].includes(input.orderType) || !Number.isFinite(Date.parse(input.occurredAt)) || !/(Z|[+-]\d\d:\d\d)$/.test(input.occurredAt) || !input.cartKey || !Number.isSafeInteger(input.cartRevision)) throw new OfflineError("INVALID_CHECKOUT", "The sale identity, time, or saved cart is invalid.");
  if (input.shiftId !== null && (typeof input.shiftId !== "string" || !input.shiftId)) throw new OfflineError("INVALID_SHIFT", "Choose a real shift or explicitly no shift.");
  if (!["COD", "BKASH", "NAGAD", "BANK"].includes(input.paymentMethod) || !["CURRENT_PRICE", "CAPTURED_PRICE"].includes(input.pricePolicy) || !["ONLINE", "OFFLINE"].includes(input.mode)) throw new OfflineError("INVALID_CHECKOUT", "The payment or pricing policy is invalid.");
  if (!Array.isArray(input.lines) || input.lines.length === 0) throw new OfflineError("EMPTY_CART", "Add an item before completing the sale.");
  money(input.tenderedAmount);
  let total = 0;
  for (const line of input.lines) {
    if (!Number.isSafeInteger(line.quantity) || line.quantity <= 0 || line.quantity > INT_MAX) throw new OfflineError("INVALID_QUANTITY", "Item quantities must be positive whole numbers.");
    money(line.unitPrice); money(line.unitPrice * line.quantity);
    if (input.orderType === "CATALOG" && !line.variantId?.trim()) throw new OfflineError("MISSING_VARIANT", "Select a real product variant.");
    if (input.orderType === "CUSTOM" && (!line.productName?.trim() || line.productName.length > 120 || (line.variantName?.length ?? 0) > 120)) throw new OfflineError("INVALID_ITEM_NAME", "Custom item names must be between 1 and 120 characters.");
    total += line.quantity * line.unitPrice; money(total);
  }
  if (input.tenderedAmount < total) throw new OfflineError("INSUFFICIENT_TENDER", "The reported payment must cover the sale total.");
  if ((input.customerName?.length ?? 0) > 120 || (input.customerPhone?.length ?? 0) > 20 || (input.notes?.length ?? 0) > 500) throw new OfflineError("INVALID_CUSTOMER", "Customer details are too long.");
  return total;
}
function toWire(input: LocalCheckoutInput): WireSale {
  const lines = input.lines.map(line => input.orderType === "CATALOG" ? { variantId: line.variantId!, quantity: line.quantity, unitPrice: line.unitPrice } : {
    productName: line.productName!.trim(), ...(line.variantName?.trim() ? { variantName: line.variantName.trim() } : {}), quantity: line.quantity, unitPrice: line.unitPrice,
  });
  return {
    clientOrderId: input.clientOrderId, userId: input.scope.userId, orderType: input.orderType, occurredAt: new Date(input.occurredAt).toISOString(),
    shiftId: input.shiftId, paymentMethod: input.paymentMethod, tenderedAmount: input.tenderedAmount, lines,
    ...(input.customerName ? { customerName: input.customerName } : {}), ...(input.customerPhone ? { customerPhone: input.customerPhone } : {}), ...(input.notes ? { notes: input.notes } : {}),
    clientReceiptNumber: `LOCAL-${input.clientOrderId}`, pricePolicy: input.pricePolicy, grantToken: input.grantToken,
  };
}

/** This writer only commits locally. Financial upload and printing follow commit;
 * an optional read-only online preflight belongs in the checkout adapter. */
export async function commitLocalSale(db: OfflineDatabase, raw: LocalCheckoutInput): Promise<{ sale: LocalSale; receipt: LocalReceipt }> {
  const input = structuredClone(raw);
  const totalAmount = validateInput(input);
  const key = scopeKey(input.scope);
  const wire = toWire(input);
  const payloadHash = await sha256({ scope: input.scope, wire });
  const existing = await db.localSales.get(input.clientOrderId);
  if (existing) {
    if (existing.scopeKey !== key || existing.payloadHash !== payloadHash) throw new OfflineError("SALE_ID_CONFLICT", "This sale ID already belongs to different saved content. Keep it for review.");
    const receipt = await db.receipts.get(input.clientOrderId);
    if (!receipt) throw new OfflineError("RECEIPT_MISSING", "The saved sale needs recovery. Do not record another sale.");
    return { sale: existing, receipt };
  }
  const { record: permission, claims } = await verifySavedPermission(db, input.scope, input.mode);
  if (input.grantToken !== permission.grantToken || !claims.permissions.includes(input.orderType === "CATALOG" ? "CATALOG_SALE" : "CUSTOM_SALE")) throw new OfflineError("SALE_NOT_AUTHORIZED", "This operator's current permission does not allow the sale.");
  if (input.pricePolicy === "CAPTURED_PRICE" && !claims.capturedPriceAllowed) throw new OfflineError("CAPTURED_PRICE_NOT_APPROVED", "Saved-price selling has not been approved for this register.");
  if (input.mode === "OFFLINE" && input.pricePolicy !== "CAPTURED_PRICE") throw new OfflineError("OFFLINE_PRICE_POLICY", "Offline selling requires an approved saved-price policy.");
  if (Date.parse(wire.occurredAt) < claims.iat * 1000 || Date.parse(wire.occurredAt) >= claims.exp * 1000 || Date.parse(wire.occurredAt) > Date.now() + 1000) throw new OfflineError("INVALID_SALE_TIME", "The sale time is outside the signed permission period. Renew permission and check the device clock.");
  const savedAt = new Date().toISOString();
  const sale: LocalSale = {
    clientOrderId: input.clientOrderId, scopeKey: key, scope: input.scope, payloadHash, wire, lines: input.lines,
    totalAmount, changeDue: input.paymentMethod === "COD" ? input.tenderedAmount - totalAmount : 0,
    occurredAt: wire.occurredAt, savedAt, cartFinalizationKey: `${input.cartKey}:${input.cartRevision}`,
    businessName: input.businessName, locationName: input.locationName, cashierName: input.cashierName,
    paymentEvidence: "RECEIVED_REPORTED",
  };
  const receipt: LocalReceipt = {
    clientOrderId: input.clientOrderId, scopeKey: key, label: "Saved on device — server confirmation pending",
    order: { id: input.clientOrderId, invoiceNumber: wire.clientReceiptNumber, type: input.orderType, status: "PENDING", paymentMethod: input.paymentMethod,
      businessId: input.scope.businessId, locationId: input.scope.locationId, cashierId: input.scope.userId, shiftId: input.shiftId,
      cashierName: input.cashierName, businessName: input.businessName, locationName: input.locationName,
      customerName: input.customerName, customerPhone: input.customerPhone,
      subtotal: totalAmount, totalAmount, tenderedAmount: input.tenderedAmount, changeDue: sale.changeDue,
      occurredAt: wire.occurredAt, createdAt: savedAt,
      lines: input.lines.map((line, index) => ({ id: `${input.clientOrderId}:${index}`, variantId: line.variantId ?? null, productName: line.productName ?? "Item", variantName: line.variantName, sku: line.sku, quantity: line.quantity, unitPrice: line.unitPrice, subtotal: line.quantity * line.unitPrice })),
    },
  };
  return db.transaction("rw", [db.localSales, db.receipts, db.outbox, db.stockOverlays, db.drafts, db.permissions, db.catalogSnapshots, db.metadata], async () => {
    // Check a raced same-ID retry before add. Every financial table commits or rolls back together.
    const duplicate = await db.localSales.get(input.clientOrderId);
    if (duplicate) {
      if (duplicate.payloadHash !== payloadHash || duplicate.scopeKey !== key) throw new OfflineError("SALE_ID_CONFLICT", "The sale ID was used with different content.");
      const savedReceipt = await db.receipts.get(input.clientOrderId);
      if (!savedReceipt) throw new OfflineError("RECEIPT_MISSING", "The saved receipt needs recovery.");
      return { sale: duplicate, receipt: savedReceipt };
    }
    const flag = await db.metadata.get("new-intake-disabled");
    if (flag?.value === true || process.env.NEXT_PUBLIC_OFFLINE_INTAKE === "false") throw new OfflineError("INTAKE_DISABLED", "New sales are paused. Saved sales can still be synced or exported.");
    const latestPermission = await db.permissions.get(key);
    const trusted = input.mode === "OFFLINE" ? await isTrustedWorkspaceActive(db, input.scope) : false;
    if (!latestPermission || latestPermission.rejectedAt || latestPermission.grantToken !== permission.grantToken || (input.mode === "OFFLINE" && !matchesOfflineUnlock(latestPermission) && !trusted) || claims.exp * 1000 <= Date.now() || Date.now() + 1000 < latestPermission.lastObservedAt) throw new OfflineError("PERMISSION_CHANGED", "Permission or device time changed while saving. Renew permission before trying again.");
    if (!(await db.catalogSnapshots.get(key))) throw new OfflineError("CATALOG_NOT_READY", "The complete shop download must be saved first.");
    const current = await db.drafts.get(input.cartKey);
    if (!current || current.scopeKey !== key || current.kind !== input.orderType || current.state !== "ACTIVE" || current.finalizedBy || current.revision !== input.cartRevision) throw new OfflineError("CART_CHANGED", "This cart was changed or completed in another tab. Reload its saved state.");
    const savedLines = current.data.lines;
    if (!Array.isArray(savedLines)) throw new OfflineError("CART_CONTENT_MISMATCH", "The saved cart has no matching sale lines. Reload it before completing the sale.");
    const comparableLine = (value: unknown) => {
      const line = value as SaleLine;
      return input.orderType === "CATALOG"
        ? { variantId: line.variantId, quantity: line.quantity, unitPrice: line.unitPrice }
        : { productName: line.productName?.trim(), variantName: line.variantName?.trim() || undefined, quantity: line.quantity, unitPrice: line.unitPrice };
    };
    if (canonicalJson(savedLines.map(comparableLine)) !== canonicalJson(input.lines.map(comparableLine))) throw new OfflineError("CART_CONTENT_MISMATCH", "This checkout no longer matches the saved cart. Reload it; no sale was recorded.");
    await db.localSales.add(sale);
    await db.receipts.add(receipt);
    await db.outbox.add({ clientOrderId: sale.clientOrderId, scopeKey: key, state: "PENDING", attempts: 0, nextAttemptAt: 0, updatedAt: savedAt });
    const stock = new Map<string, number>();
    if (input.orderType === "CATALOG") for (const line of input.lines) stock.set(line.variantId!, (stock.get(line.variantId!) ?? 0) - line.quantity);
    await db.stockOverlays.bulkAdd([...stock].map(([variantId, quantityDelta]) => ({ key: `${input.clientOrderId}:${variantId}`, scopeKey: key, clientOrderId: input.clientOrderId, variantId, quantityDelta })));
    await db.drafts.put({ ...current, state: "COMPLETED", finalizedBy: input.clientOrderId, revision: current.revision + 1, updatedAt: savedAt });
    await db.permissions.update(key, { lastObservedAt: Date.now() });
    return { sale, receipt };
  });
}

export async function readSaleReceipt(db: OfflineDatabase, scope: OfflineScope, clientOrderId: string) {
  const receipt = await db.receipts.get(clientOrderId);
  if (!receipt || receipt.scopeKey !== scopeKey(scope)) return undefined;
  const mapping = await db.serverMappings.get(clientOrderId);
  return { receipt, mapping: mapping?.scopeKey === receipt.scopeKey ? mapping : undefined };
}

export async function setNewIntakeDisabled(db: OfflineDatabase, disabled: boolean): Promise<void> {
  await db.metadata.put({ key: "new-intake-disabled", value: disabled });
}

/** Compare before deciding that a retry can reuse an existing financial identity. */
export function sameSaleWire(left: WireSale, right: WireSale): boolean { return canonicalJson(left) === canonicalJson(right); }
