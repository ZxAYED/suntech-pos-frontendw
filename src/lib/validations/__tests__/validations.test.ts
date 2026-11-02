import { describe, expect, it } from "vitest";
import {
  adjustStockSchema,
  catalogCheckoutSchema,
  closeShiftSchema,
  createAdvanceSchema,
  createCashierSchema,
  createExpenseSchema,
  updateExpenseSchema,
  createRefundSchema,
  customOrderSchema,
  openShiftSchema,
  processPayrollSchema,
  registerSchema,
  variantFormSchema,
} from "../index";

describe("Validations Test Suite", () => {
  describe("Catalog Checkout Validation", () => {
    it("validates successful Cash on Delivery checkout", () => {
      const payload = {
        paymentMethod: "COD" as const,
        tenderedAmount: 1000,
        lines: [{ variantId: "var-1", quantity: 2, unitPrice: 400 }],
        idempotencyKey: "11111111-1111-4111-8111-111111111111",
      };
      const result = catalogCheckoutSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it("rejects Cash on Delivery if tendered amount is less than total", () => {
      const payload = {
        paymentMethod: "COD" as const,
        tenderedAmount: 500, // Total is 800
        lines: [{ variantId: "var-1", quantity: 2, unitPrice: 400 }],
        idempotencyKey: "11111111-1111-4111-8111-111111111111",
      };
      const result = catalogCheckoutSchema.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain("Tendered cash must be at least equal to order total");
      }
    });

    it("accepts exact digital payment methods (BKASH, NAGAD, BANK)", () => {
      const validMethods = ["BKASH", "NAGAD", "BANK"] as const;
      for (const method of validMethods) {
        const payload = {
          paymentMethod: method,
          tenderedAmount: 800,
          lines: [{ variantId: "var-1", quantity: 2, unitPrice: 400 }],
          idempotencyKey: "11111111-1111-4111-8111-111111111111",
        };
        const result = catalogCheckoutSchema.safeParse(payload);
        expect(result.success).toBe(true);
      }
    });

    it("validates Admin checkout with explicit businessId and locationId", () => {
      const payload = {
        businessId: "0b15b39e-2144-4cb6-a664-9be1c4e7ef63",
        locationId: "73c68383-be3c-419b-a010-86d1ee880cf5",
        paymentMethod: "COD" as const,
        tenderedAmount: 3000,
        lines: [{ variantId: "var-uuid-1", quantity: 2, unitPrice: 1500 }],
        idempotencyKey: "11111111-1111-4111-8111-111111111111",
      };
      const result = catalogCheckoutSchema.safeParse(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.businessId).toBe("0b15b39e-2144-4cb6-a664-9be1c4e7ef63");
        expect(result.data.locationId).toBe("73c68383-be3c-419b-a010-86d1ee880cf5");
      }
    });

    it("rejects invented payment methods like SPLIT, CRYPTO, etc.", () => {
      const payload = {
        paymentMethod: "SPLIT_CRYPTO",
        tenderedAmount: 1000,
        lines: [{ variantId: "var-1", quantity: 1, unitPrice: 1000 }],
        idempotencyKey: "11111111-1111-4111-8111-111111111111",
      };
      const result = catalogCheckoutSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it("rejects non-integer BDT monetary amounts", () => {
      const payload = {
        paymentMethod: "COD" as const,
        tenderedAmount: 1000.5,
        lines: [{ variantId: "var-1", quantity: 1, unitPrice: 500 }],
        idempotencyKey: "11111111-1111-4111-8111-111111111111",
      };
      const result = catalogCheckoutSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });
  });

  describe("Custom Order Validation", () => {
    it("validates valid custom sale items and cash tender", () => {
      const payload = {
        paymentMethod: "COD" as const,
        tenderedAmount: 1500,
        lines: [
          { productName: "Custom Tailoring", quantity: 1, unitPrice: 1200 },
          { productName: "Fabric Thread", quantity: 2, unitPrice: 50 },
        ],
        idempotencyKey: "22222222-2222-4222-8222-222222222222",
      };
      const result = customOrderSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it("rejects custom sale with 0 items", () => {
      const payload = {
        paymentMethod: "COD" as const,
        tenderedAmount: 1000,
        lines: [],
        idempotencyKey: "22222222-2222-4222-8222-222222222222",
      };
      const result = customOrderSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });
  });

  describe("Refund Validation & Invariants", () => {
    it("validates partial refund payload with idempotency key", () => {
      const payload = {
        items: [{ orderItemId: "item-123", quantity: 2 }],
        reason: "Customer changed mind",
        idempotencyKey: "33333333-3333-4333-8333-333333333333",
      };
      const result = createRefundSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it("rejects refund with 0 quantity", () => {
      const payload = {
        items: [{ orderItemId: "item-123", quantity: 0 }],
        idempotencyKey: "33333333-3333-4333-8333-333333333333",
      };
      const result = createRefundSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it("rejects non-uuid idempotency key", () => {
      const payload = {
        items: [{ orderItemId: "item-123", quantity: 1 }],
        idempotencyKey: "invalid-key-not-uuid",
      };
      const result = createRefundSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });
  });

  describe("Shift & Advance Validation", () => {
    it("accepts non-negative integer for opening float", () => {
      const result = openShiftSchema.safeParse({
        startingAmount: 2500,
        idempotencyKey: "44444444-4444-4444-8444-444444444444",
      });
      expect(result.success).toBe(true);
    });

    it("rejects negative amount for opening float", () => {
      const result = openShiftSchema.safeParse({
        startingAmount: -500,
        idempotencyKey: "44444444-4444-4444-8444-444444444444",
      });
      expect(result.success).toBe(false);
    });

    it("validates positive amount for salary advance", () => {
      const result = createAdvanceSchema.safeParse({
        amount: 3000,
        reason: "Medical emergency",
        idempotencyKey: "55555555-5555-4555-8555-555555555555",
      });
      expect(result.success).toBe(true);
    });

    it("rejects 0 or negative salary advance amount", () => {
      const result = createAdvanceSchema.safeParse({
        amount: 0,
        idempotencyKey: "55555555-5555-4555-8555-555555555555",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Expenses Validation", () => {
    it("validates correct expense entry", () => {
      const payload = {
        title: "Branch water jars",
        amount: 450,
        category: "UTILITIES" as const,
        note: "Delivered today",
      };
      const result = createExpenseSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it("rejects unknown expense category", () => {
      const payload = {
        title: "Test expense",
        amount: 450,
        category: "NON_EXISTENT_CATEGORY",
      };
      const result = createExpenseSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it("validates operational expense update payload", () => {
      const payload = {
        id: "exp-001",
        title: "Adjusted Shop Rent",
        amount: 12000,
        category: "RENT" as const,
        note: "Updated with utility charges",
      };
      const result = updateExpenseSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it("rejects operational expense update missing id", () => {
      const payload = {
        title: "Adjusted Shop Rent",
        amount: 12000,
      };
      const result = updateExpenseSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });
  });

  describe("Staff Management Validation", () => {
    it("enforces strong password and required location on cashier creation", () => {
      const valid = createCashierSchema.safeParse({
        fullName: "Tanvir Ahmed",
        password: "Pass1234Secure!",
        locationId: "loc-dhanmondi-01",
        monthlySalary: 25000,
      });
      expect(valid.success).toBe(true);

      const invalidPassword = createCashierSchema.safeParse({
        fullName: "Tanvir Ahmed",
        password: "123", // too short
        locationId: "loc-dhanmondi-01",
        monthlySalary: 25000,
      });
      expect(invalidPassword.success).toBe(false);
    });
  });

  describe("Inventory & Stock Adjustment Validation", () => {
    it("validates positive stock adjustment", () => {
      const result = adjustStockSchema.safeParse({
        stock: 50,
        operation: "set",
      });
      expect(result.success).toBe(true);
    });

    it("permits negative stock adjustment per contract change (allowNegative)", () => {
      const result = adjustStockSchema.safeParse({
        stock: -10,
        operation: "set",
        locationId: "73c68383-be3c-419b-a010-86d1ee880cf5",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.stock).toBe(-10);
      }
    });

    it("permits negative stock in variant creation/update per contract change", () => {
      const result = variantFormSchema.safeParse({
        name: "128GB Black",
        sellingPrice: 1500,
        stock: -5,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.stock).toBe(-5);
      }
    });

    it("normalizes uppercase stock operations to lowercase enum strings", () => {
      const setResult = adjustStockSchema.safeParse({
        stock: 20,
        operation: "SET",
      });
      expect(setResult.success).toBe(true);
      if (setResult.success) {
        expect(setResult.data.operation).toBe("set");
      }

      const deductResult = adjustStockSchema.safeParse({
        stock: -5,
        operation: "DEDUCT",
      });
      expect(deductResult.success).toBe(true);
      if (deductResult.success) {
        expect(deductResult.data.operation).toBe("deduct");
      }

      const addResult = adjustStockSchema.safeParse({
        stock: 15,
        operation: "ADD",
      });
      expect(addResult.success).toBe(true);
      if (addResult.success) {
        expect(addResult.data.operation).toBe("add");
      }
    });
  });

  describe("Shift Closing & Payroll Validation", () => {
    it("validates close shift with counted cash and idempotency key", () => {
      const result = closeShiftSchema.safeParse({
        closingAmount: 12500,
        notes: "Shift closed normally",
        idempotencyKey: "66666666-6666-4666-8666-666666666666",
      });
      expect(result.success).toBe(true);
    });

    it("validates payroll processing payload", () => {
      const result = processPayrollSchema.safeParse({
        cashierId: "cashier-001",
        month: 10,
        year: 2026,
        idempotencyKey: "77777777-7777-4777-8777-777777777777",
      });
      expect(result.success).toBe(true);
    });

    it("validates registration with password complexity requirements", () => {
      const result = registerSchema.safeParse({
        fullName: "Store Owner",
        email: "owner@suntechpos.com",
        password: "Password123!",
      });
      expect(result.success).toBe(true);
    });
  });
});
