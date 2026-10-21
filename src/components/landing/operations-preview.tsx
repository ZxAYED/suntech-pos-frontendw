"use client";

import { useState } from "react";
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
} from "lucide-react";
import { BRANCH_PREVIEWS, type BranchId, formatBDT } from "./demo-data";

export function OperationsPreview() {
  const [branchId, setBranchId] = useState<BranchId>("uttara");
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
                <span className="text-sm font-semibold text-[#070B28] truncate">
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
                      active ? "text-[#070B28]" : "text-slate-600 hover:text-slate-900"
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

        {/* Dynamic Branch Telemetry Area */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={branchId}
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -6 }}
            transition={{ duration: reduceMotion ? 0 : 0.22 }}
            className="pt-4 space-y-5"
          >
            {/* Branch Overview Header Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Metric 1: Revenue */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 block mb-1">
                  Today&apos;s Revenue
                </span>
                <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-[#070B28] tabular-nums">
                  {formatBDT(branch.revenueToday)}
                </div>
                <div className="mt-1 flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                  <TrendingUp className="h-3 w-3" />
                  <span>+18.4% vs last shift</span>
                </div>
              </div>

              {/* Metric 2: Orders */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 block mb-1">
                  Completed Orders
                </span>
                <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-[#070B28] tabular-nums">
                  {branch.orderCount}{" "}
                  <span className="text-xs font-normal text-slate-500">tickets</span>
                </div>
                <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-500 font-mono">
                  <Receipt className="h-3 w-3 text-slate-400" />
                  <span>Avg. ৳{Math.round(branch.revenueToday / branch.orderCount)}</span>
                </div>
              </div>

              {/* Metric 3: Alerts */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 block mb-1">
                  Inventory Alerts
                </span>
                <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-[#070B28] tabular-nums flex items-center gap-1.5">
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

            {/* Mini Hourly Volume Bar Graph */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3.5">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-medium text-[#070B28]">Hourly Register Velocity</span>
                <span className="text-[11px] font-mono text-slate-500">Shift Peak: 16:00</span>
              </div>
              <div className="flex items-end gap-1.5 h-14 pt-2">
                {branch.bars.map((val, idx) => {
                  const heightPercent = Math.max(12, Math.round((val / maxBar) * 100));
                  const isPeak = val === Math.max(...branch.bars);
                  return (
                    <div
                      key={idx}
                      className="flex-1 flex flex-col items-center justify-end h-full group relative"
                    >
                      <motion.div
                        className={`w-full rounded-t-sm transition-colors ${
                          isPeak
                            ? "bg-[#0052FF]"
                            : "bg-blue-400/35 group-hover:bg-[#0052FF]"
                        }`}
                        initial={reduceMotion ? { height: `${heightPercent}%` } : { height: 0 }}
                        animate={{ height: `${heightPercent}%` }}
                        transition={{
                          duration: reduceMotion ? 0 : 0.35,
                          delay: reduceMotion ? 0 : idx * 0.02,
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
                  <span className="text-xs font-semibold text-[#070B28] flex items-center gap-1.5">
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
                          <p className="font-medium text-[#070B28] truncate">
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
                  <span className="text-xs font-semibold text-[#070B28] flex items-center gap-1.5">
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
                            <p className="font-medium text-[#070B28] truncate">
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
              <span>Deterministic demo state</span>
            </div>
          </motion.div>
        </AnimatePresence>
      </section>
    </MotionConfig>
  );
}
