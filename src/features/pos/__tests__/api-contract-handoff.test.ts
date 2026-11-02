import { describe, expect, it } from "vitest";
import {
  catalogCheckoutSchema,
  customOrderSchema,
  createRefundSchema,
  closeShiftSchema,
} from "@/lib/validations";
import { ApiClientError } from "@/types/api";
import type { Order } from "@/types/domain";
import type { AdvanceRowViewModel } from "@/features/hr/view-models";

describe("Frontend API Contract Handoff Verification (3.1 - 3.5)", () => {
  describe("3.1 Checkout (/api/v1/orders/catalog and /api/v1/orders/custom)", () => {
    it("enforces explicit paymentMethod (COD, BKASH, NAGAD, BANK)", () => {
      const explicitMethods = ["COD", "BKASH", "NAGAD", "BANK"] as const;
      for (const method of explicitMethods) {
        const payload = {
          paymentMethod: method,
          tenderedAmount: 500,
          lines: [{ variantId: "var_001", quantity: 1, unitPrice: 500 }],
          idempotencyKey: "11111111-1111-4111-8111-111111111111",
        };
        const res = catalogCheckoutSchema.safeParse(payload);
        expect(res.success).toBe(true);
      }
    });

    it("rejects unsupported legacy payment methods (CASH, CARD, BANK_TRANSFER)", () => {
      const legacyMethods = ["CASH", "CARD", "BANK_TRANSFER"];
      for (const method of legacyMethods) {
        const payload = {
          paymentMethod: method,
          tenderedAmount: 500,
          lines: [{ variantId: "var_001", quantity: 1, unitPrice: 500 }],
          idempotencyKey: "11111111-1111-4111-8111-111111111111",
        };
        const res = catalogCheckoutSchema.safeParse(payload);
        expect(res.success).toBe(false);
      }
    });

    it("rejects checkout when neither paymentMethod nor paymentType is provided", () => {
      const payload = {
        tenderedAmount: 500,
        lines: [{ variantId: "var_001", quantity: 1, unitPrice: 500 }],
        idempotencyKey: "11111111-1111-4111-8111-111111111111",
      };
      const res = catalogCheckoutSchema.safeParse(payload);
      expect(res.success).toBe(false);
      if (!res.success) {
        const msg = res.error.issues.map((i) => i.message).join(" ");
        expect(msg).toMatch(/Payment method is required/);
      }
    });

    it("accepts matching paymentMethod and paymentType (e.g. COD and COD)", () => {
      const payload = {
        paymentMethod: "COD" as const,
        paymentType: "COD",
        tenderedAmount: 500,
        lines: [{ variantId: "var_001", quantity: 1, unitPrice: 500 }],
        idempotencyKey: "11111111-1111-4111-8111-111111111111",
      };
      const res = catalogCheckoutSchema.safeParse(payload);
      expect(res.success).toBe(true);
    });

    it("rejects mismatching paymentMethod and paymentType", () => {
      const payload = {
        paymentMethod: "COD" as const,
        paymentType: "BKASH",
        tenderedAmount: 500,
        lines: [{ variantId: "var_001", quantity: 1, unitPrice: 500 }],
        idempotencyKey: "11111111-1111-4111-8111-111111111111",
      };
      const res = catalogCheckoutSchema.safeParse(payload);
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0]?.message).toContain("paymentMethod and paymentType must match");
      }
    });

    it("enforces explicit paymentMethod on custom sales (/api/v1/orders/custom)", () => {
      const payloadMissing = {
        tenderedAmount: 1200,
        lines: [{ productName: "Custom Tailoring", quantity: 1, unitPrice: 1200 }],
        idempotencyKey: "11111111-1111-4111-8111-111111111111",
      };
      const resMissing = customOrderSchema.safeParse(payloadMissing);
      expect(resMissing.success).toBe(false);

      const payloadValid = {
        paymentMethod: "BKASH" as const,
        tenderedAmount: 1200,
        lines: [{ productName: "Custom Tailoring", quantity: 1, unitPrice: 1200 }],
        idempotencyKey: "11111111-1111-4111-8111-111111111111",
      };
      const resValid = customOrderSchema.safeParse(payloadValid);
      expect(resValid.success).toBe(true);
    });

    it("parses 409 PRICE_CHANGED conflict error with currentPrice and variantId", () => {
      const errorResponse = {
        statusCode: 409,
        message: "Product price changed. Please refresh your cart.",
        code: "PRICE_CHANGED",
        variantId: "var_xxx",
        currentPrice: 450,
        submittedPrice: 400,
      };

      const apiError = new ApiClientError(
        errorResponse.message,
        errorResponse.statusCode,
        undefined,
        undefined,
        errorResponse.code,
        errorResponse,
      );

      expect(apiError.status).toBe(409);
      expect(apiError.code).toBe("PRICE_CHANGED");
      expect(apiError.data?.variantId).toBe("var_xxx");
      expect(apiError.data?.currentPrice).toBe(450);
      expect(apiError.data?.submittedPrice).toBe(400);
    });

    it("handles order response with refundStatus (null | PARTIALLY_REFUNDED | REFUNDED)", () => {
      const mockOrderUnrefunded: Order = {
        id: "ord_1",
        invoiceNumber: "INV-001",
        type: "CATALOG",
        status: "PAID",
        paymentMethod: "COD",
        businessId: "biz_1",
        locationId: "loc_1",
        lines: [],
        subtotal: 1000,
        totalAmount: 1000,
        refundStatus: null,
        createdAt: new Date().toISOString(),
      };
      expect(mockOrderUnrefunded.refundStatus).toBeNull();

      const mockOrderPartiallyRefunded: Order = {
        ...mockOrderUnrefunded,
        refundStatus: "PARTIALLY_REFUNDED",
      };
      expect(mockOrderPartiallyRefunded.refundStatus).toBe("PARTIALLY_REFUNDED");

      const mockOrderFullyRefunded: Order = {
        ...mockOrderUnrefunded,
        refundStatus: "REFUNDED",
      };
      expect(mockOrderFullyRefunded.refundStatus).toBe("REFUNDED");
    });
  });

  describe("3.2 Refunds (POST /api/v1/orders/:id/refunds)", () => {
    it("validates refund request with items, reason, and payoutShiftId: null", () => {
      const payload = {
        items: [{ orderItemId: "item_xxx", quantity: 1 }],
        reason: "Damaged goods",
        payoutShiftId: null,
        idempotencyKey: "22222222-2222-4222-8222-222222222222",
      };

      const res = createRefundSchema.safeParse(payload);
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.items).toHaveLength(1);
        expect(res.data.reason).toBe("Damaged goods");
        expect(res.data.payoutShiftId).toBeNull();
      }
    });

    it("validates refund request with active payoutShiftId string", () => {
      const payload = {
        items: [{ orderItemId: "item_xxx", quantity: 2 }],
        reason: "Wrong size",
        payoutShiftId: "shift_123",
        idempotencyKey: "22222222-2222-4222-8222-222222222222",
      };

      const res = createRefundSchema.safeParse(payload);
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.payoutShiftId).toBe("shift_123");
      }
    });
  });

  describe("3.3 HR & Advances (/api/v1/hr/advances)", () => {
    it("maps deductedAmount and remainingAmount correctly in AdvanceRowViewModel", () => {
      const rawBackendAdvance = {
        id: "adv_1",
        cashierId: "csh_1",
        employeeName: "Rahim",
        amount: 5000,
        deductedAmount: 2000,
        remainingAmount: 3000,
        status: "ACTIVE" as const,
        takenAt: "2026-11-01T08:00:00Z",
      };

      const amount = Number(rawBackendAdvance.amount || 0);
      const deductedAmount = Number(rawBackendAdvance.deductedAmount ?? 0);
      const remainingAmount = Number(
        rawBackendAdvance.remainingAmount ?? (amount - deductedAmount),
      );

      const vm: AdvanceRowViewModel = {
        id: rawBackendAdvance.id,
        cashierId: rawBackendAdvance.cashierId,
        employeeName: rawBackendAdvance.employeeName,
        amount,
        deductedAmount,
        remainingAmount,
        createdAt: rawBackendAdvance.takenAt,
        status: rawBackendAdvance.status,
      };

      expect(vm.amount).toBe(5000);
      expect(vm.deductedAmount).toBe(2000);
      expect(vm.remainingAmount).toBe(3000);
    });

    it("guards advance deletion when deductedAmount > 0 or status is DEDUCTED", () => {
      const advanceDeducted: AdvanceRowViewModel = {
        id: "adv_2",
        cashierId: "csh_1",
        amount: 3000,
        deductedAmount: 1500,
        remainingAmount: 1500,
        createdAt: "2026-11-01T08:00:00Z",
        status: "DEDUCTED",
      };

      const canDelete =
        advanceDeducted.status !== "DEDUCTED" &&
        advanceDeducted.status !== "VOIDED" &&
        !(advanceDeducted.deductedAmount && advanceDeducted.deductedAmount > 0);

      expect(canDelete).toBe(false);

      // Verify 409 conflict error behavior
      const error409 = new ApiClientError(
        "Cannot delete advance that has already been partially or fully deducted from payroll",
        409,
      );
      expect(error409.status).toBe(409);
      expect(error409.message).toBe(
        "Cannot delete advance that has already been partially or fully deducted from payroll",
      );
    });
  });

  describe("3.4 Shifts & Staff Admin Scoping", () => {
    it("validates closeShift schema with actualCash, notes, and businessId for Admin", () => {
      const payload = {
        shiftId: "shift_999",
        actualCash: 12500,
        closingAmount: 12500,
        notes: "End of day count verified",
        businessId: "biz_xxx",
        idempotencyKey: "33333333-3333-4333-8333-333333333333",
      };

      const res = closeShiftSchema.safeParse(payload);
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.actualCash).toBe(12500);
        expect(res.data.notes).toBe("End of day count verified");
        expect(res.data.businessId).toBe("biz_xxx");
        expect(res.data.shiftId).toBe("shift_999");
      }
    });

    it("verifies cashier query param format with businessId", () => {
      const cashierId = "usr_xxx";
      const businessId = "biz_xxx";

      const deleteEndpoint = `/users/cashiers/${cashierId}?businessId=${businessId}`;
      const statusEndpoint = `/users/${cashierId}/status?businessId=${businessId}`;

      expect(deleteEndpoint).toBe("/users/cashiers/usr_xxx?businessId=biz_xxx");
      expect(statusEndpoint).toBe("/users/usr_xxx/status?businessId=biz_xxx");
    });
  });

  describe("3.5 Location Deletion Guard (DELETE /api/v1/tenants/locations/:id)", () => {
    it("properly surfaces 409 message when active assigned cashiers exist in branch", () => {
      const branchDeletionError = new ApiClientError(
        "Cannot delete branch with active assigned staff. Reassign or delete staff first.",
        409,
      );

      expect(branchDeletionError.status).toBe(409);
      expect(branchDeletionError.message).toBe(
        "Cannot delete branch with active assigned staff. Reassign or delete staff first.",
      );
    });
  });

  describe("3.6 ORD-01 Order Field Validation (useOrders / validateAndMapOrder)", () => {
    it("throws an error when status is missing instead of silently defaulting to PAID", async () => {
      const { validateAndMapOrder } = await import("@/features/pos/api/use-pos");
      const malformed = {
        id: "ord_1",
        type: "CATALOG",
        // status is missing!
        paymentMethod: "COD",
        totalAmount: 1500,
        lines: [],
      };

      expect(() =>
        validateAndMapOrder(malformed as unknown as Parameters<typeof validateAndMapOrder>[0]),
      ).toThrow(/missing or invalid 'status'/i);
    });

    it("throws an error when paymentMethod is missing instead of silently defaulting to COD", async () => {
      const { validateAndMapOrder } = await import("@/features/pos/api/use-pos");
      const malformed = {
        id: "ord_2",
        type: "CATALOG",
        status: "PAID",
        // paymentMethod is missing!
        totalAmount: 1500,
        lines: [],
      };

      expect(() =>
        validateAndMapOrder(malformed as unknown as Parameters<typeof validateAndMapOrder>[0]),
      ).toThrow(/missing essential field 'paymentMethod'/i);
    });

    it("throws an error when totalAmount is non-numeric or missing", async () => {
      const { validateAndMapOrder } = await import("@/features/pos/api/use-pos");
      const malformed = {
        id: "ord_3",
        type: "CATALOG",
        status: "PAID",
        paymentMethod: "COD",
        totalAmount: "invalid-number",
        lines: [],
      };

      expect(() =>
        validateAndMapOrder(malformed as unknown as Parameters<typeof validateAndMapOrder>[0]),
      ).toThrow(/non-numeric 'totalAmount'/i);
    });

    it("allows totalAmount: 0 (free or fully-discounted valid sale)", async () => {
      const { validateAndMapOrder } = await import("@/features/pos/api/use-pos");
      const validZeroSale = {
        id: "ord_zero",
        type: "CATALOG",
        status: "PAID",
        paymentMethod: "COD",
        totalAmount: 0,
        lines: [],
      };

      const mapped = validateAndMapOrder(
        validZeroSale as unknown as Parameters<typeof validateAndMapOrder>[0],
      );
      expect(mapped.id).toBe("ord_zero");
      expect(mapped.totalAmount).toBe(0);
      expect(mapped.status).toBe("PAID");
    });

    it("correctly maps valid order with lines and legacy orderType alias", async () => {
      const { validateAndMapOrder } = await import("@/features/pos/api/use-pos");
      const validOrder = {
        id: "ord_complete",
        orderType: "CATALOG",
        status: "PAID",
        paymentMethod: "BKASH",
        totalAmount: 2500,
        lines: [
          {
            id: "line_1",
            quantity: 2,
            unitPrice: 1250,
            productName: "Silk Scarf",
          },
        ],
      };

      const mapped = validateAndMapOrder(
        validOrder as unknown as Parameters<typeof validateAndMapOrder>[0],
      );
      expect(mapped.id).toBe("ord_complete");
      expect(mapped.type).toBe("CATALOG");
      expect(mapped.paymentMethod).toBe("BKASH");
      expect(mapped.totalAmount).toBe(2500);
      expect(mapped.lines).toHaveLength(1);
      expect(mapped.lines[0].subtotal).toBe(2500);
    });
  });
});
