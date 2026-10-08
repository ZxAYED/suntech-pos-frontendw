"use client";

import { useState } from "react";
import { CheckCircle2, FileText, Lock, MoreHorizontal, Plus, Printer, Trash2 } from "lucide-react";
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

  /* ── Active Shift Core Metrics ── */
  const openingFloat = 10000;
  const cashSales = 24820;

  /* ── Advance Ledger State ── */
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

  /* ── Reconciliation State ── */
  const [countedCash, setCountedCash] = useState(expectedInDrawer.toString());
  const countedNum = parseFloat(countedCash) || 0;
  const variance = countedNum - expectedInDrawer;

  const handleWithdrawAdvance = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const amount = parseFloat(advanceAmountInput);
    if (!amount || amount <= 0) {
      toast.error("Enter a valid advance amount.");
      return;
    }
    if (!advanceNoteInput.trim()) {
      toast.error("Enter a reason for this advance.");
      return;
    }

    setAdvances([
      {
        id: `adv-${Date.now()}`,
        timestamp: "Just now",
        note: advanceNoteInput.trim(),
        amount,
      },
      ...advances,
    ]);
    setAdvanceAmountInput("");
    setAdvanceNoteInput("");
    toast.success(`Withdrew ${fmt(amount)} BDT advance.`);
  };

  const handleCloseShift = () => {
    if (variance !== 0) {
      toast.warning(
        `Drawer variance of ${variance > 0 ? "+" : ""}${fmt(variance)} BDT. Supervisor sign-off required.`,
      );
    } else {
      toast.success(
        "Shift balanced & sealed. Z-Audit slip printed.",
      );
    }
  };

  return (
    <div className="space-y-6 font-sans select-none">
      {/* ═══ Standardized Page Header ═══ */}
      <PageHeader
        title="Shift Balancing"
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => toast.success("Printing Shift X-Report…")}
            className="h-9 px-4 gap-2 text-xs font-medium border-slate-200 text-[#070B28] bg-white hover:bg-slate-50 cursor-pointer shadow-2xs"
          >
            <Printer className="h-3.5 w-3.5 text-slate-400" />
            Print X-Report
          </Button>
        }
      />

      {/* ═══ Horizontal 4-Stat Metric Row ═══ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 rounded-xl bg-white border border-slate-200 p-5 shadow-xs">
        <StatBlock label="Opening Float" value={fmt(openingFloat)} suffix="BDT" />
        <StatBlock
          label="Cash Sales"
          value={`+${fmt(cashSales)}`}
          suffix="BDT"
          valueClass="text-emerald-600"
        />
        <StatBlock
          label="Advances Out"
          value={`-${fmt(totalAdvances)}`}
          suffix="BDT"
          valueClass="text-rose-600"
        />
        <StatBlock
          label="Expected in Drawer"
          value={fmt(expectedInDrawer)}
          suffix="BDT"
        />
      </div>

      {/* ═══ Main Two-Column Grid ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ── LEFT: Drawer Reconciliation ── */}
        <div className="lg:col-span-7 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="p-6 space-y-5">
            {/* Cash Input — the hero interaction */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-500">
                Counted Cash in Drawer
              </label>
              <div className="relative">
                <Input
                  type="number"
                  value={countedCash}
                  onChange={(e) => setCountedCash(e.target.value)}
                  placeholder="0"
                  className="min-h-14 h-14 border-slate-200 pr-16 font-mono text-2xl font-bold text-[#070B28] tabular-nums"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-sm font-medium text-slate-400">
                  BDT
                </span>
              </div>
            </div>

            {/* Expected vs Variance — single row */}
            <div className="flex items-center gap-6 rounded-lg bg-slate-50 border border-slate-100 px-5 py-4">
              <div className="flex-1">
                <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 block">
                  Expected
                </span>
                <p className="font-mono text-lg font-medium text-[#070B28] mt-0.5 tabular-nums">
                  {fmt(expectedInDrawer)}{" "}
                  <span className="text-xs font-normal text-slate-400 font-sans">
                    BDT
                  </span>
                </p>
              </div>
              <div className="w-px h-10 bg-slate-200" />
              <div className="flex-1">
                <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 block">
                  Variance
                </span>
                <p
                  className={`font-mono text-lg font-medium mt-0.5 tabular-nums ${
                    variance === 0 ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {variance === 0
                    ? "0"
                    : `${variance > 0 ? "+" : ""}${fmt(variance)}`}{" "}
                  <span className="text-xs font-normal text-slate-400 font-sans">
                    BDT
                  </span>
                </p>
              </div>
            </div>

            {/* Close Shift CTA */}
            <Button
              type="button"
              onClick={handleCloseShift}
              className="min-h-12 h-12 w-full bg-[#0052FF] hover:bg-[#0052FF]/90 text-white text-sm font-medium shadow-xs cursor-pointer transition-colors gap-2"
            >
              <Lock className="h-4 w-4" />
              Close Shift & Seal Drawer
            </Button>
          </div>
        </div>

        {/* ── RIGHT: Advance Ledger ── */}
        <div className="lg:col-span-5 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="p-5 space-y-4">
            {/* Header row */}
            <div className="flex items-center justify-between">
              <h2 className="text-[13px] font-semibold text-[#070B28]">
                Advance Ledger
              </h2>
              <span className="font-mono text-xs font-medium text-slate-400 tabular-nums">
                {fmt(totalAdvances)} BDT out
              </span>
            </div>

            {/* Inline Add Form */}
            <form
              onSubmit={handleWithdrawAdvance}
              className="flex items-center gap-2"
            >
              <div className="relative w-[120px] flex-shrink-0">
                <Input
                  type="number"
                  min="1"
                  value={advanceAmountInput}
                  onChange={(e) => setAdvanceAmountInput(e.target.value)}
                  placeholder="Amount"
                  className="min-h-9 h-9 pr-10 font-mono text-xs font-medium text-[#070B28] tabular-nums"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 font-mono text-[10px] font-medium text-slate-400">
                  BDT
                </span>
              </div>
              <Input
                value={advanceNoteInput}
                onChange={(e) => setAdvanceNoteInput(e.target.value)}
                placeholder="Reason / note"
                className="min-h-9 h-9 flex-1 text-xs font-medium text-[#070B28]"
              />
              <Button
                type="submit"
                variant="outline"
                className="min-h-9 h-9 px-3 border-[#0052FF] text-[#0052FF] hover:bg-[#0052FF]/5 font-medium text-xs cursor-pointer shadow-2xs gap-1 flex-shrink-0"
              >
                <Plus className="h-3 w-3" />
                Add
              </Button>
            </form>

            {/* Advance Ledger Table */}
            <div className="border-t border-slate-100 pt-3">
              <div className="rounded-lg border border-slate-200 overflow-hidden">
                <Table className="w-full text-xs">
                  <TableHeader className="bg-slate-50/80 border-b border-slate-200">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="py-2 px-3 text-left text-slate-400 font-medium uppercase tracking-wider text-xs">
                        Time
                      </TableHead>
                      <TableHead className="py-2 px-3 text-left text-slate-400 font-medium uppercase tracking-wider text-xs">
                        Note
                      </TableHead>
                      <TableHead className="py-2 px-3 text-right text-slate-400 font-medium uppercase tracking-wider text-xs">
                        Amount
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-slate-100">
                    {advances.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={3}
                          className="py-8 text-center text-xs text-slate-400"
                        >
                          No advances taken this shift.
                        </TableCell>
                      </TableRow>
                    ) : (
                      advances.map((adv) => (
                        <TableRow
                          key={adv.id}
                          className="h-10 hover:bg-slate-50/60"
                        >
                          <TableCell className="py-2 px-3 text-slate-400 font-mono text-[11px] tabular-nums">
                            {adv.timestamp}
                          </TableCell>
                          <TableCell className="py-2 px-3 font-medium text-slate-700 text-xs">
                            {adv.note}
                          </TableCell>
                          <TableCell className="py-2 px-3 text-right font-mono font-medium text-[#070B28] tabular-nums text-xs">
                            {fmt(adv.amount)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Historical Shifts ═══ */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="text-[13px] font-semibold text-[#070B28]">
            Recent Shifts
          </h2>
          <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-slate-100 text-[10px] font-medium text-slate-500 tabular-nums">
            {shiftsList.length}
          </span>
        </div>

        <div className="rounded-xl bg-white border border-slate-200 shadow-xs overflow-hidden">
          <Table className="w-full text-sm">
            <TableHeader className="bg-slate-50/80 border-b border-slate-200">
              <TableRow className="hover:bg-transparent">
                <TableHead className="py-2.5 px-4 text-slate-400 font-medium uppercase tracking-wider text-xs">
                  Shift Code
                </TableHead>
                <TableHead className="py-2.5 px-4 text-slate-400 font-medium uppercase tracking-wider text-xs">
                  Cashier
                </TableHead>
                <TableHead className="py-2.5 px-4 text-right text-slate-400 font-medium uppercase tracking-wider text-xs">
                  Float
                </TableHead>
                <TableHead className="py-2.5 px-4 text-right text-slate-400 font-medium uppercase tracking-wider text-xs">
                  Counted
                </TableHead>
                <TableHead className="py-2.5 px-4 text-right text-slate-400 font-medium uppercase tracking-wider text-xs">
                  Variance
                </TableHead>
                <TableHead className="py-2.5 px-4 text-center text-slate-400 font-medium uppercase tracking-wider text-xs">
                  Status
                </TableHead>
                <TableHead className="py-2.5 px-4 text-right text-slate-400 font-medium uppercase tracking-wider text-xs w-16">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100">
              {paginatedShifts.map((sh) => (
                <TableRow
                  key={sh.id}
                  className="h-11 hover:bg-slate-50/70 transition-colors"
                >
                  <TableCell className="py-2.5 px-4">
                    <span className="font-mono text-sm font-medium text-[#070B28] tabular-nums">
                      {sh.shiftCode}
                    </span>
                    <span className="block text-[11px] text-slate-400 font-normal mt-0.5">
                      {sh.openedAt}
                    </span>
                  </TableCell>

                  <TableCell className="py-2.5 px-4">
                    <span className="text-sm font-medium text-[#070B28]">
                      {sh.cashierName}
                    </span>
                    <span className="block text-[11px] text-slate-400 mt-0.5">
                      {sh.terminalLane}
                    </span>
                  </TableCell>

                  <TableCell className="py-2.5 px-4 text-right font-mono text-sm text-slate-600 tabular-nums">
                    {sh.openingFloat.toLocaleString("en-BD")}
                  </TableCell>

                  <TableCell className="py-2.5 px-4 text-right font-mono text-sm font-medium text-[#070B28] tabular-nums">
                    {sh.countedCash.toLocaleString("en-BD")}
                  </TableCell>

                  <TableCell
                    className={`py-2.5 px-4 text-right font-mono text-sm font-medium tabular-nums ${
                      sh.variance === 0
                        ? "text-emerald-600"
                        : "text-rose-600"
                    }`}
                  >
                    {sh.variance === 0
                      ? "0"
                      : `${sh.variance > 0 ? "+" : ""}${sh.variance}`}
                  </TableCell>

                  <TableCell className="py-2.5 px-4 text-center">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                      <span
                        className={`inline-block h-1.5 w-1.5 rounded-full ${
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

                  <TableCell className="py-2.5 px-4 text-right">
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
                      <DropdownMenuContent align="end" className="w-48 bg-white border-slate-200 shadow-xl rounded-lg p-1.5 z-50">
                        <DropdownMenuItem
                          onClick={() => toast.info(`Viewing Z-Audit for shift #${sh.shiftCode}`)}
                          className="flex items-center gap-2.5 py-2 px-3 text-xs font-medium text-[#070B28] hover:bg-slate-50 cursor-pointer rounded-md transition-colors"
                        >
                          <FileText className="h-4 w-4 text-slate-500" />
                          <span>View Shift Details</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => toast.success(`Reprinting Z-Report slip for shift #${sh.shiftCode}...`)}
                          className="flex items-center gap-2.5 py-2 px-3 text-xs font-medium text-[#070B28] hover:bg-slate-50 cursor-pointer rounded-md transition-colors"
                        >
                          <Printer className="h-4 w-4 text-[#0052FF]" />
                          <span>Reprint Slip</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => toast.success(`Audit status verified for ${sh.shiftCode}`)}
                          className="flex items-center gap-2.5 py-2 px-3 text-xs font-medium text-emerald-600 hover:bg-emerald-50 cursor-pointer rounded-md transition-colors"
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
          <div className="border-t border-slate-200 bg-white px-4 py-1">
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

/* ── Stat Block Sub-component ── */
function StatBlock({
  label,
  value,
  suffix,
  valueClass = "text-[#070B28]",
}: {
  label: string;
  value: string;
  suffix?: string;
  valueClass?: string;
}) {
  return (
    <div>
      <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 block">
        {label}
      </span>
      <p className={`font-mono text-2xl font-bold mt-1 tabular-nums ${valueClass}`}>
        {value}{" "}
        {suffix && (
          <span className="text-xs font-normal text-slate-400 font-sans">
            {suffix}
          </span>
        )}
      </p>
    </div>
  );
}
