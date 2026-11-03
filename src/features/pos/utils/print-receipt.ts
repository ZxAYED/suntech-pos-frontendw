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

export function formatPaymentMethod(method: string | undefined | null): string {
  if (!method || !method.trim()) return "—";
  return getPaymentMethodLabel(method);
}

export function hasUnicodeContent(receipt: ReceiptViewModel): boolean {
  const hasUnicode = (str: string | undefined | null) => Boolean(str && /[^\x00-\x7F]/.test(str));
  return (
    hasUnicode(receipt.businessName) ||
    hasUnicode(receipt.locationName) ||
    hasUnicode(receipt.cashierName) ||
    hasUnicode(receipt.customerName) ||
    receipt.items.some((it) => hasUnicode(it.name))
  );
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

function escPdf(val: string | number | undefined | null): string {
  if (val == null) return "";
  return String(val)
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

export function wrapPdfText(text: string, maxWidth: number, charWidth: number): string[] {
  if (!text || !text.trim()) return [];
  const maxCharsPerLine = Math.max(8, Math.floor(maxWidth / charWidth));
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if (!currentLine) {
      if (word.length <= maxCharsPerLine) {
        currentLine = word;
      } else {
        for (let i = 0; i < word.length; i += maxCharsPerLine) {
          const chunk = word.slice(i, i + maxCharsPerLine);
          if (i + maxCharsPerLine >= word.length) {
            currentLine = chunk;
          } else {
            lines.push(chunk);
          }
        }
      }
    } else if ((currentLine + " " + word).length <= maxCharsPerLine) {
      currentLine += " " + word;
    } else {
      lines.push(currentLine);
      if (word.length <= maxCharsPerLine) {
        currentLine = word;
      } else {
        for (let i = 0; i < word.length; i += maxCharsPerLine) {
          const chunk = word.slice(i, i + maxCharsPerLine);
          if (i + maxCharsPerLine >= word.length) {
            currentLine = chunk;
          } else {
            lines.push(chunk);
          }
        }
      }
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

/**
 * Builds a clean plaintext receipt formatted for thermal ASCII printers or text export.
 */
export function generateReceiptText(receipt: ReceiptViewModel): string {
  const biz = sanitizeDisplayName(receipt.businessName, "Business name unavailable");
  const loc = sanitizeDisplayName(receipt.locationName, "Branch location unavailable");
  const cashier = sanitizeDisplayName(receipt.cashierName, "Staff Cashier");
  const customer = sanitizeDisplayName(receipt.customerName, "Walk-in Customer");
  const paymentLabel = formatPaymentMethod(receipt.paymentMethod);
  const statusStr = receipt.status ? ` [${receipt.status}]` : "";

  return `
========================================
           ${biz}
           ${loc}
========================================
Invoice #: ${receipt.invoiceNumber || "RECEIPT"}${statusStr}
Date:     ${receipt.createdAt ? new Date(receipt.createdAt).toLocaleString("en-BD") : "—"}
Cashier:  ${cashier}
Customer: ${customer}${receipt.customerPhone ? ` (${receipt.customerPhone})` : ""}
----------------------------------------
ITEMS:
${receipt.items.map((i) => `${i.name}\n  ${i.quantity} x ${formatBDT(i.unitPrice)} = ${formatBDT(i.subtotal)}`).join("\n")}
----------------------------------------
SUBTOTAL: ${formatBDT(receipt.subtotal)}
TOTAL:    ${formatBDT(receipt.totalAmount)}
PAYMENT:  ${paymentLabel}
${receipt.tenderedAmount != null ? `PAID:     ${formatBDT(receipt.tenderedAmount)}\n` : ""}${receipt.changeDue != null ? `CHANGE:   ${formatBDT(receipt.changeDue)}\n` : ""}========================================
       Thank you for your business!
========================================
  `.trim();
}

/**
 * Builds a clean, self-contained HTML thermal receipt document for printing.
 * Uses responsive centering on A4 (@page auto + 72mm margin: 0 auto) and fits 80mm thermal paper.
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

  const paymentLabel = formatPaymentMethod(receipt.paymentMethod);
  const bizName = sanitizeDisplayName(receipt.businessName, "Business name unavailable");
  const locName = sanitizeDisplayName(receipt.locationName, "Branch location unavailable");
  const cashierName = sanitizeDisplayName(receipt.cashierName, "Staff Cashier");
  const customerName = sanitizeDisplayName(receipt.customerName, "Walk-in Customer");
  const invoiceNum = receipt.invoiceNumber || "RECEIPT";
  const isRefunded = receipt.status === "REFUNDED" || receipt.status === "PARTIALLY_REFUNDED";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Receipt_${escapeHtml(invoiceNum)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    @page {
      size: auto;
      margin: 4mm;
    }
    @media print {
      html, body {
        width: 100% !important;
        max-width: none !important;
        margin: 0 !important;
        padding: 0 !important;
        background: #fff !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .receipt-paper {
        box-sizing: border-box !important;
        width: 72mm !important;
        max-width: 100% !important;
        margin: 0 auto !important;
        padding: 0 !important;
      }
      .item-row {
        break-inside: avoid;
        page-break-inside: avoid;
      }
      .item-name {
        white-space: normal;
        overflow-wrap: anywhere;
      }
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: "Noto Sans Bengali", "SolaimanLipi", "Kalpurush", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, monospace;
      font-size: 11px;
      line-height: 1.35;
      color: #111;
      background: #fff;
      padding: 6px;
      -webkit-font-smoothing: antialiased;
    }
    .receipt-paper {
      box-sizing: border-box;
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
      white-space: normal;
      overflow-wrap: anywhere;
    }
    .loc-name {
      font-size: 10px;
      color: #4b5563;
      margin-bottom: 4px;
      white-space: normal;
      overflow-wrap: anywhere;
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
    .status-tag.refunded {
      border-color: #e11d48;
      color: #e11d48;
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
      flex-shrink: 0;
    }
    .meta-value {
      font-weight: 600;
      color: #111827;
      text-align: right;
      overflow-wrap: anywhere;
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
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .item-name {
      font-weight: 600;
      font-size: 11px;
      color: #111827;
      white-space: normal;
      overflow-wrap: anywhere;
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
        ${receipt.status ? `<span class="status-tag ${isRefunded ? "refunded" : ""}">${escapeHtml(receipt.status)}</span>` : ""}
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
      <div class="meta-row">
        <span class="meta-label">Customer:</span>
        <span class="meta-value">${escapeHtml(customerName)}</span>
      </div>
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
 * Uses a full viewport offscreen frame (100vw/100vh) for accurate media queries.
 * Guards triggerPrint with a local printStarted boolean so onload and timeout cannot open two print dialogs.
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
  iframe.style.width = "100vw";
  iframe.style.height = "100vh";
  iframe.style.border = "none";
  iframe.style.opacity = "0";
  iframe.style.pointerEvents = "none";

  document.body.appendChild(iframe);

  let cleanedUp = false;
  let printStarted = false;
  let printTimeoutId: ReturnType<typeof setTimeout> | null = null;
  let fallbackTimer: ReturnType<typeof setTimeout> | null = null;

  const cleanup = () => {
    if (cleanedUp) return;
    cleanedUp = true;
    if (printTimeoutId) clearTimeout(printTimeoutId);
    if (fallbackTimer) clearTimeout(fallbackTimer);
    try {
      if (iframe.parentNode) {
        iframe.parentNode.removeChild(iframe);
      }
    } catch {
      // ignore
    }
  };

  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) {
    console.error("Could not access print iframe document");
    cleanup();
    return;
  }

  const html = generateReceiptHtml(receipt);
  doc.open();
  doc.write(html);
  doc.close();

  const printWindow = iframe.contentWindow;
  if (!printWindow) {
    cleanup();
    return;
  }

  try {
    printWindow.addEventListener("afterprint", cleanup, { once: true });
  } catch {
    // ignore
  }

  // Fallback cleanup timer in case afterprint does not fire on certain browser/OS dialogs
  fallbackTimer = setTimeout(cleanup, 60000);

  const triggerPrint = () => {
    if (printStarted || cleanedUp) return;
    printStarted = true;
    if (printTimeoutId) clearTimeout(printTimeoutId);
    try {
      printWindow.focus();
      printWindow.print();
    } catch (err) {
      console.error("Print invocation error:", err);
      cleanup();
    }
  };

  // Wait for document readiness, with a max safety timeout so Google Fonts doesn't block indefinitely
  if (doc.readyState === "complete") {
    printTimeoutId = setTimeout(triggerPrint, 150);
  } else {
    iframe.onload = () => {
      triggerPrint();
    };
    // Secondary safety trigger so slow fonts do not stall print invocation
    printTimeoutId = setTimeout(triggerPrint, 500);
  }
}

/**
 * Generates raw 80mm PDF bytes with accurate dynamic page height and text-wrapping.
 * Prevents text truncation, ensures two-column rows fit within 80mm paper, and supports 30+ items without clipping.
 */
export function generateReceiptPdfBytes(receipt: ReceiptViewModel): Uint8Array {
  const bizName = sanitizeDisplayName(receipt.businessName, "Business name unavailable");
  const locName = sanitizeDisplayName(receipt.locationName, "Branch location unavailable");
  const cashierName = sanitizeDisplayName(receipt.cashierName, "Staff Cashier");
  const customerName = sanitizeDisplayName(receipt.customerName, "Walk-in Customer");
  const invoiceNum = receipt.invoiceNumber || "RECEIPT";
  const paymentLabel = formatPaymentMethod(receipt.paymentMethod);

  const pageWidth = 226.77; // 80mm in PDF points (72 pt per inch)
  const marginX = 14;
  const contentWidth = pageWidth - marginX * 2; // 198.77 pt (~70mm printable width)

  // 1. Calculate wrapped lines
  const bizLines = wrapPdfText(bizName.toUpperCase(), contentWidth, 12 * 0.55);
  const locLines = wrapPdfText(locName, contentWidth, 9 * 0.52);
  const invoiceTag = receipt.status ? `#${invoiceNum} [${receipt.status}]` : `#${invoiceNum}`;
  const invoiceLines = wrapPdfText(invoiceTag, contentWidth, 10 * 0.55);

  const dateStr = receipt.createdAt
    ? new Date(receipt.createdAt).toLocaleString("en-BD", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

  const dateLines = wrapPdfText(`Date: ${dateStr}`, contentWidth, 8 * 0.52);
  const cashierLines = wrapPdfText(`Cashier: ${cashierName}`, contentWidth, 8 * 0.52);
  const customerLines = wrapPdfText(`Customer: ${customerName}`, contentWidth, 8 * 0.52);
  const phoneLines = receipt.customerPhone
    ? wrapPdfText(`Phone: ${receipt.customerPhone}`, contentWidth, 8 * 0.52)
    : [];

  const itemLineGroups = receipt.items.map((item) => ({
    nameLines: wrapPdfText(item.name, contentWidth, 8 * 0.54),
    calcLeft: `${item.quantity} x ${formatBDT(item.unitPrice)}`,
    calcRight: formatBDT(item.subtotal),
  }));

  // 2. Measure heights dynamically from wrapped content
  let totalContentHeight = 0;
  totalContentHeight += bizLines.length * 15;
  totalContentHeight += locLines.length * 12;
  totalContentHeight += invoiceLines.length * 13;
  totalContentHeight += 10; // Divider
  totalContentHeight += dateLines.length * 11;
  totalContentHeight += cashierLines.length * 11;
  totalContentHeight += customerLines.length * 11;
  totalContentHeight += phoneLines.length * 11;
  totalContentHeight += 10; // Divider
  totalContentHeight += 14; // Items header ("Item" / "Total")
  for (const group of itemLineGroups) {
    totalContentHeight += group.nameLines.length * 11;
    totalContentHeight += 13; // Quantity x UnitPrice ... Subtotal
    totalContentHeight += 4; // Gap
  }
  totalContentHeight += 10; // Totals divider
  totalContentHeight += 14; // Subtotal row
  totalContentHeight += 18; // TOTAL row
  totalContentHeight += 13; // Payment Method row
  if (receipt.tenderedAmount != null) {
    totalContentHeight += 11; // Paid row
  }
  if (receipt.changeDue != null) {
    totalContentHeight += 11; // Change row
  }
  totalContentHeight += 14; // Footer divider
  totalContentHeight += 13; // Thank you row
  totalContentHeight += 11; // Powered by row

  const topMargin = 22;
  const bottomMargin = 20;
  const pageHeight = Math.max(300, Math.ceil(totalContentHeight + topMargin + bottomMargin));

  // 3. Render PDF Stream
  const streamLines: string[] = [];
  let y = pageHeight - topMargin;

  const drawCenter = (text: string, yPos: number, font = "/F1", fontSize = 9) => {
    const textWidth = Math.min(contentWidth, text.length * (fontSize * 0.53));
    const x = Math.max(marginX, (pageWidth - textWidth) / 2);
    streamLines.push(`BT ${font} ${fontSize} Tf ${x.toFixed(1)} ${yPos.toFixed(1)} Td (${escPdf(text)}) Tj ET`);
  };

  const drawRow = (
    leftText: string,
    rightText: string,
    yPos: number,
    leftFont = "/F1",
    rightFont = "/F2",
    fontSize = 8,
  ) => {
    const rightWidth = rightText.length * (fontSize * 0.55);
    const rightX = Math.max(marginX + 60, pageWidth - marginX - rightWidth);
    const maxLeftWidth = rightX - marginX - 6;
    const leftLines = wrapPdfText(leftText, maxLeftWidth, fontSize * 0.52);

    if (leftLines.length > 0) {
      streamLines.push(`BT ${leftFont} ${fontSize} Tf ${marginX} ${yPos.toFixed(1)} Td (${escPdf(leftLines[0])}) Tj ET`);
    }
    streamLines.push(`BT ${rightFont} ${fontSize} Tf ${rightX.toFixed(1)} ${yPos.toFixed(1)} Td (${escPdf(rightText)}) Tj ET`);
  };

  const drawDivider = (yPos: number) => {
    streamLines.push(`${marginX} ${yPos.toFixed(1)} m ${(pageWidth - marginX).toFixed(1)} ${yPos.toFixed(1)} l S`);
  };

  // Header
  for (const line of bizLines) {
    drawCenter(line, y, "/F2", 12);
    y -= 15;
  }
  for (const line of locLines) {
    drawCenter(line, y, "/F1", 9);
    y -= 12;
  }
  for (const line of invoiceLines) {
    drawCenter(line, y, "/F2", 10);
    y -= 13;
  }

  // Divider
  y -= 4;
  drawDivider(y);
  y -= 8;

  // Metadata
  for (const line of dateLines) {
    streamLines.push(`BT /F1 8 Tf ${marginX} ${y.toFixed(1)} Td (${escPdf(line)}) Tj ET`);
    y -= 11;
  }
  for (const line of cashierLines) {
    streamLines.push(`BT /F1 8 Tf ${marginX} ${y.toFixed(1)} Td (${escPdf(line)}) Tj ET`);
    y -= 11;
  }
  for (const line of customerLines) {
    streamLines.push(`BT /F1 8 Tf ${marginX} ${y.toFixed(1)} Td (${escPdf(line)}) Tj ET`);
    y -= 11;
  }
  for (const line of phoneLines) {
    streamLines.push(`BT /F1 8 Tf ${marginX} ${y.toFixed(1)} Td (${escPdf(line)}) Tj ET`);
    y -= 11;
  }

  // Divider
  y -= 4;
  drawDivider(y);
  y -= 8;

  // Items Table Header
  drawRow("Item", "Total", y, "/F2", "/F2", 8);
  y -= 13;

  // Items
  for (const group of itemLineGroups) {
    for (const nameLine of group.nameLines) {
      streamLines.push(`BT /F2 8 Tf ${marginX} ${y.toFixed(1)} Td (${escPdf(nameLine)}) Tj ET`);
      y -= 11;
    }
    drawRow(group.calcLeft, group.calcRight, y, "/F1", "/F2", 8);
    y -= 13;
    y -= 4; // gap
  }

  // Totals divider
  y -= 4;
  drawDivider(y);
  y -= 8;

  // Subtotal
  drawRow("Subtotal:", formatBDT(receipt.subtotal), y, "/F1", "/F2", 9);
  y -= 14;

  // TOTAL
  drawRow("TOTAL:", formatBDT(receipt.totalAmount), y, "/F2", "/F2", 11);
  y -= 17;

  // Payment Method
  drawRow("Payment Method:", paymentLabel, y, "/F1", "/F2", 8);
  y -= 13;

  // Paid
  if (receipt.tenderedAmount != null) {
    drawRow("Paid:", formatBDT(receipt.tenderedAmount), y, "/F1", "/F2", 8);
    y -= 11;
  }

  // Change
  if (receipt.changeDue != null) {
    drawRow("Change:", formatBDT(receipt.changeDue), y, "/F1", "/F2", 8);
    y -= 11;
  }

  // Footer divider
  y -= 6;
  drawDivider(y);
  y -= 12;

  // Footer text
  drawCenter("Thank you for your business!", y, "/F1", 8);
  y -= 11;
  drawCenter("Powered by SunTech POS", y, "/F1", 7);

  // Construct PDF
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
  return encoder.encode(fullPdf);
}

/**
 * Downloads direct native PDF file for ASCII receipts.
 * For Unicode/Bengali receipts, routes to the browser print dialog so high-quality Noto Sans Bengali font is used for print-to-PDF.
 */
export function downloadReceiptPdf(receipt: ReceiptViewModel): void {
  if (typeof window === "undefined") return;

  if (hasUnicodeContent(receipt)) {
    printThermalReceipt(receipt);
    return;
  }

  const invoiceNum = receipt.invoiceNumber || "RECEIPT";
  const pdfBytes = generateReceiptPdfBytes(receipt);
  const blob = new Blob([pdfBytes as unknown as BlobPart], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `Receipt_${invoiceNum}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
