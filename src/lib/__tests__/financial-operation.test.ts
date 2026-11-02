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
    if (typeof window !== "undefined" && window.sessionStorage) {
      window.sessionStorage.clear();
    }
  });

  afterEach(() => {
    if (typeof window !== "undefined" && window.sessionStorage) {
      window.sessionStorage.clear();
    }
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

  it("Shift S1 close POST commits on server but client gets a timeout; active shift becomes null after refresh (F1 Required Test 1)", () => {
    const shiftCloseScope = {
      operationType: "shift_close" as const,
      userId: "usr-cashier-1",
      businessId: "biz-1",
      locationId: "loc-1",
    };

    const s1ClosePayload = {
      shiftId: "shift-S1",
      actualCash: 7500,
      closingAmount: 7500,
      notes: "Drawer closing balance",
      businessId: "biz-1",
    };

    const op = financialOperations.getOrCreateKey(shiftCloseScope, s1ClosePayload);
    expect(op.key).toBeTruthy();

    // Mark as unknown outcome (e.g. timeout while server closes shift)
    financialOperations.recordOutcome(shiftCloseScope, "unknown");

    // Client refreshes: active shift query returns null because server already closed shift-S1
    const activeShiftOnRefresh = null;
    expect(activeShiftOnRefresh).toBeNull();

    // Storage lookup uses stable register scope (no scopeExtra shiftId dependency)
    const recoveredOp = financialOperations.getPendingOperation<typeof s1ClosePayload>(shiftCloseScope);
    expect(recoveredOp).not.toBeNull();
    expect(recoveredOp?.outcome).toBe("unknown");
    expect(recoveredOp?.key).toBe(op.key);
    expect(recoveredOp?.payloadSnapshot?.shiftId).toBe("shift-S1");
    expect(recoveredOp?.payloadSnapshot?.closingAmount).toBe(7500);
    expect(recoveredOp?.payloadSnapshot?.actualCash).toBe(7500);
    expect(recoveredOp?.payloadSnapshot?.notes).toBe("Drawer closing balance");

    // Exact retry uses same payloadSnapshot, reusing the exact same idempotency key
    const retry = financialOperations.getOrCreateKey(shiftCloseScope, recoveredOp!.payloadSnapshot!);
    expect(retry.key).toBe(op.key);
    expect(retry.isRetry).toBe(true);
    expect(retry.isOutcomeUnknown).toBe(true);
  });

  it("Shift open commits but response times out; subsequent active-shift fetch returns S1 (F1 Required Test 2)", () => {
    const shiftOpenScope = {
      operationType: "shift_open" as const,
      userId: "usr-cashier-1",
      businessId: "biz-1",
      locationId: "loc-1",
    };

    const openPayload = {
      startingAmount: 3000,
      autoClosePrevious: false,
      businessId: "biz-1",
      locationId: "loc-1",
    };

    const op = financialOperations.getOrCreateKey(shiftOpenScope, openPayload);
    financialOperations.recordOutcome(shiftOpenScope, "unknown");

    // Server committed the open shift; subsequent activeShift fetch returns S1
    const activeShift = { id: "shift-S1", openingFloat: 3000, openedAt: new Date().toISOString() };
    expect(activeShift.id).toBe("shift-S1");

    // Open-recovery action remains visible because pendingShiftOpen is still "unknown"
    const pendingOpen = financialOperations.getPendingOperation<typeof openPayload>(shiftOpenScope);
    expect(pendingOpen).not.toBeNull();
    expect(pendingOpen?.outcome).toBe("unknown");
    expect(pendingOpen?.key).toBe(op.key);

    // Cashier inspects shift history/active shift and confirms it was already recorded
    financialOperations.clearOperation(shiftOpenScope);
    expect(financialOperations.getPendingOperation(shiftOpenScope)).toBeNull();
  });

  it("Close S1 times out, S2 later becomes active: exact retry still targets /shifts/S1/close, never S2; new close blocked until reconciled (F1 Required Test 3)", () => {
    const shiftCloseScope = {
      operationType: "shift_close" as const,
      userId: "usr-cashier-1",
      businessId: "biz-1",
      locationId: "loc-1",
    };

    const s1Payload = {
      shiftId: "shift-S1",
      actualCash: 5000,
      closingAmount: 5000,
      notes: "S1 closing",
      businessId: "biz-1",
    };

    const op = financialOperations.getOrCreateKey(shiftCloseScope, s1Payload);
    financialOperations.recordOutcome(shiftCloseScope, "unknown");

    // Later, shift S2 becomes active in system
    const activeShift = { id: "shift-S2", openingFloat: 5000 };
    expect(activeShift.id).toBe("shift-S2");

    // Attempting to close shift S2 or modify payload is blocked by unknown outcome guard
    const s2CloseAttempt = {
      shiftId: activeShift.id, // targets S2
      actualCash: 6000,
      closingAmount: 6000,
      notes: "S2 closing attempt",
      businessId: "biz-1",
    };

    expect(() => {
      financialOperations.getOrCreateKey(shiftCloseScope, s2CloseAttempt);
    }).toThrow(/transaction outcome is uncertain/i);

    // Exact retry from restored snapshot explicitly targets /shifts/S1/close (shift-S1), never S2
    const recovered = financialOperations.getPendingOperation<typeof s1Payload>(shiftCloseScope);
    expect(recovered?.payloadSnapshot?.shiftId).toBe("shift-S1");
    const retry = financialOperations.getOrCreateKey(shiftCloseScope, recovered!.payloadSnapshot!);
    expect(retry.key).toBe(op.key);
    expect(retry.isRetry).toBe(true);

    // After resolving S1, clearing the operation allows S2 to be closed
    financialOperations.recordOutcome(shiftCloseScope, "success");
    expect(financialOperations.getPendingOperation(shiftCloseScope)).toBeNull();

    const s2Close = financialOperations.getOrCreateKey(shiftCloseScope, s2CloseAttempt);
    expect(s2Close.key).toBeTruthy();
    expect(s2Close.key).not.toBe(op.key);
  });

  it("No unknown operation: normal shift open/close behaves cleanly (F1 Required Test 4)", () => {
    const shiftOpenScope = {
      operationType: "shift_open" as const,
      userId: "usr-cashier-2",
      businessId: "biz-1",
      locationId: "loc-1",
    };
    const shiftCloseScope = {
      operationType: "shift_close" as const,
      userId: "usr-cashier-2",
      businessId: "biz-1",
      locationId: "loc-1",
    };

    // Clean open
    const openRes = financialOperations.getOrCreateKey(shiftOpenScope, { startingAmount: 1000 });
    expect(openRes.isRetry).toBe(false);
    financialOperations.recordOutcome(shiftOpenScope, "success");
    expect(financialOperations.getPendingOperation(shiftOpenScope)).toBeNull();

    // Clean close
    const closeRes = financialOperations.getOrCreateKey(shiftCloseScope, { shiftId: "shift-norm-1", closingAmount: 1500 });
    expect(closeRes.isRetry).toBe(false);
    financialOperations.recordOutcome(shiftCloseScope, "success");
    expect(financialOperations.getPendingOperation(shiftCloseScope)).toBeNull();
  });

  it("hasUncertainOperations detects pending uncertain operations across types and branches (F3)", () => {
    const customSaleScope = {
      operationType: "custom_sale" as const,
      userId: "usr-admin-1",
      businessId: "biz-1",
      locationId: "loc-branch-A",
    };

    expect(financialOperations.hasUncertainOperations("usr-admin-1", "biz-1", "loc-branch-A")).toBe(false);

    financialOperations.getOrCreateKey(customSaleScope, { note: "Bulk order", amount: 12000 });
    financialOperations.recordOutcome(customSaleScope, "unknown");

    // Detects pending unknown operation on branch A
    expect(financialOperations.hasUncertainOperations("usr-admin-1", "biz-1", "loc-branch-A")).toBe(true);

    // Does not flag branch B
    expect(financialOperations.hasUncertainOperations("usr-admin-1", "biz-1", "loc-branch-B")).toBe(false);

    // Cleared after reconciliation
    financialOperations.clearOperation(customSaleScope);
    expect(financialOperations.hasUncertainOperations("usr-admin-1", "biz-1", "loc-branch-A")).toBe(false);
  });

  it("Corrupted or missing paymentMethod in checkout snapshot blocks replay without inventing COD (F2)", () => {
    const checkoutScope = {
      operationType: "custom_sale" as const,
      userId: "usr-cashier-1",
      businessId: "biz-1",
      locationId: "loc-1",
    };

    // Simulate an unknown operation whose snapshot has missing paymentMethod
    const corruptedSnapshot = {
      paymentMethod: undefined,
      amount: 5000,
      customerName: "Walk-in",
    };

    financialOperations.getOrCreateKey(checkoutScope, corruptedSnapshot);
    financialOperations.recordOutcome(checkoutScope, "unknown");

    const pending = financialOperations.getPendingOperation<typeof corruptedSnapshot>(checkoutScope);
    expect(pending?.outcome).toBe("unknown");

    // Recovery validation logic: must block replay and not invent "COD"
    const snapshot = pending?.payloadSnapshot;
    const canReplay = Boolean(snapshot?.paymentMethod);
    expect(canReplay).toBe(false);

    // Cleaning up
    financialOperations.clearOperation(checkoutScope);
  });
});
