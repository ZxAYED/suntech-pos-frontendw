import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { installProvisioning, lockOffline, setLocalUnlock } from "../../core/grant";
import { scopeKey } from "../../core/scope";
import { createSale, databases, newDb, provisioning, scope, setup } from "../../core/__tests__/fixtures";
import { catalogReadScope, filterOfflineVariants, readOfflineCatalog, requireOnlineEdit } from "../catalog-read";
import { readPreparedBusinesses } from "../tenant-read";
import { readRegisterWork } from "../register-work";
import { prepareLegacyRecovery } from "../legacy-recovery";
import { completeLegacyCart, importLegacyCarts, saveActiveCart } from "../../core/cart";
import { MemoryStorage } from "@/lib/__tests__/test-storage";
import { financialOperations } from "@/lib/financial-operation";
import { registerGuard } from "@/lib/register-guard";

afterEach(async () => {
  lockOffline(); vi.restoreAllMocks(); vi.unstubAllGlobals();
  await Promise.all(databases.splice(0).map(db => db.delete()));
});

describe("Scoped offline read adapters", () => {
  it("rejects a foreign actor, business or branch before reading a local catalog", () => {
    expect(catalogReadScope(scope, scope.userId, {})).toEqual(scope);
    expect(() => catalogReadScope(scope, "another-operator", {})).toThrow(/operator/i);
    expect(() => catalogReadScope(scope, scope.userId, { businessId: "another-business" })).toThrow(/operator/i);
    expect(() => catalogReadScope(scope, scope.userId, { locationId: "another-branch" })).toThrow(/operator/i);
    expect(() => catalogReadScope(null, scope.userId, {})).toThrow(/operator/i);
  });

  it("reads complete catalog and preserves negative stock with pending sale deltas", async () => {
    const { db, provision } = await setup();
    await setLocalUnlock(db, scope, "offline test passphrase");
    await createSale(db, provision);
    const catalog = await readOfflineCatalog(db, scope, scope.userId, { businessId: scope.businessId, locationId: scope.locationId });
    expect(catalog.variants).toHaveLength(1);
    expect(catalog.variants[0].stock).toBe(-1);
    expect(catalog.products[0].variants?.[0].id).toBe("v1");
    expect(catalog.categories[0]).toMatchObject({ productsCount: 1, activeSkus: 1, totalUnits: -1, inventoryValue: -250 });
    expect(catalog.summary).toMatchObject({ products: 1, units: -1, lowStock: 1, inventoryValue: -250, currency: "BDT" });
    expect(catalog.categories[0].salesCount).toBeUndefined(); // Incomplete history must not invent a lifetime total.
  });

  it("does not read protected data from a locked or tampered capability", async () => {
    const { db } = await setup();
    await expect(readOfflineCatalog(db, scope, scope.userId, {})).rejects.toMatchObject({ code: "LOCAL_UNLOCK_REQUIRED" });
    await setLocalUnlock(db, scope, "offline test passphrase");
    const saved = (await db.permissions.get(scopeKey(scope)))!;
    const [header, body] = saved.grantToken.split(".");
    await db.permissions.update(scopeKey(scope), { grantToken: `${header}.${body}.AAAA` });
    await expect(readOfflineCatalog(db, scope, scope.userId, {})).rejects.toMatchObject({ code: "INVALID_GRANT" });
    expect(await db.catalogSnapshots.count()).toBe(1);
  });

  it("applies the same category/search/page shape to local variants", async () => {
    const { db } = await setup();
    await setLocalUnlock(db, scope, "offline test passphrase");
    const { variants } = await readOfflineCatalog(db, scope, scope.userId, {});
    const rows = [variants[0], { ...variants[0], id: "v2", sku: "S2" }];
    expect(filterOfflineVariants(rows, { search: "sHirt", categoryId: "c1" }, 1, 1).map(row => row.id)).toEqual(["v2"]);
    expect(filterOfflineVariants(rows, { categoryId: "foreign-category" })).toEqual([]);
  });

  it("lists only prepared businesses for this operator and device", async () => {
    const { db } = await setup();
    await db.metadata.put({ key: "device-id", value: scope.deviceId });
    await setLocalUnlock(db, scope, "offline test passphrase");
    const second = { ...scope, locationId: "second-branch" };
    await installProvisioning(db, await provisioning(second), second);
    const foreign = { ...scope, userId: "another-operator", businessId: "private-business" };
    await installProvisioning(db, await provisioning(foreign), foreign);
    const otherDevice = { ...scope, deviceId: crypto.randomUUID(), businessId: "old-device-business" };
    await installProvisioning(db, await provisioning(otherDevice), otherDevice);
    const businesses = await readPreparedBusinesses(db, scope.userId);
    expect(businesses.map(row => row.id)).toEqual([scope.businessId]);
    expect(businesses[0].locations?.map(row => row.id).sort()).toEqual([scope.locationId, second.locationId].sort());
    lockOffline();
    await expect(readPreparedBusinesses(db, scope.userId)).rejects.toMatchObject({ code: "LOCAL_UNLOCK_REQUIRED" });
  });

  it("fails offline edits immediately and leaves online edit behavior available", () => {
    expect(() => requireOnlineEdit("OFFLINE", true)).toThrow(/Nothing was changed or queued/);
    expect(() => requireOnlineEdit("ONLINE", false)).toThrow(/connection/);
    expect(() => requireOnlineEdit("ONLINE", true)).not.toThrow();
    expect(() => requireOnlineEdit("SETUP", true)).not.toThrow(); // First-business creation has no branch to provision yet.
  });
});

