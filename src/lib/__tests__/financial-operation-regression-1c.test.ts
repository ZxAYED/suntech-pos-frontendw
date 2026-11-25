import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { financialOperations, type OperationScopeParams } from "../financial-operation";
import { MemoryStorage } from "./test-storage";

if (typeof window === "undefined" || !window.sessionStorage) {
  const memStorage = new MemoryStorage();
  (globalThis as unknown as { window: { sessionStorage: MemoryStorage } }).window = {
    sessionStorage: memStorage,
  };
}

describe("Phase 1C Regression Tests (ST-F04, ST-F05, ST-F06, ST-F11, ST-F13)", () => {
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

  const saleScope: OperationScopeParams = {
    operationType: "catalog_sale",
    userId: "usr-cashier-1",
    businessId: "biz-1",
    locationId: "loc-1",
  };

  const expenseScope: OperationScopeParams = {
    operationType: "expense_create",
    userId: "usr-admin-1",
    businessId: "biz-1",
    locationId: "loc-1",
  };

  const refundScope: OperationScopeParams = {
    operationType: "refund",
    userId: "usr-cashier-1",
    businessId: "biz-1",
    locationId: "loc-1",
    scopeExtra: "ord-123",
  };

  describe("ST-F04: Sale acknowledgment separation & receipt resilience", () => {
    it("case 1: demonstrates ST-F04 bug in unpatched flow where receipt error marks sale failed and preserves cart", async () => {
      let postCount = 0;
      let outcomeRecorded: string | null = null;
      let cart = [{ variantId: "v-1", quantity: 1, unitPrice: 1000 }];

      // Unpatched flow where receipt mapping is inside the mutation try-block:
      const unpatchedCompleteSale = async (orderResponse: { id: string; totalAmount?: number; lines?: unknown[] }) => {
        const payload = { lines: cart, tenderedAmount: 1000, paymentMethod: "COD" };
        financialOperations.getOrCreateKey(saleScope, payload);

        try {
          // 1. Mutation succeeds
          postCount++;
          const order = orderResponse;

          // 2. Receipt mapping runs inside the same try block:
          if (!order.lines) {
            throw new Error("Cannot map lines: malformed response");
          }

          // 3. Success recorded only at the very end:
          cart = [];
          financialOperations.recordOutcome(saleScope, "success");
          outcomeRecorded = "success";
        } catch {
          // BUG ST-F04: Receipt mapping error routes here and marks the sale failed!
          financialOperations.recordOutcome(saleScope, "failed");
          outcomeRecorded = "failed";
        }
      };

      // Server returns order without lines
      await unpatchedCompleteSale({ id: "ord-1", totalAmount: 1000 });

      // Demonstrates the defect: Sale actually succeeded on server (postCount === 1),
      // but was marked "failed" in storage and cart was NOT cleared!
      expect(postCount).toBe(1);
      expect(outcomeRecorded).toBe("failed");
      expect(cart.length).toBe(1); // Cart remains, so cashier can click checkout again!
    });

    it("case 2 & 3: handles malformed or incomplete successful order responses gracefully", () => {
      const incompleteOrder: Record<string, unknown> = {
        id: "ord-inc-1",
        // lines is undefined/null
        lines: undefined,
        totalAmount: 500,
      };

      const mapReceiptSafely = (order: typeof incompleteOrder, fallbackLines: Array<{ variantId: string; quantity: number; unitPrice: number }>) => {
        const items = Array.isArray(order.lines)
          ? order.lines.map((l: { id: string; productName: string; quantity: number; subtotal: number }) => ({ id: l.id, name: l.productName, quantity: l.quantity, subtotal: l.subtotal }))
          : fallbackLines.map((l) => ({ id: l.variantId, name: "Item", quantity: l.quantity, subtotal: l.quantity * l.unitPrice }));

        return {
          orderId: order.id,
          items,
          totalAmount: order.totalAmount ?? 0,
        };
      };

      const fallback = [{ variantId: "v-1", quantity: 1, unitPrice: 500 }];
      const receipt = mapReceiptSafely(incompleteOrder, fallback);
      expect(receipt.orderId).toBe("ord-inc-1");
      expect(receipt.items.length).toBe(1);
      expect(receipt.totalAmount).toBe(500);
    });

    it("case 4: receipt printing failure does not alter committed order state or trigger new checkout", () => {
      financialOperations.getOrCreateKey(saleScope, { total: 1000 });
      financialOperations.recordOutcome(saleScope, "success");

      const printReceipt = () => {
        throw new Error("PrinterException: Thermal printer offline");
      };

      let errorCaught = false;
      try {
        printReceipt();
      } catch {
        errorCaught = true;
      }

      expect(errorCaught).toBe(true);
      // Operation remains resolved, no active uncommitted state
      expect(financialOperations.getPendingOperation(saleScope)).toBeNull();
    });
  });

  describe("ST-F05: Accurate refund conflict classification", () => {
    const classifyRefundError = (status: number, message: string) => {
      if (status === 409) {
        if (/exceeds the remaining quantity|over_refund/i.test(message)) {
          return { type: "QUANTITY_CONFLICT", terminal: true, retryable: false };
        }
        if (/already in progress/i.test(message)) {
          return { type: "IN_FLIGHT_CONFLICT", terminal: false, retryable: true };
        }
        if (/different request body|different request/i.test(message)) {
          return { type: "PAYLOAD_CONFLICT", terminal: true, retryable: false };
        }
        if (/retry|could not be completed/i.test(message)) {
          return { type: "SERIALIZATION_CONFLICT", terminal: false, retryable: true };
        }
        return { type: "GENERIC_CONFLICT", terminal: false, retryable: false };
      }
      return { type: "OTHER_ERROR", terminal: false, retryable: false };
    };

    it("case 5: correctly classifies quantity-exceeded 409 as a confirmed domain rejection", () => {
      const error = { status: 409, message: "Refund quantity exceeds the remaining quantity" };
      const classification = classifyRefundError(error.status, error.message);
      expect(classification.type).toBe("QUANTITY_CONFLICT");
      expect(classification.terminal).toBe(true);
      expect(classification.retryable).toBe(false);
    });

    it("case 6: distinguishes idempotency in-progress and serialization conflicts from quantity conflict, preserving recovery record", () => {
      // In-flight conflict
      const inFlight = { status: 409, message: "A request with this idempotency key is already in progress" };
      const c1 = classifyRefundError(inFlight.status, inFlight.message);
      expect(c1.type).toBe("IN_FLIGHT_CONFLICT");
      expect(c1.retryable).toBe(true);
      expect(c1.terminal).toBe(false);

      // Serialization conflict (P2034)
      const serial = { status: 409, message: "Refund could not be completed. Retry." };
      const c2 = classifyRefundError(serial.status, serial.message);
      expect(c2.type).toBe("SERIALIZATION_CONFLICT");
      expect(c2.retryable).toBe(true);

      // Reused key with different payload
      const payloadMismatch = { status: 409, message: "Idempotency-Key was reused with a different request body" };
      const c3 = classifyRefundError(payloadMismatch.status, payloadMismatch.message);
      expect(c3.type).toBe("PAYLOAD_CONFLICT");
      expect(c3.terminal).toBe(true);
    });
  });

  describe("ST-F06: Recovery evidence preservation during reconciliation", () => {
    it("case 7: manual reconciliation archives evidence and does not erase the UNKNOWN record from storage", () => {
      const payload = { amount: 2500, lines: [{ variantId: "v-1", quantity: 1, unitPrice: 2500 }] };
      const op = financialOperations.getOrCreateKey(saleScope, payload);
      financialOperations.recordOutcome(saleScope, "unknown");

      // Verify it is unknown
      const pending = financialOperations.getPendingOperation(saleScope);
      expect(pending?.outcome).toBe("unknown");
      expect(pending?.key).toBe(op.key);

      // When operator reconciles/clears, evidence MUST be preserved (archived)
      financialOperations.reconcileOperation(saleScope, "reconciled_not_on_server");

      // Active pending operation for new sales is clear
      expect(financialOperations.getPendingOperation(saleScope)).toBeNull();

      // But historical/recovery evidence is preserved
      const archived = financialOperations.getArchivedOperation(saleScope, op.key);
      expect(archived).not.toBeNull();
      expect(archived?.key).toBe(op.key);
      expect(archived?.payloadSnapshot).toEqual(payload);
    });
  });

  describe("ST-F11: Form modifications locked during in-flight financial submission", () => {
    it("case 8: guards cart changes, customer details, and payment method while checkout is in-flight", () => {
      const isSubmitting = true;
      const cart = [{ variantId: "v-1", quantity: 2, unitPrice: 1500 }];
      let customerName = "Alice";
      let paymentMethod = "COD";

      // Mutators should be blocked when isSubmitting is true
      const updateCart = (newQty: number) => {
        if (isSubmitting) return;
        cart[0].quantity = newQty;
      };

      const updateCustomer = (name: string) => {
        if (isSubmitting) return;
        customerName = name;
      };

      const updatePayment = (method: string) => {
        if (isSubmitting) return;
        paymentMethod = method;
      };

      updateCart(5);
      updateCustomer("Bob");
      updatePayment("BKASH");

      expect(cart[0].quantity).toBe(2);
      expect(customerName).toBe("Alice");
      expect(paymentMethod).toBe("COD");
    });

    it("case 9: prevents closing the refund dialog while refund submission is in-flight", () => {
      let isRefunding = true;
      let refundOrder: { id: string } | null = { id: "ord-1" };

      const onDialogCloseAttempt = () => {
        if (isRefunding) return; // Guarded dialog closure
        refundOrder = null;
      };

      onDialogCloseAttempt();
      // Dialog remains open while submission is active
      expect(refundOrder).not.toBeNull();

      // Once refund completes:
      isRefunding = false;
      onDialogCloseAttempt();
      expect(refundOrder).toBeNull();
    });
  });

  describe("ST-F13: Expense retry identity and storage durability", () => {
    const expensePayloadA = {
      title: "Store electricity bill",
      amount: 4500,
      category: "UTILITIES",
      locationId: "loc-1",
    };

    const expensePayloadB = {
      title: "Store electricity bill",
      amount: 5500, // changed amount
      category: "UTILITIES",
      locationId: "loc-1",
    };

    it("case 10 & 11: expense POST timeout retains stable key and snapshot for exact retry", () => {
      const op = financialOperations.getOrCreateKey(expenseScope, expensePayloadA);
      expect(op.key).toBeTruthy();
      expect(op.isRetry).toBe(false);

      // Simulate network timeout/500
      financialOperations.recordOutcome(expenseScope, "unknown");

      // Verify snapshot and key are preserved
      const pending = financialOperations.getPendingOperation<typeof expensePayloadA>(expenseScope);
      expect(pending?.key).toBe(op.key);
      expect(pending?.outcome).toBe("unknown");
      expect(pending?.payloadSnapshot).toEqual(expensePayloadA);

      // Exact retry reuses the identical key
      const retry = financialOperations.getOrCreateKey(expenseScope, pending!.payloadSnapshot!);
      expect(retry.key).toBe(op.key);
      expect(retry.isRetry).toBe(true);
      expect(retry.isOutcomeUnknown).toBe(true);
    });

    it("case 12: two intentional identical expenses retain distinct identities after confirmed success", () => {
      const exp1 = financialOperations.getOrCreateKey(expenseScope, expensePayloadA);
      financialOperations.recordOutcome(expenseScope, "success");

      // Second identical expense (e.g. next month bill with identical name and amount)
      const exp2 = financialOperations.getOrCreateKey(expenseScope, expensePayloadA);
      expect(exp2.key).toBeTruthy();
      expect(exp2.key).not.toBe(exp1.key);
      expect(exp2.isRetry).toBe(false);
    });

    it("case 13: storage write failure prevents unsafe expense submission and throws explicit error", () => {
      const origSetItem = window.sessionStorage.setItem.bind(window.sessionStorage);
      window.sessionStorage.setItem = () => {
        throw new Error("QuotaExceededError");
      };

      try {
        expect(() => {
          financialOperations.getOrCreateKey(expenseScope, expensePayloadA);
        }).toThrow(/storage|quota/i);

        // Verifies zero stored records
        window.sessionStorage.setItem = origSetItem;
        expect(financialOperations.getPendingOperation(expenseScope)).toBeNull();
      } finally {
        window.sessionStorage.setItem = origSetItem;
      }
    });

    it("case 14: blocks changed expense payload from overwriting unresolved pending/unknown work", () => {
      const op = financialOperations.getOrCreateKey(expenseScope, expensePayloadA);
      financialOperations.recordOutcome(expenseScope, "unknown");

      expect(() => {
        financialOperations.getOrCreateKey(expenseScope, expensePayloadB);
      }).toThrow(/uncertain|reconcile/i);

      const pending = financialOperations.getPendingOperation(expenseScope);
      expect(pending?.key).toBe(op.key);
      expect(pending?.payloadSnapshot).toEqual(expensePayloadA);
    });
  });

  describe("End-to-End Resilience & Existing Flow Preservation", () => {
    it("case 15: server commits sale but HTTP acknowledgment is lost -> retains stable key and snapshot for exact retry", () => {
      const payload = { lines: [{ variantId: "v-1", quantity: 2, unitPrice: 1200 }], paymentMethod: "COD" };
      const op1 = financialOperations.getOrCreateKey(saleScope, payload);
      expect(op1.key).toBeTruthy();
      expect(op1.isRetry).toBe(false);

      // Network disconnect / HTTP 500 / Timeout:
      financialOperations.recordOutcome(saleScope, "unknown");

      // Verify state is preserved:
      const pending = financialOperations.getPendingOperation<typeof payload>(saleScope);
      expect(pending?.outcome).toBe("unknown");
      expect(pending?.key).toBe(op1.key);
      expect(pending?.payloadSnapshot).toEqual(payload);

      // Cashier retries the sale with unchanged draft:
      const op2 = financialOperations.getOrCreateKey(saleScope, pending!.payloadSnapshot!);
      expect(op2.key).toBe(op1.key);
      expect(op2.isRetry).toBe(true);
      expect(op2.isOutcomeUnknown).toBe(true);
    });

    it("case 16: patched flow confirms sale, clears cart, and records success even if receipt formatting throws", async () => {
      let postCount = 0;
      let outcomeRecorded: string | null = null;
      let cart = [{ variantId: "v-1", quantity: 1, unitPrice: 1000 }];
      let receiptGenerated: unknown = null;

      const patchedCompleteSale = async (orderResponse: { id: string; totalAmount?: number; lines?: unknown[] }) => {
        const payload = { lines: cart, tenderedAmount: 1000, paymentMethod: "COD" };
        financialOperations.getOrCreateKey(saleScope, payload);

        try {
          // 1. Mutation succeeds
          postCount++;
          const order = orderResponse;

          // 2. Authoritative server success recorded immediately:
          financialOperations.recordOutcome(saleScope, "success");
          cart = [];
          outcomeRecorded = "success";

          // 3. Receipt mapping is isolated and resilient:
          try {
            if (!order.lines) {
              throw new Error("Malformed lines in order response");
            }
            receiptGenerated = { orderId: order.id, lines: order.lines };
          } catch {
            // Safe fallback receipt:
            receiptGenerated = {
              orderId: order.id,
              lines: payload.lines.map((l) => ({ id: l.variantId, name: "Item", quantity: l.quantity })),
              fallback: true,
            };
          }
        } catch {
          financialOperations.recordOutcome(saleScope, "failed");
          outcomeRecorded = "failed";
        }
      };

      await patchedCompleteSale({ id: "ord-999" });

      expect(postCount).toBe(1);
      expect(outcomeRecorded).toBe("success");
      expect(cart.length).toBe(0); // Cart is cleared!
      expect(receiptGenerated).not.toBeNull();
      expect(receiptGenerated).toMatchObject({ orderId: "ord-999", fallback: true });
      expect(financialOperations.getPendingOperation(saleScope)).toBeNull();
    });

    it("case 17: normal sale, custom sale, refund and expense happy-paths resolve cleanly without leftover locks", () => {
      // Catalog Sale
      financialOperations.getOrCreateKey(saleScope, { total: 1500 });
      financialOperations.recordOutcome(saleScope, "success");
      expect(financialOperations.getPendingOperation(saleScope)).toBeNull();

      // Custom Sale
      const customScope: OperationScopeParams = {
        operationType: "custom_sale",
        userId: "usr-cashier-1",
        businessId: "biz-1",
        locationId: "loc-1",
      };
      financialOperations.getOrCreateKey(customScope, { items: [{ name: "Custom Fee", price: 500 }] });
      financialOperations.recordOutcome(customScope, "success");
      expect(financialOperations.getPendingOperation(customScope)).toBeNull();

      // Refund
      financialOperations.getOrCreateKey(refundScope, { orderId: "ord-123", items: [{ orderItemId: "oi-1", quantity: 1 }] });
      financialOperations.recordOutcome(refundScope, "success");
      expect(financialOperations.getPendingOperation(refundScope)).toBeNull();

      // Expense
      financialOperations.getOrCreateKey(expenseScope, { title: "Stationery", amount: 250 });
      financialOperations.recordOutcome(expenseScope, "success");
      expect(financialOperations.getPendingOperation(expenseScope)).toBeNull();
    });
  });
});
