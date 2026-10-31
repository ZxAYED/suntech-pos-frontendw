"use client";

import { useState } from "react";
import {
  AnimatePresence,
  MotionConfig,
  motion,
  useReducedMotion,
} from "framer-motion";
import {
  ShoppingCart,
  Wrench,
  Receipt,
  Plus,
  Check,
  Smartphone,
  Banknote,
  CreditCard,
  ShieldCheck,
  Barcode,
  Printer,
  Sparkles,
} from "lucide-react";
import { BrandLogo } from "@/components/common/brand-logo";
import { AnimatedCounter } from "@/components/motion/animated-counter";

type Mode = "catalog" | "custom";
type Branch = "uttara" | "mirpur";

interface CatalogItem {
  id: string;
  name: string;
  sku: string;
  stock: number;
  price: number;
}

const CATALOG_ITEMS: Record<Branch, CatalogItem[]> = {
  uttara: [
    { id: "chg-45w", name: "Infinix 45W Fast Charger", sku: "INF-45W-CHG", stock: 22, price: 1450 },
    { id: "buds-tws", name: "Anker R50i TWS Earbuds", sku: "ANK-R50I-BLK", stock: 14, price: 2490 },
    { id: "gan5-65w", name: "Baseus 65W GaN5 Pro", sku: "BAS-GAN5-65W", stock: 8, price: 2990 },
  ],
  mirpur: [
    { id: "chg-45w", name: "Infinix 45W Fast Charger", sku: "INF-45W-CHG", stock: 16, price: 1450 },
    { id: "buds-tws", name: "Anker R50i TWS Earbuds", sku: "ANK-R50I-BLK", stock: 19, price: 2490 },
    { id: "gan5-65w", name: "Baseus 65W GaN5 Pro", sku: "BAS-GAN5-65W", stock: 6, price: 2990 },
  ],
};

