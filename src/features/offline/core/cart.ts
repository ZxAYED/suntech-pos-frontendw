import type { OfflineDatabase } from "../db/offline-db";
import type { CartRecord, OfflineScope, SaleType } from "./types";
import { OfflineError, scopeKey } from "./scope";

export const activeCartKey = (scope: OfflineScope, kind: SaleType): string => `${scopeKey(scope)}:${kind}:active`;
export function readActiveCart(db: OfflineDatabase, scope: OfflineScope, kind: SaleType) {
  return db.drafts.get(activeCartKey(scope, kind));
}
export async function saveActiveCart(db: OfflineDatabase, scope: OfflineScope, kind: SaleType, data: Record<string, unknown>, expectedRevision: number | null): Promise<CartRecord> {
  const key = activeCartKey(scope, kind);
  // Snapshot before the await: a React caller must not change the data being persisted.
  const frozenData = structuredClone(data);
  return db.transaction("rw", db.drafts, async () => {
    const current = await db.drafts.get(key);
    assertRevision(current, expectedRevision);
    const next: CartRecord = { key, scopeKey: scopeKey(scope), kind, state: "ACTIVE", revision: (current?.revision ?? 0) + 1, data: frozenData, updatedAt: new Date().toISOString() };
    await db.drafts.put(next);
    return next;
  });
}
function assertRevision(cart: CartRecord | undefined, expected: number | null): void {
  if ((cart?.revision ?? null) !== expected) throw new OfflineError("CART_CHANGED", "This cart changed in another tab. Reload the saved cart before continuing.");
}
function hasLines(data: Record<string, unknown>): boolean {
  return [data.lines, data.items].some(value => Array.isArray(value) && value.length > 0);
}
export function listHeldCarts(db: OfflineDatabase, scope: OfflineScope) {
  return db.drafts.where("[scopeKey+state]").equals([scopeKey(scope), "HELD"]).toArray();
}
export async function holdActiveCart(db: OfflineDatabase, scope: OfflineScope, kind: SaleType, expectedRevision: number, label: string): Promise<{active: CartRecord; held: CartRecord}> {
  const key = activeCartKey(scope, kind);
  return db.transaction("rw", db.drafts, async () => {
    const active = await db.drafts.get(key);
    assertRevision(active, expectedRevision);
    if (!active || active.state !== "ACTIVE" || !hasLines(active.data)) throw new OfflineError("CART_EMPTY", "There is no active cart to hold.");
    const heldCount = await db.drafts.where("[scopeKey+state]").equals([scopeKey(scope), "HELD"]).count();
    // Existing held-ticket UI rule. This is NOT a completed-sale/outbox limit.
    if (heldCount >= 5) throw new OfflineError("HELD_CART_LIMIT", "Five carts are already held. Resume one before holding another.");
    const held: CartRecord = { ...active, key: `${scopeKey(scope)}:held:${crypto.randomUUID()}`, state: "HELD", label };
    const cleared: CartRecord = { ...active, revision: active.revision + 1, data: {}, updatedAt: new Date().toISOString() };
    await db.drafts.add(held);
    await db.drafts.put(cleared);
    return { active: cleared, held };
  });
}
export async function resumeHeldCart(db: OfflineDatabase, scope: OfflineScope, kind: SaleType, heldKey: string, expectedRevision: number | null): Promise<CartRecord> {
  const key = activeCartKey(scope, kind);
  return db.transaction("rw", db.drafts, async () => {
    const [active, held] = await Promise.all([db.drafts.get(key), db.drafts.get(heldKey)]);
    assertRevision(active, expectedRevision);
    if (!held || held.scopeKey !== scopeKey(scope) || held.kind !== kind || held.state !== "HELD") throw new OfflineError("HELD_CART_MISSING", "This held cart does not belong to this register.");
    if (active?.state === "ACTIVE" && hasLines(active.data)) throw new OfflineError("CART_OCCUPIED", "Hold or finish the current cart first.");
    const next: CartRecord = { ...held, key, state: "ACTIVE", revision: (active?.revision ?? 0) + 1, updatedAt: new Date().toISOString() };
    delete next.finalizedBy;
    await db.drafts.put(next);
    await db.drafts.delete(held.key);
    return next;
  });
}

