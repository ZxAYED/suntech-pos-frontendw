import { OfflineDatabase } from "../../db/offline-db";
import { installProvisioning } from "../grant";
import { activeCartKey, readActiveCart, saveActiveCart } from "../cart";
import { base64url } from "../scope";
import type { BootstrapPayload, GrantClaims, OfflineScope, ProvisioningResponse, SyncResult } from "../types";
import type { LocalCheckoutInput } from "../checkout";
import { commitLocalSale } from "../checkout";

export const databases: OfflineDatabase[] = [];
export const scope: OfflineScope = { userId: "operator-one", businessId: "business-one", locationId: "branch-one", deviceId: "5726a58c-37c1-4d39-896e-382ee25875bf" };
export function newDb(name = `offline-test-${crypto.randomUUID()}`) { const db = new OfflineDatabase(name); databases.push(db); return db; }
export function bootstrapFor(target = scope): BootstrapPayload {
  return {
    serverTime: new Date().toISOString(), manifest: { version: 2, snapshotId: crypto.randomUUID(), complete: true, counts: { categories: 1, products: 1, variants: 1 }, scope: target, history: { complete: false, limit: 100 }, acceptedIdsComplete: true },
    user: { id: target.userId, fullName: "Cashier One", role: "CASHIER", status: "ACTIVE", businessId: target.businessId, locationId: target.locationId },
    business: { id: target.businessId, name: "Shop" }, location: { id: target.locationId, businessId: target.businessId, name: "Branch" },
    categories: [{ id: "c1", name: "Category", products: [{ id: "p1", name: "Shirt", categoryId: "c1", variants: [{ id: "v1", productId: "p1", sku: "S1", name: "Red", sellingPrice: 250, stock: 1 }] }] }],
    acceptedClientOrderIds: [], acceptedIdsComplete: true, history: [],
  };
}
export async function provisioning(target = scope, overrides: Partial<GrantClaims> = {}): Promise<ProvisioningResponse> {
  const keys = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
  const claims: GrantClaims = {
    version: 1, iss: "suntech-pos", aud: "suntech-offline", jti: crypto.randomUUID(), sub: target.userId, ...target, role: "CASHIER",
    iat: Math.floor(Date.now() / 1000) - 10, exp: Math.floor(Date.now() / 1000) + 3600,
    permissions: ["CATALOG_SALE", "CUSTOM_SALE"], offlineIntakeAllowed: true, capturedPriceAllowed: true, ...overrides,
  };
  const header = base64url(new TextEncoder().encode(JSON.stringify({ alg: "ES256", kid: "test-key" })));
  const data = `${header}.${base64url(new TextEncoder().encode(JSON.stringify(claims)))}`;
  const signature = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, keys.privateKey, new TextEncoder().encode(data));
  return { grantToken: `${data}.${base64url(new Uint8Array(signature))}`, claims, verificationKey: { kid: "test-key", jwk: await crypto.subtle.exportKey("jwk", keys.publicKey) }, bootstrap: bootstrapFor(target) };
}
export async function setup(target = scope, claims: Partial<GrantClaims> = {}) {
  const db = newDb(); const provision = await provisioning(target, claims);
  await installProvisioning(db, provision, target);
  return { db, provision, scope: target };
}
export async function checkoutInput(db: OfflineDatabase, provision: ProvisioningResponse, overrides: Partial<LocalCheckoutInput> = {}): Promise<LocalCheckoutInput> {
  const target = overrides.scope ?? scope;
  const kind = overrides.orderType ?? "CATALOG";
  const previous = await readActiveCart(db, target, kind);
  const lines = overrides.lines ?? [{ variantId: "v1", productName: "Shirt", variantName: "Red", sku: "S1", quantity: 2, unitPrice: 250 }];
  const cart = await saveActiveCart(db, target, kind, { lines }, previous?.revision ?? null);
  return { scope: target, clientOrderId: crypto.randomUUID(), occurredAt: new Date().toISOString(), orderType: kind, shiftId: null, paymentMethod: "COD", tenderedAmount: 1000, lines, pricePolicy: "CURRENT_PRICE", grantToken: provision.grantToken, mode: "ONLINE", cartKey: activeCartKey(target, kind), cartRevision: cart.revision, ...overrides };
}
export async function createSale(db: OfflineDatabase, provision: ProvisioningResponse, overrides: Partial<LocalCheckoutInput> = {}) { const input = await checkoutInput(db, provision, overrides); return { ...await commitLocalSale(db, input), input }; }
export async function accepted(db: OfflineDatabase, clientOrderId: string, status: "ACCEPTED" | "DUPLICATE" = "ACCEPTED"): Promise<SyncResult> {
  const receipt = await db.receipts.get(clientOrderId);
  if (!receipt) throw new Error("missing test receipt");
  return { clientOrderId, status, retryable: false, warnings: [], order: { ...receipt.order, id: `official-${clientOrderId}`, invoiceNumber: `INV-${clientOrderId}`, status: "PAID", lines: receipt.order.lines.map((line,index) => ({ ...line, id: `server-line-${clientOrderId}-${index}` })) } };
}
