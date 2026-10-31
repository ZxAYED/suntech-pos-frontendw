import type { ReceiptViewModel } from "@/features/pos/view-models";
import { getPaymentMethodLabel } from "@/lib/payment-methods";
import { formatBDT } from "@/lib/utils";

export function isUuid(val: string | undefined | null): boolean {
  if (!val) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val.trim());
}

export function sanitizeDisplayName(name: string | undefined | null, fallback: string): string {
  if (!name || !name.trim() || isUuid(name)) {
    return fallback;
  }
  return name.trim();
}

function escapeHtml(str: string | undefined | null): string {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Builds a clean, self-contained HTML thermal receipt document for printing.
 */
export function generateReceiptHtml(receipt: ReceiptViewModel): string {
  const formattedDate = receipt.createdAt
    ? new Date(receipt.createdAt).toLocaleString("en-BD", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

  const paymentLabel = receipt.paymentMethod
    ? getPaymentMethodLabel(receipt.paymentMethod)
    : "Cash";

  const bizName = sanitizeDisplayName(receipt.businessName, "SUNTECH RETAIL LTD.");
  const locName = sanitizeDisplayName(receipt.locationName, "Uttara Doyel Branch");
  const cashierName = sanitizeDisplayName(receipt.cashierName, "Staff Cashier");
  const customerName = sanitizeDisplayName(receipt.customerName, "Walk-in Customer");
  const invoiceNum = receipt.invoiceNumber || "RECEIPT";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Receipt_${escapeHtml(invoiceNum)}</title>
  <style>
    @page {
      size: 80mm auto;
      margin: 3mm 4mm 6mm 4mm;
    }
    @media print {
      html, body {
        width: 80mm !important;
        max-width: 80mm !important;
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
        color: #000000 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .receipt-paper {
        width: 72mm !important;
        max-width: 72mm !important;
        margin: 0 auto !important;
        padding: 2mm 0 !important;
      }
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, monospace;
      font-size: 11px;
      line-height: 1.35;
      color: #111;
      background: #fff;
      padding: 6px;
      -webkit-font-smoothing: antialiased;
    }
    .receipt-paper {
      width: 72mm;
      max-width: 100%;
      margin: 0 auto;
    }
    .header {
      text-align: center;
      margin-bottom: 6px;
    }
    .biz-name {
      font-size: 14px;
      font-weight: 800;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      color: #070B28;
      margin-bottom: 2px;
    }
    .loc-name {
      font-size: 10px;
      color: #4b5563;
      margin-bottom: 4px;
    }
    .invoice-tag {
      display: inline-block;
      font-size: 11px;
      font-weight: 700;
      color: #111827;
      margin-top: 2px;
    }
    .status-tag {
      display: inline-block;
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      padding: 1px 5px;
      border: 1px solid #059669;
      color: #059669;
      border-radius: 3px;
      margin-left: 4px;
    }
    .dashed-divider {
      border-top: 1px dashed #9ca3af;
      margin: 6px 0;
    }
    .meta-section {
      font-size: 10px;
      line-height: 1.45;
    }
    .meta-row {
      display: flex;
      justify-content: space-between;
      margin: 1px 0;
    }
    .meta-label {
      color: #4b5563;
    }
    .meta-value {
      font-weight: 600;
      color: #111827;
      text-align: right;
    }
    .items-section {
      margin: 4px 0;
    }
    .items-head {
      display: flex;
      justify-content: space-between;
      font-weight: 700;
      font-size: 10px;
      border-bottom: 1px solid #111827;
      padding-bottom: 3px;
      margin-bottom: 5px;
      color: #111827;
    }
    .item-row {
      margin-bottom: 5px;
    }
    .item-name {
      font-weight: 600;
      font-size: 11px;
      color: #111827;
      word-break: break-word;
    }
    .item-calc {
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      color: #4b5563;
      margin-top: 1px;
    }
    .item-total {
      font-weight: 600;
      color: #111827;
    }
    .summary-section {
      font-size: 11px;
      line-height: 1.45;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      margin: 2px 0;
      color: #374151;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      font-weight: 800;
      color: #0052FF;
      border-top: 1px solid #111827;
      border-bottom: 1px solid #111827;
      padding: 4px 0;
      margin: 5px 0;
    }
    .bold {
      font-weight: 700;
    }
    .footer {
      text-align: center;
      font-size: 10px;
      color: #6b7280;
      margin-top: 8px;
      line-height: 1.4;
    }
  </style>
</head>
<body>
  <div class="receipt-paper">
    <div class="header">
      <div class="biz-name">${escapeHtml(bizName)}</div>
      <div class="loc-name">${escapeHtml(locName)}</div>
      <div class="invoice-tag">
        #${escapeHtml(invoiceNum)}
        ${receipt.status ? `<span class="status-tag">${escapeHtml(receipt.status)}</span>` : ""}
      </div>
    </div>

    <div class="dashed-divider"></div>

    <div class="meta-section">
      <div class="meta-row">
        <span class="meta-label">Date:</span>
        <span class="meta-value">${escapeHtml(formattedDate)}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">Cashier:</span>
        <span class="meta-value">${escapeHtml(cashierName)}</span>
      </div>
      ${
        receipt.customerName && !isUuid(receipt.customerName)
          ? `<div class="meta-row">
              <span class="meta-label">Customer:</span>
              <span class="meta-value">${escapeHtml(customerName)}</span>
            </div>`
          : ""
      }
      ${
        receipt.customerPhone
          ? `<div class="meta-row">
              <span class="meta-label">Phone:</span>
              <span class="meta-value">${escapeHtml(receipt.customerPhone)}</span>
            </div>`
          : ""
      }
    </div>

    <div class="dashed-divider"></div>

    <div class="items-section">
      <div class="items-head">
        <span>Item</span>
        <span style="text-align: right;">Total</span>
      </div>
      ${receipt.items
        .map(
          (item) => `
        <div class="item-row">
          <div class="item-name">${escapeHtml(item.name)}</div>
          <div class="item-calc">
            <span>${item.quantity} &times; ${formatBDT(item.unitPrice)}</span>
            <span class="item-total">${formatBDT(item.subtotal)}</span>
          </div>
        </div>
      `,
        )
        .join("")}
    </div>

    <div class="dashed-divider"></div>

    <div class="summary-section">
      <div class="summary-row">
        <span>Subtotal:</span>
        <span class="bold">${formatBDT(receipt.subtotal)}</span>
      </div>
      <div class="total-row">
        <span>TOTAL:</span>
        <span>${formatBDT(receipt.totalAmount)}</span>
      </div>
      <div class="summary-row">
        <span>Payment Method:</span>
        <span class="bold">${escapeHtml(paymentLabel)}</span>
      </div>
      ${
        receipt.tenderedAmount != null
          ? `<div class="summary-row">
              <span>Paid:</span>
              <span class="bold">${formatBDT(receipt.tenderedAmount)}</span>
            </div>`
          : ""
      }
      ${
        receipt.changeDue != null
          ? `<div class="summary-row">
              <span>Change:</span>
              <span class="bold">${formatBDT(receipt.changeDue)}</span>
            </div>`
          : ""
      }
    </div>

    <div class="dashed-divider"></div>

    <div class="footer">
      <div class="bold">Thank you for your business!</div>
      <div>Powered by SunTech POS</div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Prints the receipt via an isolated invisible iframe.
 */
export function printThermalReceipt(receipt: ReceiptViewModel): void {
  if (typeof window === "undefined") return;

  const frameId = "suntech-pos-receipt-print-frame";
  const existingFrame = document.getElementById(frameId);
  if (existingFrame) {
    existingFrame.remove();
  }

  const iframe = document.createElement("iframe");
  iframe.id = frameId;
  iframe.style.position = "fixed";
  iframe.style.top = "-9999px";
  iframe.style.left = "-9999px";
  iframe.style.width = "80mm";
  iframe.style.height = "100px";
  iframe.style.border = "none";
  iframe.style.opacity = "0";
  iframe.style.pointerEvents = "none";

  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) {
    console.error("Could not access print iframe document");
    return;
  }

  const html = generateReceiptHtml(receipt);
  doc.open();
  doc.write(html);
  doc.close();

  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (err) {
      console.error("Print invocation error:", err);
    }
  }, 250);
}

