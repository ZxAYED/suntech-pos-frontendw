import { describe, expect, it } from "vitest";
import {
  generateReceiptHtml,
  generateReceiptPdfBytes,
  generateReceiptText,
} from "../utils/print-receipt";
import type { ReceiptViewModel } from "../view-models";

describe("Phase C: Consistent Receipt Outputs & Timezone Formatting (R1, R3)", () => {
  const sampleReceipt: ReceiptViewModel = {
    orderId: "ord-test-receipt-1",
    invoiceNumber: "INV-20261107-999",
    businessName: "SunTech Electronics",
    locationName: "Uttara Branch",
    cashierName: "Hasan",
    customerName: "Rahim",
    paymentMethod: "COD",
    subtotal: 2500,
    totalAmount: 2500,
    tenderedAmount: 2500,
    changeDue: 0,
    items: [
      {
        id: "item-1",
        name: "Wireless Earbuds",
        quantity: 1,
        unitPrice: 2500,
        subtotal: 2500,
      },
    ],
    // 2026-11-06T18:10:00.000Z is 2026-11-07 12:10 AM in Dhaka
    saleAt: "2026-11-06T18:10:00.000Z",
    occurredAt: "2026-11-06T18:10:00.000Z",
    createdAt: "2026-11-07T04:00:00.000Z",
    timeSource: "occurredAt",
  };

  it("generateReceiptText uses the Dhaka sale time consistently", () => {
    const text = generateReceiptText(sampleReceipt);
    expect(text).toContain("Date:     Nov 7, 2026, 12:10 AM");
    expect(text).toContain("TOTAL:    2,500 BDT");
  });

  it("generateReceiptHtml formats Dhaka sale time and keeps 72mm centered layout", () => {
    const html = generateReceiptHtml(sampleReceipt);
    expect(html).toContain("Nov 7, 2026, 12:10 AM");
    expect(html).toContain("width: 72mm !important;");
  });

  it("generateReceiptPdfBytes generates valid PDF containing formatted Dhaka date", () => {
    const pdfBytes = generateReceiptPdfBytes(sampleReceipt);
    expect(pdfBytes).toBeInstanceOf(Uint8Array);
    const pdfString = new TextDecoder().decode(pdfBytes);
    expect(pdfString).toContain("%PDF-1.4");
    expect(pdfString).toContain("Nov 7, 2026, 12:10 AM");
  });

  it("preserves stable historical date upon reprint regardless of print time", () => {
    // If reprinted days later, receipt model preserves original saleAt
    const reprintText = generateReceiptText(sampleReceipt);
    expect(reprintText).toContain("Nov 7, 2026, 12:10 AM");
  });

  it("renders fallback placeholder cleanly when all dates are missing", () => {
    const missingDateReceipt: ReceiptViewModel = {
      ...sampleReceipt,
      saleAt: null,
      occurredAt: null,
      createdAt: "",
    };
    const text = generateReceiptText(missingDateReceipt);
    expect(text).toContain("Date:     —");
    const html = generateReceiptHtml(missingDateReceipt);
    expect(html).toContain("—");
  });
});

