/** F10: amount paid is not the price of the sale. */
export function fallbackReceiptAmounts(
  lines: readonly { quantity: number; unitPrice: number }[],
  tenderedAmount?: number,
) {
  const totalAmount = lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
  return {
    subtotal: totalAmount,
    totalAmount,
    tenderedAmount: tenderedAmount ?? totalAmount,
    changeDue: Math.max(0, (tenderedAmount ?? totalAmount) - totalAmount),
  };
}