/**
 * Generates and downloads a direct native PDF receipt file without needing the browser print dialog.
 * Fixes coordinate offsets and text alignment so right-hand prices and totals are never truncated.
 */
export function downloadReceiptPdf(receipt: ReceiptViewModel): void {
  if (typeof window === "undefined") return;

  const pageWidth = 226.77; // 80mm in PDF points (72 pt per inch)
  const baseHeight = 260;
  const itemsHeight = Math.max(1, receipt.items.length) * 28;
  const pageHeight = Math.max(400, baseHeight + itemsHeight);

  const esc = (val: string | number | undefined | null) =>
    String(val ?? "")
      .replace(/\\/g, "\\\\")
      .replace(/\(/g, "\\(")
      .replace(/\)/g, "\\)");

  const streamLines: string[] = [];
  let y = pageHeight - 30;

  const bizName = sanitizeDisplayName(receipt.businessName, "SUNTECH RETAIL LTD.");
  const locName = sanitizeDisplayName(receipt.locationName, "Uttara Doyel Branch");
  const cashierName = sanitizeDisplayName(receipt.cashierName, "Staff Cashier");
  const customerName = sanitizeDisplayName(receipt.customerName, "Walk-in Customer");
  const invoiceNum = receipt.invoiceNumber || "RECEIPT";

  // Helper to draw centered text
  const drawCenter = (text: string, yPos: number, font = "/F1", fontSize = 9) => {
    const textWidth = text.length * (fontSize * 0.52);
    const x = Math.max(15, (pageWidth - textWidth) / 2);
    streamLines.push(`BT ${font} ${fontSize} Tf ${x.toFixed(1)} ${yPos.toFixed(1)} Td (${esc(text)}) Tj ET`);
  };

  // Helper to draw a two-column row with independent absolute positions on the exact same baseline
  const drawRow = (
    leftText: string,
    rightText: string,
    yPos: number,
    leftFont = "/F1",
    rightFont = "/F2",
    fontSize = 8,
  ) => {
    const rightWidth = rightText.length * (fontSize * 0.52);
    const rightX = Math.max(120, pageWidth - 16 - rightWidth);
    streamLines.push(`BT ${leftFont} ${fontSize} Tf 15 ${yPos.toFixed(1)} Td (${esc(leftText)}) Tj ET`);
    streamLines.push(`BT ${rightFont} ${fontSize} Tf ${rightX.toFixed(1)} ${yPos.toFixed(1)} Td (${esc(rightText)}) Tj ET`);
  };

  // Header
  drawCenter(bizName.toUpperCase(), y, "/F2", 12);
  y -= 14;
  drawCenter(locName, y, "/F1", 9);
  y -= 13;
  drawCenter(`#${invoiceNum}`, y, "/F2", 10);

  // Divider line
  y -= 8;
  streamLines.push(`15 ${y.toFixed(1)} m ${(pageWidth - 15).toFixed(1)} ${y.toFixed(1)} l S`);

  // Date
  y -= 14;
  const dateStr = receipt.createdAt
    ? new Date(receipt.createdAt).toLocaleString("en-BD", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

  streamLines.push(`BT /F1 8 Tf 15 ${y.toFixed(1)} Td (Date: ${esc(dateStr)}) Tj ET`);

  y -= 11;
  streamLines.push(`BT /F1 8 Tf 15 ${y.toFixed(1)} Td (Cashier: ${esc(cashierName)}) Tj ET`);

  if (receipt.customerName && !isUuid(receipt.customerName)) {
    y -= 11;
    streamLines.push(`BT /F1 8 Tf 15 ${y.toFixed(1)} Td (Customer: ${esc(customerName)}) Tj ET`);
  }

  // Items Header
  y -= 14;
  streamLines.push(`15 ${y.toFixed(1)} m ${(pageWidth - 15).toFixed(1)} ${y.toFixed(1)} l S`);
  y -= 12;
  drawRow("Item", "Total", y, "/F2", "/F2", 8);

  // Items
  for (const item of receipt.items) {
    y -= 14;
    // Item name
    streamLines.push(`BT /F2 8 Tf 15 ${y.toFixed(1)} Td (${esc(item.name)}) Tj ET`);
    y -= 11;
    // Quantity x Price on left, Line Subtotal on right
    drawRow(
      `${item.quantity} x ${formatBDT(item.unitPrice)}`,
      formatBDT(item.subtotal),
      y,
      "/F1",
      "/F2",
      8,
    );
  }

  // Totals divider
  y -= 10;
  streamLines.push(`15 ${y.toFixed(1)} m ${(pageWidth - 15).toFixed(1)} ${y.toFixed(1)} l S`);

  // Subtotal
  y -= 14;
  drawRow("Subtotal:", formatBDT(receipt.subtotal), y, "/F1", "/F2", 9);

  // TOTAL
  y -= 16;
  drawRow("TOTAL:", formatBDT(receipt.totalAmount), y, "/F2", "/F2", 11);

  // Payment Method
  const paymentLabel = receipt.paymentMethod
    ? getPaymentMethodLabel(receipt.paymentMethod)
    : "Cash";
  y -= 14;
  drawRow("Payment Method:", paymentLabel, y, "/F1", "/F2", 8);

  // Paid (Replaced Tendered)
  if (receipt.tenderedAmount != null) {
    y -= 11;
    drawRow("Paid:", formatBDT(receipt.tenderedAmount), y, "/F1", "/F2", 8);
  }

  // Change
  if (receipt.changeDue != null) {
    y -= 11;
    drawRow("Change:", formatBDT(receipt.changeDue), y, "/F1", "/F2", 8);
  }

  // Footer divider
  y -= 16;
  streamLines.push(`15 ${y.toFixed(1)} m ${(pageWidth - 15).toFixed(1)} ${y.toFixed(1)} l S`);
  y -= 14;
  drawCenter("Thank you for your business!", y, "/F1", 8);
  y -= 11;
  drawCenter("Powered by SunTech POS", y, "/F1", 7);

  const streamContent = streamLines.join("\n");
  const encoder = new TextEncoder();
  const streamBytes = encoder.encode(streamContent);

  const objects = [
    `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj`,
    `2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj`,
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth.toFixed(2)} ${pageHeight.toFixed(2)}] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>\nendobj`,
    `4 0 obj\n<< /Length ${streamBytes.length} >>\nstream\n${streamContent}\nendstream\nendobj`,
    `5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj`,
    `6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj`,
  ];

  let offset = 0;
  const pdfHeader = `%PDF-1.4\n`;
  offset = encoder.encode(pdfHeader).length;

  const offsets: number[] = [0];
  let bodyStr = "";
  for (const obj of objects) {
    offsets.push(offset);
    bodyStr += `${obj}\n`;
    offset += encoder.encode(`${obj}\n`).length;
  }

  const xrefOffset = offset;
  let xrefStr = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i++) {
    xrefStr += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  xrefStr += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  const fullPdf = pdfHeader + bodyStr + xrefStr;
  const blob = new Blob([encoder.encode(fullPdf)], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `Receipt_${invoiceNum}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
