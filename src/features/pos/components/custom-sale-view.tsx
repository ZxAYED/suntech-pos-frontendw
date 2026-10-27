"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Minus, Plus, ReceiptText, Store, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { TenantRequiredState } from "@/components/common/data-state";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateCustomOrder, type CreatedOrder } from "@/features/pos/api/use-pos";
import type { CustomSaleLineForm } from "@/features/pos/view-models";
import { useActiveShift } from "@/features/shifts/api/use-shifts";
import { useTenantScope, type RoleType } from "@/features/tenant/hooks/use-tenant-scope";
import { PAYMENT_METHOD_OPTIONS } from "@/lib/payment-methods";
import { formatBDT } from "@/lib/utils";
import { ApiClientError } from "@/types/api";
import type { PaymentMethod } from "@/types/domain";

function newLine(): CustomSaleLineForm {
  return { id: globalThis.crypto.randomUUID(), productName: "", quantity: 1, unitPrice: "" };
}

export function CustomSaleView({ role = "cashier" }: { role?: RoleType }) {
  const tenant = useTenantScope(role);
  const activeShift = useActiveShift(tenant.isTenantReady);
  const createOrder = useCreateCustomOrder();
  const [lines, setLines] = useState<CustomSaleLineForm[]>([newLine()]);
  const [customer, setCustomer] = useState({ customerName: "", customerPhone: "" });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("COD");
  const [tendered, setTendered] = useState("");
  const [receipt, setReceipt] = useState<CreatedOrder | null>(null);
  const [outcomeUnknown, setOutcomeUnknown] = useState(false);
  const operationKeyRef = useRef<string | null>(null);
  const total = useMemo(() => lines.reduce((sum, line) => sum + (Number(line.unitPrice) || 0) * line.quantity, 0), [lines]);
  const tenderedAmount = paymentMethod === "COD" ? Number(tendered) : total;

  if (tenant.isAdmin && !tenant.isTenantReady) return <TenantRequiredState />;

  const draftChanged = () => { if (!outcomeUnknown) operationKeyRef.current = null; };
  const updateLine = (id: string, patch: Partial<CustomSaleLineForm>) => {
    if (outcomeUnknown) return;
    draftChanged();
    setLines((current) => current.map((line) => line.id === id ? { ...line, ...patch } : line));
  };
  const submit = async () => {
    const invalid = lines.find((line) => !line.productName.trim() || !Number.isInteger(line.quantity) || line.quantity < 1 || !Number.isInteger(Number(line.unitPrice)) || Number(line.unitPrice) < 0);
    if (invalid) { toast.error("Each line needs a product name, positive integer quantity, and non-negative whole BDT price."); return; }
    if (!Number.isInteger(tenderedAmount) || tenderedAmount < total) { toast.error("Tendered amount must be a whole BDT value at least equal to the total."); return; }
    operationKeyRef.current ??= globalThis.crypto.randomUUID();
    try {
      const result = await createOrder.mutateAsync({
        ...tenant.tenantParams,
        shiftId: activeShift.data?.id,
        customerName: customer.customerName.trim() || undefined,
        customerPhone: customer.customerPhone.trim() || undefined,
        paymentMethod, tenderedAmount,
        lines: lines.map((line) => ({ productName: line.productName.trim(), variantName: line.variantName?.trim() || undefined, quantity: line.quantity, unitPrice: Number(line.unitPrice) })),
        idempotencyKey: operationKeyRef.current,
      });
      setReceipt(result); setLines([newLine()]); setCustomer({ customerName: "", customerPhone: "" }); setTendered(""); setOutcomeUnknown(false); operationKeyRef.current = null;
      toast.success("Custom sale confirmed by the server.");
    } catch (error) {
      if (error instanceof ApiClientError && (error.status === 0 || error.status === 408 || error.status >= 500)) {
        setOutcomeUnknown(true);
        toast.error("The server result is unknown. Keep this draft unchanged and retry with the same operation key.");
      } else {
        operationKeyRef.current = null;
        toast.error(error instanceof Error ? error.message : "Custom sale failed. The draft was preserved.");
      }
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title={tenant.isAdmin ? "Direct Custom Sale (Admin Desk)" : "Direct Custom Sale"} actions={tenant.isAdmin ? <Link href="/admin/select-business" className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium"><Store className="h-4 w-4 text-[#0052FF]" />{tenant.activeBranch?.name}<span className="text-[#0052FF]">Switch</span></Link> : undefined} />
      {outcomeUnknown ? <p role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">Sale result unknown. Draft editing is locked; retry sends the same operation key.</p> : null}
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-4">{lines.map((line, index) => <Card key={line.id} className="border-slate-200 p-4 shadow-xs"><div className="mb-4 flex items-center justify-between"><div><p className="text-sm font-semibold text-[#070B28]">Item {index + 1}</p><p className="text-xs text-slate-500">Free-form line; it does not create a catalog item or change stock.</p></div><Button variant="ghost" size="icon" disabled={lines.length === 1 || outcomeUnknown} onClick={() => { draftChanged(); setLines((current) => current.filter((item) => item.id !== line.id)); }} aria-label={`Remove item ${index + 1}`}><Trash2 className="h-4 w-4 text-rose-500" /></Button></div><div className="grid gap-4 md:grid-cols-2">
          <Field label="Product or service name *"><Input disabled={outcomeUnknown} value={line.productName} onChange={(event) => updateLine(line.id, { productName: event.target.value })} /></Field>
          <Field label="Variant or style (optional)"><Input disabled={outcomeUnknown} value={line.variantName ?? ""} onChange={(event) => updateLine(line.id, { variantName: event.target.value })} /></Field>
          <Field label="Unit price (BDT) *"><Input disabled={outcomeUnknown} type="number" inputMode="numeric" min="0" step="1" value={line.unitPrice} onChange={(event) => updateLine(line.id, { unitPrice: event.target.value === "" ? "" : Number(event.target.value) })} /></Field>
          <Field label="Quantity *"><div className="flex items-center gap-2"><Button type="button" variant="outline" size="icon" disabled={outcomeUnknown} onClick={() => updateLine(line.id, { quantity: Math.max(1, line.quantity - 1) })}><Minus className="h-4 w-4" /></Button><Input disabled={outcomeUnknown} type="number" min="1" step="1" value={line.quantity} onChange={(event) => updateLine(line.id, { quantity: Math.max(1, Number.parseInt(event.target.value, 10) || 1) })} className="text-center" /><Button type="button" variant="outline" size="icon" disabled={outcomeUnknown} onClick={() => updateLine(line.id, { quantity: line.quantity + 1 })}><Plus className="h-4 w-4" /></Button></div></Field>
        </div><div className="mt-4 text-right text-sm text-slate-500">Line total <span className="ml-2 font-mono font-semibold text-[#070B28]">{formatBDT((Number(line.unitPrice) || 0) * line.quantity)}</span></div></Card>)}<Button variant="outline" disabled={outcomeUnknown} onClick={() => { draftChanged(); setLines((current) => [...current, newLine()]); }}><Plus className="mr-2 h-4 w-4" />Add another item</Button></div>

        <Card className="h-fit border-slate-200 p-5 shadow-xs xl:sticky xl:top-0"><h2 className="font-semibold text-[#070B28]">Customer & payment</h2><div className="mt-4 space-y-4"><Field label="Customer name (optional)"><Input disabled={outcomeUnknown} value={customer.customerName} onChange={(event) => { draftChanged(); setCustomer((value) => ({ ...value, customerName: event.target.value })); }} /></Field><Field label="Customer phone (optional)"><Input disabled={outcomeUnknown} type="tel" value={customer.customerPhone} onChange={(event) => { draftChanged(); setCustomer((value) => ({ ...value, customerPhone: event.target.value })); }} /></Field><Field label="Payment method"><Select disabled={outcomeUnknown} value={paymentMethod} onValueChange={(value) => { draftChanged(); setPaymentMethod(value as PaymentMethod); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PAYMENT_METHOD_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></Field>{paymentMethod === "COD" ? <Field label="Tendered amount (BDT)"><Input disabled={outcomeUnknown} type="number" min="0" step="1" value={tendered} onChange={(event) => { draftChanged(); setTendered(event.target.value); }} /></Field> : null}</div><div className="my-5 flex items-center justify-between border-y border-slate-200 py-4"><span className="font-medium text-slate-600">Total</span><span className="font-mono text-xl font-bold text-[#0052FF]">{formatBDT(total)}</span></div><p className="mb-3 text-[11px] text-slate-500">{activeShift.data ? "The current active shift will be attached." : "Shift is optional; checkout remains available."}</p><Button className="w-full bg-[#0052FF] text-white hover:bg-[#0047E0]" disabled={!lines.length || !Number.isInteger(tenderedAmount) || tenderedAmount < total} loading={createOrder.isPending} onClick={() => void submit()}><ReceiptText className="mr-2 h-4 w-4" />{outcomeUnknown ? "Retry same sale" : "Complete sale"}</Button></Card>
      </div>

      <Dialog open={receipt !== null} onOpenChange={(open) => !open && setReceipt(null)}><DialogContent><DialogHeader><DialogTitle>Custom sale receipt</DialogTitle></DialogHeader>{receipt ? <div className="space-y-3"><div className="text-center"><p className="font-mono text-xs text-slate-500">#{receipt.receiptNumber ?? receipt.invoiceNumber}</p><p className="font-mono text-2xl font-bold text-[#0052FF]">{formatBDT(receipt.totalAmount)}</p><p className="text-xs text-slate-500">Server-confirmed {receipt.status} · {receipt.paymentMethod}</p></div>{receipt.lines.map((line) => <div key={line.id} className="flex justify-between text-sm"><span>{line.productName}{line.variantName ? ` · ${line.variantName}` : ""} × {line.quantity}</span><span className="font-mono">{formatBDT(line.subtotal)}</span></div>)}</div> : null}</DialogContent></Dialog>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><label className="text-xs font-medium text-[#070B28]">{label}</label>{children}</div>;
}
