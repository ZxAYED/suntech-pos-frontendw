"use client";

import { useState } from "react";
import Image from "next/image";
import {
  AnimatePresence,
  MotionConfig,
  motion,
  useReducedMotion,
} from "framer-motion";
import {
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  AlertTriangle,
  Receipt,
  Store,
  Layers,
  Camera,
  BarChart3,
  CheckCircle2,
} from "lucide-react";
import { BRANCH_PREVIEWS, type BranchId, formatBDT } from "./demo-data";
import { AnimatedCounter } from "@/components/motion/animated-counter";

export function OperationsPreview() {
  const [branchId, setBranchId] = useState<BranchId>("uttara");
  const [viewMode, setViewMode] = useState<"telemetry" | "storefront">("telemetry");
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);

  const reduceMotion = useReducedMotion();
  const branch = BRANCH_PREVIEWS[branchId];
  const maxBar = Math.max(...branch.bars, 100);

  return (
    <MotionConfig reducedMotion="user">
      <section
        aria-label="Illustrative SunTech POS workspace preview"
        className="w-full rounded-xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-[0_20px_50px_-12px_rgba(7,11,40,0.08),0_1px_3px_rgba(7,11,40,0.04)]"
      >
        {/* Top Control Bar: Business Identity + Demo Pill + Branch Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[#0052FF] border border-blue-100/60 shrink-0">
              <Store className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-[#0A1138] truncate">
                  SunTech Electronics
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
              </div>
              <p className="text-[11px] font-mono text-slate-500 truncate">
                Multi-Branch POS Preview
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* View Mode Toggle: Telemetry vs Physical Storefront (Asset 1) */}
            <div className="hidden sm:inline-flex items-center rounded-lg bg-slate-100 p-0.5 border border-slate-200/60 text-xs">
              <button
                type="button"
                onClick={() => setViewMode("telemetry")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  viewMode === "telemetry"
                    ? "bg-white text-[#0A1138] font-medium shadow-xs"
                    : "text-slate-500 hover:text-[#0A1138]"
                }`}
              >
                <BarChart3 className="h-3 w-3" />
                <span>Telemetry</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("storefront")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  viewMode === "storefront"
                    ? "bg-white text-[#0A1138] font-medium shadow-xs"
                    : "text-slate-500 hover:text-[#0A1138]"
                }`}
              >
                <Camera className="h-3 w-3" />
                <span>Storefront</span>
              </button>
            </div>

            {/* Branch Switcher Tabs */}
            <div
              role="group"
              aria-label="Preview branch"
              className="inline-flex items-center rounded-lg bg-slate-100 p-1 border border-slate-200/70"
            >
              {(["uttara", "mirpur"] as const).map((id) => {
                const active = branchId === id;
                return (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setBranchId(id)}
                    className={`relative rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0052FF] ${
                      active ? "text-[#0A1138]" : "text-slate-600 hover:text-[#0A1138]"
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="active-preview-branch"
                        className="absolute inset-0 rounded-md bg-white shadow-xs"
                        transition={
                          reduceMotion
                            ? { duration: 0 }
                            : { type: "spring", stiffness: 420, damping: 32 }
                        }
                      />
                    )}
                    <span className="relative z-10">{BRANCH_PREVIEWS[id].label}</span>
                  </button>
                );
              })}
            </div>

            <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-mono font-medium uppercase tracking-wider text-slate-500">
              Demo Data
            </span>
          </div>
        </div>

        {/* View Mode 1: Physical Storefront Perspective (Featuring Image 1) */}
        {viewMode === "storefront" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            className="pt-4"
          >
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-slate-900 border border-slate-200 shadow-inner group">
              <Image
                src="/images/asset-1.jpg"
                alt="Physical Storefront Operations at Uttara Doyel Branch"
                fill
                priority
                sizes="(max-width: 1400px) 100vw, 700px"
                className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#070B28]/85 via-[#070B28]/20 to-transparent" />

              {/* Live Overlay HUD */}
              <div className="absolute top-3 left-3 bg-[#070B28]/85 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-lg text-white font-mono text-xs flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{BRANCH_PREVIEWS[branchId].label} Branch • Counter 01 Live</span>
              </div>

              <div className="absolute bottom-3 inset-x-3 flex items-center justify-between text-white text-xs font-mono">
                <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">
                  <span className="text-slate-400">Shift Revenue: </span>
                  <span className="text-emerald-400 font-bold">{formatBDT(branch.revenueToday)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setViewMode("telemetry")}
                  className="bg-[#0052FF] hover:bg-[#0047E0] px-3 py-1.5 rounded-lg font-sans font-medium text-white transition-colors cursor-pointer"
                >
                  View Telemetry ➔
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* View Mode 2: Dynamic Branch Telemetry Area */}
        {viewMode === "telemetry" && (
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={branchId}
              initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -6 }}
              transition={{ duration: reduceMotion ? 0 : 0.2 }}
              className="pt-4 space-y-5"
            >
              {/* Branch Overview Header Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Metric 1: Revenue with Animated Counter */}
                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 transition-colors hover:bg-slate-50">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 block mb-1">
                    Today&apos;s Revenue
                  </span>
                  <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-[#0A1138] tabular-nums">
                    <AnimatedCounter value={branch.revenueToday} prefix="৳" />
                  </div>
                  <div className="mt-1 flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                    <TrendingUp className="h-3 w-3" />
                    <span>+18.4% vs last shift</span>
                  </div>
                </div>

                {/* Metric 2: Orders with Animated Counter */}
                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 transition-colors hover:bg-slate-50">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 block mb-1">
                    Completed Orders
                  </span>
                  <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-[#0A1138] tabular-nums">
                    <AnimatedCounter value={branch.orderCount} />{" "}
                    <span className="text-xs font-normal text-slate-500">tickets</span>
                  </div>
                  <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-500 font-mono">
                    <Receipt className="h-3 w-3 text-slate-400" />
                    <span>Avg. ৳{Math.round(branch.revenueToday / branch.orderCount)}</span>
                  </div>
                </div>

                {/* Metric 3: Alerts */}
                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 transition-colors hover:bg-slate-50">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 block mb-1">
                    Inventory Alerts
                  </span>
                  <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-[#0A1138] tabular-nums flex items-center gap-1.5">
                    <span>{branch.lowStockCount}</span>
                    <span className="text-xs font-normal text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                      Low Stock
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-1 text-[11px] text-amber-600">
                    <AlertTriangle className="h-3 w-3" />
                    <span>Reorder threshold reached</span>
                  </div>
                </div>
              </div>

              {/* Mini Hourly Volume Bar Graph with Smooth Tooltip & Heights */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3.5 relative">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-medium text-[#0A1138]">Hourly Register Velocity</span>
                  <span className="text-[11px] font-mono text-slate-500">
                    {hoveredBarIndex !== null
                      ? `Volume: ${branch.bars[hoveredBarIndex]} tickets`
                      : "Shift Peak: 16:00"}
                  </span>
                </div>
                <div className="flex items-end gap-1.5 h-14 pt-2">
                  {branch.bars.map((val, idx) => {
                    const heightPercent = Math.max(12, Math.round((val / maxBar) * 100));
                    const isPeak = val === Math.max(...branch.bars);
                    return (
                      <div
                        key={idx}
                        onMouseEnter={() => setHoveredBarIndex(idx)}
                        onMouseLeave={() => setHoveredBarIndex(null)}
                        className="flex-1 flex flex-col items-center justify-end h-full group relative cursor-pointer"
                      >
                        <motion.div
                          className={`w-full rounded-t-sm transition-colors duration-150 ${
                            isPeak
                              ? "bg-[#0052FF]"
                              : hoveredBarIndex === idx
                              ? "bg-blue-600"
                              : "bg-blue-400/35 group-hover:bg-[#0052FF]"
                          }`}
                          initial={reduceMotion ? { height: `${heightPercent}%` } : { height: 0 }}
                          animate={{ height: `${heightPercent}%` }}
                          transition={{
                            duration: reduceMotion ? 0 : 0.35,
                            delay: reduceMotion ? 0 : idx * 0.02,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1.5 pt-1 border-t border-slate-100">
                  <span>10:00 AM</span>
                  <span>14:00 PM</span>
                  <span>18:00 PM</span>
                  <span>21:00 PM</span>
                </div>
              </div>

              {/* Two-Column Detail Grid: Branch Inventory + Live Activity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Left Column: Inventory Snapshot */}
                <div className="rounded-xl border border-slate-100 bg-white p-3.5">
                  <div className="flex items-center justify-between mb-2.5 pb-1.5 border-b border-slate-100">
                    <span className="text-xs font-semibold text-[#0A1138] flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5 text-[#0052FF]" />
                      Branch Inventory
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 uppercase">
                      SKU / Stock
                    </span>
                  </div>
                  <div className="space-y-2">
                    {branch.inventory.map((item) => {
                      const isLow = item.stock <= 5;
                      return (
                        <div
                          key={item.sku}
                          className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50/80 hover:bg-slate-50 transition-colors"
                        >
                          <div className="min-w-0 pr-2">
                            <p className="font-medium text-[#0A1138] truncate">
                              {item.name}
                            </p>
                            <p className="text-[10px] font-mono text-slate-500">
                              {item.sku}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <span
                              className={`inline-block font-mono font-semibold px-1.5 py-0.5 rounded text-[10px] ${
                                isLow
                                  ? "bg-amber-100 text-amber-800 border border-amber-200"
                                  : "bg-blue-100/70 text-[#0052FF]"
                              }`}
                            >
                              {item.stock} in stock
                            </span>
                            <div className="text-[11px] font-mono font-medium text-slate-700 mt-0.5">
                              {formatBDT(item.sellingPrice)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right Column: Live Activity Feed */}
                <div className="rounded-xl border border-slate-100 bg-white p-3.5">
                  <div className="flex items-center justify-between mb-2.5 pb-1.5 border-b border-slate-100">
                    <span className="text-xs font-semibold text-[#0A1138] flex items-center gap-1.5">
                      <Receipt className="h-3.5 w-3.5 text-emerald-600" />
                      Recent Activity
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 uppercase">
                      Ledger Stream
                    </span>
                  </div>
                  <div className="space-y-2">
                    {branch.activity.map((act) => {
                      const isCredit = act.direction === "IN";
                      return (
                        <div
                          key={act.id}
                          className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50/80 hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex items-center gap-2 min-w-0 pr-2">
                            <span
                              className={`flex h-6 w-6 items-center justify-center rounded-md shrink-0 ${
                                isCredit
                                  ? "bg-emerald-50 text-emerald-600 border border-emerald-200/60"
                                  : "bg-rose-50 text-rose-600 border border-rose-200/60"
                              }`}
                            >
                              {isCredit ? (
                                <ArrowDownLeft className="h-3.5 w-3.5" />
                              ) : (
                                <ArrowUpRight className="h-3.5 w-3.5" />
                              )}
                            </span>
                            <div className="min-w-0">
                              <p className="font-medium text-[#0A1138] truncate">
                                {act.label}
                              </p>
                              <p className="text-[10px] font-mono text-slate-500">
                                {isCredit ? "Voucher settled" : "Drawer payout"}
                              </p>
                            </div>
                          </div>
                          <div
                            className={`font-mono text-xs font-semibold shrink-0 ${
                              isCredit ? "text-emerald-600" : "text-rose-600"
                            }`}
                          >
                            {isCredit ? "+" : "-"}
                            {formatBDT(act.amount)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Reassurance Footer inside the preview */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-[11px] font-mono text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live local ledger reconciled
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                  Deterministic demo state
                </span>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </section>
    </MotionConfig>
  );
}