/** Copy-only migration: leave old keys as evidence, mark once atomically, never overwrite an IDB cart. */
export async function importLegacyCarts(db: OfflineDatabase, scope: OfflineScope, input: { kind: SaleType; active?: { kind: SaleType; data: Record<string, unknown> }; held?: Array<{ id: string; kind: SaleType; data: Record<string, unknown>; label?: string }> }): Promise<boolean> {
  const marker = `legacy-cart-import:${scopeKey(scope)}:${input.kind}`;
  return db.transaction("rw", db.drafts, db.metadata, async () => {
    if (await db.metadata.get(marker)) return false;
    if (input.active && input.active.kind !== input.kind) throw new OfflineError("MIGRATION_SCOPE", "Legacy cart kind does not match.");
    if (input.active) {
      const key = activeCartKey(scope, input.active.kind);
      if (await db.drafts.get(key)) throw new OfflineError("MIGRATION_CONFLICT", "A local cart already exists. Keep both copies for recovery.");
      await db.drafts.add({ key, scopeKey: scopeKey(scope), kind: input.active.kind, state: "ACTIVE", revision: 1, data: structuredClone(input.active.data), updatedAt: new Date().toISOString() });
    }
    for (const held of input.held ?? []) {
      if (held.kind !== input.kind) throw new OfflineError("MIGRATION_SCOPE", "Held cart kind does not match.");
      if (!held.id) throw new OfflineError("INVALID_LEGACY_CART", "A held cart has no identity. Existing storage has been kept.");
      await db.drafts.add({ key: `${scopeKey(scope)}:legacy-held:${held.id}`, scopeKey: scopeKey(scope), kind: held.kind, state: "HELD", revision: 1, label: held.label, data: structuredClone(held.data), updatedAt: new Date().toISOString() });
    }
    await db.metadata.add({ key: marker, value: new Date().toISOString() });
    return true;
  });
}

export async function discardHeldCart(db: OfflineDatabase, scope: OfflineScope, kind: SaleType, heldKey: string, expectedRevision?: number): Promise<void> {
  await db.transaction("rw", db.drafts, async () => {
    const row = await db.drafts.get(heldKey);
    if (!row || row.scopeKey !== scopeKey(scope) || row.kind !== kind || row.state !== "HELD" || (expectedRevision !== undefined && row.revision !== expectedRevision)) throw new OfflineError("HELD_CART_CHANGED", "The held cart changed or belongs to another register.");
    await db.drafts.delete(heldKey);
  });
}

/** A confirmed legacy HTTP result closes its cart without ever creating a v2 sale or outbox event. */
export async function completeLegacyCart(db: OfflineDatabase, scope: OfflineScope, kind: SaleType, expectedRevision: number, legacyKey: string): Promise<CartRecord> {
  const key = activeCartKey(scope,kind);
  return db.transaction("rw", db.drafts, db.metadata, async () => {
    const cart = await db.drafts.get(key);
    if (cart?.state === "COMPLETED" && cart.finalizedBy === `legacy:${legacyKey}`) return cart;
    assertRevision(cart,expectedRevision);
    if (!cart || cart.scopeKey !== scopeKey(scope) || cart.kind !== kind || cart.state !== "ACTIVE") throw new OfflineError("CART_CHANGED", "The legacy sale cart changed. Keep the original acknowledgment for recovery.");
    const completed: CartRecord = { ...cart, state:"COMPLETED", finalizedBy:`legacy:${legacyKey}`, revision:cart.revision+1, updatedAt:new Date().toISOString() };
    await db.metadata.put({key:`legacy-sale-confirmed:${scopeKey(scope)}:${legacyKey}`,value:{originalKey:legacyKey,scope,confirmedAt:completed.updatedAt}});
    await db.drafts.put(completed);
    return completed;
  });
}