export function OperationsPreview() {
  const [activeBranch, setActiveBranch] = useState<Branch>("uttara");
  const [mode, setMode] = useState<Mode>("catalog");
  const [selectedCatalogIds, setSelectedCatalogIds] = useState<string[]>(["chg-45w", "buds-tws"]);
  const [activeTender, setActiveTender] = useState<"cash" | "bkash" | "card">("cash");

  const reduceMotion = useReducedMotion();
  const currentCatalog = CATALOG_ITEMS[activeBranch];

  const toggleCatalogItem = (id: string) => {
    setSelectedCatalogIds((prev) =>
      prev.includes(id)
        ? prev.length > 1
          ? prev.filter((i) => i !== id)
          : prev
        : [...prev, id]
    );
  };

  const catalogSubtotal = selectedCatalogIds.reduce((sum, id) => {
    const item = currentCatalog.find((c) => c.id === id);
    return sum + (item?.price ?? 0);
  }, 0);

  const customPrice = 3500;

  return (
    <MotionConfig reducedMotion="user">
      <section
        aria-label="Interactive SunTech POS Workspace Preview"
        className="w-full rounded-2xl border border-slate-200/90 bg-white p-3.5 sm:p-6 shadow-[0_20px_50px_-12px_rgba(7,11,40,0.08),0_1px_3px_rgba(7,11,40,0.04)]"
      >
        {/* Top Control Bar: Fully Responsive Header */}
        <div className="pb-3 sm:pb-4 border-b border-slate-100">
          {/* Mobile Layout (< sm): 2 Clean Rows */}
          <div className="flex sm:hidden flex-col gap-2.5">
            {/* Mobile Row 1: Brand Logo + Demo Badge */}
            <div className="flex items-center justify-between">
              <BrandLogo size="sm" href="/" className="shrink-0" />
              <span className="inline-flex items-center gap-1 rounded-md border border-blue-200/60 bg-blue-50 px-2 py-0.5 text-[10px] font-mono font-medium text-[#0052FF]">
                <Sparkles className="h-2.5 w-2.5" />
                <span>Demo</span>
              </span>
            </div>

            {/* Mobile Row 2: Merchant Identity + Branch Switcher */}
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100/70">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-[#0A1138] truncate">
                    SunTech Electronics
                  </span>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                </div>
                <p className="text-[10px] font-mono text-slate-500 truncate">
                  Lane 01 • {activeBranch === "uttara" ? "Uttara" : "Mirpur"}
                </p>
              </div>

              {/* Branch Switcher on Mobile */}
              <div
                role="group"
                aria-label="Preview branch"
                className="inline-flex items-center rounded-lg bg-slate-100 p-0.5 border border-slate-200/80 shrink-0"
              >
                {(
                  [
                    { id: "uttara" as const, label: "Uttara" },
                    { id: "mirpur" as const, label: "Mirpur" },
                  ] as const
                ).map((branch) => {
                  const isActive = activeBranch === branch.id;
                  return (
                    <button
                      key={branch.id}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => setActiveBranch(branch.id)}
                      className={`relative rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[#0052FF] ${
                        isActive ? "text-[#0A1138]" : "text-slate-500 hover:text-[#0A1138]"
                      }`}
                    >
                      {isActive && (
                        <motion.span
                          layoutId="activeHeroBranchMobile"
                          transition={
                            reduceMotion
                              ? { duration: 0 }
                              : { type: "spring", stiffness: 450, damping: 32 }
                          }
                          className="absolute inset-0 rounded-md bg-white shadow-xs"
                        />
                      )}
                      <span className="relative z-10">{branch.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Desktop/Tablet Layout (sm+): 1 Row */}
          <div className="hidden sm:flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <BrandLogo size="sm" href="/" className="shrink-0" />
              <div className="h-5 w-px bg-slate-200 shrink-0" />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-[#0A1138] truncate">
                    SunTech Electronics
                  </span>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                </div>
                <p className="text-[10px] font-mono text-slate-500 truncate">
                  Counter Lane 01 • {activeBranch === "uttara" ? "Uttara Branch" : "Mirpur Branch"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div
                role="group"
                aria-label="Preview branch"
                className="inline-flex items-center rounded-lg bg-slate-100 p-1 border border-slate-200/80"
              >
                {(
                  [
                    { id: "uttara" as const, label: "Uttara" },
                    { id: "mirpur" as const, label: "Mirpur" },
                  ] as const
                ).map((branch) => {
                  const isActive = activeBranch === branch.id;
                  return (
                    <button
                      key={branch.id}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => setActiveBranch(branch.id)}
                      className={`relative rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[#0052FF] ${
                        isActive ? "text-[#0A1138]" : "text-slate-500 hover:text-[#0A1138]"
                      }`}
                    >
                      {isActive && (
                        <motion.span
                          layoutId="activeHeroBranch"
                          transition={
                            reduceMotion
                              ? { duration: 0 }
                              : { type: "spring", stiffness: 450, damping: 32 }
                          }
                          className="absolute inset-0 rounded-md bg-white shadow-xs"
                        />
                      )}
                      <span className="relative z-10">{branch.label}</span>
                    </button>
                  );
                })}
              </div>

              <span className="inline-flex items-center gap-1 rounded-md border border-blue-200/60 bg-blue-50 px-2 py-1 text-[10px] font-mono font-medium text-[#0052FF]">
                <Sparkles className="h-3 w-3" />
                <span>Interactive Demo</span>
              </span>
            </div>
          </div>
        </div>

        {/* Navy Segmented Tab Switcher with Mobile Responsive Labels */}
        <div className="pt-3 sm:pt-4 pb-3 sm:pb-4">
          <div className="inline-flex w-full items-center rounded-xl bg-[#0A1138] p-1 sm:p-1.5 shadow-md border border-white/10">
            {(
              [
                {
                  id: "catalog" as const,
                  desktopLabel: "01. Catalog SKU Register",
                  mobileLabel: "01. Catalog",
                  icon: ShoppingCart,
                },
                {
                  id: "custom" as const,
                  desktopLabel: "02. Direct Custom Sale",
                  mobileLabel: "02. Custom Sale",
                  icon: Wrench,
                },
              ] as const
            ).map((tab) => {
              const active = mode === tab.id;
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setMode(tab.id)}
                  className={`relative flex-1 flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg py-2 sm:py-2.5 px-2 sm:px-3 text-xs sm:text-sm font-semibold transition-colors cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-[#0052FF] ${
                    active ? "text-[#0A1138]" : "text-slate-300 hover:text-white"
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId="heroPreviewModeTab"
                      transition={
                        reduceMotion
                          ? { duration: 0 }
                          : { type: "spring", stiffness: 450, damping: 32 }
                      }
                      className="absolute inset-0 rounded-lg bg-white shadow-xs"
                    />
                  )}
                  <TabIcon
                    className={`relative z-10 h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 transition-colors ${
                      active ? "text-[#0052FF]" : "text-slate-400"
                    }`}
                    aria-hidden="true"
                  />
                  <span className="relative z-10 whitespace-nowrap">
                    <span className="hidden sm:inline">{tab.desktopLabel}</span>
                    <span className="sm:hidden">{tab.mobileLabel}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Workspace Stage: Stable Height Multi-Column Layout */}
        <div className="min-h-[290px] sm:min-h-[320px]">
          <AnimatePresence mode="wait">
            {mode === "catalog" ? (
              <motion.div
                key="catalog-stage"
                initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 items-stretch"
              >
                {/* Left: Compact Catalog Workspace (7 cols) */}
                <div className="md:col-span-7 flex flex-col justify-between space-y-2">
                  <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-100">
                    <span className="font-semibold text-[#0A1138] flex items-center gap-1.5">
                      <Barcode className="h-3.5 w-3.5 text-[#0052FF]" />
                      Fast Register Catalog
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      Tap item to add
                    </span>
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    {currentCatalog.map((item) => {
                      const inTicket = selectedCatalogIds.includes(item.id);
                      return (
                        <div
                          key={item.id}
                          onClick={() => toggleCatalogItem(item.id)}
                          role="checkbox"
                          aria-checked={inTicket}
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              toggleCatalogItem(item.id);
                            }
                          }}
                          className={`flex items-center justify-between p-2 sm:p-2.5 rounded-xl border transition-all cursor-pointer ${
                            inTicket
                              ? "border-[#0052FF]/50 bg-blue-50/40 shadow-xs"
                              : "border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/60"
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <p className="text-xs font-semibold text-[#0A1138] truncate">
                              {item.name}
                            </p>
                            <p className="text-[10px] font-mono text-slate-500 mt-0.5">
                              {item.sku} • Stock: {item.stock} pcs
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-mono text-xs font-bold text-[#0052FF] tabular-nums">
                              ৳{item.price.toLocaleString("en-BD")}
                            </span>
                            <span
                              className={`flex h-5 w-5 items-center justify-center rounded-md border text-xs transition-colors ${
                                inTicket
                                  ? "bg-[#0052FF] border-[#0052FF] text-white"
                                  : "border-slate-300 bg-white text-slate-400"
                              }`}
                            >
                              {inTicket ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-1 flex items-center justify-between text-[10px] sm:text-[11px] font-mono text-slate-500">
                    <span className="flex items-center gap-1">
                      <Barcode className="h-3 w-3 text-slate-400 shrink-0" />
                      <span className="truncate">Scan: 93821049281</span>
                    </span>
                    <span className="text-[#0052FF] font-semibold shrink-0">
                      {selectedCatalogIds.length} item(s) in ticket
                    </span>
                  </div>
                </div>

                {/* Right: Dark Navy Ticket Panel (5 cols) */}
                <div className="md:col-span-5 rounded-xl sm:rounded-2xl bg-[#070B28] p-3.5 sm:p-4 text-white flex flex-col justify-between shadow-lg border border-slate-800">
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                      <div className="flex items-center gap-1.5">
                        <Receipt className="h-3.5 w-3.5 text-sky-400" />
                        <span className="text-[10px] sm:text-[11px] font-semibold tracking-wider uppercase text-slate-300">
                          Active Ticket
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-sky-400 bg-blue-500/20 px-2 py-0.5 rounded-full border border-blue-400/20">
                        #TCK-9904
                      </span>
                    </div>

                    <div className="mt-2.5 sm:mt-3">
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                        Settlement Due
                      </span>
                      <div className="font-mono text-xl sm:text-2xl font-bold text-sky-400 tabular-nums mt-0.5">
                        <AnimatedCounter value={catalogSubtotal} prefix="৳ " />
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5 sm:mt-1">
                        {activeBranch === "uttara" ? "Uttara Doyel" : "Mirpur Circle"} • Lane 01
                      </p>
                    </div>
                  </div>

                  {/* Interactive Tender Routing */}
                  <div className="mt-2.5 sm:mt-3 pt-2.5 sm:pt-3 border-t border-white/10">
                    <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1.5">
                      Tender Method
                    </span>
                    <div className="grid grid-cols-3 gap-1.5 text-[10px] sm:text-[11px] font-mono">
                      {(
                        [
                          { id: "cash" as const, label: "Cash", icon: Banknote },
                          { id: "bkash" as const, label: "bKash", icon: Smartphone },
                          { id: "card" as const, label: "Card", icon: CreditCard },
                        ] as const
                      ).map((t) => {
                        const isTenderSelected = activeTender === t.id;
                        const Icon = t.icon;
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setActiveTender(t.id)}
                            className={`p-1.5 rounded-lg border text-center flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
                              isTenderSelected
                                ? "bg-[#0052FF] border-blue-400/40 text-white font-semibold"
                                : "bg-white/5 hover:bg-white/10 border-white/10 text-slate-300"
                            }`}
                          >
                            <Icon className="h-3 w-3" />
                            <span>{t.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="custom-stage"
                initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 items-stretch"
              >
                {/* Left: Custom Direct Sale Workbench (7 cols) */}
                <div className="md:col-span-7 flex flex-col justify-between space-y-2">
                  <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-100">
                    <span className="font-semibold text-[#0A1138] flex items-center gap-1.5">
                      <Wrench className="h-3.5 w-3.5 text-[#0052FF]" />
                      Direct Custom Sale Workbench
                    </span>
                    <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      Zero Stock
                    </span>
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    {/* Item Description */}
                    <div className="p-2 sm:p-2.5 rounded-xl border border-slate-200/90 bg-slate-50/60">
                      <span className="text-[10px] font-mono uppercase text-slate-500 block mb-0.5">
                        Description / Labor
                      </span>
                      <p className="text-xs font-semibold text-[#0A1138]">
                        Display & Touch Assembly Replacement
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Technician bench service & precision adhesive
                      </p>
                    </div>

                    {/* Pricing & Quantity Row */}
                    <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                      <div className="p-1.5 sm:p-2 rounded-xl border border-slate-200/80 bg-white">
                        <span className="text-[10px] font-mono uppercase text-slate-500 block">
                          Agreed Price (BDT)
                        </span>
                        <span className="text-sm font-mono font-bold text-[#0052FF]">
                          ৳3,500
                        </span>
                      </div>
                      <div className="p-1.5 sm:p-2 rounded-xl border border-slate-200/80 bg-white">
                        <span className="text-[10px] font-mono uppercase text-slate-500 block">
                          Quantity
                        </span>
                        <span className="text-sm font-mono font-bold text-[#0A1138]">
                          1 unit
                        </span>
                      </div>
                    </div>

                    {/* IMEI / SN Audit Note */}
                    <div className="p-1.5 sm:p-2 rounded-xl border border-blue-100 bg-blue-50/50 flex items-center justify-between text-[10px] sm:text-[11px]">
                      <span className="font-mono text-blue-950 font-medium truncate pr-1">
                        IMEI: 864501048291034
                      </span>
                      <span className="text-[10px] text-[#0052FF] font-semibold shrink-0">
                        90-Day Warranty
                      </span>
                    </div>
                  </div>

                  <div className="pt-1 flex items-center justify-between text-[10px] sm:text-[11px] font-mono text-slate-500">
                    <span className="flex items-center gap-1 text-emerald-600">
                      <ShieldCheck className="h-3 w-3 shrink-0" />
                      <span>Direct Ledger</span>
                    </span>
                    <span>Ready for Thermal Slip</span>
                  </div>
                </div>

                {/* Right: Dark Navy Ticket Panel (5 cols) */}
                <div className="md:col-span-5 rounded-xl sm:rounded-2xl bg-[#070B28] p-3.5 sm:p-4 text-white flex flex-col justify-between shadow-lg border border-slate-800">
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                      <div className="flex items-center gap-1.5">
                        <Wrench className="h-3.5 w-3.5 text-sky-400" />
                        <span className="text-[10px] sm:text-[11px] font-semibold tracking-wider uppercase text-slate-300">
                          Custom Ticket
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-sky-400 bg-blue-500/20 px-2 py-0.5 rounded-full border border-blue-400/20">
                        #CST-1082
                      </span>
                    </div>

                    <div className="mt-2.5 sm:mt-3">
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                        Settlement Due
                      </span>
                      <div className="font-mono text-xl sm:text-2xl font-bold text-sky-400 tabular-nums mt-0.5">
                        <AnimatedCounter value={customPrice} prefix="৳ " />
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5 sm:mt-1">
                        Display Replacement • IMEI Linked
                      </p>
                    </div>
                  </div>

                  {/* Print Slip Action */}
                  <div className="mt-2.5 sm:mt-3 pt-2.5 sm:pt-3 border-t border-white/10">
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1.5">
                      <span>Instant Thermal Ticket</span>
                      <span className="text-emerald-400">Ready</span>
                    </div>
                    <div className="flex items-center gap-2 p-1.5 sm:p-2 rounded-xl bg-white/5 border border-white/10 text-xs">
                      <Printer className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                      <span className="text-slate-200 text-[10px] sm:text-[11px] truncate">
                        Thermal Receipt + Cashier Sig
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Reassurance Footer */}
        <div className="flex items-center justify-between pt-3 sm:pt-3.5 mt-2 border-t border-slate-100 text-[10px] sm:text-[11px] font-mono text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="truncate">Deterministic demo state</span>
          </span>
          <span className="flex items-center gap-1 text-slate-600 shrink-0">
            <ShieldCheck className="h-3.5 w-3.5 text-[#0052FF]" />
            <span>Lane 01 Multi-Branch</span>
          </span>
        </div>
      </section>
    </MotionConfig>
  );
}
