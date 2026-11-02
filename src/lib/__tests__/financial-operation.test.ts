import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { financialOperations } from "../financial-operation";
import { MemoryStorage } from "./test-storage";

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

  it("stores and preserves payloadSnapshot for recovery after page reload (F1)", () => {
    const advanceScope = {
      operationType: "advance_create" as const,
      userId: "usr-cashier-1",
      businessId: "biz-1",
      locationId: "loc-1",
    };
    const advancePayload = { amount: 2000, reason: "Medical emergency" };

    const op = financialOperations.getOrCreateKey(advanceScope, advancePayload);
    financialOperations.recordOutcome(advanceScope, "unknown");

    // Simulating page refresh by retrieving from sessionStorage
    const retrieved = financialOperations.getPendingOperation<{ amount: number; reason: string }>(advanceScope);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.key).toBe(op.key);
    expect(retrieved?.outcome).toBe("unknown");
    expect(retrieved?.payloadSnapshot).toEqual(advancePayload);

    // Exact retry with restored snapshot succeeds and reuses key
    const retry = financialOperations.getOrCreateKey(advanceScope, retrieved!.payloadSnapshot!);
    expect(retry.key).toBe(op.key);
    expect(retry.isRetry).toBe(true);

    // Attempting to retry with a changed amount throws error requiring reconciliation
    expect(() => {
      financialOperations.getOrCreateKey(advanceScope, { amount: 3000, reason: "Medical emergency" });
    }).toThrow(/transaction outcome is uncertain/i);
  });

  it("preserves shift open/close operation snapshot across reload and reuses key (F3)", () => {
    const shiftOpenScope = {
      operationType: "shift_open" as const,
      userId: "usr-cashier-1",
      businessId: "biz-1",
      locationId: "loc-1",
    };
    const shiftOpenPayload = {
      startingAmount: 5000,
      autoClosePrevious: true,
      businessId: "biz-1",
      locationId: "loc-1",
    };

    const op = financialOperations.getOrCreateKey(shiftOpenScope, shiftOpenPayload);
    financialOperations.recordOutcome(shiftOpenScope, "unknown");

    const retrieved = financialOperations.getPendingOperation<typeof shiftOpenPayload>(shiftOpenScope);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.key).toBe(op.key);
    expect(retrieved?.outcome).toBe("unknown");
    expect(retrieved?.payloadSnapshot).toEqual(shiftOpenPayload);

    // Exact retry with restored snapshot reuses key
    const retry = financialOperations.getOrCreateKey(shiftOpenScope, retrieved!.payloadSnapshot!);
    expect(retry.key).toBe(op.key);
    expect(retry.isRetry).toBe(true);
    expect(retry.isOutcomeUnknown).toBe(true);

    // Cleared after reconciliation
    financialOperations.clearOperation(shiftOpenScope);
    expect(financialOperations.getPendingOperation(shiftOpenScope)).toBeNull();
  });

  it("enforces immutable checkout replay with saved shiftId when active shift rotates (F4)", () => {
    const saleScope = {
      operationType: "catalog_sale" as const,
      userId: "usr-cashier-1",
      businessId: "biz-1",
      locationId: "loc-1",
    };

    const originalSale = {
      shiftId: "shift-morning-1",
      customerName: "Walk-in Customer",
      paymentMethod: "COD",
      tenderedAmount: 2500,
      lines: [{ variantId: "var-1", quantity: 1, unitPrice: 2500 }],
    };

    const op = financialOperations.getOrCreateKey(saleScope, originalSale);
    financialOperations.recordOutcome(saleScope, "unknown");

    const pending = financialOperations.getPendingOperation<typeof originalSale>(saleScope);
    expect(pending?.payloadSnapshot?.shiftId).toBe("shift-morning-1");

    // If UI recomputes shiftId using rotated active shift (shift-evening-2), getOrCreateKey blocks payload mismatch
    const rotatedSalePayload = {
      ...originalSale,
      shiftId: "shift-evening-2",
    };
    expect(() => {
      financialOperations.getOrCreateKey(saleScope, rotatedSalePayload);
    }).toThrow(/transaction outcome is uncertain/i);

    // Using the immutable saved snapshot (retaining shift-morning-1) succeeds and reuses the exact key
    const exactReplay = financialOperations.getOrCreateKey(saleScope, pending!.payloadSnapshot!);
    expect(exactReplay.key).toBe(op.key);
    expect(exactReplay.isRetry).toBe(true);
  });
});
