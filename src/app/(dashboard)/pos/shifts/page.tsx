"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowUpRight,
  Banknote,
  CheckCircle2,
  Clock,
  Coins,
  FileText,
  Lock,
  MoreHorizontal,
  Plus,
  Printer,
  Trash2,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { DataPagination } from "@/components/common/data-pagination";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/layout/page-header";
import { demoShifts } from "@/demo/shifts";
import { cn } from "@/lib/utils";

const fmt = (n: number) => n.toLocaleString("en-US");

interface CashAdvance {
  id: string;
  timestamp: string;
  note: string;
  amount: number;
}

export default function ShiftsPage() {
  /* ── Recent Shifts State & Pagination ── */
  const [shiftsList] = useState(demoShifts);
  const [shiftPage, setShiftPage] = useState(1);
  const [shiftPageSize, setShiftPageSize] = useState(5);
  const totalShiftPages = Math.ceil(shiftsList.length / shiftPageSize) || 1;
  const paginatedShifts = shiftsList.slice(
    (shiftPage - 1) * shiftPageSize,
    shiftPage * shiftPageSize,
  );

  /* ── Starting Cash (Opening Float) State ── */
  const [openingFloat, setOpeningFloat] = useState(10000);
  const [openingFloatInput, setOpeningFloatInput] = useState("10000");

  /* ── Cash Sales ── */
  const [cashSales] = useState(24820);

  /* ── Advance Ledger State (Only Amount + Reason, will be deducted from salary) ── */
  const [advances, setAdvances] = useState<CashAdvance[]>([
    {
      id: "adv-1",
      timestamp: "Today, 11:30 AM",
      note: "Lunch & Staff Refreshment",
      amount: 350,
    },
    {
      id: "adv-2",
      timestamp: "Today, 01:15 PM",
      note: "Emergency Cashier Advance",
      amount: 1000,
    },
  ]);

  const [advanceAmountInput, setAdvanceAmountInput] = useState("");
  const [advanceNoteInput, setAdvanceNoteInput] = useState("");

  const totalAdvances = advances.reduce((sum, a) => sum + a.amount, 0);
  const expectedInDrawer = openingFloat + cashSales - totalAdvances;

  /* ── Reconciliation State (Counted Drawer Input) ── */
  const [countedCash, setCountedCash] = useState(expectedInDrawer.toString());
  const countedNum = parseFloat(countedCash) || 0;
  const variance = countedNum - expectedInDrawer;

  const handleUpdateOpeningFloat = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const val = parseFloat(openingFloatInput);
    if (isNaN(val) || val < 0) {
      toast.error("Please enter a valid starting cash amount.");
      return;
    }
    setOpeningFloat(val);
    const newExpected = val + cashSales - totalAdvances;
    setCountedCash(newExpected.toString());
    toast.success(`Starting cash updated: ${fmt(val)} BDT`);
  };

  const handleWithdrawAdvance = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const amount = parseFloat(advanceAmountInput);
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid advance amount.");
      return;
    }
    if (!advanceNoteInput.trim()) {
      toast.error("Please enter a reason or note for this advance.");
      return;
    }

    const timeString = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const newAdvance: CashAdvance = {
      id: `adv-${Date.now()}`,
      timestamp: `Today, ${timeString}`,
      note: advanceNoteInput.trim(),
      amount,
    };

    setAdvances([newAdvance, ...advances]);
    setAdvanceAmountInput("");
    setAdvanceNoteInput("");
    toast.success(`Recorded advance: -${fmt(amount)} BDT (will be deducted from salary)`);
  };

  const handleDeleteAdvance = (id: string) => {
    const target = advances.find((a) => a.id === id);
    if (!target) return;
    setAdvances((prev) => prev.filter((a) => a.id !== id));
    toast.info(`Voided advance. Restored ${fmt(target.amount)} BDT to drawer.`);
  };

  const handleCloseShift = () => {
    if (variance !== 0) {
      toast.warning(
        `Drawer discrepancy detected: ${variance > 0 ? "+" : ""}${fmt(variance)} BDT. Supervisor PIN required to seal.`,
      );
    } else {
      toast.success(
        "Shift successfully balanced & locked. Z-Audit slip sent to thermal printer.",
      );
    }
  };

  return (
    <div className="space-y-7 font-sans pb-12">
      {/* ═══ Standardized Page Header ═══ */}
      <PageHeader
        title="Shift Balancing"
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => toast.success("Generating Shift X-Report audit slip…")}
            className="h-9 px-4 gap-2 text-xs font-semibold border-slate-200 text-[#070B28] bg-white hover:bg-slate-50 cursor-pointer shadow-2xs"
          >
            <Printer className="h-3.5 w-3.5 text-slate-500" />
            <span>Print X-Report</span>
          </Button>
        }
      />

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 1: STARTING CASH (OPENING FLOAT) CONFIGURATION BAR               */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[#0052FF] shrink-0">
            <Banknote className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#070B28]">Starting Cash (Opening Float)</h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Initial cash placed in the register drawer at the start of this shift.
            </p>
          </div>
        </div>

        <form onSubmit={handleUpdateOpeningFloat} className="flex items-center gap-2.5 sm:self-center">
          <div className="relative w-44">
            <Input
              type="number"
              min="0"
              step="any"
              value={openingFloatInput}
              onChange={(e) => setOpeningFloatInput(e.target.value)}
              className="min-h-11 h-11 pr-14 font-mono text-base font-bold text-[#070B28] rounded-xl border-slate-200 focus-visible:ring-2 focus-visible:ring-[#0052FF]/20 focus-visible:border-[#0052FF]"
              placeholder="10000"
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-mono text-xs font-semibold text-slate-400">
              BDT
            </span>
          </div>

          <Button
            type="submit"
            className="min-h-11 h-11 px-5 bg-[#0052FF] hover:bg-[#0047E0] text-white text-xs font-semibold rounded-xl shadow-xs cursor-pointer transition-colors shrink-0"
          >
            Set Float
          </Button>
        </form>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 2: EXECUTIVE SHIFT METRICS HUD (Symmetrical 4-Card Grid)       */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 w-full">
        {/* Opening Float Card */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Opening Float
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
              <Banknote className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="font-mono text-2xl sm:text-3xl font-bold text-[#070B28] tabular-nums">
              {fmt(openingFloat)}
            </span>
            <span className="text-xs font-medium text-slate-400 font-sans">BDT</span>
          </div>
          <p className="mt-2 text-xs text-slate-500">Verified starting drawer cash</p>
        </div>

        {/* Cash Sales Card */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Cash Sales (In)
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <Coins className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="font-mono text-2xl sm:text-3xl font-bold text-emerald-600 tabular-nums">
              +{fmt(cashSales)}
            </span>
            <span className="text-xs font-medium text-slate-400 font-sans">BDT</span>
          </div>
          <p className="mt-2 text-xs text-emerald-600/90 font-medium">
            32 settled cash transactions
          </p>
        </div>

        {/* Advances Out Card */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs flex flex-col justify-between ring-1 ring-rose-500/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-500">
              Advances Out
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="font-mono text-2xl sm:text-3xl font-bold text-rose-600 tabular-nums">
              -{fmt(totalAdvances)}
            </span>
            <span className="text-xs font-medium text-slate-400 font-sans">BDT</span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {advances.length} shift {advances.length === 1 ? "withdrawal" : "withdrawals"}
          </p>
        </div>

        {/* Expected in Drawer Card */}
        <div className="rounded-2xl border border-[#0052FF]/20 bg-gradient-to-br from-blue-50/50 to-white p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#0052FF]">
              Expected in Drawer
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0052FF]/10 text-[#0052FF]">
              <Lock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="font-mono text-2xl sm:text-3xl font-bold text-[#070B28] tabular-nums">
              {fmt(expectedInDrawer)}
            </span>
            <span className="text-xs font-medium text-slate-400 font-sans">BDT</span>
          </div>
          <p className="mt-2 text-xs text-slate-500 font-mono">
            Float + Sales - Advances
          </p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 3: CASH ADVANCE LEDGER (CLEAN 2-FIELD FORM, NO CLUTTER)         */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="rounded-2xl bg-white border border-slate-200/90 shadow-sm overflow-hidden w-full">
        {/* Clean Header: Simple English, One-line description, No active shift badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 border-b border-slate-100 bg-slate-50/40">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600 shadow-2xs shrink-0">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#070B28] tracking-tight">
                Cash Advance Ledger
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Cash advances given to staff during shift. These will be deducted from salary.
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right shrink-0">
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-400 block">
              Total Advances Out
            </span>
            <span className="font-mono text-xl sm:text-2xl font-bold text-rose-600 tabular-nums">
              -{fmt(totalAdvances)}{" "}
              <span className="text-xs font-medium text-slate-500 font-sans">BDT</span>
            </span>
          </div>
        </div>

        {/* Clean Form: Only 2 inputs (Amount + Reason) + Symmetrical Button */}
        <div className="p-5 sm:p-6 bg-white border-b border-slate-100">
          <form onSubmit={handleWithdrawAdvance}>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              {/* Field 1: Amount (BDT) */}
              <div className="md:col-span-4 space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block">
                  Amount (BDT) *
                </label>
                <div className="relative">
                  <Input
                    type="number"
                    min="1"
                    step="any"
                    value={advanceAmountInput}
                    onChange={(e) => setAdvanceAmountInput(e.target.value)}
                    placeholder="0"
                    className="min-h-12 h-12 pr-14 font-mono text-lg font-bold text-[#070B28] tabular-nums rounded-xl border-slate-200 focus-visible:ring-2 focus-visible:ring-[#0052FF]/20 focus-visible:border-[#0052FF]"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-mono text-xs font-semibold text-slate-400">
                    BDT
                  </span>
                </div>
              </div>

              {/* Field 2: Reason / Note */}
              <div className="md:col-span-6 space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block">
                  Reason *
                </label>
                <Input
                  value={advanceNoteInput}
                  onChange={(e) => setAdvanceNoteInput(e.target.value)}
                  placeholder="e.g. Lunch expense, emergency advance..."
                  className="min-h-12 h-12 text-sm sm:text-base font-medium text-[#070B28] rounded-xl border-slate-200 focus-visible:ring-2 focus-visible:ring-[#0052FF]/20 focus-visible:border-[#0052FF]"
                />
              </div>

              {/* Action Button */}
              <div className="md:col-span-2">
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="min-h-12 h-12 w-full rounded-xl bg-[#0052FF] hover:bg-[#0047E0] text-white text-sm font-semibold shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors border-0 outline-none"
                >
                  <Plus className="h-4 w-4" />
                  <span>Record Advance</span>
                </motion.button>
              </div>
            </div>
          </form>
        </div>

        {/* Advance Ledger Table: Symmetrical, No IDs, Clean Rows */}
        <div className="overflow-x-auto">
          <Table className="w-full">
            <TableHeader className="bg-slate-50/80 border-b border-slate-200/80">
              <TableRow className="hover:bg-transparent">
                <TableHead className="py-3 px-5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 w-44">
                  Time
                </TableHead>
                <TableHead className="py-3 px-5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Reason
                </TableHead>
                <TableHead className="py-3 px-5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 w-44">
                  Amount (BDT)
                </TableHead>
                <TableHead className="py-3 px-5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 w-20">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100">
              <AnimatePresence initial={false}>
                {advances.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-10 text-center">
                      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                        <Wallet className="h-5 w-5" strokeWidth={1.5} />
                      </div>
                      <p className="mt-2.5 text-sm font-semibold text-[#070B28]">
                        No advances issued this shift
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        Use the form above to record staff meal allowances or emergency cash payouts.
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  advances.map((adv) => (
                    <motion.tr
                      key={adv.id}
                      layout
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -12 }}
                      transition={{ duration: 0.18 }}
                      className="group h-14 hover:bg-slate-50/80 transition-colors"
                    >
                      {/* Time (Clean font, NO ID number) */}
                      <TableCell className="py-3.5 px-5">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="font-mono text-xs sm:text-sm font-medium text-slate-600 tabular-nums">
                            {adv.timestamp}
                          </span>
                        </div>
                      </TableCell>

                      {/* Reason (Clean primary font, single line, NO ID) */}
                      <TableCell className="py-3.5 px-5">
                        <p className="text-sm sm:text-base font-semibold text-[#070B28] leading-tight">
                          {adv.note}
                        </p>
                      </TableCell>

                      {/* Amount (Tabular BDT figures) */}
                      <TableCell className="py-3.5 px-5 text-right">
                        <span className="font-mono text-base sm:text-lg font-bold text-rose-600 tabular-nums">
                          -{fmt(adv.amount)}
                        </span>
                        <span className="ml-1 text-xs font-semibold text-slate-400">BDT</span>
                      </TableCell>

                      {/* Action */}
                      <TableCell className="py-3.5 px-5 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteAdvance(adv.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer border-0 outline-none ml-auto"
                          title="Void advance"
                          aria-label="Void advance"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </TableCell>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </TableBody>
          </Table>
        </div>

        {/* Ledger Summary Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-200/80 bg-slate-50/60 px-5 sm:px-6 py-3.5 gap-2">
          <span className="text-xs font-medium text-slate-500">
            Showing {advances.length} shift {advances.length === 1 ? "record" : "records"} · Subtracted from drawer cash and future cashier payroll
          </span>
          <div className="flex items-center gap-2 text-sm font-semibold text-[#070B28]">
            <span className="text-slate-500 font-normal">Disbursements Total:</span>
            <span className="font-mono text-base font-bold text-rose-600 tabular-nums">
              -{fmt(totalAdvances)} BDT
            </span>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 4: CASH DRAWER RECONCILIATION & SHIFT SEAL                     */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="rounded-2xl bg-white border border-slate-200/90 shadow-sm p-6 sm:p-7 w-full space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-[#070B28] tracking-tight">
              Cash Drawer Reconciliation & Shift Seal
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Count cash in register drawer to calculate variance against expected balance.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCountedCash(expectedInDrawer.toString())}
            className="self-start sm:self-auto text-xs font-semibold text-[#0052FF] hover:text-[#0047E0] bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer border-0 outline-none"
          >
            Match Expected ({fmt(expectedInDrawer)} BDT)
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Physical Cash Input (Kept in drawer section as requested) */}
          <div className="lg:col-span-5 space-y-2">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block">
              Physical Cash Counted in Drawer *
            </label>
            <div className="relative">
              <Input
                type="number"
                value={countedCash}
                onChange={(e) => setCountedCash(e.target.value)}
                placeholder="0"
                className="min-h-16 h-16 border-slate-200 pr-16 font-mono text-2xl sm:text-3xl font-bold text-[#070B28] tabular-nums rounded-xl focus-visible:ring-2 focus-visible:ring-[#0052FF]/20 focus-visible:border-[#0052FF]"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-sm font-bold text-slate-400">
                BDT
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Include all bills and coins currently in cash drawer
            </p>
          </div>

          {/* Audit Breakdown Cards */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Expected Summary */}
            <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
                Net System Expected
              </span>
              <p className="font-mono text-xl sm:text-2xl font-bold text-[#070B28] mt-1 tabular-nums">
                {fmt(expectedInDrawer)}{" "}
                <span className="text-xs font-normal text-slate-400 font-sans">BDT</span>
              </p>
              <p className="text-[11px] text-slate-500 mt-1 font-mono">
                {fmt(openingFloat)} + {fmt(cashSales)} - {fmt(totalAdvances)}
              </p>
            </div>

            {/* Live Variance */}
            <div
              className={cn(
                "rounded-xl border p-4 transition-colors",
                variance === 0
                  ? "bg-emerald-50/60 border-emerald-200 text-emerald-950"
                  : "bg-rose-50/60 border-rose-200 text-rose-950",
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Variance
                </span>
                {variance === 0 ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Balanced
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700">
                    <AlertTriangle className="h-3.5 w-3.5" /> Discrepancy
                  </span>
                )}
              </div>
              <p
                className={cn(
                  "font-mono text-xl sm:text-2xl font-bold mt-1 tabular-nums",
                  variance === 0 ? "text-emerald-600" : "text-rose-600",
                )}
              >
                {variance === 0 ? "0" : `${variance > 0 ? "+" : ""}${fmt(variance)}`}{" "}
                <span className="text-xs font-normal text-slate-500 font-sans">BDT</span>
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                {variance === 0
                  ? "Audit clear. Drawer matches ledger."
                  : variance > 0
                  ? "Cash surplus. Review untracked cash sales."
                  : "Cash deficit. Verify unlogged advances."}
              </p>
            </div>
          </div>
        </div>

        {/* Seal Shift Action Bar (NO auto description text) */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            onClick={() => toast.success("Drafting shift summary report...")}
            className="min-h-12 h-12 px-5 text-sm font-semibold border-slate-200 text-[#070B28] hover:bg-slate-50 cursor-pointer"
          >
            Save Draft
          </Button>
          <motion.button
            type="button"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleCloseShift}
            className="min-h-12 h-12 px-7 bg-[#0052FF] hover:bg-[#0047E0] text-white text-sm font-semibold rounded-xl shadow-xs cursor-pointer transition-colors flex items-center justify-center gap-2 border-0 outline-none"
          >
            <Lock className="h-4 w-4" />
            <span>Close Shift & Seal Drawer</span>
          </motion.button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 5: HISTORICAL SHIFTS AUDIT LOG (Clean Symmetrical Typography)    */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="space-y-4 w-full">
        {/* Title: Proper size & weight, clean alignment, NO branch name */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg sm:text-xl font-semibold text-[#070B28] tracking-tight">
              Recent Shifts Audit Log
            </h2>
            <span className="inline-flex items-center justify-center h-5 min-w-5 px-2 rounded-full bg-slate-100 text-xs font-semibold text-slate-600 tabular-nums">
              {shiftsList.length}
            </span>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200/90 shadow-xs overflow-hidden">
          <Table className="w-full text-sm">
            <TableHeader className="bg-slate-50/80 border-b border-slate-200">
              <TableRow className="hover:bg-transparent">
                <TableHead className="py-3.5 px-4 text-slate-500 font-semibold uppercase tracking-wider text-xs">
                  Shift Code
                </TableHead>
                <TableHead className="py-3.5 px-4 text-slate-500 font-semibold uppercase tracking-wider text-xs">
                  Cashier & Register
                </TableHead>
                <TableHead className="py-3.5 px-4 text-right text-slate-500 font-semibold uppercase tracking-wider text-xs">
                  Float (BDT)
                </TableHead>
                <TableHead className="py-3.5 px-4 text-right text-slate-500 font-semibold uppercase tracking-wider text-xs">
                  Counted (BDT)
                </TableHead>
                <TableHead className="py-3.5 px-4 text-right text-slate-500 font-semibold uppercase tracking-wider text-xs">
                  Variance
                </TableHead>
                <TableHead className="py-3.5 px-4 text-center text-slate-500 font-semibold uppercase tracking-wider text-xs">
                  Status
                </TableHead>
                <TableHead className="py-3.5 px-4 text-right text-slate-500 font-semibold uppercase tracking-wider text-xs w-16">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100">
              {paginatedShifts.map((sh) => (
                <TableRow
                  key={sh.id}
                  className="h-14 hover:bg-slate-50/70 transition-colors"
                >
                  <TableCell className="py-3 px-4">
                    <span className="font-mono text-sm font-semibold text-[#070B28] tabular-nums">
                      {sh.shiftCode}
                    </span>
                    <span className="block text-xs text-slate-400 font-normal mt-0.5">
                      {sh.openedAt}
                    </span>
                  </TableCell>

                  <TableCell className="py-3 px-4">
                    <span className="text-sm font-semibold text-[#070B28]">
                      {sh.cashierName}
                    </span>
                    <span className="block text-xs text-slate-400 mt-0.5">
                      {sh.terminalLane}
                    </span>
                  </TableCell>

                  <TableCell className="py-3 px-4 text-right font-mono text-sm text-slate-600 tabular-nums">
                    {sh.openingFloat.toLocaleString("en-BD")}
                  </TableCell>

                  <TableCell className="py-3 px-4 text-right font-mono text-sm font-semibold text-[#070B28] tabular-nums">
                    {sh.countedCash.toLocaleString("en-BD")}
                  </TableCell>

                  <TableCell
                    className={`py-3 px-4 text-right font-mono text-sm font-semibold tabular-nums ${
                      sh.variance === 0
                        ? "text-emerald-600"
                        : "text-rose-600"
                    }`}
                  >
                    {sh.variance === 0
                      ? "0"
                      : `${sh.variance > 0 ? "+" : ""}${sh.variance}`}
                  </TableCell>

                  <TableCell className="py-3 px-4 text-center">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold">
                      <span
                        className={`inline-block h-2 w-2 rounded-full ${
                          sh.status === "OPEN"
                            ? "bg-[#0052FF]"
                            : sh.status === "BALANCED"
                              ? "bg-emerald-500"
                              : "bg-slate-400"
                        }`}
                      />
                      <span
                        className={
                          sh.status === "OPEN"
                            ? "text-[#0052FF]"
                            : sh.status === "BALANCED"
                              ? "text-emerald-600"
                              : "text-slate-500"
                        }
                      >
                        {sh.status === "OPEN"
                          ? "Open"
                          : sh.status === "BALANCED"
                            ? "Balanced"
                            : "Closed"}
                      </span>
                    </span>
                  </TableCell>

                  <TableCell className="py-3 px-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-[#070B28] hover:bg-slate-100 cursor-pointer transition-colors"
                          title="Shift actions"
                          aria-label="Shift actions"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 bg-white border-slate-200 shadow-xl rounded-xl p-1.5 z-50">
                        <DropdownMenuItem
                          onClick={() => toast.info(`Viewing Z-Audit for shift #${sh.shiftCode}`)}
                          className="flex items-center gap-2.5 py-2 px-3 text-xs font-semibold text-[#070B28] hover:bg-slate-50 cursor-pointer rounded-lg transition-colors"
                        >
                          <FileText className="h-4 w-4 text-slate-500" />
                          <span>View Shift Details</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => toast.success(`Reprinting Z-Report slip for shift #${sh.shiftCode}...`)}
                          className="flex items-center gap-2.5 py-2 px-3 text-xs font-semibold text-[#070B28] hover:bg-slate-50 cursor-pointer rounded-lg transition-colors"
                        >
                          <Printer className="h-4 w-4 text-[#0052FF]" />
                          <span>Reprint Slip</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => toast.success(`Audit status verified for ${sh.shiftCode}`)}
                          className="flex items-center gap-2.5 py-2 px-3 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 cursor-pointer rounded-lg transition-colors"
                        >
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          <span>Verify Audit</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Reusable DataPagination */}
          <div className="border-t border-slate-200 bg-white px-4 py-1.5">
            <DataPagination
              currentPage={shiftPage}
              totalPages={totalShiftPages}
              totalItems={shiftsList.length}
              pageSize={shiftPageSize}
              onPageChange={setShiftPage}
              onPageSizeChange={(newSize) => {
                setShiftPageSize(newSize);
                setShiftPage(1);
              }}
              pageSizeOptions={[5, 10, 20]}
              itemLabel="shifts"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
