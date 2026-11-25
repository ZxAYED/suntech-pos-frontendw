import type { OfflineDatabase } from "../db/offline-db";
import { getDeviceId, scopeKey } from "../core/scope";
import { financialOperations } from "@/lib/financial-operation";
import { registerGuard, type RegisterWorkSummary } from "@/lib/register-guard";
import type { OfflineScope } from "../core/types";

const noWork: RegisterWorkSummary = { hasCart: false, cartCount: 0, hasHeldTickets: false, heldCount: 0, isOutcomeUnknown: false };

/** Scope switching examines durable work; copied old storage is not a live cart after migration. */
export async function readRegisterWork(db: OfflineDatabase, userId?: string, businessId?: string, locationId?: string): Promise<RegisterWorkSummary> {
  if (!userId || !businessId || !locationId) return { ...noWork };
  try {
    const deviceId = await getDeviceId(db);
    const key = scopeKey({ userId, businessId, locationId, deviceId });
    const [marker, carts, uncertainUpload, legacyEvidence] = await Promise.all([
      db.metadata.get(`legacy-cart-import:${key}:CATALOG`),
      db.drafts.where("scopeKey").equals(key).toArray(),
      db.outbox.where("scopeKey").equals(key).filter(row => ["UNKNOWN", "SENDING", "NEEDS_REVIEW"].includes(row.state)).first(),
      db.metadata.where("key").startsWith(`legacy-financial-recovery:${key}:`).toArray(),
    ]);
    let unfinishedLegacy = false;
    for (const row of legacyEvidence) {
      const value = row.value as { scope?: OfflineScope; operation?: { key?: string } } | null;
      if (!value?.scope || scopeKey(value.scope) !== key || !value.operation?.key) { unfinishedLegacy = true; continue; }
      const proof = (await db.metadata.get(`legacy-sale-confirmed:${key}:${value.operation.key}`))?.value as { originalKey?: string; scope?: OfflineScope } | undefined;
      if (!proof?.scope || proof.originalKey !== value.operation.key || scopeKey(proof.scope) !== key) unfinishedLegacy = true;
    }
    let cartCount = 0; let hasCart = false; let heldCount = 0;
    for (const cart of carts) {
      if (cart.state === "HELD") heldCount++;
      if (cart.state !== "ACTIVE") continue;
      const lines = cart.data.lines ?? cart.data.items ?? [];
      if (!Array.isArray(lines)) return { ...noWork, isOutcomeUnknown: true };
      if (lines.length) hasCart = true;
      cartCount += lines.reduce((sum, line) => sum + (Number.isFinite(Number(line?.quantity)) ? Math.max(1, Number(line.quantity)) : 1), 0);
    }
    const legacy = marker ? noWork : registerGuard.hasActiveRegisterWork(userId, businessId, locationId);
    return {
      hasCart: hasCart || legacy.hasCart, cartCount: cartCount + legacy.cartCount,
      hasHeldTickets: heldCount > 0 || legacy.hasHeldTickets, heldCount: heldCount + legacy.heldCount,
      isOutcomeUnknown: legacy.isOutcomeUnknown || unfinishedLegacy || Boolean(uncertainUpload) || financialOperations.hasUncertainOperations(userId, businessId, locationId),
    };
  } catch { return { ...noWork, isOutcomeUnknown: true }; }
}
