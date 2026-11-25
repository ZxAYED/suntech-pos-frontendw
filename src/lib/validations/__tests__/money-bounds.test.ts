import { describe, expect, it } from "vitest";
import { catalogCheckoutSchema, customOrderSchema, MAX_STORED_BDT, safeIntegerBDTSchema } from "../index";

const common = { idempotencyKey: "11111111-1111-4111-8111-111111111111", paymentMethod: "BANK", tenderedAmount: 100 };

describe("PostgreSQL monetary storage bounds", () => {
  it("accepts the actual database maximum and rejects the first overflowing taka", () => {
    expect(safeIntegerBDTSchema.safeParse(MAX_STORED_BDT).success).toBe(true);
    expect(safeIntegerBDTSchema.safeParse(MAX_STORED_BDT + 1).success).toBe(false);
  });
  it("rejects overflow from multiplication even when unit prices fit", () => {
    expect(catalogCheckoutSchema.safeParse({ ...common, lines: [{ variantId: "v", quantity: 2, unitPrice: MAX_STORED_BDT }] }).success).toBe(false);
    expect(customOrderSchema.safeParse({ ...common, lines: [{ productName: "Custom", quantity: 2, unitPrice: MAX_STORED_BDT }] }).success).toBe(false);
  });
  it("rejects overflow from summing otherwise valid lines", () => {
    expect(catalogCheckoutSchema.safeParse({ ...common, lines: [
      { variantId: "v1", quantity: 1, unitPrice: MAX_STORED_BDT },
      { variantId: "v2", quantity: 1, unitPrice: 1 },
    ] }).success).toBe(false);
  });
  it("accepts normal whole-BDT cash and manual digital methods", () => {
    for (const paymentMethod of ["COD", "BKASH", "NAGAD", "BANK"]) {
      expect(catalogCheckoutSchema.safeParse({ ...common, paymentMethod, lines: [{ variantId: "v", quantity: 2, unitPrice: 50 }] }).success).toBe(true);
    }
  });
});
