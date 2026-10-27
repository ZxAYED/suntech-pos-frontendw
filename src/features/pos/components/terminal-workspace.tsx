"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Minus, Pause, Plus, Printer, Search, ShoppingBag, Store, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { DataState, TenantRequiredState } from "@/components/common/data-state";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useCatalogCheckout, useRegisterCatalog, type RegisterProduct } from "@/features/pos/api/use-pos";
import type { CartLine, ReceiptViewModel } from "@/features/pos/view-models";
import { useActiveShift } from "@/features/shifts/api/use-shifts";
import { useTenantScope, type RoleType } from "@/features/tenant/hooks/use-tenant-scope";
import { PAYMENT_METHOD_OPTIONS } from "@/lib/payment-methods";
import { cn, formatBDT } from "@/lib/utils";
import { ApiClientError } from "@/types/api";
import type { PaymentMethod } from "@/types/domain";

interface HeldTicket { id: string; label: string; lines: CartLine[]; createdAt: string }
export interface TerminalWorkspaceProps { role?: RoleType }

export function TerminalWorkspace({ role = "cashier" }: TerminalWorkspaceProps) {
  const tenant = useTenantScope(role);
  const catalog = useRegisterCatalog(tenant.tenantParams, tenant.isTenantReady);
  const activeShift = useActiveShift(tenant.isTenantReady);
  const checkout = useCatalogCheckout();
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("ALL");
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [cart, setCart] = useState<CartLine[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("COD");
  const [tendered, setTendered] = useState("");
  const [heldTickets, setHeldTickets] = useState<HeldTicket[]>([]);
  const [receipt, setReceipt] = useState<ReceiptViewModel | null>(null);
  const [outcomeUnknown, setOutcomeUnknown] = useState(false);
  const operationKeyRef = useRef<string | null>(null);

  const products = useMemo(() => {
    const term = search.trim().toLowerCase();
    return catalog.data.filter((product) =>
      (categoryId === "ALL" || product.categoryId === categoryId) &&
      (!term || product.name.toLowerCase().includes(term) || product.variants.some((variant) => variant.sku.toLowerCase().includes(term) || variant.variantName?.toLowerCase().includes(term))),
    );
  }, [catalog.data, categoryId, search]);
  const subtotal = cart.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
  const tenderedAmount = paymentMethod === "COD" ? Number(tendered) : subtotal;
  const changeDue = Number.isFinite(tenderedAmount) ? Math.max(0, tenderedAmount - subtotal) : 0;

  if (tenant.isAdmin && !tenant.isTenantReady) return <div className="p-6"><TenantRequiredState /></div>;

  const selectedVariant = (product: RegisterProduct) => product.variants.find((variant) => variant.variantId === selectedVariants[product.productId]) ?? product.variants[0];
  const markDraftChanged = () => { if (!outcomeUnknown) operationKeyRef.current = null; };
  const addItem = (product: RegisterProduct) => {
    if (outcomeUnknown) return;
    const item = selectedVariant(product);
    if (!item?.isActive || (item.stock ?? 0) <= 0) return;
    markDraftChanged();
    setCart((current) => {
      const existing = current.find((line) => line.variantId === item.variantId);
      if (existing) return current.map((line) => line.variantId === item.variantId ? { ...line, quantity: Math.min(line.quantity + 1, item.stock ?? 0) } : line);
      return [...current, { variantId: item.variantId, name: `${item.name}${item.variantName ? ` · ${item.variantName}` : ""}`, sku: item.sku, unitPrice: item.unitPrice, quantity: 1, stock: item.stock ?? 0 }];
    });
  };
  const updateQuantity = (variantId: string, quantity: number) => {
    if (outcomeUnknown) return;
    markDraftChanged();
    setCart((current) => quantity <= 0 ? current.filter((line) => line.variantId !== variantId) : current.map((line) => line.variantId === variantId ? { ...line, quantity: Math.min(quantity, line.stock) } : line));
  };
  const holdTicket = () => {
    if (!cart.length || outcomeUnknown) return;
    setHeldTickets((current) => [...current, { id: globalThis.crypto.randomUUID(), label: `Held ticket ${current.length + 1}`, lines: cart, createdAt: new Date().toISOString() }]);
    setCart([]); operationKeyRef.current = null; toast.success("Ticket held in this tab only.");
  };
  const completeSale = async () => {
    if (!cart.length) return;
    if (!Number.isInteger(tenderedAmount) || tenderedAmount < subtotal) {
      toast.error("Tendered amount must be a whole BDT value at least equal to the total.");
      return;
    }
    if (!outcomeUnknown) {
      const refreshed = await catalog.refetchVariants();
      if (!refreshed.data) { toast.error("Could not refresh price and stock. The ticket was preserved."); return; }
      const latest = new Map(refreshed.data.map((variant) => [variant.id, variant]));
      const changed = cart.some((line) => {
        const variant = latest.get(line.variantId);
        return !variant || !variant.isActive || variant.sellingPrice !== line.unitPrice || variant.stock < line.quantity;
      });
      if (changed) {
        setCart((current) => current.map((line) => {
          const variant = latest.get(line.variantId);
          return variant ? { ...line, unitPrice: variant.sellingPrice, stock: variant.stock, quantity: Math.min(line.quantity, Math.max(0, variant.stock)) } : line;
        }).filter((line) => line.quantity > 0));
        operationKeyRef.current = null;
        toast.error("Price, availability, or stock changed. Review the updated ticket before checkout.");
        return;
      }
    }
    operationKeyRef.current ??= globalThis.crypto.randomUUID();
    try {
      const order = await checkout.mutateAsync({
        ...tenant.tenantParams,
        shiftId: activeShift.data?.id,
        tenderedAmount,
        paymentMethod,
        lines: cart.map((line) => ({ variantId: line.variantId, quantity: line.quantity, unitPrice: line.unitPrice })),
        idempotencyKey: operationKeyRef.current,
      });
      const nextReceipt: ReceiptViewModel = {
        orderId: order.id, invoiceNumber: order.receiptNumber ?? order.invoiceNumber,
        items: order.lines.map((line) => ({ id: line.id, name: `${line.productName}${line.variantName ? ` · ${line.variantName}` : ""}`, quantity: line.quantity, unitPrice: line.unitPrice, subtotal: line.subtotal })),
        subtotal: order.subtotal, totalAmount: order.totalAmount, paymentMethod: order.paymentMethod,
        createdAt: order.occurredAt ?? order.createdAt, businessName: tenant.activeBusiness?.name, locationName: tenant.activeBranch?.name,
      };
      setReceipt(nextReceipt); setCart([]); setTendered(""); setOutcomeUnknown(false); operationKeyRef.current = null;
      toast.success("Catalog sale confirmed by the server.");
    } catch (error) {
      if (error instanceof ApiClientError && (error.status === 0 || error.status === 408 || error.status >= 500)) {
        setOutcomeUnknown(true);
        toast.error("The server result is unknown. Keep this ticket unchanged and retry with the same operation key.");
      } else {
        operationKeyRef.current = null;
        toast.error(error instanceof Error ? error.message : "Checkout failed. The ticket was preserved.");
      }
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-white lg:flex-row">
      <section className="flex min-h-0 flex-1 flex-col border-r border-slate-200">
        <PageHeader title={tenant.isAdmin ? "Catalog Register (Admin Desk)" : "Catalog Register"} className="border-none px-4 pb-2 pt-4" actions={tenant.isAdmin ? <Link href="/admin/select-business" className="hidden items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-[#070B28] hover:border-[#0052FF] sm:flex"><Store className="h-4 w-4 text-[#0052FF]" />{tenant.activeBranch?.name}<span className="text-[#0052FF]">Switch</span></Link> : undefined} />
        <div className="flex gap-3 border-b border-slate-200 px-4 pb-3"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search product, variant, or SKU" className="pl-9" /></div></div>
        <div className="flex gap-2 overflow-x-auto border-b border-slate-100 px-4 py-3">{[{ id: "ALL", name: "All" }, ...catalog.categories].map((category) => <button key={category.id} type="button" onClick={() => setCategoryId(category.id)} className={cn("min-h-9 whitespace-nowrap rounded-full border px-3 text-xs font-medium", categoryId === category.id ? "border-[#0052FF] bg-blue-50 text-[#0052FF]" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50")}>{category.name}</button>)}</div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4"><DataState data={products} isLoading={catalog.isLoading} isError={catalog.isError} resource="register catalog" emptyTitle="No products match these filters." onRetry={() => void catalog.refetch()}>{(data) => <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">{data.map((product) => {
          const item = selectedVariant(product);
          return <article key={product.productId} className="group overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-xs transition hover:-translate-y-0.5 hover:border-[#0052FF] hover:shadow-md"><div className="relative aspect-[4/3] bg-slate-100">{item.imageUrl ? <Image src={item.imageUrl} alt="" fill className="object-cover" sizes="(max-width: 768px) 50vw, 25vw" /> : <div className="flex h-full items-center justify-center"><ShoppingBag className="h-8 w-8 text-slate-300" /></div>}</div><div className="p-3"><p className="line-clamp-2 text-sm font-semibold text-[#070B28]">{product.name}</p>{product.variants.length > 1 ? <label className="mt-1 block"><span className="sr-only">Variant for {product.name}</span><select value={item.variantId} onChange={(event) => setSelectedVariants((current) => ({ ...current, [product.productId]: event.target.value }))} className="h-6 w-full truncate rounded border border-slate-200 bg-white px-1 text-[11px] text-slate-600 focus:border-[#0052FF] focus:outline-none"><option disabled value="">Choose variant</option>{product.variants.map((variant) => <option key={variant.variantId} value={variant.variantId}>{variant.variantName || variant.sku}</option>)}</select></label> : <p className="mt-1 h-6 truncate text-[11px] leading-6 text-slate-500">{item.variantName || item.sku}</p>}<div className="mt-2 flex items-center justify-between gap-1"><div><span className="font-mono text-sm font-bold text-[#0052FF]">{formatBDT(item.unitPrice)}</span><span className="ml-1 text-[10px] text-slate-400">Stock {item.stock ?? "—"}</span></div><Button size="icon" className="h-7 w-7" disabled={!item.isActive || (item.stock ?? 0) <= 0 || outcomeUnknown} onClick={() => addItem(product)} aria-label={`Add ${product.name}, ${item.variantName || item.sku}`}><Plus className="h-3.5 w-3.5" /></Button></div></div></article>;
        })}</div>}</DataState></div>
      </section>

      <aside className="flex max-h-[48vh] w-full flex-col bg-slate-50 lg:max-h-none lg:w-[390px]">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3"><div><h2 className="font-semibold text-[#070B28]">Current ticket</h2><p className="text-xs text-slate-500">{cart.reduce((sum, line) => sum + line.quantity, 0)} items</p></div><div className="flex gap-1"><Button size="icon" variant="ghost" onClick={holdTicket} disabled={!cart.length || outcomeUnknown} aria-label="Hold ticket"><Pause className="h-4 w-4" /></Button><Button size="icon" variant="ghost" onClick={() => { setCart([]); operationKeyRef.current = null; }} disabled={!cart.length || outcomeUnknown} aria-label="Clear cart"><Trash2 className="h-4 w-4" /></Button></div></div>
        {outcomeUnknown ? <p role="alert" className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800">Checkout result unknown. Ticket editing is locked; retry sends the same operation key.</p> : null}
        <div className="min-h-0 flex-1 overflow-y-auto p-3">{cart.length ? <div className="space-y-2">{cart.map((line) => <div key={line.variantId} className="rounded-lg border border-slate-200 bg-white p-3"><div className="flex items-start justify-between gap-2"><div><p className="text-sm font-medium text-[#070B28]">{line.name}</p><p className="font-mono text-[11px] text-slate-400">{line.sku}</p></div><button disabled={outcomeUnknown} onClick={() => updateQuantity(line.variantId, 0)} aria-label={`Remove ${line.name}`} className="text-slate-400 hover:text-rose-500 disabled:opacity-40"><X className="h-4 w-4" /></button></div><div className="mt-3 flex items-center justify-between"><div className="flex items-center gap-1"><Button size="icon" variant="outline" className="h-8 w-8" disabled={outcomeUnknown} onClick={() => updateQuantity(line.variantId, line.quantity - 1)}><Minus className="h-3 w-3" /></Button><span className="w-8 text-center font-mono text-sm">{line.quantity}</span><Button size="icon" variant="outline" className="h-8 w-8" disabled={outcomeUnknown || line.quantity >= line.stock} onClick={() => updateQuantity(line.variantId, line.quantity + 1)}><Plus className="h-3 w-3" /></Button></div><span className="font-mono text-sm font-semibold">{formatBDT(line.unitPrice * line.quantity)}</span></div></div>)}</div> : <div className="flex h-full min-h-36 flex-col items-center justify-center text-center text-slate-400"><ShoppingBag className="mb-2 h-8 w-8" /><p className="text-sm">Add a variant to begin.</p></div>}{heldTickets.length ? <div className="mt-4 border-t border-slate-200 pt-3"><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Held in this tab</p>{heldTickets.map((ticket) => <button key={ticket.id} disabled={outcomeUnknown} onClick={() => { setCart(ticket.lines); setHeldTickets((current) => current.filter((item) => item.id !== ticket.id)); operationKeyRef.current = null; }} className="mb-2 flex w-full justify-between rounded-md border border-dashed border-slate-300 bg-white px-3 py-2 text-xs disabled:opacity-50"><span>{ticket.label}</span><span>{ticket.lines.length} lines</span></button>)}</div> : null}</div>
        <div className="border-t border-slate-200 bg-white p-4"><div className="mb-3 flex justify-between"><span className="text-sm text-slate-500">Subtotal</span><strong className="font-mono text-lg text-[#070B28]">{formatBDT(subtotal)}</strong></div><div className="mb-3 grid grid-cols-2 gap-2">{PAYMENT_METHOD_OPTIONS.map((option) => <button key={option.value} type="button" disabled={outcomeUnknown} onClick={() => { setPaymentMethod(option.value); markDraftChanged(); }} className={cn("min-h-10 rounded-md border px-2 text-xs font-medium", paymentMethod === option.value ? "border-[#0052FF] bg-blue-50 text-[#0052FF]" : "border-slate-200 text-slate-600")}>{option.label}</button>)}</div>{paymentMethod === "COD" ? <div className="mb-3"><label htmlFor="catalog-tendered" className="text-xs font-medium">Tendered amount (BDT)</label><Input id="catalog-tendered" type="number" min="0" step="1" disabled={outcomeUnknown} value={tendered} onChange={(event) => { setTendered(event.target.value); markDraftChanged(); }} /><p className="mt-1 text-xs text-slate-500">Change due: {formatBDT(changeDue)}</p></div> : null}<p className="mb-3 text-[11px] text-slate-500">{activeShift.data ? `Linked to active shift opened ${new Date(activeShift.data.openedAt).toLocaleTimeString("en-BD")}.` : "No active shift; checkout remains available."}</p><Button className="w-full bg-[#0052FF] text-white hover:bg-[#0047E0]" disabled={!cart.length || !Number.isInteger(tenderedAmount) || tenderedAmount < subtotal} loading={checkout.isPending} onClick={() => void completeSale()}>{outcomeUnknown ? "Retry same checkout" : `Complete sale · ${formatBDT(subtotal)}`}</Button></div>
      </aside>

      <Dialog open={receipt !== null} onOpenChange={(open) => !open && setReceipt(null)}><DialogContent><DialogHeader><DialogTitle>Receipt</DialogTitle></DialogHeader>{receipt ? <div className="space-y-3"><div className="text-center"><p className="font-bold text-[#070B28]">{receipt.businessName || "SunTech POS"}</p><p className="text-xs text-slate-500">{receipt.locationName || "Assigned branch"}</p><p className="mt-1 font-mono text-xs">#{receipt.invoiceNumber}</p></div>{receipt.items.map((line) => <div key={line.id} className="flex justify-between text-sm"><span>{line.name} × {line.quantity}</span><span className="font-mono">{formatBDT(line.subtotal)}</span></div>)}<div className="flex justify-between border-t pt-3 font-bold"><span>Total</span><span>{formatBDT(receipt.totalAmount)}</span></div><Button variant="outline" className="w-full" disabled title="Printing integration is not yet available"><Printer className="mr-2 h-4 w-4" />Print unavailable</Button></div> : null}</DialogContent></Dialog>
    </div>
  );
}
