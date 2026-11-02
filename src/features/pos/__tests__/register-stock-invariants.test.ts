import { describe, expect, it } from "vitest";
import {
  catalogCheckoutSchema,
  catalogOrderLineSchema,
  customOrderItemSchema,
} from "@/lib/validations";

describe("POS Negative Stock & Integer Currency Invariants (F02, F12)", () => {
  it("allows sale checkout when branch stock is 0 or negative per approved business policy", () => {
    // 3 in stock, selling 5 -> valid order line
    const lineWithLowStock = {
      variantId: "var-1",
      quantity: 5, // exceeds initial stock of 3
      unitPrice: 1500,
    };

    const result = catalogOrderLineSchema.safeParse(lineWithLowStock);
    expect(result.success).toBe(true);
  });

  it("permits sale lines with positive quantity regardless of stock level", () => {
    const lineFromNegativeStock = {
      variantId: "var-2",
      quantity: 3,
      unitPrice: 2000,
    };

    const result = catalogOrderLineSchema.safeParse(lineFromNegativeStock);
    expect(result.success).toBe(true);
  });

  it("strictly requires whole integer quantities (rejects decimals)", () => {
    const fractionalQuantity = {
      variantId: "var-1",
      quantity: 1.5,
      unitPrice: 1000,
    };

    const result = catalogOrderLineSchema.safeParse(fractionalQuantity);
    expect(result.success).toBe(false);
  });

  it("strictly rejects floating point unit prices (rejects decimal BDT)", () => {
    const decimalPrice = {
      variantId: "var-1",
      quantity: 2,
      unitPrice: 12.9, // decimal price must be rejected, not silently floored
    };

    const result = catalogOrderLineSchema.safeParse(decimalPrice);
    expect(result.success).toBe(false);
  });

  it("custom sale item schema strictly rejects non-integer amount numbers", () => {
    const invalidCustomSale = {
      productName: "Alteration service",
      quantity: 1,
      unitPrice: 150.75, // decimals forbidden in whole BDT currency
    };

    const result = customOrderItemSchema.safeParse(invalidCustomSale);
    expect(result.success).toBe(false);
  });

  it("custom sale item schema accepts valid positive safe integers", () => {
    const validCustomSale = {
      productName: "Alteration service",
      quantity: 2,
      unitPrice: 250,
    };

    const result = customOrderItemSchema.safeParse(validCustomSale);
    expect(result.success).toBe(true);
  });

  it("checkout schema validates full payload with valid UUID idempotency key", () => {
    const fullCheckout = {
      lines: [
        {
          variantId: "var-1",
          quantity: 2,
          unitPrice: 1000,
        },
      ],
      paymentMethod: "COD" as const,
      tenderedAmount: 2000,
      idempotencyKey: "11111111-2222-4333-8444-555555555555",
      businessId: "11111111-1111-1111-1111-111111111111",
      locationId: "22222222-2222-2222-2222-222222222222",
    };

    const result = catalogCheckoutSchema.safeParse(fullCheckout);
    expect(result.success).toBe(true);
  });
});
