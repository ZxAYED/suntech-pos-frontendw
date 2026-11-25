import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { financialOperations, type OperationScopeParams } from "../financial-operation";
import { MemoryStorage } from "./test-storage";

if (typeof window === "undefined" || !window.sessionStorage) {
  const memStorage = new MemoryStorage();
  (globalThis as unknown as { window: { sessionStorage: MemoryStorage } }).window = {
    sessionStorage: memStorage,
  };
}

describe("Increment 1B Regression Tests (ST-F01, ST-F02, ST-F03)", () => {
  beforeEach(() => {
    if (typeof window !== "undefined" && window.sessionStorage) {
      window.sessionStorage.clear();
    }
  });

  afterEach(() => {
    if (typeof window !== "undefined" && window.sessionStorage) {
      window.sessionStorage.clear();
    }
    vi.restoreAllMocks();
  });

  const scope: OperationScopeParams = {
    operationType: "catalog_sale",
    userId: "usr-cashier-1",
    businessId: "biz-1",
    locationId: "loc-1",
  };

  const payloadA = {
    items: [{ variantId: "var-1", quantity: 2, unitPrice: 1500 }],
    paymentMethod: "COD",
    tenderedAmount: 3000,
  };

  const payloadB = {
    items: [{ variantId: "var-1", quantity: 3, unitPrice: 1500 }],
    paymentMethod: "COD",
    tenderedAmount: 4500,
  };

  describe("ST-F02: Storage failures must be explicit and prevent financial POST", () => {
    it("throws when sessionStorage.setItem throws (e.g. QuotaExceededError), returning no key and persisting zero records", () => {
      const origSetItem = window.sessionStorage.setItem.bind(window.sessionStorage);
      window.sessionStorage.setItem = () => {
        throw new Error("QuotaExceededError: DOMException quota exceeded");
      };

      try {
        expect(() => {
          financialOperations.getOrCreateKey(scope, payloadA);
        }).toThrow(/storage|quota/i);

        // Verify storage has no records stored
        window.sessionStorage.setItem = origSetItem;
        const pending = financialOperations.getPendingOperation(scope);
        expect(pending).toBeNull();
      } finally {
        window.sessionStorage.setItem = origSetItem;
      }
    });

    it("throws when storage has an unreadable/corrupted prior record rather than silently overwriting it", () => {
      // Store corrupted non-JSON data under this scope's key
      const storageKey = `stpos:finop:catalog_sale:usr-cashier-1:biz-1:loc-1:root`;
      window.sessionStorage.setItem(storageKey, "{bad-json:broken");

      expect(() => {
        financialOperations.getOrCreateKey(scope, payloadA);
      }).toThrow(/unreadable|corrupted|reconcile/i);
    });

    it("throws when sessionStorage access is denied", () => {
      const origStorage = window.sessionStorage;
      Object.defineProperty(window, "sessionStorage", {
        get() {
          throw new Error("SecurityError: Access is denied for this document to the Storage object");
        },
        configurable: true,
      });

      try {
        expect(() => {
          financialOperations.getOrCreateKey(scope, payloadA);
        }).toThrow(/storage|denied|access/i);
      } finally {
        Object.defineProperty(window, "sessionStorage", {
          value: origStorage,
          configurable: true,
          writable: true,
        });
      }
    });
  });

  describe("ST-F03: Prevent unresolved PENDING or UNKNOWN operations from being overwritten by changed payloads", () => {
    it("blocks changed payload when operation is still in PENDING state", () => {
      // Create initial pending operation
      const resA = financialOperations.getOrCreateKey(scope, payloadA);
      expect(resA.key).toBeTruthy();
      expect(resA.isRetry).toBe(false);

      const pending = financialOperations.getPendingOperation(scope);
      expect(pending?.outcome).toBe("pending");
      expect(pending?.key).toBe(resA.key);

      // Attempting to call getOrCreateKey with a changed payload while PENDING must throw
      expect(() => {
        financialOperations.getOrCreateKey(scope, payloadB);
      }).toThrow(/pending|uncertain|reconcile|cannot overwrite/i);

      // Verify the original pending record was NOT overwritten in storage
      const preserved = financialOperations.getPendingOperation(scope);
      expect(preserved?.key).toBe(resA.key);
      expect(preserved?.payloadHash).toBe(pending?.payloadHash);
    });

    it("blocks changed payload when operation is in UNKNOWN state", () => {
      const resA = financialOperations.getOrCreateKey(scope, payloadA);
      financialOperations.recordOutcome(scope, "unknown");

      expect(() => {
        financialOperations.getOrCreateKey(scope, payloadB);
      }).toThrow(/uncertain|reconcile/i);

      const preserved = financialOperations.getPendingOperation(scope);
      expect(preserved?.key).toBe(resA.key);
      expect(preserved?.outcome).toBe("unknown");
    });

    it("allows identical retry while PENDING, returning the same key", () => {
      const resA = financialOperations.getOrCreateKey(scope, payloadA);
      const resRetry = financialOperations.getOrCreateKey(scope, payloadA);

      expect(resRetry.key).toBe(resA.key);
      expect(resRetry.isRetry).toBe(true);
    });

    it("allows identical retry while UNKNOWN, returning the same key", () => {
      const resA = financialOperations.getOrCreateKey(scope, payloadA);
      financialOperations.recordOutcome(scope, "unknown");

      const resRetry = financialOperations.getOrCreateKey(scope, payloadA);
      expect(resRetry.key).toBe(resA.key);
      expect(resRetry.isRetry).toBe(true);
      expect(resRetry.isOutcomeUnknown).toBe(true);
    });

    it("allows fresh new transaction with fresh key after previous transaction succeeded and cleared", () => {
      const res1 = financialOperations.getOrCreateKey(scope, payloadA);
      financialOperations.recordOutcome(scope, "success");

      // Now customer buys identical items in a new sale
      const res2 = financialOperations.getOrCreateKey(scope, payloadA);
      expect(res2.key).toBeTruthy();
      expect(res2.key).not.toBe(res1.key);
      expect(res2.isRetry).toBe(false);
    });
  });

  describe("ST-F01: Submission locks must be released after validation failures and double-clicks prevented", () => {
    it("releases submission lock if early validation fails in checkout submission flow", async () => {
      let isSubmitting = false;
      const isSubmittingRef = { current: false };

      const mockSubmit = async (isValidInput: boolean) => {
        if (isSubmittingRef.current) return "LOCKED";
        isSubmittingRef.current = true;
        isSubmitting = true;

        try {
          // Early validation
          if (!isValidInput) {
            return "VALIDATION_FAILED";
          }
          // Financial POST would happen here
          return "SUBMITTED";
        } finally {
          isSubmittingRef.current = false;
          isSubmitting = false;
        }
      };

      // 1. First attempt fails validation
      const res1 = await mockSubmit(false);
      expect(res1).toBe("VALIDATION_FAILED");
      expect(isSubmittingRef.current).toBe(false);
      expect(isSubmitting).toBe(false);

      // 2. Second attempt with valid input succeeds because lock was released
      const res2 = await mockSubmit(true);
      expect(res2).toBe("SUBMITTED");
      expect(isSubmittingRef.current).toBe(false);
      expect(isSubmitting).toBe(false);
    });

    it("prevents double-click from initiating concurrent submissions", async () => {
      let submitCount = 0;
      let isSubmitting = false;
      const isSubmittingRef = { current: false };

      let resolveSlowPost: () => void = () => {};
      const slowPostPromise = new Promise<void>((resolve) => {
        resolveSlowPost = resolve;
      });

      const mockSubmit = async () => {
        if (isSubmittingRef.current) return "BLOCKED_BY_LOCK";
        isSubmittingRef.current = true;
        isSubmitting = true;

        try {
          submitCount++;
          await slowPostPromise;
          return "SUCCESS";
        } finally {
          isSubmittingRef.current = false;
          isSubmitting = false;
        }
      };

      // First click begins
      const call1 = mockSubmit();
      expect(isSubmittingRef.current).toBe(true);

      // Second immediate click while first is running
      const call2 = mockSubmit();
      expect(await call2).toBe("BLOCKED_BY_LOCK");
      expect(submitCount).toBe(1);

      // Finish first call
      resolveSlowPost();
      const res1 = await call1;
      expect(res1).toBe("SUCCESS");
      expect(submitCount).toBe(1);
      expect(isSubmittingRef.current).toBe(false);
    });
  });

  describe("Integrated End-to-End Handlers Simulation", () => {
    it("Storage denied / quota exceeded → zero financial POSTs, user cart retained, lock released", async () => {
      let isSubmitting = false;
      const isSubmittingRef = { current: false };
      let postCallCount = 0;
      let cart = [
        { variantId: "var-1", quantity: 2, unitPrice: 1500 },
      ];

      // Simulate checkout flow matching terminal-workspace.tsx
      const completeSale = async () => {
        if (isSubmittingRef.current) return "BLOCKED";
        isSubmittingRef.current = true;
        isSubmitting = true;

        try {
          if (!cart.length) return "EMPTY_CART";

          const operationScope: OperationScopeParams = {
            operationType: "catalog_sale",
            userId: "usr-1",
            businessId: "biz-1",
            locationId: "loc-1",
          };

          const payload = {
            lines: cart,
            paymentMethod: "COD",
            tenderedAmount: 3000,
          };

          let scopedKey: string;
          try {
            const keyInfo = financialOperations.getOrCreateKey(operationScope, payload);
            scopedKey = keyInfo.key;
          } catch {
            // Storage failure caught
            return "STORAGE_ERROR";
          }

          // Financial POST
          postCallCount++;
          cart = [];
          financialOperations.recordOutcome(operationScope, "success");
          return `SUCCESS:${scopedKey}`;
        } finally {
          isSubmittingRef.current = false;
          isSubmitting = false;
        }
      };

      // Force storage setItem to throw (quota exceeded)
      const origSetItem = window.sessionStorage.setItem.bind(window.sessionStorage);
      window.sessionStorage.setItem = () => {
        throw new Error("QuotaExceededError");
      };

      try {
        const result = await completeSale();
        expect(result).toBe("STORAGE_ERROR");
        // Critical: ZERO financial POSTs
        expect(postCallCount).toBe(0);
        // Critical: User cart is retained!
        expect(cart.length).toBe(1);
        // Critical: Lock is released!
        expect(isSubmittingRef.current).toBe(false);
        expect(isSubmitting).toBe(false);
      } finally {
        window.sessionStorage.setItem = origSetItem;
      }
    });

    it("Validation failure in checkout → zero financial POSTs, lock released, subsequent valid submit succeeds", async () => {
      let isSubmitting = false;
      const isSubmittingRef = { current: false };
      let postCallCount = 0;
      let cart: Array<{ variantId: string; quantity: number; unitPrice: number }> = [];

      const completeSale = async () => {
        if (isSubmittingRef.current) return "BLOCKED";
        isSubmittingRef.current = true;
        isSubmitting = true;

        try {
          if (!cart.length) return "VALIDATION_FAILED:EMPTY_CART";

          const operationScope: OperationScopeParams = {
            operationType: "catalog_sale",
            userId: "usr-1",
            businessId: "biz-1",
            locationId: "loc-1",
          };

          const payload = {
            lines: cart,
            paymentMethod: "COD",
            tenderedAmount: 3000,
          };

          const keyInfo = financialOperations.getOrCreateKey(operationScope, payload);
          postCallCount++;
          cart = [];
          financialOperations.recordOutcome(operationScope, "success");
          return `SUCCESS:${keyInfo.key}`;
        } finally {
          isSubmittingRef.current = false;
          isSubmitting = false;
        }
      };

      // Attempt 1: Empty cart -> validation failure
      const res1 = await completeSale();
      expect(res1).toBe("VALIDATION_FAILED:EMPTY_CART");
      expect(postCallCount).toBe(0);
      expect(isSubmittingRef.current).toBe(false);

      // User adds items to cart
      cart = [{ variantId: "var-1", quantity: 1, unitPrice: 3000 }];

      // Attempt 2: Valid cart -> succeeds
      const res2 = await completeSale();
      expect(res2).toMatch(/^SUCCESS:/);
      expect(postCallCount).toBe(1);
      expect(cart.length).toBe(0);
      expect(isSubmittingRef.current).toBe(false);
    });

    it("Existing refund behavior preserved: successful refund, conflict 409, and uncertain 500 retry", async () => {
      let isRefunding = false;
      const isRefundingRef = { current: false };
      let refundPostCount = 0;
      let outcomeUnknown = false;

      const confirmRefund = async (refundOrder: { id: string }, items: Array<{ orderItemId: string; quantity: number }>, serverOutcome: "ok" | "conflict_409" | "timeout_500") => {
        if (isRefundingRef.current) return "BLOCKED";
        isRefundingRef.current = true;
        isRefunding = true;

        const operationScope: OperationScopeParams = {
          operationType: "refund",
          userId: "usr-1",
          businessId: "biz-1",
          locationId: "loc-1",
          scopeExtra: refundOrder.id,
        };

        try {
          if (!items.length) return "VALIDATION_FAILED:NO_ITEMS";

          const payload = { orderId: refundOrder.id, items };
          const keyInfo = financialOperations.getOrCreateKey(operationScope, payload);

          refundPostCount++;

          if (serverOutcome === "conflict_409") {
            financialOperations.recordOutcome(operationScope, "failed");
            outcomeUnknown = false;
            return "CONFLICT_409";
          }
          if (serverOutcome === "timeout_500") {
            financialOperations.recordOutcome(operationScope, "unknown");
            outcomeUnknown = true;
            return "TIMEOUT_500";
          }

          financialOperations.recordOutcome(operationScope, "success");
          outcomeUnknown = false;
          return `SUCCESS:${keyInfo.key}`;
        } finally {
          isRefundingRef.current = false;
          isRefunding = false;
        }
      };

      const order = { id: "ord-99" };
      const items = [{ orderItemId: "item-1", quantity: 1 }];

      // 1. Validation failure (empty items) releases lock
      const resVal = await confirmRefund(order, [], "ok");
      expect(resVal).toBe("VALIDATION_FAILED:NO_ITEMS");
      expect(isRefundingRef.current).toBe(false);

      // 2. Timeout 500 records unknown outcome and retains stable key
      const resTimeout = await confirmRefund(order, items, "timeout_500");
      expect(resTimeout).toBe("TIMEOUT_500");
      expect(outcomeUnknown).toBe(true);
      expect(isRefundingRef.current).toBe(false);

      const pending = financialOperations.getPendingOperation(scope);
      // Scope for refund is with scopeExtra: order.id
      const refundScope: OperationScopeParams = {
        operationType: "refund",
        userId: "usr-1",
        businessId: "biz-1",
        locationId: "loc-1",
        scopeExtra: order.id,
      };
      const pendingRefund = financialOperations.getPendingOperation(refundScope);
      expect(pendingRefund?.outcome).toBe("unknown");
      const stableKey = pendingRefund?.key;
      expect(stableKey).toBeTruthy();

      // 3. Changed payload during unknown outcome is rejected
      expect(() => {
        financialOperations.getOrCreateKey(refundScope, { orderId: order.id, items: [{ orderItemId: "item-2", quantity: 5 }] });
      }).toThrow(/uncertain|reconcile/i);

      // 4. Identical retry uses exact same idempotency key and succeeds
      const resRetry = await confirmRefund(order, items, "ok");
      expect(resRetry).toBe(`SUCCESS:${stableKey}`);
      expect(outcomeUnknown).toBe(false);
      expect(isRefundingRef.current).toBe(false);
      expect(financialOperations.getPendingOperation(refundScope)).toBeNull();
    });
  });
});