describe("Durable branch guards and legacy browser restart", () => {
  const operationScope = { ...scope, operationType: "catalog_sale" as const };
  const lines = [{ variantId: "v1", name: "Shirt", sku: "S1", unitPrice: 500, quantity: 2, stock: 1 }];
  const payload = { lines: lines.map(({ variantId, unitPrice, quantity }) => ({ variantId, unitPrice, quantity })), tenderedAmount: 1000, paymentMethod: "COD" };
  beforeEach(() => vi.stubGlobal("window", { localStorage: new MemoryStorage(), sessionStorage: new MemoryStorage() }));

  it("ignores copied stale legacy cart after an IDB completion, while detecting new IDB work", async () => {
    const db = newDb();
    await db.metadata.put({ key: "device-id", value: scope.deviceId });
    registerGuard.saveDraft(scope.userId, scope.businessId, scope.locationId, { cart: lines, heldTickets: [] });
    await importLegacyCarts(db, scope, { kind: "CATALOG", active: { kind: "CATALOG", data: { lines } } });
    await completeLegacyCart(db, scope, "CATALOG", 1, crypto.randomUUID());
    expect(await readRegisterWork(db, scope.userId, scope.businessId, scope.locationId)).toMatchObject({ hasCart: false, cartCount: 0, isOutcomeUnknown: false });
    await saveActiveCart(db, scope, "CATALOG", { lines }, 2);
    expect(await readRegisterWork(db, scope.userId, scope.businessId, scope.locationId)).toMatchObject({ hasCart: true, cartCount: 2 });
  });

  it("restores the original legacy identity after sessionStorage is lost without creating a V2 sale", async () => {
    const db = newDb();
    await db.metadata.put({ key: "device-id", value: scope.deviceId });
    const original = financialOperations.getOrCreateKey(operationScope, payload);
    financialOperations.recordOutcome(operationScope, "unknown");
    await prepareLegacyRecovery(db, scope, "catalog_sale");
    window.sessionStorage.clear();
    expect((await readRegisterWork(db, scope.userId, scope.businessId, scope.locationId)).isOutcomeUnknown).toBe(true);
    await prepareLegacyRecovery(db, scope, "catalog_sale");
    expect(financialOperations.getPendingOperation(operationScope)).toMatchObject({ key: original.key, outcome: "unknown", payloadSnapshot: payload });
    expect(await db.localSales.count()).toBe(0);
    expect(await db.outbox.count()).toBe(0);
  });

  it("does not resurrect a legacy operation already acknowledged atomically", async () => {
    const db = newDb();
    const original = financialOperations.getOrCreateKey(operationScope, payload);
    await prepareLegacyRecovery(db, scope, "catalog_sale");
    const cart = await saveActiveCart(db, scope, "CATALOG", { lines }, null);
    await completeLegacyCart(db, scope, "CATALOG", cart.revision, original.key);
    window.sessionStorage.clear();
    expect(await prepareLegacyRecovery(db, scope, "catalog_sale")).toBeNull();
    expect(financialOperations.getPendingOperation(operationScope)).toBeNull();
  });

  it("keeps both identities instead of overwriting a different live request", async () => {
    const db = newDb();
    const original = financialOperations.getOrCreateKey(operationScope, payload);
    await prepareLegacyRecovery(db, scope, "catalog_sale");
    financialOperations.recordOutcome(operationScope, "failed");
    const newer = financialOperations.getOrCreateKey(operationScope, payload, "LOCAL_FIRST_V2");
    await expect(prepareLegacyRecovery(db, scope, "catalog_sale")).rejects.toThrow(/Two different/);
    expect(financialOperations.getPendingOperation(operationScope)?.key).toBe(newer.key);
    const saved = await db.metadata.get(`legacy-financial-recovery:${scopeKey(scope)}:catalog_sale`);
    expect(saved?.value).toMatchObject({ operation: { key: original.key } });
  });
});
