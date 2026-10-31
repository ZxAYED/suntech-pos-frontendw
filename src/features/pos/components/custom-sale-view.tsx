"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Minus, Plus, ReceiptText, Store, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { TenantRequiredState } from "@/components/common/data-state";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateCustomOrder } from "@/features/pos/api/use-pos";
import { ReceiptDialog } from "@/features/pos/components/receipt-dialog";
import { mapOrderToReceipt, type CustomSaleLineForm, type ReceiptViewModel } from "@/features/pos/view-models";
import { useActiveShift } from "@/features/shifts/api/use-shifts";
import { useTenantScope, type RoleType } from "@/features/tenant/hooks/use-tenant-scope";
import { PAYMENT_METHOD_OPTIONS } from "@/lib/payment-methods";
import { formatBDT } from "@/lib/utils";
import { customOrderSchema } from "@/lib/validations";
import { ApiClientError } from "@/types/api";
import type { PaymentMethod } from "@/types/domain";

function newLine(): CustomSaleLineForm {
  return { id: globalThis.crypto.randomUUID(), productName: "", quantity: 1, unitPrice: "" };
}

export function CustomSaleView({ role = "cashier" }: { role?: RoleType }) {
  const tenant = useTenantScope(role);
  const activeShift = useActiveShift(tenant.locationId, tenant.isTenantReady);
  const createOrder = useCreateCustomOrder();
  const [lines, setLines] = useState<CustomSaleLineForm[]>([newLine()]);
  const [customer, setCustomer] = useState({ customerName: "", customerPhone: "" });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("COD");
  const [tendered, setTendered] = useState("");
  const [receipt, setReceipt] = useState<ReceiptViewModel | null>(null);
  const [outcomeUnknown, setOutcomeUnknown] = useState(false);
  const operationKeyRef = useRef<string | null>(null);

  const total = useMemo(() => {
    return lines.reduce((sum, line) => {
      const price = typeof line.unitPrice === "number" ? line.unitPrice : Number(line.unitPrice);
      const safePrice = Number.isFinite(price) && price >= 0 ? Math.floor(price) : 0;
      return sum + safePrice * Math.max(1, Math.floor(line.quantity));
    }, 0);
  }, [lines]);

  const tenderedAmount =
    paymentMethod === "COD"
      ? tendered.trim() !== "" && !Number.isNaN(Number(tendered))
        ? Number(tendered)
        : total
      : total;

  if (tenant.isAdmin && !tenant.isTenantReady) return <TenantRequiredState />;

  const draftChanged = () => { if (!outcomeUnknown) operationKeyRef.current = null; };
  const updateLine = (id: string, patch: Partial<CustomSaleLineForm>) => {
    if (outcomeUnknown) return;
    draftChanged();
    setLines((current) => current.map((line) => line.id === id ? { ...line, ...patch } : line));
  };
  const submit = async () => {
    operationKeyRef.current ??= globalThis.crypto.randomUUID();

    const formattedLines = lines.map((line) => {
      const parsedPrice = typeof line.unitPrice === "number" ? line.unitPrice : Number(line.unitPrice);
      return {
        productName: line.productName.trim(),
        variantName: line.variantName?.trim() || undefined,
        quantity: Math.floor(line.quantity),
        unitPrice: Number.isFinite(parsedPrice) ? Math.floor(parsedPrice) : -1,
      };
    });

    const validation = customOrderSchema.safeParse({
      ...tenant.tenantParams,
      shiftId: activeShift.data?.id,
      customerName: customer.customerName.trim() || undefined,
      customerPhone: customer.customerPhone.trim() || undefined,
      paymentMethod,
      tenderedAmount: Math.floor(tenderedAmount),
      lines: formattedLines,
      idempotencyKey: operationKeyRef.current,
    });

    if (!validation.success) {
      toast.error(validation.error.issues[0]?.message || "Invalid order inputs. Please check quantities and prices.");
      return;
    }

    try {
      const result = await createOrder.mutateAsync({
        ...tenant.tenantParams,
        shiftId: validation.data.shiftId,
        customerName: validation.data.customerName,
        customerPhone: validation.data.customerPhone,
        paymentMethod: validation.data.paymentMethod,
        tenderedAmount: validation.data.tenderedAmount,
        lines: validation.data.lines,
        idempotencyKey: validation.data.idempotencyKey,
      });
      const receiptVm = mapOrderToReceipt(result, tenant.activeBusiness?.name, tenant.activeBranch?.name);
      setReceipt(receiptVm);
      setLines([newLine()]);
      setCustomer({ customerName: "", customerPhone: "" });
      setTendered("");
      setOutcomeUnknown(false);
      operationKeyRef.current = null;
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
        </div><div className="mt-4 text-right text-sm text-slate-500">Line total <span className="ml-2 font-mono font-semibold text-[#070B28]">{formatBDT((Number.isFinite(Number(line.unitPrice)) && Number(line.unitPrice) >= 0 ? Math.floor(Number(line.unitPrice)) : 0) * line.quantity)}</span></div></Card>)}<Button variant="outline" disabled={outcomeUnknown} onClick={() => { draftChanged(); setLines((current) => [...current, newLine()]); }}><Plus className="mr-2 h-4 w-4" />Add another item</Button></div>

        <Card className="h-fit border-slate-200 p-5 shadow-xs xl:sticky xl:top-0"><h2 className="font-semibold text-[#070B28]">Customer & payment</h2><div className="mt-4 space-y-4"><Field label="Customer name (optional)"><Input disabled={outcomeUnknown} value={customer.customerName} onChange={(event) => { draftChanged(); setCustomer((value) => ({ ...value, customerName: event.target.value })); }} /></Field><Field label="Customer phone (optional)"><Input disabled={outcomeUnknown} type="tel" value={customer.customerPhone} onChange={(event) => { draftChanged(); setCustomer((value) => ({ ...value, customerPhone: event.target.value })); }} /></Field><Field label="Payment method"><Select disabled={outcomeUnknown} value={paymentMethod} onValueChange={(value) => { draftChanged(); setPaymentMethod(value as PaymentMethod); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PAYMENT_METHOD_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></Field>{paymentMethod === "COD" ? <Field label="Paid amount (BDT)"><Input disabled={outcomeUnknown} type="number" min="0" step="1" value={tendered} onChange={(event) => { draftChanged(); setTendered(event.target.value); }} /></Field> : null}</div><div className="my-5 flex items-center justify-between border-y border-slate-200 py-4"><span className="font-medium text-slate-600">Total</span><span className="font-mono text-xl font-bold text-[#0052FF]">{formatBDT(total)}</span></div><p className="mb-3 text-[11px] text-slate-500">{activeShift.data ? "The current active shift will be attached." : "Shift is optional; checkout remains available."}</p><Button className="w-full bg-[#0052FF] text-white hover:bg-[#0047E0]" disabled={!lines.length || !Number.isInteger(tenderedAmount) || tenderedAmount < total} loading={createOrder.isPending} onClick={() => void submit()}><ReceiptText className="mr-2 h-4 w-4" />{outcomeUnknown ? "Retry same sale" : "Complete sale"}</Button></Card>
      </div>

      <ReceiptDialog receipt={receipt} open={receipt !== null} onOpenChange={(open) => !open && setReceipt(null)} />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><label className="text-xs font-medium text-[#070B28]">{label}</label>{children}</div>;
}
