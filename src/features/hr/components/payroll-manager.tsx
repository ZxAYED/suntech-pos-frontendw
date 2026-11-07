"use client";

import { useMemo, useRef, useState } from "react";
import { Banknote, HandCoins, History, WalletCards } from "lucide-react";
import { toast } from "sonner";
import { DataState, TenantRequiredState } from "@/components/common/data-state";
import { MetricCard } from "@/components/common/metric-card";
import { SegmentedTabs } from "@/components/common/segmented-tabs";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  useAdvances,
  useDeleteAdvance,
  useDisbursePayroll,
  usePayrollSummary,
  useProcessPayroll,
} from "@/features/hr/api/use-hr";
import type { AdvanceRowViewModel, PayrollRowViewModel } from "@/features/hr/view-models";
import { useTenantScope } from "@/features/tenant/hooks/use-tenant-scope";
import { financialOperations } from "@/lib/financial-operation";
import { formatBDT } from "@/lib/utils";
import { getBusinessDateParts, formatBusinessDateTime, formatBusinessDate } from "@/lib/business-time";
import { disbursePayrollSchema, processPayrollSchema } from "@/lib/validations";
import { ApiClientError } from "@/types/api";

export function PayrollManager() {
  const tenant = useTenantScope("admin");
  const dhakaParts = getBusinessDateParts(new Date());
  const [currentMonth, setCurrentMonth] = useState(dhakaParts.month);
  const [currentYear, setCurrentYear] = useState(dhakaParts.year);

  const payroll = usePayrollSummary({ month: currentMonth, year: currentYear });
  const advances = useAdvances({ month: currentMonth, year: currentYear });

  const processPayroll = useProcessPayroll();
  const disbursePayroll = useDisbursePayroll();
  const deleteAdvance = useDeleteAdvance();

  const [tab, setTab] = useState<"payroll" | "advances">("payroll");
  const [dialog, setDialog] = useState<"process" | "disburse" | "void" | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [selectedCashier, setSelectedCashier] = useState<PayrollRowViewModel | null>(null);
  const [selectedAdvance, setSelectedAdvance] = useState<AdvanceRowViewModel | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);

  const payrollRows = useMemo(() => payroll.data?.rows ?? [], [payroll.data?.rows]);
  const advanceRows = advances.data?.items ?? [];
  const advanceSummary = advances.data?.summary;

  const totals = useMemo(() => {
    const base = payrollRows.reduce((sum, row) => sum + row.baseSalary, 0);
    const advancesTotal = payrollRows.reduce((sum, row) => sum + row.advancesTotal, 0);
    const payable = payrollRows.reduce((sum, row) => sum + row.netPayable, 0);
    const outstanding = payrollRows
      .filter((row) => row.status !== "PAID" && row.status !== "SETTLED")
      .reduce((sum, row) => sum + row.netPayable, 0);
    return { base, advances: advancesTotal, payable, outstanding };
  }, [payrollRows]);

  if (!tenant.isTenantReady) return <TenantRequiredState />;

  const handleProcessSingle = async (cashierId: string) => {
    if (isSubmittingRef.current || processPayroll.isPending) return;

    const targetRow = selectedCashier ?? payrollRows.find((r) => r.cashierId === cashierId);
    if (targetRow && targetRow.baseSalary <= 0) {
      toast.error("Cannot process payroll for employee with 0 base salary.");
      return;
    }

    const operationScope = {
      operationType: "payroll_process" as const,
      userId: tenant.userId,
      businessId: tenant.businessId,
      locationId: tenant.locationId,
      scopeExtra: `${cashierId}:${currentYear}-${currentMonth}`,
    };
    const payloadToHash = {
      cashierId,
      month: currentMonth,
      year: currentYear,
      businessId: tenant.businessId,
    };

    let key: string;
    try {
      const keyInfo = financialOperations.getOrCreateKey(operationScope, payloadToHash);
      key = keyInfo.key;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Uncertain payroll operation pending.");
      return;
    }

    const parsed = processPayrollSchema.safeParse({
      cashierId,
      month: currentMonth,
      year: currentYear,
      idempotencyKey: key,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid payroll parameters");
      return;
    }

    try {
      isSubmittingRef.current = true;
      setIsSubmitting(true);
      await processPayroll.mutateAsync(parsed.data);
      financialOperations.recordOutcome(operationScope, "success");
      toast.success("Cashier salary paid successfully");
      setDialog(null);
      setSelectedCashier(null);
    } catch (err: unknown) {
      if (err instanceof ApiClientError && (err.status === 0 || err.status === 408 || err.status >= 500)) {
        financialOperations.recordOutcome(operationScope, "unknown");
        toast.error("Payroll processing result is unknown. Please check status before retrying.");
      } else {
        financialOperations.recordOutcome(operationScope, "failed");
        toast.error(err instanceof Error ? err.message : "Failed to pay salary");
      }
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const handleDisburseBatch = async () => {
    if (isSubmittingRef.current || disbursePayroll.isPending) return;

    const operationScope = {
      operationType: "payroll_disburse" as const,
      userId: tenant.userId,
      businessId: tenant.businessId,
      locationId: tenant.locationId,
      scopeExtra: `${currentYear}-${currentMonth}:${tenant.locationId || "all"}`,
    };
    const payloadToHash = {
      month: currentMonth,
      year: currentYear,
      locationId: tenant.locationId || undefined,
      businessId: tenant.businessId,
    };

    let key: string;
    try {
      const keyInfo = financialOperations.getOrCreateKey(operationScope, payloadToHash);
      key = keyInfo.key;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Uncertain disbursement operation pending.");
      return;
    }

    const parsed = disbursePayrollSchema.safeParse({
      month: currentMonth,
      year: currentYear,
      locationId: tenant.locationId || undefined,
      idempotencyKey: key,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid disbursement parameters");
      return;
    }

    try {
      isSubmittingRef.current = true;
      setIsSubmitting(true);
      await disbursePayroll.mutateAsync(parsed.data);
      financialOperations.recordOutcome(operationScope, "success");
      toast.success("All staff salaries paid successfully");
      setDialog(null);
    } catch (err: unknown) {
      if (err instanceof ApiClientError && (err.status === 0 || err.status === 408 || err.status >= 500)) {
        financialOperations.recordOutcome(operationScope, "unknown");
        toast.error("Payroll disbursement result is unknown. Please check status before retrying.");
      } else {
        financialOperations.recordOutcome(operationScope, "failed");
        toast.error(err instanceof Error ? err.message : "Failed to pay salaries");
      }
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const handleVoidAdvance = async () => {
    if (isSubmittingRef.current || deleteAdvance.isPending || !selectedId) return;

    try {
      isSubmittingRef.current = true;
      setIsSubmitting(true);
      await deleteAdvance.mutateAsync({
        id: selectedId,
        businessId: tenant.isAdmin ? tenant.businessId : undefined,
      });
      toast.success("Salary advance cancelled");
      setDialog(null);
      setSelectedId("");
      setSelectedAdvance(null);
    } catch (err: unknown) {
      if (err instanceof ApiClientError && err.status === 409) {
        toast.error(
          err.message ||
            "Cannot cancel advance that has already been deducted from payroll",
        );
      } else {
        toast.error(err instanceof Error ? err.message : "Failed to cancel advance");
      }
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payroll & Advances"
        description="Review salaries, disburse employee payroll, and track salary advances."
        actions={
          <div className="flex items-center gap-2">
            <Select
              value={String(currentMonth)}
              onValueChange={(val) => setCurrentMonth(Number(val))}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <SelectItem key={m} value={String(m)}>
                    {new Date(2026, m - 1, 1).toLocaleString("en-US", { month: "short" })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={String(currentYear)}
              onValueChange={(val) => setCurrentYear(Number(val))}
            >
              <SelectTrigger className="w-[90px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[2025, 2026, 2027].map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {tab === "payroll" ? (
              <Button
                onClick={() => setDialog("disburse")}
                disabled={disbursePayroll.isPending || isSubmitting || payrollRows.length === 0 || totals.outstanding <= 0}
                className="bg-[#0052FF] text-white hover:bg-[#0047E0]"
              >
                <WalletCards className="mr-2 h-4 w-4" />
                Pay All Salaries
              </Button>
            ) : null}
          </div>
        }
      />
      <SegmentedTabs
        tabs={[
          { id: "payroll", label: "Payroll" },
          { id: "advances", label: "Advances" },
        ]}
        activeTab={tab}
        onChange={setTab}
      />

      {tab === "payroll" ? (
        <>
          <div className="grid gap-4 sm:grid-cols-4">
            <MetricCard label="Base compensation" value={formatBDT(totals.base)} icon={Banknote} />
            <MetricCard label="Advance Ledger Total" value={formatBDT(totals.advances)} icon={History} />
            <MetricCard label="Total net payable" value={formatBDT(totals.payable)} icon={WalletCards} />
            <MetricCard label="Outstanding unpaid" value={formatBDT(totals.outstanding)} icon={WalletCards} />
          </div>
          <DataState
            data={payrollRows}
            isLoading={payroll.isLoading}
            isError={payroll.isError}
            resource="payroll"
            emptyTitle="No payroll records for this period."
            onRetry={() => void payroll.refetch()}
          >
            {(rows) => (
              <Card className="overflow-hidden border-slate-200 shadow-xs">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Period</TableHead>
                        <TableHead className="text-right">Base salary</TableHead>
                        <TableHead className="text-right">Advance Ledger</TableHead>
                        <TableHead className="text-right">Net payable</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Paid at</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell>
                            <p className="font-medium text-[#070B28]">{row.employeeName}</p>
                            <p className="font-mono text-xs text-slate-400">{row.employeePublicId}</p>
                          </TableCell>
                          <TableCell>{row.periodLabel}</TableCell>
                          <TableCell className="text-right font-mono">{formatBDT(row.baseSalary)}</TableCell>
                          <TableCell className="text-right font-mono text-rose-600">
                            -{formatBDT(row.advancesTotal)}
                          </TableCell>
                          <TableCell className="text-right font-mono font-semibold">
                            {formatBDT(row.netPayable)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                row.processed
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                  : "border-amber-200 bg-amber-50 text-amber-700"
                              }
                            >
                              {row.processed ? "PAID" : "DUE"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-slate-600 whitespace-nowrap">
                            {row.processed && (row.paidAt || row.disbursedAt)
                              ? formatBusinessDateTime(row.paidAt || row.disbursedAt!)
                              : "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            {!row.processed ? (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={processPayroll.isPending || isSubmitting || row.baseSalary <= 0}
                                title={row.baseSalary <= 0 ? "Cannot process employee with 0 base salary" : "Pay employee salary"}
                                onClick={() => {
                                  setSelectedCashier(row);
                                  setDialog("process");
                                }}
                                className="h-8 text-xs font-medium text-[#0052FF] hover:bg-blue-50 border-blue-200"
                              >
                                <WalletCards className="mr-1.5 h-3.5 w-3.5" />
                                Pay Salary
                              </Button>
                            ) : (
                              <span className="text-xs text-slate-400 font-medium">Paid</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            )}
          </DataState>
        </>
      ) : (
        <>
          <Card className="border-amber-200 bg-amber-50/60 p-4 text-sm text-amber-900">
            <strong>Salary Advance Governance:</strong> Active (non-voided) advances are tracked in the Advance Ledger and deducted during monthly payroll computation.
          </Card>
          {advanceSummary ? (
            <div className="grid gap-4 sm:grid-cols-3">
              <MetricCard
                label="Total Active Advances"
                value={formatBDT(advanceSummary.totalActiveAdvances)}
                icon={HandCoins}
              />
              <MetricCard
                label="Active Advances (Count)"
                value={String(advanceSummary.pendingCount)}
                icon={WalletCards}
              />
              <MetricCard
                label="Settled / Closed"
                value={String(advanceSummary.deductedCount)}
                icon={Banknote}
              />
            </div>
          ) : null}
          <DataState
            data={advanceRows}
            isLoading={advances.isLoading}
            isError={advances.isError}
            resource="advances"
            emptyTitle="No advance records found."
            onRetry={() => void advances.refetch()}
          >
            {(rows) => (
              <Card className="overflow-hidden border-slate-200 shadow-xs">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead>Cashier</TableHead>
                        <TableHead>Branch</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-right">Deducted</TableHead>
                        <TableHead className="text-right">Remaining</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell>
                            <p className="font-medium text-[#070B28]">{row.employeeName || row.cashierName || row.cashierId}</p>
                            {row.employeeCode && <p className="font-mono text-xs text-slate-400">{row.employeeCode}</p>}
                          </TableCell>
                          <TableCell className="text-xs text-slate-600">
                            {row.locationName || "—"}
                          </TableCell>
                          <TableCell className="text-xs text-slate-600">
                            {formatBusinessDate(row.takenAt || row.createdAt)}
                          </TableCell>
                          <TableCell className="text-xs">{row.note || "—"}</TableCell>
                          <TableCell className={`text-right font-mono font-medium ${row.status === "VOIDED" ? "line-through text-slate-400" : "text-[#070B28]"}`}>
                            {formatBDT(row.amount)}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs text-rose-600">
                            {formatBDT(row.deductedAmount ?? 0)}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs font-medium text-slate-700">
                            {formatBDT(row.remainingAmount ?? (row.amount - (row.deductedAmount ?? 0)))}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                row.status === "DEDUCTED"
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                  : row.status === "VOIDED"
                                  ? "border-rose-200 bg-rose-50 text-rose-700"
                                  : "border-amber-200 bg-amber-50 text-amber-700"
                              }
                            >
                              {row.status === "VOIDED" ? "CANCELLED" : (row.status || "PENDING")}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {row.status !== "DEDUCTED" &&
                              row.status !== "VOIDED" &&
                              !(row.deductedAmount && row.deductedAmount > 0) && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedId(row.id);
                                  setSelectedAdvance(row);
                                  setDialog("void");
                                }}
                                className="h-8 text-xs border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                                title="Cancel this salary advance"
                              >
                                Cancel
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            )}
          </DataState>
        </>
      )}

      {/* Confirmation & Action Dialogs */}
      <Dialog
        open={dialog !== null}
        onOpenChange={(open) => {
          if (!open && !isSubmitting) {
            setDialog(null);
            setSelectedCashier(null);
            setSelectedAdvance(null);
            setSelectedId("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialog === "process"
                ? "Confirm Salary Payment"
                : dialog === "disburse"
                ? "Pay All Staff Salaries"
                : "Cancel Salary Advance"}
            </DialogTitle>
            <DialogDescription>
              {dialog === "process"
                ? "Please check the salary breakdown below before confirming payment."
                : dialog === "disburse"
                ? `Confirm monthly salary payment for all unpaid staff for ${new Date(2026, currentMonth - 1, 1).toLocaleString("en-US", { month: "long" })} ${currentYear}.`
                : "Are you sure you want to cancel this salary advance?"}
            </DialogDescription>
          </DialogHeader>

          {dialog === "process" && selectedCashier ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Employee:</span>
                  <span className="font-medium text-[#070B28]">
                    {selectedCashier.employeeName} {selectedCashier.employeePublicId ? `(${selectedCashier.employeePublicId})` : ""}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Month / Period:</span>
                  <span className="font-medium text-[#070B28]">{selectedCashier.periodLabel}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Base Salary:</span>
                  <span className="font-mono text-[#070B28]">{formatBDT(selectedCashier.baseSalary)}</span>
                </div>
                {selectedCashier.advancesTotal > 0 ? (
                  <div className="flex justify-between text-rose-600">
                    <span>Advance Deducted:</span>
                    <span className="font-mono">-{formatBDT(selectedCashier.advancesTotal)}</span>
                  </div>
                ) : null}
                <div className="flex justify-between border-t border-slate-200 pt-2 font-semibold text-[#070B28]">
                  <span>Total to Pay:</span>
                  <span className="font-mono text-[#0052FF] text-base">{formatBDT(selectedCashier.netPayable)}</span>
                </div>
              </div>

              <p className="text-xs text-slate-500">
                This will record the salary payment in the company ledger and mark this cashier as paid.
              </p>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDialog(null);
                    setSelectedCashier(null);
                  }}
                  disabled={isSubmitting || processPayroll.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="bg-[#0052FF] text-white hover:bg-[#0047E0]"
                  onClick={() => handleProcessSingle(selectedCashier.cashierId)}
                  disabled={isSubmitting || processPayroll.isPending}
                  loading={isSubmitting || processPayroll.isPending}
                >
                  Yes, Pay Salary
                </Button>
              </div>
            </div>
          ) : null}

          {dialog === "disburse" ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Period:</span>
                  <span className="font-medium text-[#070B28]">
                    {new Date(2026, currentMonth - 1, 1).toLocaleString("en-US", { month: "long" })} {currentYear}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Unpaid Employees:</span>
                  <span className="font-medium text-[#070B28]">
                    {payrollRows.filter((r) => !r.processed && r.status !== "PAID" && r.status !== "SETTLED").length} staff members
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2 font-semibold text-[#070B28]">
                  <span>Total Amount to Pay:</span>
                  <span className="font-mono text-[#0052FF] text-base">{formatBDT(totals.outstanding)}</span>
                </div>
              </div>

              <p className="text-xs text-slate-500">
                This will disburse monthly salaries to all unpaid staff with active advance deductions applied automatically.
              </p>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialog(null)}
                  disabled={isSubmitting || disbursePayroll.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="bg-[#0052FF] text-white hover:bg-[#0047E0]"
                  onClick={handleDisburseBatch}
                  disabled={isSubmitting || disbursePayroll.isPending}
                  loading={isSubmitting || disbursePayroll.isPending}
                >
                  Yes, Pay All Salaries
                </Button>
              </div>
            </div>
          ) : null}

          {dialog === "void" ? (
            <div className="space-y-4">
              {selectedAdvance ? (
                <div className="rounded-lg border border-rose-100 bg-rose-50/50 p-3 space-y-2 text-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>Employee:</span>
                    <span className="font-medium text-[#070B28]">
                      {selectedAdvance.employeeName || selectedAdvance.cashierName || selectedAdvance.cashierId}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Advance Amount:</span>
                    <span className="font-mono font-semibold text-rose-600">{formatBDT(selectedAdvance.amount)}</span>
                  </div>
                  {selectedAdvance.note ? (
                    <div className="flex justify-between text-slate-600 text-xs">
                      <span>Reason:</span>
                      <span className="text-slate-800">{selectedAdvance.note}</span>
                    </div>
                  ) : null}
                </div>
              ) : null}

              <p className="text-xs text-slate-500">
                Are you sure you want to cancel this salary advance? This money will not be deducted from the employee&apos;s salary.
              </p>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDialog(null);
                    setSelectedId("");
                    setSelectedAdvance(null);
                  }}
                  disabled={isSubmitting || deleteAdvance.isPending}
                >
                  No, Keep Advance
                </Button>
                <Button
                  type="button"
                  className="bg-rose-600 text-white hover:bg-rose-700"
                  onClick={handleVoidAdvance}
                  disabled={isSubmitting || deleteAdvance.isPending}
                  loading={isSubmitting || deleteAdvance.isPending}
                >
                  Yes, Cancel Advance
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
