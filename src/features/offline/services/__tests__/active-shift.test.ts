import "fake-indexeddb/auto";
import { afterEach, describe, expect, it } from "vitest";
import { databases, scope, setup } from "../../core/__tests__/fixtures";
import { setLocalUnlock, lockOffline } from "../../core/grant";
import { rememberActiveShift, readSavedActiveShift } from "../active-shift";
import { scopeKey } from "../../core/scope";
import type { ShiftViewModel } from "@/features/shifts/view-models";

const shift: ShiftViewModel = { id: "original-shift", locationId: scope.locationId, cashierId: scope.userId, status: "OPEN", openingFloat: 200, openedAt: new Date().toISOString() };
afterEach(async () => { lockOffline(); for (const db of databases.splice(0)) await db.delete(); });

describe("last known shift keeps its original identity", () => {
  it("survives database reopen, distinguishes unknown from a confirmed no-shift response, and never guesses another shift", async () => {
    const { db } = await setup(); await setLocalUnlock(db, scope, "offline-passphrase");
    expect(await readSavedActiveShift(db, scope)).toMatchObject({ shift: null, known: false });
    await rememberActiveShift(db, scope, shift); db.close(); await db.open();
    expect(await readSavedActiveShift(db, scope)).toMatchObject({ known: true, shift: { id: "original-shift" } });
    await rememberActiveShift(db, scope, null);
    expect(await readSavedActiveShift(db, scope)).toMatchObject({ shift: null, known: true });
  });
  it("rejects another branch and refuses a corrupted cashier association", async () => {
    const { db } = await setup(); await setLocalUnlock(db, scope, "offline-passphrase");
    await expect(rememberActiveShift(db, scope, { ...shift, locationId: "other-branch" })).rejects.toMatchObject({ code: "SHIFT_SCOPE_MISMATCH" });
    await rememberActiveShift(db, scope, shift);
    await db.metadata.put({ key: `active-shift:${scopeKey(scope)}`, value: { scope, shift: { ...shift, cashierId: "other-operator" }, savedAt: new Date().toISOString() } });
    await expect(readSavedActiveShift(db, scope)).rejects.toMatchObject({ code: "SHIFT_SCOPE_MISMATCH" });
  });
  it("requires local unlock and current offline authority even when a shift snapshot exists", async () => {
    const { db } = await setup(); await rememberActiveShift(db, scope, shift);
    await expect(readSavedActiveShift(db, scope)).rejects.toMatchObject({ code: "LOCAL_UNLOCK_REQUIRED" });
  });
});
