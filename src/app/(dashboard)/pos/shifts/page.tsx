"use client";

import { useMemo, useState } from "react";
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
import { financialOperations, type OperationScopeParams } from "@/lib/financial-operation";
import { formatBDT } from "@/lib/utils";
import { closeShiftSchema, createAdvanceSchema, openShiftSchema } from "@/lib/validations";
import { ApiClientError } from "@/types/api";

export default function ShiftsPage() {
  const tenant = useTenantScope("cashier");
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const active = useActiveShift(
    { locationId: tenant.locationId ?? undefined, businessId: tenant.businessId ?? undefined },
    tenant.isTenantReady,
  );
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
  const [hasShiftSnapshot, setHasShiftSnapshot] = useState(false);

  const activeShift = active.data ?? null;
  const pending = openShift.isPending || closeShift.isPending;

  const shiftOpenScope: OperationScopeParams = useMemo(() => ({
    operationType: "shift_open",
    userId: tenant.userId ?? null,
    businessId: tenant.businessId ?? null,
    locationId: tenant.locationId ?? null,
  }), [tenant.userId, tenant.businessId, tenant.locationId]);

  const shiftCloseScope: OperationScopeParams = useMemo(() => ({
    operationType: "shift_close",
    userId: tenant.userId ?? null,
    businessId: tenant.businessId ?? null,
    locationId: tenant.locationId ?? null,
    scopeExtra: activeShift?.id ?? null,
  }), [tenant.userId, tenant.businessId, tenant.locationId, activeShift?.id]);

  // Cashier Advance State
  const advanceScope: OperationScopeParams = useMemo(() => ({
    operationType: "advance_create",
    userId: tenant.userId ?? null,
    businessId: tenant.businessId ?? null,
    locationId: tenant.locationId ?? null,
  }), [tenant.userId, tenant.businessId, tenant.locationId]);

  const isAuthHydrated = Boolean(tenant.userId);
  const pendingAdvance = isAuthHydrated
    ? financialOperations.getPendingOperation<{ amount?: number; reason?: string }>(advanceScope)
    : null;
  const isAdvanceUnknown = Boolean(pendingAdvance && pendingAdvance.outcome === "unknown");
  const hasAdvanceSnapshot = Boolean(
    pendingAdvance?.payloadSnapshot &&
    typeof pendingAdvance.payloadSnapshot.amount === "number" &&
    Number.isSafeInteger(pendingAdvance.payloadSnapshot.amount) &&
    pendingAdvance.payloadSnapshot.amount > 0,
  );

  const [advanceModal, setAdvanceModal] = useState(false);
  const [advanceAmount, setAdvanceAmount] = useState("");
  const [advanceReason, setAdvanceReason] = useState("");
  const [advanceOutcomeUnknown, setAdvanceOutcomeUnknown] = useState(false);

  const effectiveOutcomeUnknown = advanceOutcomeUnknown || isAdvanceUnknown;
  const effectiveHasSnapshot = hasAdvanceSnapshot || (advanceAmount !== "" && Number.isSafeInteger(Number(advanceAmount)) && Number(advanceAmount) > 0);

  const openAdvanceModal = () => {
    if (!tenant.userId) {
      toast.error("Please log in to manage salary advances.");
      return;
    }
    const pending = financialOperations.getPendingOperation<{ amount?: number; reason?: string }>(advanceScope);
    const isUnknown = pending?.outcome === "unknown";
    setAdvanceOutcomeUnknown(isUnknown);
    if (isUnknown && pending?.payloadSnapshot?.amount != null) {
      setAdvanceAmount(String(pending.payloadSnapshot.amount));
      setAdvanceReason(pending.payloadSnapshot.reason ?? "");
    }
    setAdvanceModal(true);
  };

  const showModal = (kind: "open" | "close") => {
    setModal(kind);
    const scope = kind === "open" ? shiftOpenScope : shiftCloseScope;
    const pendingOp = financialOperations.getPendingOperation<{
      startingAmount?: number;
      autoClosePrevious?: boolean;
      actualCash?: number;
      closingAmount?: number;
      notes?: string;
    }>(scope);
    const isUnknown = pendingOp?.outcome === "unknown";
    setOutcomeUnknown(isUnknown);

    if (kind === "open") {
      const snap = pendingOp?.payloadSnapshot;
      if (isUnknown && snap?.startingAmount != null) {
        setAmount(String(snap.startingAmount));
        setAutoClosePrevious(Boolean(snap.autoClosePrevious));
        setHasShiftSnapshot(true);
      } else {
        setAmount("");
        setAutoClosePrevious(false);
        setHasShiftSnapshot(Boolean(snap?.startingAmount != null));
      }
      setNote("");
    } else {
      const snap = pendingOp?.payloadSnapshot;
      if (isUnknown && (snap?.actualCash != null || snap?.closingAmount != null)) {
        setAmount(String(snap.actualCash ?? snap.closingAmount));
        setNote(snap.notes ?? "");
        setHasShiftSnapshot(true);
      } else {
        setAmount(activeShift?.expectedCash != null ? String(activeShift.expectedCash) : "");
        setNote("");
        setHasShiftSnapshot(Boolean(snap?.actualCash != null || snap?.closingAmount != null));
      }
      setAutoClosePrevious(false);
    }
  };

  const handleClearShiftLock = (kind: "open" | "close") => {
    if (pending) return;
    const confirmed = window.confirm(
      "CONFIRM SHIFT RECONCILIATION:\n\n" +
      "Have you checked your shift history or active shift status to verify whether the shift was already opened or closed on the server?\n\n" +
      "• If the shift action was recorded: Do not reset; the shift is already recorded on the server.\n" +
      "• If the shift action was NOT recorded: Click OK to clear the lock and safely enter new shift values.\n\n" +
      "Proceed to clear the shift lock?",
    );
    if (!confirmed) return;

    const scope = kind === "open" ? shiftOpenScope : shiftCloseScope;
    financialOperations.clearOperation(scope);
    setOutcomeUnknown(false);
    setHasShiftSnapshot(false);
    toast.info("Shift operation lock cleared after history reconciliation.");
  };

  const submitModal = async () => {
    const rawAmount = amount !== "" ? Number(amount) : NaN;
    if (modal === "open") {
      if (tenant.isAdmin && (!tenant.businessId || !tenant.locationId)) {
        toast.error("Please select a business and branch before opening a shift.");
        return;
      }

      let startingAmount: number;
      let locationId: string | undefined;
      let businessId: string | undefined;
      let autoClosePrev: boolean | undefined;

      if (outcomeUnknown) {
        const pendingOp = financialOperations.getPendingOperation<{
          startingAmount: number;
          locationId?: string;
          businessId?: string;
          autoClosePrevious?: boolean;
        }>(shiftOpenScope);

        if (!pendingOp?.payloadSnapshot || pendingOp.payloadSnapshot.startingAmount == null) {
          toast.error("Original shift open draft cannot be restored. Please verify shift history and clear lock.");
          return;
        }
        startingAmount = pendingOp.payloadSnapshot.startingAmount;
        locationId = pendingOp.payloadSnapshot.locationId;
        businessId = pendingOp.payloadSnapshot.businessId;
        autoClosePrev = pendingOp.payloadSnapshot.autoClosePrevious;
      } else {
        startingAmount = rawAmount;
        locationId = tenant.isAdmin && tenant.locationId ? tenant.locationId : undefined;
        businessId = tenant.isAdmin && tenant.businessId ? tenant.businessId : undefined;
        autoClosePrev = autoClosePrevious || undefined;
      }

      const payloadToHash = {
        startingAmount,
        locationId,
        businessId,
        autoClosePrevious: autoClosePrev,
      };

      let scopedKey: string;
      try {
        const keyInfo = financialOperations.getOrCreateKey(shiftOpenScope, payloadToHash);
        scopedKey = keyInfo.key;
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Uncertain shift operation pending.");
        return;
      }

      const parsed = openShiftSchema.safeParse({
        ...payloadToHash,
        idempotencyKey: scopedKey,
      });
      if (!parsed.success) {
        toast.error(parsed.error.issues[0]?.message ?? "Invalid opening float");
        return;
      }

      try {
        await openShift.mutateAsync(parsed.data);
        toast.success("Shift opened.");
        financialOperations.recordOutcome(shiftOpenScope, "success");
        setOutcomeUnknown(false);
        setHasShiftSnapshot(false);
        setModal(null);
      } catch (error) {
        if (error instanceof ApiClientError && (error.status === 0 || error.status === 408 || error.status >= 500)) {
          financialOperations.recordOutcome(shiftOpenScope, "unknown");
          setOutcomeUnknown(true);
          setHasShiftSnapshot(true);
          toast.error("Network timeout or server error. The shift open outcome is uncertain. Retry with the same key or verify shift history.");
        } else {
          financialOperations.recordOutcome(shiftOpenScope, "failed");
          setOutcomeUnknown(false);
          setHasShiftSnapshot(false);
          toast.error(error instanceof Error ? error.message : "The shift action failed.");
        }
      }
    } else if (modal === "close") {
      let shiftId = activeShift?.id;
      let actualCash: number;
      let notes: string | undefined;
      let businessId: string | undefined;

      if (outcomeUnknown) {
        const pendingOp = financialOperations.getPendingOperation<{
          shiftId?: string;
          actualCash: number;
          closingAmount: number;
          notes?: string;
          businessId?: string;
        }>(shiftCloseScope);

        if (!pendingOp?.payloadSnapshot) {
          toast.error("Original shift close draft cannot be restored. Please verify shift history and clear lock.");
          return;
        }
        shiftId = pendingOp.payloadSnapshot.shiftId;
        actualCash = pendingOp.payloadSnapshot.actualCash ?? pendingOp.payloadSnapshot.closingAmount;
        notes = pendingOp.payloadSnapshot.notes;
        businessId = pendingOp.payloadSnapshot.businessId;
      } else {
        actualCash = rawAmount;
        notes = note.trim() || undefined;
        businessId = tenant.isAdmin && tenant.businessId ? tenant.businessId : undefined;
      }

      const payloadToHash = {
        shiftId,
        actualCash,
        closingAmount: actualCash,
        notes,
        businessId,
      };

      let scopedKey: string;
      try {
        const keyInfo = financialOperations.getOrCreateKey(shiftCloseScope, payloadToHash);
        scopedKey = keyInfo.key;
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Uncertain shift operation pending.");
        return;
      }

      const parsed = closeShiftSchema.safeParse({
        ...payloadToHash,
        idempotencyKey: scopedKey,
      });
      if (!parsed.success) {
        toast.error(parsed.error.issues[0]?.message ?? "Invalid closing cash count");
        return;
      }

      try {
        await closeShift.mutateAsync(parsed.data);
        toast.success("Shift closed with server-calculated reconciliation.");
        financialOperations.recordOutcome(shiftCloseScope, "success");
        setOutcomeUnknown(false);
        setHasShiftSnapshot(false);
        setModal(null);
      } catch (error) {
        if (error instanceof ApiClientError && (error.status === 0 || error.status === 408 || error.status >= 500)) {
          financialOperations.recordOutcome(shiftCloseScope, "unknown");
          setOutcomeUnknown(true);
          setHasShiftSnapshot(true);
          toast.error("Network timeout or server error. The shift close outcome is uncertain. Retry with the same key or verify shift history.");
        } else {
          financialOperations.recordOutcome(shiftCloseScope, "failed");
          setOutcomeUnknown(false);
          setHasShiftSnapshot(false);
          toast.error(error instanceof Error ? error.message : "The shift action failed.");
        }
      }
    }
  };

  const submitAdvance = async () => {
    if (!tenant.userId) {
      toast.error("Authentication required to request salary advances.");
      return;
    }

    if (effectiveOutcomeUnknown && !hasAdvanceSnapshot) {
      toast.error("Original advance draft cannot be restored. Please verify your advance ledger and clear the lock if the advance was not recorded.");
      return;
    }

    let payload: { amount: number; reason?: string };

    if (effectiveOutcomeUnknown && pendingAdvance?.payloadSnapshot?.amount != null) {
      payload = {
        amount: pendingAdvance.payloadSnapshot.amount,
        reason: pendingAdvance.payloadSnapshot.reason,
      };
    } else {
      const rawAmount = advanceAmount !== "" ? Number(advanceAmount) : NaN;
      if (!Number.isSafeInteger(rawAmount) || rawAmount <= 0) {
        toast.error("Advance amount must be a positive whole BDT number.");
        return;
      }
      payload = {
        amount: rawAmount,
        reason: advanceReason.trim() || undefined,
      };
    }

    let keyInfo: { key: string; isRetry: boolean; isOutcomeUnknown: boolean };
    try {
      keyInfo = financialOperations.getOrCreateKey(advanceScope, payload);
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Cannot proceed with changed advance request while an uncertain transaction exists.",
      );
      return;
    }

    const parsed = createAdvanceSchema.safeParse({
      ...payload,
      idempotencyKey: keyInfo.key,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid advance amount");
      return;
    }

    try {
      await createAdvance.mutateAsync(parsed.data);
      toast.success("Salary advance request submitted.");
      financialOperations.recordOutcome(advanceScope, "success");
      setAdvanceOutcomeUnknown(false);
      setAdvanceAmount("");
      setAdvanceReason("");
      setAdvanceModal(false);
    } catch (error) {
      if (error instanceof ApiClientError && (error.status === 0 || error.status === 408 || error.status >= 500)) {
        financialOperations.recordOutcome(advanceScope, "unknown");
        setAdvanceOutcomeUnknown(true);
        toast.error(
          "Network timeout or server error. The advance outcome is uncertain. Please retry with the same key or verify your advance ledger.",
        );
      } else {
        financialOperations.recordOutcome(advanceScope, "failed");
        setAdvanceOutcomeUnknown(false);
        toast.error(error instanceof Error ? error.message : "Failed to submit advance request.");
      }
    }
  };

  const handleClearUncertainAdvance = () => {
    if (createAdvance.isPending) return;
    const confirmed = window.confirm(
      "CONFIRM SALARY ADVANCE RECONCILIATION:\n\n" +
      "Have you checked your salary advance ledger below to verify whether this advance was already recorded on the server?\n\n" +
      "• If the advance appears in the ledger: Do not clear this lock; the advance has already been recorded.\n" +
      "• If the advance does NOT appear in the ledger: Click OK to clear the lock and safely submit a new request.\n\n" +
      "Proceed to clear the advance lock?",
    );
    if (!confirmed) return;

    financialOperations.clearOperation(advanceScope);
    setAdvanceOutcomeUnknown(false);
    setAdvanceAmount("");
    setAdvanceReason("");
    toast.info("Uncertain advance operation cleared after ledger verification.");
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
              <p className="text-xs text-slate-500">Cashier self-service for recording salary advances. Tracked directly in the advance ledger.</p>
            </div>
          </div>
          <Button size="sm" onClick={openAdvanceModal} className="bg-[#0052FF] text-white">
            <Plus className="mr-1 h-3.5 w-3.5" /> Request advance
          </Button>
        </div>

        {effectiveOutcomeUnknown ? (
          <div className="mt-3 flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
            <span>An advance request timed out or returned an uncertain outcome. Please review your ledger below or click to retry/reconcile.</span>
            <Button size="sm" variant="outline" className="border-amber-300 bg-white hover:bg-amber-100" onClick={openAdvanceModal}>
              Review Request
            </Button>
          </div>
        ) : null}

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

      <Dialog open={modal !== null} onOpenChange={(open) => { if (!open && !pending) setModal(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{modal === "open" ? "Open shift" : "Close shift"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {outcomeUnknown ? (
              <div role="alert" className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-semibold">Shift outcome uncertain (timeout/server error).</span>{" "}
                  {hasShiftSnapshot ? (
                    <span>Values restored and locked; retry uses the same operation key.</span>
                  ) : (
                    <span className="text-rose-700 font-medium">Original values unavailable. Verify shift history before clearing.</span>
                  )}
                </div>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => modal && handleClearShiftLock(modal)}
                  className="rounded border border-amber-300 bg-white px-2 py-0.5 text-xs font-semibold text-amber-900 hover:bg-amber-100 cursor-pointer disabled:opacity-50"
                >
                  I checked history (Clear lock)
                </button>
              </div>
            ) : null}
            <div>
              <label htmlFor="shift-amount" className="text-xs font-medium">
                {modal === "close" ? "Counted cash" : "Opening float"} (BDT)
              </label>
              <Input
                id="shift-amount"
                type="number"
                min="0"
                step="1"
                disabled={outcomeUnknown}
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
              />
            </div>
            {modal === "open" ? (
              <label className="flex items-start gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  disabled={outcomeUnknown}
                  checked={autoClosePrevious}
                  onChange={(event) => setAutoClosePrevious(event.target.checked)}
                  className="mt-1"
                />
                <span>Reconcile and auto-close a shift left open on a previous Dhaka calendar day. Same-day active shifts cannot be replaced.</span>
              </label>
            ) : (
              <div>
                <label htmlFor="shift-note" className="text-xs font-medium">Closing notes (optional)</label>
                <Input
                  id="shift-note"
                  disabled={outcomeUnknown}
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                />
              </div>
            )}
            <Button
              className="w-full bg-[#0052FF] text-white"
              loading={pending}
              disabled={pending || (outcomeUnknown && !hasShiftSnapshot)}
              onClick={() => void submitModal()}
            >
              {outcomeUnknown ? (hasShiftSnapshot ? "Retry same operation" : "Uncertain state — Clear lock above") : modal === "open" ? "Open shift" : "Close shift"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={advanceModal} onOpenChange={(open) => { if (!open && !createAdvance.isPending) setAdvanceModal(false); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Request Salary Advance</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {effectiveOutcomeUnknown ? (
              <div role="alert" className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 space-y-1">
                <p className="font-semibold">Transaction outcome is uncertain</p>
                {effectiveHasSnapshot ? (
                  <p>A network interruption occurred. Your original request details have been restored and the exact idempotency key will be reused on retry to prevent duplicate advances.</p>
                ) : (
                  <p>A previous advance request timed out but its original draft could not be restored. Please verify your advance ledger below before clearing this lock.</p>
                )}
              </div>
            ) : null}
            <p className="text-xs text-slate-500">
              Advances are recorded directly in the Advance Ledger and deducted from monthly payroll disbursement.
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
                disabled={createAdvance.isPending || effectiveOutcomeUnknown}
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
                disabled={createAdvance.isPending || effectiveOutcomeUnknown}
                onChange={(e) => setAdvanceReason(e.target.value)}
              />
            </div>
            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
              {effectiveOutcomeUnknown ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={createAdvance.isPending}
                    onClick={handleClearUncertainAdvance}
                  >
                    Verified in ledger (Clear lock)
                  </Button>
                  <Button
                    className="bg-[#0052FF] text-white hover:bg-[#0047E0]"
                    loading={createAdvance.isPending}
                    disabled={createAdvance.isPending || !effectiveHasSnapshot}
                    title={!effectiveHasSnapshot ? "Original draft unavailable. Please verify ledger and clear lock." : undefined}
                    onClick={() => void submitAdvance()}
                  >
                    Retry exact request
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" disabled={createAdvance.isPending} onClick={() => setAdvanceModal(false)}>
                    Cancel
                  </Button>
                  <Button
                    className="bg-[#0052FF] text-white hover:bg-[#0047E0]"
                    loading={createAdvance.isPending}
                    disabled={!advanceAmount || !Number.isSafeInteger(Number(advanceAmount)) || Number(advanceAmount) <= 0}
                    onClick={() => void submitAdvance()}
                  >
                    Submit Request
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
