"use client";

import { useMemo, useState } from "react";
import { Banknote, Clock3, History, Plus, WalletCards } from "lucide-react";
import { toast } from "sonner";
import { DataState } from "@/components/common/data-state";
import { MetricCard } from "@/components/common/metric-card";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMockShifts } from "@/features/shifts/api/use-shifts";
import type { ShiftViewModel } from "@/features/shifts/view-models";
import { formatBDT } from "@/lib/utils";

interface DrawerAction { id: string; amount: number; note: string; createdAt: string; }

export default function ShiftsPage() {
  const query = useMockShifts();
  const [activeShift, setActiveShift] = useState<ShiftViewModel | null>(() => query.data.find((shift) => shift.status === "OPEN") ?? null);
  const [drawerActions, setDrawerActions] = useState<DrawerAction[]>([]);
  const [modal, setModal] = useState<"open" | "cash" | "close" | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const expectedCash = activeShift?.expectedCash ?? activeShift?.openingFloat ?? 0;
  const cashOut = useMemo(() => drawerActions.reduce((sum, action) => sum + action.amount, 0), [drawerActions]);

  const submitModal = () => {
    const parsed = Number(amount);
    if (!Number.isInteger(parsed) || parsed < 0 || (modal === "cash" && parsed === 0)) { toast.error("Enter a valid integer BDT amount."); return; }
    if (modal === "open") {
      setActiveShift({ id: `mock-shift-${Date.now()}`, status: "OPEN", locationId: "assigned-location", cashierId: "preview-cashier", cashierName: "Preview cashier", openingFloat: parsed, openedAt: new Date().toISOString(), expectedCash: parsed });
      toast.success("Mock shift opened.");
    } else if (modal === "cash") {
      setDrawerActions((current) => [...current, { id: `drawer-${Date.now()}`, amount: parsed, note: note.trim() || "Drawer cash-out", createdAt: new Date().toISOString() }]);
      toast.success("Mock drawer action recorded.");
    } else if (modal === "close" && activeShift) {
      setActiveShift(null); toast.success(`Mock shift closed with ${formatBDT(parsed - expectedCash + cashOut)} variance.`);
    }
    setAmount(""); setNote(""); setModal(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Shift Operations" actions={activeShift ? <Button variant="outline" onClick={() => setModal("close")}>Close shift</Button> : <Button onClick={() => setModal("open")} className="bg-[#0052FF] text-white">Open shift</Button>} />

      {query.isLoading ? <DataState data={[]} isLoading isError={false} resource="shifts" emptyTitle="No shifts recorded.">{() => null}</DataState> : query.isError ? <DataState data={[]} isLoading={false} isError resource="shifts" emptyTitle="No shifts recorded." onRetry={() => void query.refetch()}>{() => null}</DataState> : (
        <>
          <Card className="border-slate-200 p-5 shadow-xs"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2"><h2 className="font-semibold text-[#070B28]">1. Active Shift</h2><Badge variant="outline" className={activeShift ? "border-emerald-200 bg-emerald-50 text-emerald-700" : ""}>{activeShift ? "OPEN" : "NO ACTIVE SHIFT"}</Badge></div><p className="mt-1 text-sm text-slate-500">{activeShift ? `${activeShift.cashierName || "Cashier"} · Opened ${new Date(activeShift.openedAt).toLocaleString("en-BD")}` : "Checkout remains available; future orders omit shiftId."}</p></div>{activeShift ? <span className="font-mono text-xl font-bold text-[#0052FF]">{formatBDT(activeShift.openingFloat)}</span> : null}</div></Card>

          <div><h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">2. Shift Metrics</h2><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="Opening float" value={formatBDT(activeShift?.openingFloat ?? 0)} icon={WalletCards} /><MetricCard label="Expected cash" value={formatBDT(expectedCash)} icon={Banknote} /><MetricCard label="Drawer cash-outs" value={formatBDT(cashOut)} icon={Banknote} /><MetricCard label="Elapsed status" value={activeShift ? "In progress" : "Not running"} icon={Clock3} /></div></div>

          <Card className="border-slate-200 p-5 shadow-xs"><div className="flex items-start justify-between gap-4"><div><h2 className="font-semibold text-[#070B28]">3. Shift Cash Actions</h2><p className="mt-1 text-xs text-amber-700">Integration decision pending: salary advance vs. drawer cash-out. This ledger is isolated from the Shift API.</p></div><Button variant="outline" disabled={!activeShift} onClick={() => setModal("cash")}><Plus className="mr-2 h-4 w-4" />Record cash-out</Button></div>{drawerActions.length ? <div className="mt-4 divide-y rounded-lg border border-slate-200">{drawerActions.map((action) => <div key={action.id} className="flex items-center justify-between p-3 text-sm"><div><p className="font-medium">{action.note}</p><p className="text-xs text-slate-400">{new Date(action.createdAt).toLocaleString("en-BD")}</p></div><span className="font-mono text-rose-600">-{formatBDT(action.amount)}</span></div>)}</div> : <p className="mt-4 rounded-lg border border-dashed border-slate-200 p-6 text-center text-sm text-slate-400">No drawer cash actions in this mock shift.</p>}</Card>

          <Card className="overflow-hidden border-slate-200 shadow-xs"><div className="flex items-center gap-2 border-b border-slate-200 p-5"><History className="h-4 w-4 text-[#0052FF]" /><h2 className="font-semibold text-[#070B28]">4. Shift History</h2></div><DataState data={query.data.filter((shift) => shift.status === "CLOSED")} isLoading={false} isError={false} resource="shift history" emptyTitle="No shifts recorded.">{(rows) => <div className="overflow-x-auto"><Table><TableHeader className="bg-slate-50"><TableRow><TableHead>Cashier</TableHead><TableHead>Opened</TableHead><TableHead>Closed</TableHead><TableHead className="text-right">Opening float</TableHead><TableHead className="text-right">Variance</TableHead></TableRow></TableHeader><TableBody>{rows.map((shift) => <TableRow key={shift.id}><TableCell className="font-medium">{shift.cashierName}</TableCell><TableCell>{new Date(shift.openedAt).toLocaleString("en-BD")}</TableCell><TableCell>{shift.closedAt ? new Date(shift.closedAt).toLocaleString("en-BD") : "—"}</TableCell><TableCell className="text-right font-mono">{formatBDT(shift.openingFloat)}</TableCell><TableCell className="text-right font-mono">{formatBDT(shift.variance ?? 0)}</TableCell></TableRow>)}</TableBody></Table></div>}</DataState></Card>
        </>
      )}

      <Dialog open={modal !== null} onOpenChange={(open) => !open && setModal(null)}><DialogContent><DialogHeader><DialogTitle>{modal === "open" ? "Open shift" : modal === "close" ? "5. Close shift" : "Record drawer cash-out"}</DialogTitle></DialogHeader><div className="space-y-4"><div><label htmlFor="shift-amount" className="text-xs font-medium">{modal === "close" ? "Counted cash" : modal === "open" ? "Opening float" : "Amount"} (BDT)</label><Input id="shift-amount" type="number" min="0" step="1" value={amount} onChange={(event) => setAmount(event.target.value)} /></div>{modal === "cash" ? <div><label htmlFor="shift-note" className="text-xs font-medium">Note</label><Input id="shift-note" value={note} onChange={(event) => setNote(event.target.value)} /></div> : null}<Button className="w-full bg-[#0052FF] text-white" onClick={submitModal}>Save mock action</Button></div></DialogContent></Dialog>
    </div>
  );
}
