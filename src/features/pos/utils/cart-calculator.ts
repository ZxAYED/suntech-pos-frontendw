/**
 * POS Cart and Payment Calculation Utilities
 *
 * Formulas:
 * - Line Subtotal = Math.max(0, unitPrice) * Math.max(0, quantity)
 * - Cart Subtotal = Sum of Line Subtotals
 * - Total = Subtotal - Flat Discount + Charges + Tax
 * - Payment Sum = Sum of all payment amounts across methods (Cash, Card, bKash, Nagad, Bank, etc.)
 */

export interface CartLineItem {
  variantId?: string;
  name?: string;
  unitPrice: number;
  quantity: number;
  discount?: number;
}

export interface CartPricingOptions {
  flatDiscount?: number;
  charges?: number;
  taxRatePercent?: number;
}

export interface PaymentEntry {
  method: string;
  amount: number;
}

export interface CartTotalsResult {
  rawSubtotal: number;
  itemDiscountsTotal: number;
  subtotal: number;
  flatDiscount: number;
  charges: number;
  tax: number;
  total: number;
  itemCount: number;
}

export interface PaymentSplitResult {
  totalPaid: number;
  requiredTotal: number;
  changeDue: number;
  remainingDue: number;
  isSufficient: boolean;
  isExact: boolean;
  splits: Array<{ method: string; amount: number; percentage: number }>;
}

/**
 * Calculates cart subtotal, discounts, charges, and final payable total.
 */
export function calculateCartTotals(
  items: CartLineItem[],
  options: CartPricingOptions = {},
): CartTotalsResult {
  let rawSubtotal = 0;
  let itemDiscountsTotal = 0;
  let itemCount = 0;

  for (const item of items) {
    const qty = Math.max(0, Math.floor(Number(item.quantity) || 0));
    const price = Math.max(0, Number(item.unitPrice) || 0);
    const lineRaw = price * qty;
    const lineDiscount = Math.min(lineRaw, Math.max(0, Number(item.discount) || 0));

    rawSubtotal += lineRaw;
    itemDiscountsTotal += lineDiscount;
    itemCount += qty;
  }

  const subtotal = Math.max(0, rawSubtotal - itemDiscountsTotal);
  const flatDiscount = Math.min(subtotal, Math.max(0, Number(options.flatDiscount) || 0));
  const afterDiscount = subtotal - flatDiscount;
  const charges = Math.max(0, Number(options.charges) || 0);
  const taxRate = Math.max(0, Number(options.taxRatePercent) || 0);
  const tax = taxRate > 0 ? Math.round((afterDiscount * taxRate) / 100) : 0;
  const total = Math.max(0, afterDiscount + charges + tax);

  return {
    rawSubtotal,
    itemDiscountsTotal,
    subtotal,
    flatDiscount,
    charges,
    tax,
    total,
    itemCount,
  };
}

/**
 * Verifies multi-payment splits (e.g., 50% Cash, 50% Bank) against required total.
 */
export function verifyPaymentSplits(
  requiredTotal: number,
  payments: PaymentEntry[],
): PaymentSplitResult {
  const safeRequired = Math.max(0, Number(requiredTotal) || 0);
  let totalPaid = 0;

  const validPayments = payments
    .filter((p) => Number(p.amount) > 0)
    .map((p) => {
      const amount = Math.max(0, Number(p.amount) || 0);
      totalPaid += amount;
      return { method: p.method, amount };
    });

  const changeDue = Math.max(0, totalPaid - safeRequired);
  const remainingDue = Math.max(0, safeRequired - totalPaid);
  const isSufficient = totalPaid >= safeRequired;
  const isExact = totalPaid === safeRequired;

  const splits = validPayments.map((p) => ({
    method: p.method,
    amount: p.amount,
    percentage: totalPaid > 0 ? Math.round((p.amount / totalPaid) * 10000) / 100 : 0,
  }));

  return {
    totalPaid,
    requiredTotal: safeRequired,
    changeDue,
    remainingDue,
    isSufficient,
    isExact,
    splits,
  };
}
