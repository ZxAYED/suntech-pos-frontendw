"use client";

import { useRef, useState } from "react";
import { Banknote, Clock3, HandCoins, History, Plus, WalletCards } from "lucide-react";
import { toast } from "sonner";
import { DataPagination } from "@/components/common/data-pagination";
import { DataState } from "@/components/common/data-state";
import { MetricCard } from "@/components/common/metric-card";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAdvances, useCreateAdvance } from "@/features/hr/api/use-hr";
import type { AdvanceRowViewModel } from "@/features/hr/view-models";
import { useActiveShift, useCloseShift, useOpenShift, useShifts } from "@/features/shifts/api/use-shifts";
import { useTenantScope } from "@/features/tenant/hooks/use-tenant-scope";
import { formatBDT } from "@/lib/utils";
import { closeShiftSchema, createAdvanceSchema, openShiftSchema } from "@/lib/validations";
import { ApiClientError } from "@/types/api";

function operationKey() {
  return globalThis.crypto.randomUUID();
}

export default function ShiftsPage() {
  const tenant = useTenantScope("cashier");
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const active = useActiveShift(tenant.locationId, tenant.isTenantReady);
  const history = useShifts(tenant.buildQueryParams(pagination), tenant.isTenantReady);
  const advances = useAdvances(undefined, tenant.isTenantReady);
  const openShift = useOpenShift();
  const closeShift = useCloseShift();
  const createAdvance = useCreateAdvance();

  const [modal, setModal] = useState<"open" | "close" | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [autoClosePrevious, setAutoClosePrevious] = useState(false);
  const [outcomeUnknown, setOutcomeUnknown] = useState(false);
  const operationKeyRef = useRef<string | null>(null);

  // Cashier Advance State
  const [advanceModal, setAdvanceModal] = useState(false);
  const [advanceAmount, setAdvanceAmount] = useState("");
  const [advanceReason, setAdvanceReason] = useState("");
  const advanceOperationKeyRef = useRef<string | null>(null);

  const activeShift = active.data ?? null;
  const pending = openShift.isPending || closeShift.isPending;

  const showModal = (kind: "open" | "close") => {
    setModal(kind);
    setAmount(kind === "close" && activeShift?.expectedCash != null ? String(activeShift.expectedCash) : "");
    setNote("");
    setAutoClosePrevious(false);
    setOutcomeUnknown(false);
    operationKeyRef.current = null;
  };

  const submitModal = async () => {
    const rawAmount = amount !== "" ? Number(amount) : NaN;
    operationKeyRef.current ??= operationKey();
    if (modal === "open") {
      const parsed = openShiftSchema.safeParse({
        startingAmount: rawAmount,
        locationId: tenant.isAdmin && tenant.locationId ? tenant.locationId : undefined,
        autoClosePrevious: autoClosePrevious || undefined,
        idempotencyKey: operationKeyRef.current,
      });
      if (!parsed.success) {
        toast.error(parsed.error.issues[0]?.message ?? "Invalid opening float");
        return;
      }
      try {
        await openShift.mutateAsync(parsed.data);
        toast.success("Shift opened.");
        operationKeyRef.current = null;
        setOutcomeUnknown(false);
        setModal(null);
      } catch (error) {
        if (error instanceof ApiClientError && (error.status === 0 || error.status === 408 || error.status >= 500)) {
          setOutcomeUnknown(true);
        } else {
          operationKeyRef.current = null;
        }
        toast.error(error instanceof Error ? error.message : "The shift action failed.");
      }
    } else if (modal === "close") {
      const parsed = closeShiftSchema.safeParse({
        closingAmount: rawAmount,
        notes: note.trim() || undefined,
        idempotencyKey: operationKeyRef.current,
      });
      if (!parsed.success) {
        toast.error(parsed.error.issues[0]?.message ?? "Invalid closing cash count");
        return;
      }
      try {
        await closeShift.mutateAsync(parsed.data);
        toast.success("Shift closed with server-calculated reconciliation.");
        operationKeyRef.current = null;
        setOutcomeUnknown(false);
        setModal(null);
      } catch (error) {
        if (error instanceof ApiClientError && (error.status === 0 || error.status === 408 || error.status >= 500)) {
          setOutcomeUnknown(true);
        } else {
          operationKeyRef.current = null;
        }
        toast.error(error instanceof Error ? error.message : "The shift action failed.");
      }
    }
  };

  const submitAdvance = async () => {
    const rawAmount = advanceAmount !== "" ? Number(advanceAmount) : NaN;
    advanceOperationKeyRef.current ??= operationKey();
    const parsed = createAdvanceSchema.safeParse({
      amount: rawAmount,
      reason: advanceReason.trim() || undefined,
      idempotencyKey: advanceOperationKeyRef.current,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid advance amount");
      return;
    }
    try {
      await createAdvance.mutateAsync(parsed.data);
      toast.success("Salary advance request submitted.");
      advanceOperationKeyRef.current = null;
      setAdvanceAmount("");
      setAdvanceReason("");
      setAdvanceModal(false);
    } catch (error) {
      advanceOperationKeyRef.current = null;
      toast.error(error instanceof Error ? error.message : "Failed to submit advance request.");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Shift Operations"
        description="Manage cashier drawer shifts, opening floats, cash reconciliations, and employee advances."
        actions={activeShift ? <Button variant="outline" onClick={() => showModal("close")}>Close shift</Button> : <Button onClick={() => showModal("open")} className="bg-[#0052FF] text-white">Open shift</Button>}
      />

      {active.isError ? <Card className="border-rose-200 bg-rose-50 p-4 text-sm text-rose-700" role="alert">Active shift could not be loaded. <button className="font-semibold underline" onClick={() => void active.refetch()}>Retry</button></Card> : null}
      <Card className="border-slate-200 p-5 shadow-xs"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2"><h2 className="font-semibold text-[#070B28]">1. Active Shift</h2><Badge variant="outline" className={activeShift ? "border-emerald-200 bg-emerald-50 text-emerald-700" : ""}>{active.isLoading ? "LOADING" : activeShift ? "OPEN" : "NO ACTIVE SHIFT"}</Badge></div><p className="mt-1 text-sm text-slate-500">{activeShift ? `${activeShift.cashierName || "Current operator"} · Opened ${new Date(activeShift.openedAt).toLocaleString("en-BD")}` : "Checkout remains available; orders omit shiftId when no shift is open."}</p></div>{activeShift ? <span className="font-mono text-xl font-bold text-[#0052FF]">{formatBDT(activeShift.openingFloat)}</span> : null}</div></Card>

      <div><h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">2. Shift Metrics</h2><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="Opening float" value={formatBDT(activeShift?.openingFloat ?? 0)} icon={WalletCards} /><MetricCard label="Cash sales" value={formatBDT(activeShift?.cashSales ?? 0)} icon={Banknote} /><MetricCard label="Advances out" value={formatBDT(activeShift?.advancesOut ?? 0)} icon={Banknote} /><MetricCard label="Expected cash" value={formatBDT(activeShift?.expectedCash ?? 0)} icon={Clock3} /></div></div>

      <Card className="border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HandCoins className="h-5 w-5 text-[#0052FF]" />
            <div>
              <h2 className="font-semibold text-[#070B28]">3. My Salary Advances</h2>
              <p className="text-xs text-slate-500">Cashier self-service for requesting on-shift advances. Automatically reconciled against payroll.</p>
            </div>
          </div>
          <Button size="sm" onClick={() => setAdvanceModal(true)} className="bg-[#0052FF] text-white">
            <Plus className="mr-1 h-3.5 w-3.5" /> Request advance
          </Button>
        </div>

        <div className="mt-4">
          <DataState
            data={advances.data?.items ?? []}
            isLoading={advances.isLoading}
            isError={advances.isError}
            resource="advances"
            emptyTitle="No advances recorded for your account."
            onRetry={() => void advances.refetch()}
          >
            {(rows: AdvanceRowViewModel[]) => (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((advance) => {
                      const isVoided = advance.status === "VOIDED";
                      const isDeducted = advance.status === "DEDUCTED" || advance.status === "SETTLED";
                      return (
                        <TableRow key={advance.id}>
                          <TableCell className="text-xs text-slate-600">
                            {advance.createdAt ? new Date(advance.createdAt).toLocaleString("en-BD") : "—"}
                          </TableCell>
                          <TableCell className="text-xs">{advance.note || "General advance"}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                isVoided
                                  ? "border-rose-200 bg-rose-50 text-rose-700 font-semibold"
                                  : isDeducted
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                    : "border-amber-200 bg-amber-50 text-amber-700"
                              }
                            >
                              {advance.status || "PENDING"}
                            </Badge>
                          </TableCell>
                          <TableCell className={`text-right font-mono font-semibold ${isVoided ? "text-slate-400 line-through" : "text-[#070B28]"}`}>
                            {formatBDT(advance.amount)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </DataState>
        </div>
      </Card>

      <Card className="overflow-hidden border-slate-200 shadow-xs"><div className="flex items-center gap-2 border-b border-slate-200 p-5"><History className="h-4 w-4 text-[#0052FF]" /><h2 className="font-semibold text-[#070B28]">4. Shift History</h2></div><DataState data={history.data?.rows ?? []} isLoading={history.isLoading} isError={history.isError} resource="shift history" emptyTitle="No shifts recorded." onRetry={() => void history.refetch()}>{(rows) => <div className="overflow-x-auto"><Table><TableHeader className="bg-slate-50"><TableRow><TableHead>Cashier</TableHead><TableHead>Branch</TableHead><TableHead>Opened</TableHead><TableHead>Closed</TableHead><TableHead className="text-right">Opening float</TableHead><TableHead className="text-right">Variance</TableHead></TableRow></TableHeader><TableBody>{rows.map((shift) => <TableRow key={shift.id}><TableCell className="font-medium">{shift.cashierName || "Current operator"}</TableCell><TableCell>{shift.locationName && !/^[0-9a-f-]{36}$/i.test(shift.locationName) ? shift.locationName : (tenant.activeBranch?.name || "Main Branch")}</TableCell><TableCell>{new Date(shift.openedAt).toLocaleString("en-BD")}</TableCell><TableCell>{shift.closedAt ? new Date(shift.closedAt).toLocaleString("en-BD") : "—"}</TableCell><TableCell className="text-right font-mono">{formatBDT(shift.openingFloat)}</TableCell><TableCell className="text-right font-mono">{shift.variance == null ? "—" : formatBDT(shift.variance)}</TableCell></TableRow>)}</TableBody></Table></div>}</DataState><div className="border-t border-slate-200 px-4"><DataPagination currentPage={history.data?.meta.page ?? pagination.page} totalPages={history.data?.meta.totalPages ?? 1} totalItems={history.data?.meta.total ?? 0} pageSize={history.data?.meta.limit ?? pagination.limit} onPageChange={(page) => setPagination((current) => ({ ...current, page }))} onPageSizeChange={(limit) => setPagination({ page: 1, limit })} itemLabel="shifts" /></div></Card>

      <Dialog open={modal !== null} onOpenChange={(open) => { if (!open && !pending) setModal(null); }}><DialogContent><DialogHeader><DialogTitle>{modal === "open" ? "Open shift" : "Close shift"}</DialogTitle></DialogHeader><div className="space-y-4">{outcomeUnknown ? <p role="alert" className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">The result is unknown. Values are locked; retry uses the same operation key.</p> : null}<div><label htmlFor="shift-amount" className="text-xs font-medium">{modal === "close" ? "Counted cash" : "Opening float"} (BDT)</label><Input id="shift-amount" type="number" min="0" step="1" disabled={outcomeUnknown} value={amount} onChange={(event) => { setAmount(event.target.value); operationKeyRef.current = null; }} /></div>{modal === "open" ? <label className="flex items-start gap-2 text-sm text-slate-600"><input type="checkbox" disabled={outcomeUnknown} checked={autoClosePrevious} onChange={(event) => { setAutoClosePrevious(event.target.checked); operationKeyRef.current = null; }} className="mt-1" /><span>Reconcile and auto-close a shift left open on a previous Dhaka calendar day. Same-day active shifts cannot be replaced.</span></label> : <div><label htmlFor="shift-note" className="text-xs font-medium">Closing notes (optional)</label><Input id="shift-note" disabled={outcomeUnknown} value={note} onChange={(event) => { setNote(event.target.value); operationKeyRef.current = null; }} /></div>}<Button className="w-full bg-[#0052FF] text-white" loading={pending} onClick={() => void submitModal()}>{outcomeUnknown ? "Retry same operation" : modal === "open" ? "Open shift" : "Close shift"}</Button></div></DialogContent></Dialog>

      <Dialog open={advanceModal} onOpenChange={(open) => { if (!open && !createAdvance.isPending) setAdvanceModal(false); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Request Salary Advance</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-xs text-slate-500">
              Advances requested during your shift are recorded in the ledger and deducted during month-end payroll settlement.
            </p>
            <div>
              <label htmlFor="advance-amount" className="text-xs font-medium text-slate-700">Advance Amount (BDT)</label>
              <Input
                id="advance-amount"
                type="number"
                min="1"
                step="1"
                placeholder="e.g. 2000"
                value={advanceAmount}
                disabled={createAdvance.isPending}
                onChange={(e) => setAdvanceAmount(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="advance-reason" className="text-xs font-medium text-slate-700">Reason (optional)</label>
              <Input
                id="advance-reason"
                type="text"
                placeholder="e.g. Personal emergency"
                value={advanceReason}
                disabled={createAdvance.isPending}
                onChange={(e) => setAdvanceReason(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" disabled={createAdvance.isPending} onClick={() => setAdvanceModal(false)}>
                Cancel
              </Button>
              <Button
                className="bg-[#0052FF] text-white hover:bg-[#0047E0]"
                loading={createAdvance.isPending}
                disabled={!advanceAmount || Number(advanceAmount) <= 0}
                onClick={() => void submitAdvance()}
              >
                Submit Request
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
