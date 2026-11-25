import "fake-indexeddb/auto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { rejectOperatorPermissions } from "../reject-operator";
import { databases, provisioning, scope, setup, createSale } from "../../core/__tests__/fixtures";
import { installProvisioning, isOfflineUnlocked, lockOffline, setLocalUnlock, verifySavedPermission } from "../../core/grant";
import { scopeKey } from "../../core/scope";

afterEach(async () => { lockOffline(); vi.restoreAllMocks(); await Promise.all(databases.splice(0).map(db => db.delete())); });

describe("Confirmed operator rejection", () => {
  it("persists rejection for that operator's branches and preserves other operators and financial work", async () => {
    const { db, provision } = await setup();
    const otherBranch = { ...scope, locationId: "branch-2" };
    const otherOperator = { ...scope, userId: "another-operator" };
    await installProvisioning(db, await provisioning(otherBranch), otherBranch);
    await installProvisioning(db, await provisioning(otherOperator), otherOperator);
    await setLocalUnlock(db, scope, "test-passphrase");
    await createSale(db, provision);
    const before = { carts: await db.drafts.toArray(), outbox: await db.outbox.toArray(), sales: await db.localSales.toArray() };
    await rejectOperatorPermissions(db, scope.userId);
    expect(isOfflineUnlocked(scope)).toBe(false);
    await expect(verifySavedPermission(db, scope, "ONLINE")).rejects.toMatchObject({ code: "OFFLINE_AUTHORITY_REJECTED" });
    expect((await db.permissions.get(scopeKey(otherBranch)))?.rejectedAt).toBeTypeOf("number");
    expect((await db.permissions.get(scopeKey(otherOperator)))?.rejectedAt).toBeUndefined();
    expect({ carts: await db.drafts.toArray(), outbox: await db.outbox.toArray(), sales: await db.localSales.toArray() }).toEqual(before);
  });

  it("locks memory immediately but exposes a failed durable write", async () => {
    const { db } = await setup();
    await setLocalUnlock(db, scope, "test-passphrase");
    vi.spyOn(db.permissions, "update").mockRejectedValueOnce(new DOMException("Disk unavailable", "QuotaExceededError"));
    await expect(rejectOperatorPermissions(db, scope.userId)).rejects.toThrow("Disk unavailable");
    expect(isOfflineUnlocked(scope)).toBe(false);
    expect((await db.permissions.get(scopeKey(scope)))?.rejectedAt).toBeUndefined();
  });
});
