"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Minus, Pause, Plus, Printer, Search, ShoppingBag, Store, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { DataState, TenantRequiredState } from "@/components/common/data-state";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useMockCheckout, useMockRegisterCatalog } from "@/features/pos/api/use-pos";
import type { CartLine, ReceiptViewModel } from "@/features/pos/view-models";
import { useTenantScope, type RoleType } from "@/features/tenant/hooks/use-tenant-scope";
import { PAYMENT_METHOD_OPTIONS } from "@/lib/payment-methods";
import { cn, formatBDT } from "@/lib/utils";
import type { PaymentMethod } from "@/types/domain";

interface HeldTicket { id: string; label: string; lines: CartLine[]; createdAt: string; }
export interface TerminalWorkspaceProps { role?: RoleType; }

export function TerminalWorkspace({ role = "cashier" }: TerminalWorkspaceProps) {
  const tenant = useTenantScope(role);
  const catalog = useMockRegisterCatalog();
  const checkout = useMockCheckout();
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("ALL");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("COD");
  const [heldTickets, setHeldTickets] = useState<HeldTicket[]>([]);
  const [receipt, setReceipt] = useState<ReceiptViewModel | null>(null);

  const items = useMemo(() => {
    const term = search.trim().toLowerCase();
    return catalog.data.filter((item) =>
      (categoryId === "ALL" || item.categoryId === categoryId) &&
      (!term || item.name.toLowerCase().includes(term) || item.sku.toLowerCase().includes(term)),
    );
  }, [catalog.data, categoryId, search]);
  const subtotal = cart.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);

  if (tenant.isAdmin && !tenant.isTenantReady) return <div className="p-6"><TenantRequiredState /></div>;

  const addItem = (item: (typeof catalog.data)[number]) => {
    if (!item.isActive || item.stock === 0) return;
    setCart((current) => {
      const existing = current.find((line) => line.variantId === item.variantId);
      if (existing) return current.map((line) => line.variantId === item.variantId ? { ...line, quantity: Math.min(line.quantity + 1, item.stock ?? Number.MAX_SAFE_INTEGER) } : line);
      return [...current, { variantId: item.variantId, name: `${item.name}${item.variantName ? ` · ${item.variantName}` : ""}`, sku: item.sku, unitPrice: item.unitPrice, quantity: 1 }];
    });
  };
  const updateQuantity = (variantId: string, quantity: number) => setCart((current) => quantity <= 0 ? current.filter((line) => line.variantId !== variantId) : current.map((line) => line.variantId === variantId ? { ...line, quantity } : line));
  const holdTicket = () => {
    if (!cart.length) return;
    setHeldTickets((current) => [...current, { id: `held-${Date.now()}`, label: `Held ticket ${current.length + 1}`, lines: cart, createdAt: new Date().toISOString() }]);
    setCart([]); toast.success("Ticket held in local frontend state.");
  };
  const completeSale = async () => {
    if (!cart.length) return;
    const next = await checkout.mutateAsync({ items: cart.map((line) => ({ id: line.variantId, name: line.name, quantity: line.quantity, unitPrice: line.unitPrice, subtotal: line.unitPrice * line.quantity })), subtotal, totalAmount: subtotal, paymentMethod, businessName: tenant.activeBusiness?.name, locationName: tenant.activeBranch?.name });
    setReceipt(next); setCart([]); toast.success("Mock checkout completed.");
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-white lg:flex-row">
      <section className="flex min-h-0 flex-1 flex-col border-r border-slate-200">
        <PageHeader title={tenant.isAdmin ? "Catalog Register (Admin Desk)" : "Catalog Register"} className="border-none px-4 pb-2 pt-4" actions={tenant.isAdmin ? <Link href="/admin/select-business" className="hidden items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-[#070B28] hover:border-[#0052FF] sm:flex"><Store className="h-4 w-4 text-[#0052FF]" />{tenant.activeBranch?.name}<span className="text-[#0052FF]">Switch</span></Link> : undefined} />
        <div className="flex gap-3 border-b border-slate-200 px-4 pb-3"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name or SKU" className="pl-9" /></div></div>
        <div className="flex gap-2 overflow-x-auto border-b border-slate-100 px-4 py-3">{[{ id: "ALL", name: "All" }, ...catalog.categories].map((category) => <button key={category.id} type="button" onClick={() => setCategoryId(category.id)} className={cn("min-h-9 whitespace-nowrap rounded-full border px-3 text-xs font-medium", categoryId === category.id ? "border-[#0052FF] bg-blue-50 text-[#0052FF]" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50")}>{category.name}</button>)}</div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <DataState data={items} isLoading={catalog.isLoading} isError={catalog.isError} resource="register catalog" emptyTitle="No products match these filters." onRetry={() => void catalog.refetch()}>
            {(data) => <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">{data.map((item) => <button key={item.variantId} type="button" onClick={() => addItem(item)} disabled={!item.isActive || item.stock === 0} className="group overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-xs transition hover:-translate-y-0.5 hover:border-[#0052FF] hover:shadow-md disabled:opacity-50"><div className="relative aspect-[4/3] bg-slate-100">{item.imageUrl ? <Image src={item.imageUrl} alt="" fill className="object-cover" sizes="(max-width: 768px) 50vw, 25vw" /> : <div className="flex h-full items-center justify-center"><ShoppingBag className="h-8 w-8 text-slate-300" /></div>}</div><div className="p-3"><p className="line-clamp-2 text-sm font-semibold text-[#070B28]">{item.name}</p><p className="mt-1 text-[11px] text-slate-500">{item.variantName || item.sku}</p><div className="mt-2 flex items-end justify-between gap-2"><span className="font-mono text-sm font-bold text-[#0052FF]">{formatBDT(item.unitPrice)}</span><span className="text-[10px] text-slate-400">Stock {item.stock ?? "—"}</span></div></div></button>)}</div>}
          </DataState>
        </div>
      </section>

      <aside className="flex max-h-[48vh] w-full flex-col bg-slate-50 lg:max-h-none lg:w-[390px]">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3"><div><h2 className="font-semibold text-[#070B28]">Current ticket</h2><p className="text-xs text-slate-500">{cart.reduce((sum, line) => sum + line.quantity, 0)} items</p></div><div className="flex gap-1"><Button size="icon" variant="ghost" onClick={holdTicket} disabled={!cart.length} aria-label="Hold ticket"><Pause className="h-4 w-4" /></Button><Button size="icon" variant="ghost" onClick={() => setCart([])} disabled={!cart.length} aria-label="Clear cart"><Trash2 className="h-4 w-4" /></Button></div></div>
        <div className="min-h-0 flex-1 overflow-y-auto p-3">{cart.length ? <div className="space-y-2">{cart.map((line) => <div key={line.variantId} className="rounded-lg border border-slate-200 bg-white p-3"><div className="flex items-start justify-between gap-2"><div><p className="text-sm font-medium text-[#070B28]">{line.name}</p><p className="font-mono text-[11px] text-slate-400">{line.sku}</p></div><button onClick={() => updateQuantity(line.variantId, 0)} aria-label={`Remove ${line.name}`} className="text-slate-400 hover:text-rose-500"><X className="h-4 w-4" /></button></div><div className="mt-3 flex items-center justify-between"><div className="flex items-center gap-1"><Button size="icon" variant="outline" className="h-8 w-8" onClick={() => updateQuantity(line.variantId, line.quantity - 1)}><Minus className="h-3 w-3" /></Button><span className="w-8 text-center font-mono text-sm">{line.quantity}</span><Button size="icon" variant="outline" className="h-8 w-8" onClick={() => updateQuantity(line.variantId, line.quantity + 1)}><Plus className="h-3 w-3" /></Button></div><span className="font-mono text-sm font-semibold">{formatBDT(line.unitPrice * line.quantity)}</span></div></div>)}</div> : <div className="flex h-full min-h-36 flex-col items-center justify-center text-center text-slate-400"><ShoppingBag className="mb-2 h-8 w-8" /><p className="text-sm">Add a variant to begin.</p></div>}
          {heldTickets.length ? <div className="mt-4 border-t border-slate-200 pt-3"><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Held locally</p>{heldTickets.map((ticket) => <button key={ticket.id} onClick={() => { setCart(ticket.lines); setHeldTickets((current) => current.filter((item) => item.id !== ticket.id)); }} className="mb-2 flex w-full justify-between rounded-md border border-dashed border-slate-300 bg-white px-3 py-2 text-xs"><span>{ticket.label}</span><span>{ticket.lines.length} lines</span></button>)}</div> : null}
        </div>
        <div className="border-t border-slate-200 bg-white p-4"><div className="mb-3 flex justify-between"><span className="text-sm text-slate-500">Subtotal</span><strong className="font-mono text-lg text-[#070B28]">{formatBDT(subtotal)}</strong></div><div className="mb-3 grid grid-cols-2 gap-2">{PAYMENT_METHOD_OPTIONS.map((option) => <button key={option.value} type="button" onClick={() => setPaymentMethod(option.value)} className={cn("min-h-10 rounded-md border px-2 text-xs font-medium", paymentMethod === option.value ? "border-[#0052FF] bg-blue-50 text-[#0052FF]" : "border-slate-200 text-slate-600")}>{option.label}</button>)}</div><p className="mb-3 text-[11px] text-slate-500">Checkout can proceed without an active shift; the later API payload will omit shiftId.</p><Button className="w-full bg-[#0052FF] text-white hover:bg-[#0047E0]" disabled={!cart.length} loading={checkout.isPending} onClick={() => void completeSale()}>Complete sale · {formatBDT(subtotal)}</Button></div>
      </aside>

      <Dialog open={receipt !== null} onOpenChange={(open) => !open && setReceipt(null)}><DialogContent><DialogHeader><DialogTitle>Receipt</DialogTitle></DialogHeader>{receipt ? <div className="space-y-3"><div className="text-center"><p className="font-bold text-[#070B28]">{receipt.businessName || "SunTech POS"}</p><p className="text-xs text-slate-500">{receipt.locationName || "Assigned branch"}</p><p className="mt-1 font-mono text-xs">#{receipt.invoiceNumber}</p></div>{receipt.items.map((line) => <div key={line.id} className="flex justify-between text-sm"><span>{line.name} × {line.quantity}</span><span className="font-mono">{formatBDT(line.subtotal)}</span></div>)}<div className="flex justify-between border-t pt-3 font-bold"><span>Total</span><span>{formatBDT(receipt.totalAmount)}</span></div><Button variant="outline" className="w-full"><Printer className="mr-2 h-4 w-4" />Print placeholder</Button></div> : null}</DialogContent></Dialog>
    </div>
  );
}
