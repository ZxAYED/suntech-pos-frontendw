import type { OfflineDatabase } from "../db/offline-db";
import type { OfflineScope } from "../core/types";
import { OfflineError, scopeKey } from "../core/scope";
import { financialOperations, type ScopedFinancialOperation } from "@/lib/financial-operation";

interface LegacyEvidence { scope: OfflineScope; operation: ScopedFinancialOperation }

/** Preserve the original route and identity across browser-close, separately from new V2 sales. */
export async function prepareLegacyRecovery(db: OfflineDatabase, scope: OfflineScope, operationType: "catalog_sale" | "custom_sale"): Promise<ScopedFinancialOperation | null> {
  const params = { operationType, userId: scope.userId, businessId: scope.businessId, locationId: scope.locationId };
  const key = scopeKey(scope);
  const evidenceKey = `legacy-financial-recovery:${key}:${operationType}`;
  const current = financialOperations.getPendingOperation(params);
  const saved = await db.metadata.get(evidenceKey);
  const evidence = saved?.value as LegacyEvidence | undefined;
  if (saved && (!evidence || !evidence.operation || scopeKey(evidence.scope) !== key || evidence.operation.operationType !== operationType)) {
    throw new OfflineError("LEGACY_RECOVERY_CONFLICT", "Saved legacy recovery evidence belongs to a different register. Both copies were kept.");
  }
  const original = evidence?.operation;
  if (original) {
    const acknowledgment = await db.metadata.get(`legacy-sale-confirmed:${key}:${original.key}`);
    if (acknowledgment) {
      const proof = acknowledgment.value as { originalKey?: string; scope?: OfflineScope } | null;
      if (!proof?.scope || proof.originalKey !== original.key || scopeKey(proof.scope) !== key) throw new OfflineError("LEGACY_RECOVERY_CONFLICT", "The saved legacy acknowledgment needs review. Its identity was kept.");
      if (current?.key === original.key && (current.deliveryProtocol ?? "LEGACY_HTTP") === "LEGACY_HTTP") financialOperations.recordOutcome(params, "success");
      if (!current || current.key === original.key) return null;
    } else {
      return financialOperations.restoreLegacyOperation(params, original);
    }
  }
  if (!current || (current.deliveryProtocol ?? "LEGACY_HTTP") !== "LEGACY_HTTP" || !["pending", "unknown"].includes(current.outcome)) return null;
  // Commit this copy before a legacy retry or a local cart migration can begin.
  await db.transaction("rw", db.metadata, async () => {
    const latest = await db.metadata.get(evidenceKey);
    if (latest) {
      const other = latest.value as LegacyEvidence;
      if (other.operation.key !== current.key && !(await db.metadata.get(`legacy-sale-confirmed:${key}:${other.operation.key}`))) {
        throw new OfflineError("LEGACY_RECOVERY_CONFLICT", "Two original financial identities need review. Neither was replaced.");
      }
    }
    await db.metadata.put({ key: evidenceKey, value: { scope, operation: structuredClone(current) } satisfies LegacyEvidence });
  });
  return current;
}
