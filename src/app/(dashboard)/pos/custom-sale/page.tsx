"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Banknote,
  Building2,
  CheckCircle2,
  CreditCard,
  Minus,
  Plus,
  Printer,
  RotateCcw,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const fmt = (n: number) => n.toLocaleString("en-US");

interface CustomSaleItem {
  id: string;
  itemName: string;
  category: string;
  unitPrice: string;
  quantity: number;
  warrantyNote: string;
}

export default function CustomSalePage() {
  const createEmptyItem = (customId?: string): CustomSaleItem => ({
    id: customId || `item-${Math.random().toString(36).substring(2, 9)}`,
    itemName: "",
    category: "Accessories",
    unitPrice: "",
    quantity: 1,
    warrantyNote: "",
  });

  // Multiple Items State
  const [items, setItems] = useState<CustomSaleItem[]>([
    {
      id: "item-init-1",
      itemName: "",
      category: "Accessories",
      unitPrice: "",
      quantity: 1,
      warrantyNote: "",
    },
  ]);

  // Customer Details (Optional)
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerName, setCustomerName] = useState("");

  // Payment Method Selection
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "BKASH" | "NAGAD" | "BANK">("COD");

  // Receipt Modal State
  const [completedReceipt, setCompletedReceipt] = useState<{
    invoiceNo: string;
    items: { name: string; qty: number; unitPrice: number; lineTotal: number; warranty: string }[];
    total: number;
    customer: string;
    phone: string;
    method: string;
  } | null>(null);

  // Computations (Strictly NO VAT)
  const totalUnits = items.reduce((sum, item) => sum + item.quantity, 0);
  const total = items.reduce((sum, item) => {
    const price = parseFloat(item.unitPrice) || 0;
    return sum + price * item.quantity;
  }, 0);

  const handleAddItem = () => {
    setItems((prev) => [...prev, createEmptyItem()]);
    toast.success("Added new item section. Enter details below.");
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) {
      toast.error("You must have at least one item on this sale.");
      return;
    }
    setItems((prev) => prev.filter((item) => item.id !== id));
    toast.info("Removed custom item.");
  };

  const handleUpdateItem = (id: string, updates: Partial<CustomSaleItem>) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item)),
    );
  };

  const handleResetForm = () => {
    setItems([createEmptyItem()]);
    setCustomerPhone("");
    setCustomerName("");
    setPaymentMethod("COD");
  };

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validate each item
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.itemName.trim()) {
        toast.error(`Item #${i + 1}: Please enter the item name or description.`);
        return;
      }
      const p = parseFloat(it.unitPrice) || 0;
      if (p <= 0) {
        toast.error(`Item #${i + 1}: Please enter a price greater than 0 BDT.`);
        return;
      }
    }

    const receiptNo = `DIR-${Date.now().toString().slice(-6)}`;
    setCompletedReceipt({
      invoiceNo: receiptNo,
      items: items.map((it) => {
        const up = parseFloat(it.unitPrice) || 0;
        return {
          name: it.itemName.trim(),
          qty: it.quantity,
          unitPrice: up,
          lineTotal: up * it.quantity,
          warranty: it.warrantyNote.trim() || "None",
        };
      }),
      total,
      customer: customerName.trim() || "Walk-in Customer",
      phone: customerPhone.trim() || "Unrecorded",
      method:
        paymentMethod === "COD"
          ? "Cash (COD)"
          : paymentMethod === "BKASH"
          ? "bKash"
          : paymentMethod === "NAGAD"
          ? "Nagad"
          : "Bank / Card",
    });

    toast.success(`Direct sale recorded: ${fmt(total)} BDT (${items.length} items)`);
    handleResetForm();
  };

  return (
    <div className="space-y-6 font-sans select-none">
      {/* ═══ Standardized Page Header ═══ */}
      <PageHeader
        title="Direct Custom Sale"
        actions={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleResetForm}
            className="min-h-9 h-9 px-3.5 text-xs font-semibold border-slate-200 text-slate-600 bg-white hover:bg-slate-50 cursor-pointer shadow-2xs gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5 text-slate-400" />
            <span>Clear Form</span>
          </Button>
        }
      />

      {/* ═══ Main Workbench Grid ═══ */}
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ── LEFT: Item & Service Specifications (7 Cols) ── */}
          <div className="lg:col-span-7 space-y-4">
            {items.map((item, index) => {
              const itemPrice = parseFloat(item.unitPrice) || 0;
              const itemLineTotal = itemPrice * item.quantity;

              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-5 relative transition-all"
                >
                  {/* Item Section Header */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-[#0052FF]">
                        {index + 1}
                      </span>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Custom Item #{index + 1}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {itemLineTotal > 0 && (
                        <span className="font-mono text-xs font-bold tabular-nums text-slate-600 bg-slate-100 px-2.5 py-1 rounded">
                          Line: {fmt(itemLineTotal)} BDT
                        </span>
                      )}

                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-2 py-1 rounded cursor-pointer transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Item Name / Model Description */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-slate-500">
                        Item Name / Service Description <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-xs font-normal text-slate-400">
                        Required
                      </span>
                    </div>
                    <Input
                      required
                      value={item.itemName}
                      onChange={(e) => handleUpdateItem(item.id, { itemName: e.target.value })}
                      placeholder="e.g. Display Glass Separation & Lamination"
                      className="min-h-11 h-11 text-sm font-medium border-slate-200 text-[#070B28] placeholder:text-slate-400 focus-visible:border-[#0052FF] focus-visible:ring-2 focus-visible:ring-[#0052FF]/20"
                    />
                  </div>

                  {/* Category & Unit Price in 2 Columns */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-500">
                        Category (Optional)
                      </label>
                      <Select
                        value={item.category}
                        onValueChange={(cat) => handleUpdateItem(item.id, { category: cat })}
                      >
                        <SelectTrigger className="min-h-11 h-11 border-slate-200 text-sm font-medium text-[#070B28]">
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Accessories">Accessories</SelectItem>
                          <SelectItem value="Cables">Cables & Adapters</SelectItem>
                          <SelectItem value="Chargers">Chargers & Power</SelectItem>
                          <SelectItem value="Audio">Audio & Earbuds</SelectItem>
                          <SelectItem value="Repairs">Repairs & Servicing</SelectItem>
                          <SelectItem value="Other">Other / General</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-slate-500">
                          Unit Price (BDT) <span className="text-rose-500">*</span>
                        </label>
                        <span className="text-xs font-normal text-slate-400">
                          Required
                        </span>
                      </div>
                      <div className="relative">
                        <Input
                          required
                          type="number"
                          min="1"
                          step="any"
                          value={item.unitPrice}
                          onChange={(e) => handleUpdateItem(item.id, { unitPrice: e.target.value })}
                          placeholder="0"
                          className="min-h-11 h-11 border-slate-200 pr-14 font-mono text-base font-bold text-[#070B28] placeholder:text-slate-400 focus-visible:border-[#0052FF] focus-visible:ring-2 focus-visible:ring-[#0052FF]/20 tabular-nums"
                        />
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-mono text-xs font-semibold text-slate-400">
                          BDT
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quantity & Warranty in 2 Columns */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-500">
                        Quantity
                      </label>
                      <div className="flex h-11 items-center rounded-md border border-slate-200 bg-white p-1">
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateItem(item.id, {
                              quantity: Math.max(1, item.quantity - 1),
                            })
                          }
                          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded text-slate-600 hover:bg-slate-100 hover:text-[#070B28] transition-colors border-0 outline-none"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="flex-1 text-center font-mono text-base font-bold tabular-nums text-[#070B28]">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateItem(item.id, {
                              quantity: item.quantity + 1,
                            })
                          }
                          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded text-slate-600 hover:bg-slate-100 hover:text-[#070B28] transition-colors border-0 outline-none"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-500">
                        Warranty / Serial Note
                      </label>
                      <Input
                        value={item.warrantyNote}
                        onChange={(e) => handleUpdateItem(item.id, { warrantyNote: e.target.value })}
                        placeholder="e.g. 30 Days Service"
                        className="min-h-11 h-11 border-slate-200 text-sm font-medium text-[#070B28] placeholder:text-slate-400 focus-visible:border-[#0052FF]"
                      />
                    </div>
                  </div>
                </div>
              );
            })}

            {/* ═══ Add More Items Button ═══ */}
            <button
              type="button"
              onClick={handleAddItem}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-white hover:border-[#0052FF] hover:bg-blue-50/40 p-4 text-sm font-semibold text-[#0052FF] cursor-pointer transition-all shadow-2xs group"
            >
              <Plus className="h-4 w-4 group-hover:scale-110 transition-transform" />
              <span>+ Add More Items</span>
            </button>
          </div>

          {/* ── RIGHT: Customer & Payment Settlement (5 Cols) ── */}
          <div className="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-5 sticky top-4">
            {/* Customer Details Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Customer Details
              </span>
              <span className="text-xs font-normal text-slate-400">
                Optional
              </span>
            </div>

            {/* Customer Mobile & Name */}
            <div className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-500">
                  Customer Mobile Number
                </label>
                <Input
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="e.g., +880 1712-345678"
                  className="min-h-11 h-11 border-slate-200 font-mono text-sm font-medium text-[#070B28] placeholder:text-slate-400 focus-visible:border-[#0052FF]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-500">
                  Customer Name
                </label>
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Walk-In Customer (leave empty if unrecorded)"
                  className="min-h-11 h-11 border-slate-200 text-sm font-medium text-[#070B28] placeholder:text-slate-400 focus-visible:border-[#0052FF]"
                />
              </div>
            </div>

            {/* Payment Method & Settlement */}
            <div className="pt-3 border-t border-slate-100 space-y-3.5">
              <div className="border-b border-slate-100 pb-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Payment Method & Settlement
                </span>
              </div>

              <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("COD")}
                  className={cn(
                    "flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-semibold transition-all cursor-pointer border-0 outline-none",
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
                    "flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-semibold transition-all cursor-pointer border-0 outline-none",
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
                    "flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-semibold transition-all cursor-pointer border-0 outline-none",
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
                    "flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-semibold transition-all cursor-pointer border-0 outline-none",
                    paymentMethod === "BANK"
                      ? "bg-white text-[#0052FF] shadow-xs"
                      : "text-slate-600 hover:text-[#070B28]",
                  )}
                >
                  <Building2 className="h-3.5 w-3.5" />
                  <span>Bank</span>
                </button>
              </div>

              {/* Settlement Summary */}
              <div className="space-y-1.5 py-2">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Lines Breakdown ({items.length} {items.length === 1 ? "item" : "items"}, {totalUnits} units)</span>
                  <span className="font-mono font-medium text-[#070B28] tabular-nums">
                    {fmt(total)} BDT
                  </span>
                </div>
                {/* Granular Items Mini-List */}
                <div className="space-y-1 pt-1 max-h-36 overflow-y-auto">
                  {items.map((it, idx) => {
                    const price = parseFloat(it.unitPrice) || 0;
                    return (
                      <div key={it.id} className="flex justify-between text-[11px] text-slate-500">
                        <span className="truncate pr-2">
                          #{idx + 1} {it.itemName.trim() || "Untitled"} ({it.quantity}x)
                        </span>
                        <span className="font-mono tabular-nums text-slate-700 shrink-0">
                          {fmt(price * it.quantity)} BDT
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-between text-xs text-slate-500 pt-1.5 border-t border-slate-100">
                  <span>Payment Mode</span>
                  <span className="font-semibold text-[#070B28] uppercase">
                    {paymentMethod}
                  </span>
                </div>
              </div>

              {/* Total Payable & CTA Button */}
              <div className="pt-2 border-t border-slate-100 space-y-3.5">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Total Payable
                  </span>
                  <span className="font-mono text-3xl font-bold tabular-nums text-[#070B28]">
                    {fmt(total)}{" "}
                    <span className="text-xs font-normal text-slate-500 font-sans">BDT</span>
                  </span>
                </div>

                <Button
                  type="submit"
                  disabled={items.some((it) => !it.itemName.trim() || (parseFloat(it.unitPrice) || 0) <= 0)}
                  className="min-h-12 h-12 w-full bg-[#0052FF] hover:bg-[#0047E0] text-white text-sm font-semibold shadow-xs cursor-pointer transition-colors gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>
                    Complete Direct Sale ({items.length} {items.length === 1 ? "Item" : "Items"}) · {fmt(total)} BDT
                  </span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* ═══ Clean Thermal Receipt Modal (NO VAT) ═══ */}
      <AnimatePresence>
        {completedReceipt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#070B28]/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="relative w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <button
                type="button"
                onClick={() => setCompletedReceipt(null)}
                className="absolute top-4 right-4 p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="text-center space-y-1">
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-1">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-base text-[#070B28]">SunTech Direct Sale</h3>
                <p className="text-xs text-slate-500 font-mono">#{completedReceipt.invoiceNo}</p>
              </div>

              <div className="border-t border-b border-dashed border-slate-200 py-3 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Customer:</span>
                  <span className="font-medium text-[#070B28]">{completedReceipt.customer}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Contact:</span>
                  <span className="font-medium text-[#070B28]">{completedReceipt.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tender:</span>
                  <span className="font-medium text-slate-700">{completedReceipt.method}</span>
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-1.5">
                  <span className="font-semibold text-slate-700 block">Sold Items:</span>
                  {completedReceipt.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between text-slate-600">
                      <span className="truncate pr-2">
                        {it.name} ({it.qty}x)
                      </span>
                      <span className="font-mono tabular-nums font-semibold text-[#070B28] shrink-0">
                        {fmt(it.lineTotal)} BDT
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between border-t border-slate-100 pt-2 font-mono text-sm font-bold text-[#070B28]">
                  <span>Total Amount Paid:</span>
                  <span className="text-[#0052FF]">{fmt(completedReceipt.total)} BDT</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={() => {
                    toast.success("Printing receipt on 80mm roll...");
                    setCompletedReceipt(null);
                  }}
                  className="flex-1 min-h-10 h-10 bg-[#0052FF] hover:bg-[#0047E0] text-white font-semibold text-xs cursor-pointer gap-2"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print Slip</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCompletedReceipt(null)}
                  className="min-h-10 h-10 px-4 border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Close
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
