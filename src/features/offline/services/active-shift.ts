import type { OfflineDatabase } from "../db/offline-db";
import type { OfflineScope } from "../core/types";
import type { ShiftViewModel } from "@/features/shifts/view-models";
import { verifySavedPermission } from "../core/grant";
import { OfflineError, scopeKey } from "../core/scope";

interface SavedActiveShift { scope: OfflineScope; shift: ShiftViewModel | null; savedAt: string; observedAt?: number }
const keyFor = (scope: OfflineScope) => `active-shift:${scopeKey(scope)}`;

/** Save only a server-confirmed read or mutation; a timeout is never evidence of no shift. */
export async function rememberActiveShift(db: OfflineDatabase, scope: OfflineScope, shift: ShiftViewModel | null, observedAt = Date.now()): Promise<ShiftViewModel | null> {
  if (shift && (!shift.id || shift.locationId !== scope.locationId || shift.status !== "OPEN")) throw new OfflineError("SHIFT_SCOPE_MISMATCH", "The shift response does not match this register.");
  return db.transaction("rw",db.metadata,async()=>{
    const key=keyFor(scope);
    const previous=(await db.metadata.get(key))?.value as SavedActiveShift|undefined;
    if(previous && (previous.observedAt??Date.parse(previous.savedAt))>observedAt)return previous.shift;
    await db.metadata.put({ key, value: { scope, shift: structuredClone(shift), savedAt: new Date().toISOString(), observedAt } satisfies SavedActiveShift });
    return shift;
  });
}

export async function readSavedActiveShift(db: OfflineDatabase, scope: OfflineScope): Promise<{ shift: ShiftViewModel | null; known: boolean; savedAt: string | null }> {
  const permission = await verifySavedPermission(db, scope, "OFFLINE");
  const row = await db.metadata.get(keyFor(scope));
  if (!row) return { shift: null, known: false, savedAt: null };
  const saved = row.value as SavedActiveShift;
  if (!saved?.scope || scopeKey(saved.scope) !== scopeKey(scope) || !Number.isFinite(Date.parse(saved.savedAt)) || (saved.shift && (!saved.shift.id || saved.shift.status !== "OPEN" || saved.shift.locationId !== scope.locationId || (permission.record.user.role === "CASHIER" && saved.shift.cashierId !== scope.userId)))) {
    throw new OfflineError("SHIFT_SCOPE_MISMATCH", "The saved shift needs review. Its original record has been kept.");
  }
  return { shift: saved.shift, known: true, savedAt: saved.savedAt };
}
