"use client";

import { useMemo, useState } from "react";
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
import { useMockCategories } from "@/features/catalog/api/use-catalog";
import { useMockCreateCustomOrder } from "@/features/pos/api/use-pos";
import { mapCustomSaleToPayload, type CustomSaleLineForm } from "@/features/pos/view-models";
import { useTenantScope, type RoleType } from "@/features/tenant/hooks/use-tenant-scope";
import { PAYMENT_METHOD_OPTIONS } from "@/lib/payment-methods";
import { formatBDT } from "@/lib/utils";
import type { PaymentMethod } from "@/types/domain";

function newLine(): CustomSaleLineForm {
  return { id: `line-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, productName: "", quantity: 1, unitPrice: "" };
}

export function CustomSaleView({ role = "cashier" }: { role?: RoleType }) {
  const tenant = useTenantScope(role);
  const categories = useMockCategories();
  const createOrder = useMockCreateCustomOrder();
  const [lines, setLines] = useState<CustomSaleLineForm[]>([newLine()]);
  const [customer, setCustomer] = useState({ customerName: "", customerPhone: "" });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("COD");
  const [receipt, setReceipt] = useState<{ invoiceNumber: string; total: number } | null>(null);
  const total = useMemo(() => lines.reduce((sum, line) => sum + (Number(line.unitPrice) || 0) * line.quantity, 0), [lines]);

  if (tenant.isAdmin && !tenant.isTenantReady) return <TenantRequiredState />;

  const updateLine = (id: string, patch: Partial<CustomSaleLineForm>) => setLines((current) => current.map((line) => line.id === id ? { ...line, ...patch } : line));
  const submit = async () => {
    const invalid = lines.find((line) => !line.productName.trim() || !Number.isInteger(line.quantity) || line.quantity < 1 || !Number.isInteger(Number(line.unitPrice)) || Number(line.unitPrice) <= 0);
    if (invalid) { toast.error("Each line needs a product name, integer quantity, and positive integer BDT price."); return; }
    const payload = mapCustomSaleToPayload(lines, customer, paymentMethod);
    const result = await createOrder.mutateAsync(payload);
    setReceipt({ invoiceNumber: result.invoiceNumber, total });
    toast.success("Mock custom sale completed.");
  };

  return (
    <div className="space-y-6">
      <PageHeader title={tenant.isAdmin ? "Direct Custom Sale (Admin Desk)" : "Direct Custom Sale"} actions={tenant.isAdmin ? <Link href="/admin/select-business" className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium"><Store className="h-4 w-4 text-[#0052FF]" />{tenant.activeBranch?.name}<span className="text-[#0052FF]">Switch</span></Link> : undefined} />
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {lines.map((line, index) => <Card key={line.id} className="border-slate-200 p-4 shadow-xs"><div className="mb-4 flex items-center justify-between"><div><p className="text-sm font-semibold text-[#070B28]">Item {index + 1}</p><p className="text-xs text-slate-500">Frontend form line; category and warranty are omitted from unsupported API fields.</p></div><Button variant="ghost" size="icon" disabled={lines.length === 1} onClick={() => setLines((current) => current.filter((item) => item.id !== line.id))} aria-label={`Remove item ${index + 1}`}><Trash2 className="h-4 w-4 text-rose-500" /></Button></div><div className="grid gap-4 md:grid-cols-2">
            <Field label="Product name *"><Input value={line.productName} onChange={(event) => updateLine(line.id, { productName: event.target.value })} /></Field>
            <Field label="Variant name"><Input value={line.variantName ?? ""} onChange={(event) => updateLine(line.id, { variantName: event.target.value })} /></Field>
            <Field label="Optional category"><Select value={line.categoryId ?? "NONE"} onValueChange={(value) => updateLine(line.id, { categoryId: value === "NONE" ? undefined : value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="NONE">No category</SelectItem>{categories.data.map((category) => <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>)}</SelectContent></Select></Field>
            <Field label="Unit price (BDT) *"><Input type="number" inputMode="numeric" min="1" step="1" value={line.unitPrice} onChange={(event) => updateLine(line.id, { unitPrice: event.target.value === "" ? "" : Number(event.target.value) })} /></Field>
            <Field label="Quantity *"><div className="flex items-center gap-2"><Button type="button" variant="outline" size="icon" onClick={() => updateLine(line.id, { quantity: Math.max(1, line.quantity - 1) })}><Minus className="h-4 w-4" /></Button><Input type="number" min="1" step="1" value={line.quantity} onChange={(event) => updateLine(line.id, { quantity: Math.max(1, Number.parseInt(event.target.value, 10) || 1) })} className="text-center" /><Button type="button" variant="outline" size="icon" onClick={() => updateLine(line.id, { quantity: line.quantity + 1 })}><Plus className="h-4 w-4" /></Button></div></Field>
            <Field label="Warranty note (optional)"><Input value={line.warrantyNote ?? ""} onChange={(event) => updateLine(line.id, { warrantyNote: event.target.value })} /></Field>
          </div><div className="mt-4 text-right text-sm text-slate-500">Line total <span className="ml-2 font-mono font-semibold text-[#070B28]">{formatBDT((Number(line.unitPrice) || 0) * line.quantity)}</span></div></Card>)}
          <Button variant="outline" onClick={() => setLines((current) => [...current, newLine()])}><Plus className="mr-2 h-4 w-4" />Add another item</Button>
        </div>

        <Card className="h-fit border-slate-200 p-5 shadow-xs xl:sticky xl:top-0"><h2 className="font-semibold text-[#070B28]">Customer & payment</h2><div className="mt-4 space-y-4"><Field label="Customer name (optional)"><Input value={customer.customerName} onChange={(event) => setCustomer((value) => ({ ...value, customerName: event.target.value }))} /></Field><Field label="Customer phone (optional)"><Input type="tel" value={customer.customerPhone} onChange={(event) => setCustomer((value) => ({ ...value, customerPhone: event.target.value }))} /></Field><Field label="Payment method"><Select value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PAYMENT_METHOD_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></Field></div><div className="my-5 flex items-center justify-between border-y border-slate-200 py-4"><span className="font-medium text-slate-600">Total</span><span className="font-mono text-xl font-bold text-[#0052FF]">{formatBDT(total)}</span></div><p className="mb-3 text-[11px] text-slate-500">Shift is optional; checkout will not be blocked when no active shift exists.</p><Button className="w-full bg-[#0052FF] text-white hover:bg-[#0047E0]" disabled={total <= 0} loading={createOrder.isPending} onClick={() => void submit()}><ReceiptText className="mr-2 h-4 w-4" />Complete mock sale</Button></Card>
      </div>

      <Dialog open={receipt !== null} onOpenChange={(open) => !open && setReceipt(null)}><DialogContent><DialogHeader><DialogTitle>Custom sale receipt</DialogTitle></DialogHeader>{receipt ? <div className="space-y-4 text-center"><p className="font-mono text-xs text-slate-500">#{receipt.invoiceNumber}</p><p className="font-mono text-2xl font-bold text-[#0052FF]">{formatBDT(receipt.total)}</p><p className="text-xs text-slate-500">Identifier generated by the mock service; the real server owns it in Phase 3.</p></div> : null}</DialogContent></Dialog>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="space-y-1.5"><label className="text-xs font-medium text-[#070B28]">{label}</label>{children}</div>; }
