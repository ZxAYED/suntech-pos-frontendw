import "fake-indexeddb/auto";
import Dexie from "dexie";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createSale, databases, newDb, provisioning, scope } from "./fixtures";
import {
  deactivateTrustedWorkspace,
  installProvisioning,
  markOfflinePermissionRejected,
  readTrustedWorkspace,
  verifySavedPermission,
} from "../grant";
import { readPreparedBusinesses } from "../../services/tenant-read";
import { readOfflineCatalog } from "../../services/catalog-read";
import { createSessionToken, verifySessionToken, verifySessionTokenWithGrace } from "@/lib/session-cookie";
import { ApiClientError } from "@/types/api";

afterEach(async () => {
  const rows = databases.splice(0);
  rows.forEach((db) => db.close());
  for (const name of new Set(rows.map((db) => db.name))) {
    await Dexie.delete(name);
  }
});

describe("Automatic trusted-device offline workspace", () => {
  it("authorizes offline catalog reads and checkout automatically without a passphrase when trustWorkspace is enabled", async () => {
    const db = newDb();
    await db.metadata.put({ key: "device-id", value: scope.deviceId });
    const provision = await provisioning(scope);
    await installProvisioning(db, provision, scope, { trustWorkspace: true });

    const verified = await verifySavedPermission(db, scope, "OFFLINE");
    expect(verified.claims.offlineIntakeAllowed).toBe(true);

    const businesses = await readPreparedBusinesses(db, scope.userId);
    expect(businesses).toHaveLength(1);
    expect(businesses[0].id).toBe(scope.businessId);

    const catalog = await readOfflineCatalog(db, scope, scope.userId, {
      businessId: scope.businessId,
      locationId: scope.locationId,
    });
    expect(catalog.variants).toHaveLength(1);
  });

  it("blocks automatic offline restoration after explicit logout while preserving saved sales", async () => {
    const db = newDb();
    await db.metadata.put({ key: "device-id", value: scope.deviceId });
    const provision = await provisioning(scope);
    await installProvisioning(db, provision, scope, { trustWorkspace: true });
    await createSale(db, provision);

    await deactivateTrustedWorkspace(db, "logged_out", scope.userId);

    const ws = await readTrustedWorkspace(db);
    expect(ws?.active).toBe(false);
    expect(ws?.reason).toBe("logged_out");

    await expect(verifySavedPermission(db, scope, "OFFLINE")).rejects.toMatchObject({
      code: "LOCAL_UNLOCK_REQUIRED",
    });
    // Saved sales remain intact for future recovery
    expect(await db.localSales.count()).toBe(1);
    expect(await db.outbox.count()).toBe(1);
  });

  it("blocks automatic offline restoration on server rejection and switches operators cleanly", async () => {
    const db = newDb();
    await db.metadata.put({ key: "device-id", value: scope.deviceId });
    const provisionA = await provisioning(scope);
    await installProvisioning(db, provisionA, scope, { trustWorkspace: true });
    await createSale(db, provisionA);

    await markOfflinePermissionRejected(db, scope, "REVOKED");
    await expect(verifySavedPermission(db, scope, "OFFLINE")).rejects.toMatchObject({
      code: "OFFLINE_AUTHORITY_REJECTED",
    });

    // Account switch to operator B preserves operator A's saved sales under operator A's scopeKey
    const scopeB = { ...scope, userId: "cashier-b", locationId: "branch-b" };
    const provisionB = await provisioning(scopeB);
    await installProvisioning(db, provisionB, scopeB, { trustWorkspace: true });

    await expect(verifySavedPermission(db, scopeB, "OFFLINE")).resolves.toMatchObject({
      claims: { userId: "cashier-b" },
    });
    await expect(verifySavedPermission(db, scope, "OFFLINE")).rejects.toMatchObject({
      code: "OFFLINE_AUTHORITY_REJECTED",
    });
    expect(await db.localSales.count()).toBe(1);
  });

  it("distinguishes 7-day routing cookie expiry within the 30-day offline grace window from tampering or expired grants", async () => {
    const token = await createSessionToken({
      id: scope.userId,
      fullName: "Demo Cashier",
      role: "CASHIER",
      status: "ACTIVE",
      businessId: scope.businessId,
      locationId: scope.locationId,
    });

    const freshStrict = await verifySessionToken(token);
    expect(freshStrict?.user.id).toBe(scope.userId);

    const freshGrace = await verifySessionTokenWithGrace(token);
    expect(freshGrace?.expired).toBe(false);

    // Tampered token is always rejected
    const [payload, sig] = token.split(".");
    const tampered = `${payload}.${sig.slice(0, -1)}${sig.endsWith("A") ? "B" : "A"}`;
    expect(await verifySessionTokenWithGrace(tampered)).toBeNull();

    // Token older than 7 days but within 30-day offline grace expires strictly yet retains grace
    const baseTime = Date.now();
    const dateNowSpy = vi.spyOn(Date, "now");
    try {
      dateNowSpy.mockReturnValue(baseTime + 8 * 24 * 60 * 60 * 1000);
      expect(await verifySessionToken(token)).toBeNull();
      const withinGrace = await verifySessionTokenWithGrace(token);
      expect(withinGrace?.expired).toBe(true);
      expect(withinGrace?.session.user.id).toBe(scope.userId);

      // Token older than 30 days is rejected completely
      dateNowSpy.mockReturnValue(baseTime + 31 * 24 * 60 * 60 * 1000);
      expect(await verifySessionTokenWithGrace(token)).toBeNull();
    } finally {
      dateNowSpy.mockRestore();
    }

    // Ensure ApiClientError preserves backend codes cleanly for diagnostics
    const configErr = new ApiClientError("Local checkout signing key must be a valid EC P-256 private key.", 503, undefined, undefined, "OFFLINE_SIGNING_INVALID");
    expect(configErr.code).toBe("OFFLINE_SIGNING_INVALID");
  });
});
