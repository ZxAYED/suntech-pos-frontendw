"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import {
  Banknote,
  Building2,
  CheckCircle2,
  CreditCard,
  Minus,
  PauseCircle,
  Plus,
  Printer,
  Search,
  ShoppingBag,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { demoProducts, type DemoProduct } from "@/demo/products";
import { cn } from "@/lib/utils";

interface CartLine {
  sku: string;
  name: string;
  price: number;
  qty: number;
  image?: string;
}

interface HeldTicket {
  id: string;
  ticketNumber: string;
  timestamp: string;
  items: CartLine[];
  subtotal: number;
}

const categories = ["All", "Smartphones", "Chargers", "Earbuds", "Cables", "Accessories"] as const;
const fmt = (n: number) => n.toLocaleString("en-US");

export function TerminalWorkspace() {
  // Catalog Register State
  const [catalogCategory, setCatalogCategory] = useState<string>("All");
  const [catalogSearch, setCatalogSearch] = useState("");
  const [ticketNumber, setTicketNumber] = useState("TCK-9904");
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "BKASH" | "NAGAD" | "BANK">("COD");

  const [cart, setCart] = useState<CartLine[]>([
    { sku: "INF-CHG-45W", name: "Infinix 45W Fast Charger Kit (Type-C)", price: 1450, qty: 1, image: "/images/asset-2.jpg" },
    { sku: "CBL-TC-1M", name: "Type-C Braided Nylon Cable 1m", price: 350, qty: 2, image: "/images/asset-2.jpg" },
    { sku: "RLM-T110-WHT", name: "Realme Buds T110 ANC Earbuds", price: 1850, qty: 1, image: "/images/asset-2.jpg" },
    { sku: "RMX-OTG-U3", name: "Remax OTG Adapter Type-C to USB 3.0", price: 180, qty: 1, image: "/images/asset-2.jpg" },
    { sku: "RDM-NT13-6G", name: "Xiaomi Redmi Note 13 (6GB/128GB)", price: 19499, qty: 1, image: "/images/asset-2.jpg" },
    { sku: "ANK-R50i-BLK", name: "Anker Soundcore R50i True Wireless", price: 2150, qty: 1, image: "/images/asset-2.jpg" },
    { sku: "SM-A156B-DS", name: "Samsung Galaxy A15 5G (8GB/128GB)", price: 22999, qty: 3, image: "/images/asset-2.jpg" },
    { sku: "APL-20W-ORIG", name: "Apple 20W USB-C Power Adapter (Original)", price: 2800, qty: 2, image: "/images/asset-2.jpg" },
    { sku: "BAS-CL-2M-RED", name: "Baseus Cafule Lightning to Type-C 2m", price: 650, qty: 1, image: "/images/asset-2.jpg" },
    { sku: "JYR-10K-PB", name: "Joyroom 10000mAh Power Bank 22.5W", price: 1650, qty: 1, image: "/images/asset-2.jpg" },
  ]);

  // Parked / On-Hold Tickets feature
  const [heldTickets, setHeldTickets] = useState<HeldTicket[]>([]);

  // Receipt Modal State
  const [completedReceipt, setCompletedReceipt] = useState<{
    invoiceNo: string;
    items: { name: string; qty: number; price: number }[];
    subtotal: number;
    total: number;
    method: string;
  } | null>(null);

  // Computations
  const q = catalogSearch.toLowerCase().trim();
  const filteredProducts = demoProducts.filter(
    (p) =>
      (catalogCategory === "All" || p.category === catalogCategory) &&
      (!q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)),
  );

  const subtotal = cart.reduce((a, l) => a + l.price * l.qty, 0);
  const total = subtotal;
  const units = cart.reduce((a, l) => a + l.qty, 0);

  const addToCart = (p: DemoProduct) => {
    setCart((prev) =>
      prev.some((l) => l.sku === p.sku)
        ? prev.map((l) => (l.sku === p.sku ? { ...l, qty: l.qty + 1 } : l))
        : [...prev, { sku: p.sku, name: p.name, price: p.price, qty: 1, image: p.image }],
    );
    toast.success(`Added ${p.name} to ticket`, { duration: 1200 });
  };

  const bumpCartQty = (sku: string, d: number) =>
    setCart((prev) =>
      prev.flatMap((l) => (l.sku !== sku ? [l] : l.qty + d > 0 ? [{ ...l, qty: l.qty + d }] : [])),
    );

  const handleClearCart = () => {
    if (cart.length === 0) return;
    setCart([]);
    toast.info("Cart cleared");
  };

  const handleParkTicket = () => {
    if (cart.length === 0) {
      toast.error("Cart is empty. Nothing to park.");
      return;
    }
    const newHold: HeldTicket = {
      id: `hold-${Date.now()}`,
      ticketNumber,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      items: [...cart],
      subtotal,
    };
    setHeldTickets((prev) => [newHold, ...prev]);
    setCart([]);
    const nextTicket = `TCK-${Math.floor(1000 + Math.random() * 9000)}`;
    setTicketNumber(nextTicket);
    toast.success(`Ticket #${newHold.ticketNumber} parked. Started new ticket #${nextTicket}`);
  };

  const handleResumeTicket = (held: HeldTicket) => {
    setCart(held.items);
    setTicketNumber(held.ticketNumber);
    setHeldTickets((prev) => prev.filter((t) => t.id !== held.id));
    toast.success(`Restored ticket #${held.ticketNumber}`);
  };

  const handleChargeCatalog = () => {
    if (cart.length === 0) return;

    const methodName =
      paymentMethod === "COD"
        ? "Cash (COD)"
        : paymentMethod === "BKASH"
        ? "bKash"
        : paymentMethod === "NAGAD"
        ? "Nagad"
        : "Bank / Card";

    const currentReceipt = {
      invoiceNo: ticketNumber,
      items: cart.map((c) => ({ name: c.name, qty: c.qty, price: c.price * c.qty })),
      subtotal,
      total,
      method: methodName,
    };

    setCompletedReceipt(currentReceipt);
    toast.success(`Sale #${ticketNumber} settled via ${methodName}!`);

    // Reset for next sale
    setCart([]);
    setTicketNumber(`TCK-${Math.floor(1000 + Math.random() * 9000)}`);
  };

  return (
    <div className="flex flex-1 flex-col md:flex-row h-full min-h-0 w-full overflow-hidden bg-white select-none">
      {/* ======================================================== */}
      {/* 62%: CATALOG MASTER PANEL                                */}
      {/* ======================================================== */}
      <section className="flex flex-col h-full min-h-0 w-full md:w-[58%] lg:w-[62%] border-b md:border-b-0 md:border-r border-slate-200 overflow-hidden bg-slate-50/40">
        {/* Global Standard PageHeader */}
        <PageHeader title="Catalog Register" className="px-5 pt-5 border-none pb-2" />

        {/* Search bar */}
        <div className="flex min-h-14 h-14 items-center gap-3 border-b border-slate-200 px-5 shrink-0 bg-white">
          <Search className="h-5 w-5 shrink-0 text-slate-400" />
          <input
            value={catalogSearch}
            onChange={(e) => setCatalogSearch(e.target.value)}
            placeholder="Search catalog by name, model, SKU..."
            className="h-full flex-1 bg-transparent text-sm sm:text-base font-medium text-[#070B28] outline-none placeholder:text-slate-400"
          />
          <span className="text-xs font-medium uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-1 rounded hidden sm:inline">
            {filteredProducts.length} Items
          </span>
          {catalogSearch && (
            <button
              type="button"
              onClick={() => setCatalogSearch("")}
              className="text-xs text-slate-400 hover:text-slate-700 px-2 py-1 cursor-pointer font-medium"
            >
              Clear
            </button>
          )}
        </div>

        {/* Category Filter Chips */}
        <div className="flex min-h-12 h-12 items-center gap-1.5 border-b border-slate-200 px-5 overflow-x-auto shrink-0 bg-white">
          {categories.map((c) => {
            const count =
              c === "All"
                ? demoProducts.length
                : demoProducts.filter((p) => p.category === c).length;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setCatalogCategory(c)}
                className={cn(
                  "relative h-full shrink-0 cursor-pointer px-3.5 text-xs sm:text-sm font-medium transition-colors border-0 outline-none flex items-center gap-1.5",
                  catalogCategory === c ? "text-[#0052FF]" : "text-slate-500 hover:text-[#070B28]",
                )}
              >
                <span>{c}</span>
                <span
                  className={cn(
                    "text-[11px] font-mono font-medium px-1.5 py-0.5 rounded-full",
                    catalogCategory === c
                      ? "bg-blue-100 text-[#0052FF]"
                      : "bg-slate-100 text-slate-500",
                  )}
                >
                  {count}
                </span>
                {catalogCategory === c && (
                  <motion.span
                    layoutId="terminalCategoryIndicator"
                    transition={{ type: "spring", stiffness: 500, damping: 36 }}
                    className="absolute inset-x-2 bottom-0 h-0.5 bg-[#0052FF]"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Product Grid */}
        <div className="grid flex-1 min-h-0 auto-rows-min grid-cols-2 gap-px overflow-y-auto bg-slate-200 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 p-px">
          {filteredProducts.map((p) => (
            <motion.button
              key={p.id}
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={() => addToCart(p)}
              className="group flex cursor-pointer flex-col bg-white p-3.5 text-left transition-all hover:bg-slate-50/90 border-0 outline-none"
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                <Image
                  src={p.image}
                  alt={p.name}
                  fill
                  sizes="(max-width: 1280px) 30vw, 15vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute top-1.5 right-1.5">
                  <span
                    className={cn(
                      "font-mono text-[11px] font-bold px-1.5 py-0.5 rounded shadow-2xs",
                      p.stock <= p.minStock
                        ? "bg-amber-500 text-white"
                        : "bg-white/90 text-slate-700 backdrop-blur-xs",
                    )}
                  >
                    {p.stock}
                  </span>
                </div>
              </div>
              <p className="mt-2.5 line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-snug text-[#070B28]">
                {p.name}
              </p>
              <div className="mt-1 flex items-baseline justify-between text-xs text-slate-500">
                <span className="font-mono tabular-nums font-medium">{p.sku}</span>
                <span className="text-slate-400">{p.category}</span>
              </div>
              <div className="mt-1.5 flex items-baseline justify-between">
                <span className="font-mono text-base sm:text-lg font-medium tabular-nums text-[#0052FF]">
                  {fmt(p.price)} <span className="text-xs text-slate-500 font-normal">BDT</span>
                </span>
                <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded group-hover:bg-[#0052FF] group-hover:text-white transition-colors">
                  + Add
                </span>
              </div>
            </motion.button>
          ))}
        </div>
      </section>

      {/* ======================================================== */}
      {/* 38%: ACTIVE CART SIDEBAR                                 */}
      {/* ======================================================== */}
      <aside className="flex flex-col h-full min-h-0 w-full md:w-[42%] lg:w-[38%] overflow-hidden bg-white shadow-lg">
        {/* Cart Header (Law of Proximity: Park, Resume, and Clear Actions) */}
        <div className="flex min-h-14 h-14 items-center justify-between border-b border-slate-200 px-5 bg-white shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-[#0052FF]" />
            <h2 className="text-base font-bold text-[#070B28]">Active Ticket</h2>
            <span className="font-mono text-xs font-medium tabular-nums text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
              #{ticketNumber}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {heldTickets.length > 0 && (
              <button
                type="button"
                onClick={() => handleResumeTicket(heldTickets[0])}
                className="flex items-center gap-1 text-xs text-[#0052FF] hover:text-[#0047E0] bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded cursor-pointer transition-colors font-medium"
                title={`Resume held ticket (${heldTickets.length} held)`}
              >
                <PauseCircle className="h-3.5 w-3.5 text-[#0052FF]" />
                <span>Resume ({heldTickets.length})</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleParkTicket}
              disabled={cart.length === 0}
              className="flex items-center gap-1 text-xs text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-medium"
              title="Park ticket for later"
            >
              <PauseCircle className="h-3.5 w-3.5" />
              <span>Park</span>
            </button>
            <button
              type="button"
              onClick={handleClearCart}
              disabled={cart.length === 0}
              className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-2.5 py-1 rounded cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-medium"
              title="Clear all cart items"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear</span>
            </button>
          </div>
        </div>

        {/* Scrollable Cart Items List */}
        <div className="flex-1 min-h-0 overflow-y-auto bg-white">
          {cart.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center">
              <ShoppingBag className="h-12 w-12 text-slate-300" strokeWidth={1.25} />
              <p className="mt-3 text-base font-medium text-[#070B28]">Ticket is empty</p>
              <p className="mt-1 text-xs text-slate-500">
                Tap items on the catalog grid to ring up items.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 bg-white">
              <AnimatePresence initial={false}>
                {cart.map((l) => (
                  <motion.li
                    key={l.sku}
                    layout
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50/70 transition-colors"
                  >
                    {/* Stepper */}
                    <div className="flex items-center rounded-md border border-slate-200 bg-slate-50">
                      <button
                        type="button"
                        onClick={() => bumpCartQty(l.sku, -1)}
                        className="flex h-8 w-8 cursor-pointer items-center justify-center text-slate-600 hover:text-[#070B28] hover:bg-slate-200 rounded-l transition-colors border-0 outline-none"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-7 text-center font-mono text-sm font-medium tabular-nums text-[#070B28]">
                        {l.qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => bumpCartQty(l.sku, 1)}
                        className="flex h-8 w-8 cursor-pointer items-center justify-center text-slate-600 hover:text-[#070B28] hover:bg-slate-200 rounded-r transition-colors border-0 outline-none"
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Item Details */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[#070B28]">{l.name}</p>
                      <p className="font-mono text-xs tabular-nums text-slate-500 mt-0.5">
                        {l.sku} · {fmt(l.price)} BDT
                      </p>
                    </div>

                    {/* Total Price */}
                    <span className="font-mono text-sm sm:text-base font-medium tabular-nums text-[#070B28] shrink-0">
                      {fmt(l.price * l.qty)} BDT
                    </span>

                    {/* Delete item */}
                    <button
                      type="button"
                      onClick={() => bumpCartQty(l.sku, -l.qty)}
                      className="flex h-7 w-7 cursor-pointer items-center justify-center rounded text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors border-0 outline-none"
                      aria-label="Remove item"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </div>

        {/* Pinned Bottom Summary & Clean Payment Selector */}
        <div className="border-t border-slate-200 p-4 bg-white shrink-0 mt-auto shadow-xs space-y-3">
          {/* Payment Method Selector Tabs */}
          <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setPaymentMethod("COD")}
              className={cn(
                "flex items-center justify-center gap-1 py-2 rounded-md text-xs font-medium transition-all cursor-pointer border-0 outline-none",
                paymentMethod === "COD"
                  ? "bg-white text-[#0052FF] shadow-xs"
                  : "text-slate-600 hover:text-[#070B28]",
              )}
            >
              <Banknote className="h-3.5 w-3.5" />
              <span>Cash</span>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod("BKASH")}
              className={cn(
                "flex items-center justify-center gap-1 py-2 rounded-md text-xs font-medium transition-all cursor-pointer border-0 outline-none",
                paymentMethod === "BKASH"
                  ? "bg-white text-[#0052FF] shadow-xs"
                  : "text-slate-600 hover:text-[#070B28]",
              )}
            >
              <Wallet className="h-3.5 w-3.5" />
              <span>bKash</span>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod("NAGAD")}
              className={cn(
                "flex items-center justify-center gap-1 py-2 rounded-md text-xs font-medium transition-all cursor-pointer border-0 outline-none",
                paymentMethod === "NAGAD"
                  ? "bg-white text-[#0052FF] shadow-xs"
                  : "text-slate-600 hover:text-[#070B28]",
              )}
            >
              <CreditCard className="h-3.5 w-3.5" />
              <span>Nagad</span>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod("BANK")}
              className={cn(
                "flex items-center justify-center gap-1 py-2 rounded-md text-xs font-medium transition-all cursor-pointer border-0 outline-none",
                paymentMethod === "BANK"
                  ? "bg-white text-[#0052FF] shadow-xs"
                  : "text-slate-600 hover:text-[#070B28]",
              )}
            >
              <Building2 className="h-3.5 w-3.5" />
              <span>Bank</span>
            </button>
          </div>

          {/* Financial Breakdown */}
          <dl className="space-y-1 font-mono text-sm tabular-nums">
            <div className="flex justify-between items-center">
              <dt className="font-sans text-slate-500 text-xs sm:text-sm">
                Subtotal ({units} units)
              </dt>
              <dd className="font-medium text-[#070B28]">{fmt(subtotal)} BDT</dd>
            </div>
          </dl>

          {/* Total Due */}
          <div className="flex items-baseline justify-between border-t border-slate-100 pt-2">
            <span className="text-xs sm:text-sm font-medium uppercase tracking-wider text-[#070B28]">
              Total Due
            </span>
            <span className="font-mono text-2xl sm:text-3xl font-bold tabular-nums text-[#0052FF]">
              {fmt(total)} <span className="text-xs font-normal text-slate-500">BDT</span>
            </span>
          </div>

          {/* Primary Charge CTA */}
          <motion.button
            type="button"
            disabled={cart.length === 0}
            whileHover={cart.length ? { scale: 1.01 } : undefined}
            whileTap={cart.length ? { scale: 0.98 } : undefined}
            onClick={handleChargeCatalog}
            className="min-h-12 h-12 w-full cursor-pointer rounded-lg bg-[#0052FF] text-base font-medium text-white shadow-xs transition-colors hover:bg-[#0047E0] disabled:cursor-not-allowed disabled:opacity-40 border-0 outline-none ring-0 flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="h-5 w-5" />
            <span>
              Complete {paymentMethod === "COD" ? "Cash Sale" : paymentMethod} · {fmt(total)} BDT
            </span>
          </motion.button>
        </div>
      </aside>

      {/* ======================================================== */}
      {/* THERMAL RECEIPT SLIP MODAL                               */}
      {/* ======================================================== */}
      <AnimatePresence>
        {completedReceipt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCompletedReceipt(null)}
              className="fixed inset-0 bg-[#070B28]/60 backdrop-blur-xs cursor-pointer"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 12 }}
              className="relative z-10 w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl space-y-3"
            >
              <div className="text-center border-b border-dashed border-slate-300 pb-3">
                <div className="mx-auto mb-1.5 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-[#070B28]">SunTech POS</h3>
                <p className="text-xs text-slate-500 font-mono">Invoice #{completedReceipt.invoiceNo}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Terminal 01 · {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1.5 py-1 text-xs">
                {completedReceipt.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between items-start">
                    <div className="min-w-0 pr-2">
                      <p className="font-medium text-[#070B28] truncate">{it.name}</p>
                      <p className="text-[11px] text-slate-400 font-mono">Qty: {it.qty}</p>
                    </div>
                    <span className="font-mono font-medium text-[#070B28] tabular-nums shrink-0">
                      {fmt(it.price)} BDT
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-slate-300 pt-2 space-y-1 text-xs font-mono tabular-nums">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span>{fmt(completedReceipt.subtotal)} BDT</span>
                </div>
                <div className="flex justify-between text-sm font-medium text-[#070B28] border-t border-slate-200 pt-1">
                  <span>Total Paid ({completedReceipt.method}):</span>
                  <span className="text-[#0052FF] font-medium">{fmt(completedReceipt.total)} BDT</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    toast.success(`Printing ticket #${completedReceipt.invoiceNo} on POS printer...`);
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 min-h-10 h-10 bg-slate-100 hover:bg-slate-200 text-[#070B28] rounded-lg font-medium text-xs transition-colors cursor-pointer border-0 outline-none"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print Slip</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCompletedReceipt(null)}
                  className="flex-1 min-h-10 h-10 bg-[#0052FF] hover:bg-[#0047E0] text-white rounded-lg font-medium text-xs transition-colors cursor-pointer border-0 outline-none"
                >
                  New Sale
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
