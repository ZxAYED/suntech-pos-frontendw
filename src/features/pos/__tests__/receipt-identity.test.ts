import { describe, expect, it } from "vitest";
import {
  formatPaymentMethod,
  generateReceiptHtml,
  generateReceiptPdfBytes,
  generateReceiptText,
  hasUnicodeContent,
  wrapPdfText,
} from "../utils/print-receipt";
import type { ReceiptViewModel } from "../view-models";

describe("Receipt Identity & Unicode Handling (F03, F20)", () => {
  const baseReceipt: ReceiptViewModel = {
    orderId: "ord-12345",
    invoiceNumber: "INV-2026-001",
    createdAt: new Date().toISOString(),
    businessName: undefined, // Simulating unassigned / missing business name
    locationName: undefined, // Simulating unassigned / missing branch
    cashierName: "Rahim Uddin",
    customerName: "Walk-in Customer",
    items: [
      {
        id: "item-1",
        name: "Cotton Panjabi - White",
        quantity: 2,
        unitPrice: 1800,
        subtotal: 3600,
      },
    ],
    subtotal: 3600,
    totalAmount: 3600,
    paymentMethod: "COD",
    tenderedAmount: 4000,
    changeDue: 400,
  };

  it("never outputs fictional 'SUNTECH RETAIL LTD.' or 'Uttara Doyel Branch' when business is unassigned", () => {
    const textReceipt = generateReceiptText(baseReceipt);
    const htmlReceipt = generateReceiptHtml(baseReceipt);

    // Forbidden mock names
    expect(textReceipt).not.toContain("SUNTECH RETAIL LTD.");
    expect(textReceipt).not.toContain("Uttara Doyel Branch");
    expect(htmlReceipt).not.toContain("SUNTECH RETAIL LTD.");
    expect(htmlReceipt).not.toContain("Uttara Doyel Branch");

    // Truthful fallback
    expect(textReceipt).toContain("Business name unavailable");
    expect(textReceipt).toContain("Branch location unavailable");
    expect(htmlReceipt).toContain("Business name unavailable");
    expect(htmlReceipt).toContain("Branch location unavailable");
  });

  it("renders verified assigned store and branch names when provided", () => {
    const brandedReceipt: ReceiptViewModel = {
      ...baseReceipt,
      businessName: "Aarong Fashion Ltd",
      locationName: "Dhanmondi Branch",
    };

    const textReceipt = generateReceiptText(brandedReceipt);
    const htmlReceipt = generateReceiptHtml(brandedReceipt);

    expect(textReceipt).toContain("Aarong Fashion Ltd");
    expect(textReceipt).toContain("Dhanmondi Branch");
    expect(htmlReceipt).toContain("Aarong Fashion Ltd");
    expect(htmlReceipt).toContain("Dhanmondi Branch");
  });

  it("includes Noto Sans Bengali font family in thermal HTML receipt for Unicode/Bangla support", () => {
    const bengaliReceipt: ReceiptViewModel = {
      ...baseReceipt,
      businessName: "সানটেক রিটেইল",
      locationName: "ধানমন্ডি শাখা",
      items: [
        {
          id: "item-bn-1",
          name: "সুতি পাঞ্জাবি - সাদা",
          quantity: 1,
          unitPrice: 2200,
          subtotal: 2200,
        },
      ],
      subtotal: 2200,
      totalAmount: 2200,
    };

    const htmlReceipt = generateReceiptHtml(bengaliReceipt);
    expect(htmlReceipt).toContain("Noto Sans Bengali");
    expect(htmlReceipt).toContain("সানটেক রিটেইল");
    expect(htmlReceipt).toContain("সুতি পাঞ্জাবি - সাদা");
  });
});

