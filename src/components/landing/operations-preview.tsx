"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useReducedMotionPreference } from "@/components/motion/use-reduced-motion-preference";
import { Barcode, Check, Monitor, Plus, Printer, Receipt, Wrench } from "lucide-react";
import { AnimatedCounter } from "@/components/motion/animated-counter";
import { motionTokens } from "@/components/motion/motion-tokens";
import { formatBDT, type BranchId } from "./demo-data";

const branches = { uttara: "Uttara", mirpur: "Mirpur" } as const;
const catalog = [
  { id: "chg-45w", name: "Infinix 45W Fast Charger", sku: "INF-45W-CHG", price: 1450, stock: { uttara: 22, mirpur: 16 } },
  { id: "buds-tws", name: "Anker R50i TWS Earbuds", sku: "ANK-R50I-BLK", price: 2490, stock: { uttara: 14, mirpur: 19 } },
  { id: "gan5-65w", name: "Baseus 65W GaN5 Pro", sku: "BAS-GAN5-65W", price: 2990, stock: { uttara: 8, mirpur: 6 } },
];
const modes = [
  { id: "catalog", label: "Catalog", icon: Barcode },
  { id: "custom", label: "Custom sale", icon: Wrench },
] as const;

export function OperationsPreview() {
  const [branch, setBranch] = useState<BranchId>("uttara");
  const [mode, setMode] = useState<"catalog" | "custom">("catalog");
  const [selected, setSelected] = useState(["chg-45w", "buds-tws"]);
  const [tender, setTender] = useState("Cash");
  const reduceMotion = useReducedMotionPreference();
  const isCatalog = mode === "catalog";
  const total = isCatalog
    ? catalog.reduce((sum, item) => sum + (selected.includes(item.id) ? item.price : 0), 0)
    : 3500;
  const tabTransition = reduceMotion ? { duration: 0 } : { type: "spring" as const, ...motionTokens.spring };

  function toggleItem(id: string) {
    setSelected((items) => {
      if (!items.includes(id)) return [...items, id];
      return items.length === 1 ? items : items.filter((item) => item !== id);
    });
  }

  return (
    <section aria-label="Interactive SunTech POS Workspace Preview"
      className="@container rounded-2xl border border-[#d4deec] bg-white p-3.5 text-[#0a1138] shadow-[0_24px_50px_-24px_#1b376b59,0_3px_8px_-4px_#19386a24] sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-lg bg-blue-50 text-[#0052ff]"><Monitor size={18} aria-hidden /></span>
          <div>
            <h2 className="text-sm font-semibold">Register preview</h2>
            <p className="text-[11px] text-slate-500">SunTech Electronics · Lane 01</p>
          </div>
        </div>
        <div role="group" aria-label="Preview branch" className="inline-flex rounded-lg bg-slate-100 p-0.5">
          {(Object.keys(branches) as BranchId[]).map((id) => (
            <button key={id} type="button" aria-pressed={branch === id} onClick={() => setBranch(id)}
              className="relative rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-600 aria-pressed:text-[#0a1138]">
              {branch === id && <motion.span layoutId="hero-branch" transition={tabTransition} className="absolute inset-0 rounded-md bg-white shadow-sm" />}
              <span className="relative">{branches[id]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 grid gap-3 @min-[28rem]:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div className="min-w-0">
          <div role="group" aria-label="Register mode" className="mb-1 flex gap-4 border-b border-slate-200">
            {modes.map(({ id, label, icon: Icon }) => (
              <button key={id} type="button" aria-pressed={mode === id} onClick={() => setMode(id)}
                className="relative flex items-center gap-1.5 py-2 text-xs font-semibold text-slate-500 aria-pressed:text-[#0052ff]">
                <Icon size={14} aria-hidden /> {label}
                {mode === id && <motion.span layoutId="hero-mode" transition={tabTransition} className="absolute inset-x-0 -bottom-px h-0.5 bg-[#0052ff]" />}
              </button>
            ))}
          </div>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={mode}
              initial={reduceMotion ? false : { opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }} exit={reduceMotion ? {} : { opacity: 0, x: -5 }}
              transition={{ duration: reduceMotion ? 0 : .16, ease: motionTokens.easeOut }}
              className="min-h-[8.25rem]">
              {isCatalog ? catalog.map((item) => {
                const checked = selected.includes(item.id);
                return (
                  <button key={item.id} type="button" role="checkbox" aria-checked={checked}
                    aria-disabled={checked && selected.length === 1}
                    onClick={() => toggleItem(item.id)}
                    className="flex min-h-11 w-full items-center gap-2 border-b border-slate-100 px-1 py-1.5 text-left last:border-0 hover:bg-slate-50">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-semibold">{item.name}</span>
                      <span className="block font-mono text-[10px] text-slate-500">{item.sku} · {item.stock[branch]} pcs</span>
                    </span>
                    <span className="font-mono text-xs tabular-nums">{formatBDT(item.price)}</span>
                    <span className={`grid size-4 shrink-0 place-items-center rounded ${checked ? "bg-[#0052ff] text-white" : "bg-slate-100 text-slate-500"}`}>
                      {checked ? <Check size={11} aria-hidden /> : <Plus size={11} aria-hidden />}
                    </span>
                  </button>
                );
              }) : (
                <div className="py-2">
                  <p className="text-xs font-semibold">Display &amp; touch assembly replacement</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-600">Technician labor and adhesive · 90-day warranty</p>
                  <p className="my-2 border-y border-slate-100 py-2 font-mono text-xs">1 unit × {formatBDT(3500)}</p>
                  <p className="font-mono text-[10px] text-slate-500">IMEI 864501048291034</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex min-w-0 flex-col justify-between rounded-xl bg-[#111d3d] p-3.5 text-white">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] text-blue-100">
              <Receipt size={13} aria-hidden /> {isCatalog ? "Active ticket" : "Custom ticket"}
              <span className="ml-auto font-mono text-[9px] text-blue-200">{isCatalog ? "#TCK-9904" : "#CST-1082"}</span>
            </div>
            <p className="mt-3 text-[11px] text-slate-300">Settlement due</p>
            <div className="font-mono text-[1.65rem] font-semibold leading-tight tabular-nums">
              <AnimatedCounter value={total} prefix="৳ " duration={0.55} />
            </div>
            <p className="mt-1 text-[10px] text-slate-300">
              {isCatalog ? `${selected.length} ${selected.length === 1 ? "item" : "items"}` : "Repair service"} · {branches[branch]}
            </p>
          </div>
          {isCatalog ? (
            <div role="group" aria-label="Tender method" className="mt-3 grid grid-cols-3 gap-1 border-t border-white/15 pt-2.5">
              {["Cash", "bKash", "Card"].map((method) => (
                <button key={method} type="button" aria-pressed={tender === method} onClick={() => setTender(method)}
                  className="rounded border border-white/20 py-1 text-[11px] font-medium hover:bg-white/10 aria-pressed:border-[#417fff] aria-pressed:bg-[#0052ff]">
                  {method}
                </button>
              ))}
            </div>
          ) : (
            <p className="mt-3 flex items-center gap-2 border-t border-white/15 pt-2.5 text-[11px] text-blue-100">
              <Printer size={14} aria-hidden /> Thermal slip ready
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
