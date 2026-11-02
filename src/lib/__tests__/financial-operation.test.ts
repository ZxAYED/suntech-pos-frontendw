import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { financialOperations } from "../financial-operation";

// Polyfill in-memory sessionStorage for Node environment
class MemoryStorage {
  private store: Record<string, string> = {};
  get length() {
    return Object.keys(this.store).length;
  }
  key(index: number) {
    return Object.keys(this.store)[index] ?? null;
  }
  getItem(key: string) {
    return this.store[key] ?? null;
  }
  setItem(key: string, value: string) {
    this.store[key] = String(value);
  }
  removeItem(key: string) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
}

if (typeof window === "undefined" || !window.sessionStorage) {
  const memStorage = new MemoryStorage();
  (globalThis as unknown as { window: { sessionStorage: MemoryStorage } }).window = {
    sessionStorage: memStorage,
  };
}

describe("Financial Operation Idempotency Manager (F06)", () => {
  beforeEach(() => {
    financialOperations.clearOperation({
      operationType: "catalog_sale",
      userId: "usr-admin-1",
      businessId: "biz-1",
      locationId: "loc-1",
    });
    financialOperations.clearOperation({
      operationType: "catalog_sale",
      userId: "usr-admin-1",
      businessId: "biz-1",
      locationId: "loc-2",
    });
  });

  afterEach(() => {
    financialOperations.clearOperation({
      operationType: "catalog_sale",
      userId: "usr-admin-1",
      businessId: "biz-1",
      locationId: "loc-1",
    });
    financialOperations.clearOperation({
      operationType: "catalog_sale",
      userId: "usr-admin-1",
      businessId: "biz-1",
      locationId: "loc-2",
    });
  });

  const scope = {
    operationType: "catalog_sale" as const,
    userId: "usr-admin-1",
    businessId: "biz-1",
    locationId: "loc-1",
  };

  const payloadA = {
    items: [{ variantId: "var-1", quantity: 2, unitPrice: 1500 }],
    paymentMethod: "CASH",
    tenderedAmount: 3000,
  };

  const payloadB = {
    items: [{ variantId: "var-1", quantity: 3, unitPrice: 1500 }], // changed quantity
    paymentMethod: "CASH",
    tenderedAmount: 4500,
  };

  it("generates and preserves the exact same idempotency key for identical payload and scope", () => {
    const res1 = financialOperations.getOrCreateKey(scope, payloadA);
    expect(res1.key).toBeTruthy();
    expect(res1.isRetry).toBe(false);

    const res2 = financialOperations.getOrCreateKey(scope, payloadA);
    expect(res2.key).toBe(res1.key);
    expect(res2.isRetry).toBe(true);
  });

  it("generates a new distinct key when payload is modified", () => {
    const resA = financialOperations.getOrCreateKey(scope, payloadA);
    const resB = financialOperations.getOrCreateKey(scope, payloadB);

    expect(resB.key).not.toBe(resA.key);
  });

  it("generates distinct keys for different scopes (e.g. different locations or users)", () => {
    const resLoc1 = financialOperations.getOrCreateKey(scope, payloadA);
    const resLoc2 = financialOperations.getOrCreateKey(
      {
        ...scope,
        locationId: "loc-2",
      },
      payloadA,
    );

    expect(resLoc2.key).not.toBe(resLoc1.key);
  });

  it("locks operation on unknown outcome and reports active pending state", () => {
    const res = financialOperations.getOrCreateKey(scope, payloadA);

    // Mark as unknown outcome (e.g. network timeout)
    financialOperations.recordOutcome(scope, "unknown");

    const pendingOp = financialOperations.getPendingOperation(scope);
    expect(pendingOp).not.toBeNull();
    expect(pendingOp?.key).toBe(res.key);
    expect(pendingOp?.outcome).toBe("unknown");

    // Querying with same payload retains unknown state and key
    const resRetry = financialOperations.getOrCreateKey(scope, payloadA);
    expect(resRetry.key).toBe(res.key);
    expect(resRetry.isOutcomeUnknown).toBe(true);
    expect(resRetry.isRetry).toBe(true);
  });

  it("clears operation on terminal success so fresh operations can start", () => {
    financialOperations.getOrCreateKey(scope, payloadA);
    financialOperations.recordOutcome(scope, "success");
    financialOperations.clearOperation(scope);

    const pendingOp = financialOperations.getPendingOperation(scope);
    expect(pendingOp).toBeNull();
  });
});