describe("Receipt Print & PDF Layout Verification", () => {
  const sampleReceipt: ReceiptViewModel = {
    orderId: "ord-print-1",
    invoiceNumber: "INV-88219",
    createdAt: "2026-11-03T10:00:00.000Z",
    businessName: "Haque Traders & Sons",
    locationName: "Mirpur-10 Outlet",
    cashierName: "Tanvir Ahmed",
    customerName: "Mrs. Nasreen (VIP Customer)",
    customerPhone: "01700112233",
    items: [
      {
        id: "item-p1",
        name: "Standard Wireless Optical Mouse with Ergonomic Grip",
        quantity: 1,
        unitPrice: 850,
        subtotal: 850,
      },
    ],
    subtotal: 850,
    totalAmount: 850,
    paymentMethod: "BKASH",
    status: "PAID",
  };

  it("ensures HTML receipt has valid @page rules and centered 72mm layout without invalid 80mm auto", () => {
    const html = generateReceiptHtml(sampleReceipt);

    // Forbidden invalid CSS
    expect(html).not.toContain("size: 80mm auto");

    // Required print CSS
    expect(html).toContain("size: auto;");
    expect(html).toContain("margin: 4mm;");
    expect(html).toContain("width: 72mm !important;");
    expect(html).toContain("margin: 0 auto !important;");
    expect(html).toContain("break-inside: avoid;");
    expect(html).toContain("overflow-wrap: anywhere;");
  });

  it("escapes special HTML characters in customer and business names", () => {
    const specialReceipt: ReceiptViewModel = {
      ...sampleReceipt,
      businessName: "Tom & Jerry's <Boutique>",
      customerName: "A & B \"Traders\" 'Store'",
      items: [
        {
          id: "item-spec",
          name: "Item <1> & Item '2'",
          quantity: 1,
          unitPrice: 100,
          subtotal: 100,
        },
      ],
    };

    const html = generateReceiptHtml(specialReceipt);
    expect(html).toContain("Tom &amp; Jerry&#039;s &lt;Boutique&gt;");
    expect(html).toContain("A &amp; B &quot;Traders&quot; &#039;Store&#039;");
    expect(html).toContain("Item &lt;1&gt; &amp; Item &#039;2&#039;");
  });

  it("detects Unicode content correctly", () => {
    expect(hasUnicodeContent(sampleReceipt)).toBe(false);

    const withBanglaBiz: ReceiptViewModel = {
      ...sampleReceipt,
      businessName: "সানটেক ডিপার্টমেন্টাল",
    };
    expect(hasUnicodeContent(withBanglaBiz)).toBe(true);

    const withBanglaItem: ReceiptViewModel = {
      ...sampleReceipt,
      items: [
        {
          id: "bn-item",
          name: "মসুর ডাল ১ কেজি",
          quantity: 1,
          unitPrice: 130,
          subtotal: 130,
        },
      ],
    };
    expect(hasUnicodeContent(withBanglaItem)).toBe(true);
  });

  it("formats payment methods without assuming Cash for undefined methods", () => {
    expect(formatPaymentMethod("CASH")).toBe("Cash (COD)");
    expect(formatPaymentMethod("COD")).toBe("Cash (COD)");
    expect(formatPaymentMethod("BKASH")).toBe("bKash");
    expect(formatPaymentMethod("NAGAD")).toBe("Nagad");
    expect(formatPaymentMethod("BANK")).toBe("Bank / Card");
    expect(formatPaymentMethod(undefined)).toBe("—");
    expect(formatPaymentMethod("")).toBe("—");
  });

  it("wraps long text properly without exceeding max characters per line", () => {
    const longText = "Super Extended Description of Industrial Ethernet Cable Cat6 50 Meters High Speed";
    const wrapped = wrapPdfText(longText, 198, 8 * 0.54);
    expect(wrapped.length).toBeGreaterThan(1);
    for (const line of wrapped) {
      expect(line.length).toBeLessThanOrEqual(50);
    }
  });

  it("generates valid PDF bytes for single-item order with BDT totals and escaped parentheses", () => {
    const pdfBytes = generateReceiptPdfBytes(sampleReceipt);
    const pdfString = new TextDecoder().decode(pdfBytes);

    expect(pdfString.startsWith("%PDF-1.4")).toBe(true);
    expect(pdfString).toContain("%%EOF");
    expect(pdfString).toContain("INV-88219");
    expect(pdfString).toContain("HAQUE TRADERS & SONS");
    // Escaped parenthesis in customer name
    expect(pdfString).toContain("\\(VIP Customer\\)");
    // BDT currency format
    expect(pdfString).toContain("850 BDT");
    expect(pdfString).toContain("bKash");
    expect(pdfString).toContain("[PAID]");
  });

  it("generates dynamic page height without clipping for 30+ items order", () => {
    const manyItems = Array.from({ length: 35 }, (_, idx) => ({
      id: `it-${idx + 1}`,
      name: `Grocery Product Line Item #${idx + 1} with Extended Packaging Details`,
      quantity: idx + 1,
      unitPrice: 50 + idx * 10,
      subtotal: (idx + 1) * (50 + idx * 10),
    }));

    const totalSub = manyItems.reduce((acc, it) => acc + it.subtotal, 0);

    const largeReceipt: ReceiptViewModel = {
      ...sampleReceipt,
      items: manyItems,
      subtotal: totalSub,
      totalAmount: totalSub,
      status: "REFUNDED",
      tenderedAmount: undefined,
      changeDue: undefined,
    };

    const pdfBytes = generateReceiptPdfBytes(largeReceipt);
    const pdfString = new TextDecoder().decode(pdfBytes);

    expect(pdfString.startsWith("%PDF-1.4")).toBe(true);
    expect(pdfString).toContain("[REFUNDED]");

    // The MediaBox height must dynamically expand beyond standard default 300pt
    const mediaBoxMatch = pdfString.match(/\/MediaBox \[0 0 226\.77 (\d+\.\d+)\]/);
    expect(mediaBoxMatch).not.toBeNull();
    const height = parseFloat(mediaBoxMatch![1]);
    expect(height).toBeGreaterThan(1000); // 35 items needs >1000pt

    // Verify last item is in PDF stream
    expect(pdfString).toContain("Grocery Product Line Item #35");
  });
});
