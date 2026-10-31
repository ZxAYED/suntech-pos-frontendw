import { useEffect } from "react";
import { Download, FileText, Printer, Receipt as ReceiptIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { downloadReceiptPdf, isUuid, printThermalReceipt, sanitizeDisplayName } from "@/features/pos/utils/print-receipt";
import type { ReceiptViewModel } from "@/features/pos/view-models";
import { getPaymentMethodLabel } from "@/lib/payment-methods";
import { formatBDT } from "@/lib/utils";

export interface ReceiptDialogProps {
  receipt: ReceiptViewModel | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReceiptDialog({ receipt, open, onOpenChange }: ReceiptDialogProps) {
  const handlePrint = () => {
    if (!receipt) return;
    printThermalReceipt(receipt);
  };

  const handleDownloadPdf = () => {
    if (!receipt) return;
    downloadReceiptPdf(receipt);
  };

  const handleDownloadText = () => {
    if (!receipt) return;
    const biz = sanitizeDisplayName(receipt.businessName, "SunTech POS");
    const loc = sanitizeDisplayName(receipt.locationName, "Uttara Doyel Branch");
    const cashier = sanitizeDisplayName(receipt.cashierName, "Staff Cashier");
    const customer = sanitizeDisplayName(receipt.customerName, "Walk-in");
    const content = `
========================================
           ${biz}
           ${loc}
========================================
Invoice #: ${receipt.invoiceNumber}
Date:     ${receipt.createdAt ? new Date(receipt.createdAt).toLocaleString("en-BD") : "—"}
Cashier:  ${cashier}
Customer: ${customer} (${receipt.customerPhone || "N/A"})
----------------------------------------
ITEMS:
${receipt.items.map((i) => `${i.name}\n  ${i.quantity} x ${formatBDT(i.unitPrice)} = ${formatBDT(i.subtotal)}`).join("\n")}
----------------------------------------
SUBTOTAL: ${formatBDT(receipt.subtotal)}
TOTAL:    ${formatBDT(receipt.totalAmount)}
PAYMENT:  ${getPaymentMethodLabel(receipt.paymentMethod)}
PAID:     ${receipt.tenderedAmount != null ? formatBDT(receipt.tenderedAmount) : formatBDT(receipt.totalAmount)}
CHANGE:   ${receipt.changeDue != null ? formatBDT(receipt.changeDue) : "0 BDT"}
========================================
       Thank you for your business!
========================================
    `.trim();

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Receipt_${receipt.invoiceNumber}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  // Keyboard shortcut: pressing 'P' or Ctrl+P automatically prints receipt
  useEffect(() => {
    if (!open || !receipt) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "p") {
        event.preventDefault();
        printThermalReceipt(receipt);
      } else if (
        event.key.toLowerCase() === "p" &&
        !(event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement)
      ) {
        event.preventDefault();
        printThermalReceipt(receipt);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, receipt]);

  if (!receipt) return null;

  const isRefunded = receipt.status === "REFUNDED" || receipt.status === "PARTIALLY_REFUNDED";

  return (
    <>
      {/* Thermal receipt print isolation styles for native Ctrl+P */}
      <style jsx global>{`
        @media print {
          body > *:not([data-radix-portal]) {
            display: none !important;
          }
          [data-radix-portal] {
            position: static !important;
            display: block !important;
          }
          [data-radix-dialog-overlay] {
            display: none !important;
          }
          div[role="dialog"] {
            position: static !important;
            transform: none !important;
            max-width: 100% !important;
            width: 100% !important;
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
            background: transparent !important;
          }
          .no-print {
            display: none !important;
          }
          #printable-thermal-receipt {
            position: static !important;
            margin: 0 auto !important;
            width: 80mm !important;
            max-width: 80mm !important;
            padding: 4mm 2mm !important;
            border: none !important;
            box-shadow: none !important;
            overflow: visible !important;
            background: white !important;
            color: black !important;
          }
        }
      `}</style>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-2 border-b border-slate-100 flex flex-row items-center justify-between no-print">
            <div className="flex items-center gap-2">
              <ReceiptIcon className="h-5 w-5 text-[#0052FF]" />
              <DialogTitle className="text-base font-semibold text-[#070B28]">Order Receipt</DialogTitle>
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadText}
                className="gap-1 h-8 text-xs font-medium border-slate-200"
                title="Download plain text receipt"
              >
                <FileText className="h-3.5 w-3.5 text-slate-600" /> TXT
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadPdf}
                className="gap-1 h-8 text-xs font-medium border-slate-200"
                title="Download PDF receipt"
              >
                <Download className="h-3.5 w-3.5 text-slate-600" /> PDF
              </Button>
              <Button
                size="sm"
                onClick={handlePrint}
                className="bg-[#0052FF] text-white hover:bg-[#0047E0] gap-1.5 h-8 text-xs font-medium"
                title="Print Receipt (Shortcut: Press P or Ctrl+P)"
              >
                <Printer className="h-3.5 w-3.5" /> Print (P)
              </Button>
            </div>
          </DialogHeader>

          {/* Printable Thermal Receipt Paper Body */}
          <div className="p-6 bg-slate-50 flex justify-center">
            <div
              id="printable-thermal-receipt"
              className="w-full max-w-[340px] bg-white rounded-lg border border-dashed border-slate-300 p-5 shadow-xs font-mono text-xs text-slate-800 space-y-3"
            >
              {/* Header */}
              <div className="text-center space-y-1">
                <p className="text-base font-bold uppercase tracking-wider text-[#070B28]">
                  {sanitizeDisplayName(receipt.businessName, "SUNTECH RETAIL LTD.")}
                </p>
                <p className="text-[11px] text-slate-600">
                  {sanitizeDisplayName(receipt.locationName, "Uttara Doyel Branch")}
                </p>
                <div className="pt-1 flex items-center justify-center gap-1.5">
                  <span className="font-semibold text-slate-900">#{receipt.invoiceNumber}</span>
                  {receipt.status ? (
                    <Badge
                      variant="outline"
                      className={`text-[9px] px-1.5 py-0 ${
                        isRefunded
                          ? "border-rose-200 bg-rose-50 text-rose-700"
                          : "border-emerald-200 bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      {receipt.status}
                    </Badge>
                  ) : null}
                </div>
              </div>

              {/* Meta details */}
              <div className="border-t border-b border-dashed border-slate-200 py-2 space-y-1 text-[11px] text-slate-600">
                <div className="flex justify-between">
                  <span>Date:</span>
                  <span>{receipt.createdAt ? new Date(receipt.createdAt).toLocaleString("en-BD") : "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cashier:</span>
                  <span>{sanitizeDisplayName(receipt.cashierName, "Staff Cashier")}</span>
                </div>
                {receipt.customerName && !isUuid(receipt.customerName) ? (
                  <div className="flex justify-between">
                    <span>Customer:</span>
                    <span>{sanitizeDisplayName(receipt.customerName, "Walk-in Customer")}</span>
                  </div>
                ) : null}
                {receipt.customerPhone ? (
                  <div className="flex justify-between">
                    <span>Phone:</span>
                    <span>{receipt.customerPhone}</span>
                  </div>
                ) : null}
              </div>

              {/* Items Table */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-bold text-slate-900 border-b border-slate-200 pb-1 text-[11px]">
                  <span>Item</span>
                  <span className="text-right">Total</span>
                </div>
                {receipt.items.map((line) => (
                  <div key={line.id} className="text-[11px]">
                    <p className="font-medium text-slate-900 truncate">{line.name}</p>
                    <div className="flex justify-between text-slate-500">
                      <span>
                        {line.quantity} × {formatBDT(line.unitPrice)}
                      </span>
                      <span className="font-semibold text-slate-800">{formatBDT(line.subtotal)}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Financial Summary */}
              <div className="border-t border-dashed border-slate-200 pt-2 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-600">Subtotal:</span>
                  <span className="font-semibold">{formatBDT(receipt.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-slate-900 border-t border-slate-200 pt-1">
                  <span>TOTAL:</span>
                  <span className="text-[#0052FF]">{formatBDT(receipt.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-slate-600 pt-1">
                  <span>Payment Method:</span>
                  <span className="font-semibold text-slate-800">
                    {getPaymentMethodLabel(receipt.paymentMethod)}
                  </span>
                </div>
                {receipt.tenderedAmount != null && (
                  <div className="flex justify-between text-slate-600">
                    <span>Paid:</span>
                    <span className="font-semibold text-slate-900">{formatBDT(receipt.tenderedAmount)}</span>
                  </div>
                )}
                {receipt.changeDue != null && (
                  <div className="flex justify-between text-slate-600">
                    <span>Change:</span>
                    <span className="font-semibold text-slate-900">{formatBDT(receipt.changeDue)}</span>
                  </div>
                )}
              </div>

              {/* Footer Note */}
              <div className="border-t border-dashed border-slate-200 pt-3 text-center text-[10px] text-slate-500 space-y-0.5">
                <p className="font-medium text-slate-700">Thank you for your business!</p>
                <p>Powered by SunTech POS</p>
              </div>
            </div>
          </div>

          <div className="p-3 bg-white border-t border-slate-100 flex items-center justify-between gap-2 no-print">
            <span className="text-[11px] text-slate-400">
              Shortcut: press <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded font-mono text-[10px] text-slate-700">P</kbd> to print
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownloadPdf} className="border-slate-200">
                <Download className="mr-1 h-3.5 w-3.5 text-slate-600" /> Save PDF
              </Button>
              <Button size="sm" onClick={handlePrint} className="bg-[#0052FF] text-white hover:bg-[#0047E0]">
                <Printer className="mr-1.5 h-3.5 w-3.5" /> Print
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
