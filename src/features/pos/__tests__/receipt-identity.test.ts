import { describe, expect, it } from "vitest";
import { generateReceiptHtml, generateReceiptText } from "../utils/print-receipt";
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
