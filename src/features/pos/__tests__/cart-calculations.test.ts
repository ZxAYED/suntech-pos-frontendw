import { describe, expect, it } from "vitest";
import {
  calculateCartTotals,
  verifyPaymentSplits,
  type CartLineItem,
} from "@/features/pos/utils/cart-calculator";

describe("Cart & Payment Calculations (Guide Reference Lines 135, 222-224, 309)", () => {
  it("calculates basic cart total as sum of (price * quantity)", () => {
    const items: CartLineItem[] = [
      { unitPrice: 250, quantity: 2 }, // 500
      { unitPrice: 150, quantity: 3 }, // 450
      { unitPrice: 50, quantity: 1 },  // 50
    ];

    const result = calculateCartTotals(items);
    expect(result.rawSubtotal).toBe(1000);
    expect(result.subtotal).toBe(1000);
    expect(result.total).toBe(1000);
    expect(result.itemCount).toBe(6);
  });

  it("applies item-level discounts and order-level flat discount correctly", () => {
    const items: CartLineItem[] = [
      { unitPrice: 500, quantity: 2, discount: 100 }, // raw 1000 - 100 = 900
      { unitPrice: 300, quantity: 1, discount: 50 },  // raw 300 - 50 = 250
    ];

    const result = calculateCartTotals(items, { flatDiscount: 150 });
    expect(result.rawSubtotal).toBe(1300);
    expect(result.itemDiscountsTotal).toBe(150);
    expect(result.subtotal).toBe(1150);
    expect(result.flatDiscount).toBe(150);
    expect(result.total).toBe(1000); // 1150 - 150 = 1000
  });

  it("adds charges and calculates tax percentage properly", () => {
    const items: CartLineItem[] = [
      { unitPrice: 1000, quantity: 1 },
    ];

    // Subtotal 1000, charges 50, 5% tax on 1000 = 50 -> total 1100
    const result = calculateCartTotals(items, { charges: 50, taxRatePercent: 5 });
    expect(result.subtotal).toBe(1000);
    expect(result.charges).toBe(50);
    expect(result.tax).toBe(50);
    expect(result.total).toBe(1100);
  });

  it("prevents negative subtotals or negative item prices", () => {
    const items: CartLineItem[] = [
      { unitPrice: -200, quantity: 2 },
      { unitPrice: 100, quantity: -5 },
    ];

    const result = calculateCartTotals(items);
    expect(result.subtotal).toBe(0);
    expect(result.total).toBe(0);
  });

  describe("Multi-Payment Split Verification (Guide Reference Line 135)", () => {
    it("validates 50% cash and 50% bank payment split for 2000 BDT total", () => {
      const total = 2000;
      const payments = [
        { method: "CASH", amount: 1000 },
        { method: "BANK", amount: 1000 },
      ];

      const split = verifyPaymentSplits(total, payments);
      expect(split.isSufficient).toBe(true);
      expect(split.isExact).toBe(true);
      expect(split.totalPaid).toBe(2000);
      expect(split.changeDue).toBe(0);
      expect(split.remainingDue).toBe(0);
      expect(split.splits[0].percentage).toBe(50);
      expect(split.splits[1].percentage).toBe(50);
    });

    it("detects underpayment and calculates remaining due amount", () => {
      const total = 2000;
      const payments = [
        { method: "BKASH", amount: 800 },
        { method: "CASH", amount: 500 },
      ];

      const split = verifyPaymentSplits(total, payments);
      expect(split.isSufficient).toBe(false);
      expect(split.isExact).toBe(false);
      expect(split.totalPaid).toBe(1300);
      expect(split.remainingDue).toBe(700);
      expect(split.changeDue).toBe(0);
    });

    it("calculates change due when total payment exceeds required amount", () => {
      const total = 1450;
      const payments = [
        { method: "CASH", amount: 1500 },
      ];

      const split = verifyPaymentSplits(total, payments);
      expect(split.isSufficient).toBe(true);
      expect(split.isExact).toBe(false);
      expect(split.totalPaid).toBe(1500);
      expect(split.changeDue).toBe(50);
      expect(split.remainingDue).toBe(0);
    });

    it("ignores zero or negative payment entries in split calculations", () => {
      const total = 500;
      const payments = [
        { method: "CASH", amount: 500 },
        { method: "NAGAD", amount: 0 },
        { method: "BANK", amount: -100 },
      ];

      const split = verifyPaymentSplits(total, payments);
      expect(split.splits).toHaveLength(1);
      expect(split.totalPaid).toBe(500);
      expect(split.isExact).toBe(true);
    });
  });
});
