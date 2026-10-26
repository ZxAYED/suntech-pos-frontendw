"use client";

import { useMemo, useState } from "react";
import { Banknote, History, Plus, WalletCards } from "lucide-react";
import { toast } from "sonner";
import { DataState, TenantRequiredState } from "@/components/common/data-state";
import { MetricCard } from "@/components/common/metric-card";
import { SegmentedTabs } from "@/components/common/segmented-tabs";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMockAdvances, useMockPayroll, useMockStaff } from "@/features/hr/api/use-hr";
import { useTenantScope } from "@/features/tenant/hooks/use-tenant-scope";
import { formatBDT } from "@/lib/utils";

export function PayrollManager() {
  const tenant = useTenantScope("admin");
  const payroll = useMockPayroll();
  const advances = useMockAdvances();
  const staff = useMockStaff();
  const [tab, setTab] = useState<"payroll" | "advances">("payroll");
  const [dialog, setDialog] = useState<"process" | "advance" | "disburse" | "void" | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const totals = useMemo(() => ({ base: payroll.data.reduce((sum, row) => sum + row.baseSalary, 0), advances: payroll.data.reduce((sum, row) => sum + row.advancesTotal, 0), payable: payroll.data.reduce((sum, row) => sum + row.netPayable, 0) }), [payroll.data]);
  if (!tenant.isTenantReady) return <TenantRequiredState />;

  const save = () => {
    if (dialog === "advance" && (!selectedId || !Number.isInteger(Number(amount)) || Number(amount) <= 0)) { toast.error("Choose a cashier and enter a positive integer BDT amount."); return; }
    toast.success(`${dialog === "advance" ? "Advance created" : dialog === "void" ? "Advance voided" : dialog === "disburse" ? "Payroll disbursement" : "Payroll processing"} in mock state.`);
    setDialog(null); setSelectedId(""); setAmount(""); setNote("");
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Payroll & Advances" actions={<Button onClick={() => setDialog(tab === "payroll" ? "process" : "advance")} className="bg-[#0052FF] text-white hover:bg-[#0047E0]">{tab === "payroll" ? <WalletCards className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}{tab === "payroll" ? "Process payroll" : "Create advance"}</Button>} />
      <SegmentedTabs tabs={[{ id: "payroll", label: "Payroll" }, { id: "advances", label: "Advances" }]} activeTab={tab} onChange={setTab} />

      {tab === "payroll" ? <>
        <div className="grid gap-4 sm:grid-cols-3"><MetricCard label="Base compensation" value={formatBDT(totals.base)} icon={Banknote} /><MetricCard label="Advance deductions" value={formatBDT(totals.advances)} icon={History} /><MetricCard label="Net payable" value={formatBDT(totals.payable)} icon={WalletCards} /></div>
        <DataState data={payroll.data} isLoading={payroll.isLoading} isError={payroll.isError} resource="payroll" emptyTitle="No payroll records for this period." onRetry={() => void payroll.refetch()}>{(rows) => <Card className="overflow-hidden border-slate-200 shadow-xs"><div className="overflow-x-auto"><Table><TableHeader className="bg-slate-50"><TableRow><TableHead>Employee</TableHead><TableHead>Period</TableHead><TableHead className="text-right">Base salary</TableHead><TableHead className="text-right">Advances</TableHead><TableHead className="text-right">Net payable</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader><TableBody>{rows.map((row) => <TableRow key={row.id}><TableCell><p className="font-medium text-[#070B28]">{row.employeeName}</p><p className="font-mono text-xs text-slate-400">{row.employeePublicId}</p></TableCell><TableCell>{row.periodLabel}</TableCell><TableCell className="text-right font-mono">{formatBDT(row.baseSalary)}</TableCell><TableCell className="text-right font-mono text-rose-600">-{formatBDT(row.advancesTotal)}</TableCell><TableCell className="text-right font-mono font-semibold">{formatBDT(row.netPayable)}</TableCell><TableCell><Badge variant="outline" className={row.processed ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}>{row.processed ? "PROCESSED" : "PENDING"}</Badge></TableCell><TableCell className="text-right"><Button size="sm" variant="outline" disabled={!row.processed || Boolean(row.disbursedAt)} onClick={() => { setSelectedId(row.id); setDialog("disburse"); }}>Disburse</Button></TableCell></TableRow>)}</TableBody></Table></div></Card>}</DataState>
      </> : <>
        <Card className="border-amber-200 bg-amber-50/60 p-4 text-sm text-amber-900"><strong>Integration boundary:</strong> advances use the separate <code>/advances</code> module. Repayment schedules and shift drawer cash-outs are not assumed.</Card>
        <DataState data={advances.data} isLoading={advances.isLoading} isError={advances.isError} resource="advances" emptyTitle="No advance records found." onRetry={() => void advances.refetch()}>{(rows) => <Card className="overflow-hidden border-slate-200 shadow-xs"><div className="overflow-x-auto"><Table><TableHeader className="bg-slate-50"><TableRow><TableHead>Cashier</TableHead><TableHead>Date</TableHead><TableHead>Note</TableHead><TableHead className="text-right">Amount</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader><TableBody>{rows.map((row) => <TableRow key={row.id}><TableCell>{row.cashierName || row.cashierId}</TableCell><TableCell>{new Date(row.createdAt).toLocaleDateString("en-BD")}</TableCell><TableCell>{row.note || "—"}</TableCell><TableCell className="text-right font-mono">{formatBDT(row.amount)}</TableCell><TableCell><Badge variant="outline">{row.status || "ACTIVE"}</Badge></TableCell><TableCell className="text-right"><Button variant="ghost" size="sm" onClick={() => { setSelectedId(row.id); setDialog("void"); }} className="text-rose-600">Void</Button></TableCell></TableRow>)}</TableBody></Table></div></Card>}</DataState>
      </>}

      <Dialog open={dialog !== null} onOpenChange={(open) => !open && setDialog(null)}><DialogContent><DialogHeader><DialogTitle>{dialog === "advance" ? "Create advance" : dialog === "process" ? "Process monthly payroll" : dialog === "disburse" ? "Confirm disbursement" : "Void advance"}</DialogTitle></DialogHeader><div className="space-y-4">{dialog === "advance" ? <><div><label className="text-xs font-medium">Cashier *</label><Select value={selectedId} onValueChange={setSelectedId}><SelectTrigger><SelectValue placeholder="Choose cashier" /></SelectTrigger><SelectContent>{staff.data.map((row) => <SelectItem key={row.id} value={row.id}>{row.fullName}</SelectItem>)}</SelectContent></Select></div><div><label htmlFor="advance-amount" className="text-xs font-medium">Amount (BDT) *</label><Input id="advance-amount" type="number" min="1" step="1" value={amount} onChange={(event) => setAmount(event.target.value)} /></div><div><label htmlFor="advance-note" className="text-xs font-medium">Note</label><Input id="advance-note" value={note} onChange={(event) => setNote(event.target.value)} /></div></> : <p className="text-sm text-slate-600">This action updates local Phase 0 mock state only. The real mutation is deferred to Phase 4.</p>}<Button className={dialog === "void" ? "w-full bg-rose-600 text-white" : "w-full bg-[#0052FF] text-white"} onClick={save}>Confirm mock action</Button></div></DialogContent></Dialog>
    </div>
  );
}
