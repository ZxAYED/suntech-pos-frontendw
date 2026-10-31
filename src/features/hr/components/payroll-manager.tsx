"use client";

import { useMemo, useRef, useState } from "react";
import { Banknote, HandCoins, History, WalletCards, Loader2 } from "lucide-react";
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
import { useTenantScope } from "@/features/tenant/hooks/use-tenant-scope";
import { formatBDT } from "@/lib/utils";
import { disbursePayrollSchema, processPayrollSchema } from "@/lib/validations";
import { ApiClientError } from "@/types/api";

export function PayrollManager() {
  const tenant = useTenantScope("admin");
  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(now.getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(now.getFullYear());

  const payroll = usePayrollSummary({ month: currentMonth, year: currentYear });
  const advances = useAdvances({ month: currentMonth, year: currentYear });

  const processPayroll = useProcessPayroll();
  const disbursePayroll = useDisbursePayroll();
  const deleteAdvance = useDeleteAdvance();

  const [tab, setTab] = useState<"payroll" | "advances">("payroll");
  const [dialog, setDialog] = useState<"process" | "disburse" | "void" | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const processKeysRef = useRef<Map<string, string>>(new Map());
  const disburseKeyRef = useRef<string | null>(null);

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
    let key = processKeysRef.current.get(cashierId);
    if (!key) {
      key = globalThis.crypto.randomUUID();
      processKeysRef.current.set(cashierId, key);
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
      await processPayroll.mutateAsync(parsed.data);
      processKeysRef.current.delete(cashierId);
      toast.success("Cashier payroll processed successfully");
    } catch (err: unknown) {
      if (!(err instanceof ApiClientError && (err.status === 0 || err.status === 408 || err.status >= 500))) {
        processKeysRef.current.delete(cashierId);
      }
      toast.error(err instanceof Error ? err.message : "Failed to process payroll");
    }
  };

  const handleDisburseBatch = async () => {
    disburseKeyRef.current ??= globalThis.crypto.randomUUID();
    const parsed = disbursePayrollSchema.safeParse({
      month: currentMonth,
      year: currentYear,
      locationId: tenant.locationId || undefined,
      idempotencyKey: disburseKeyRef.current,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid disbursement parameters");
      return;
    }
    try {
      await disbursePayroll.mutateAsync(parsed.data);
      disburseKeyRef.current = null;
      toast.success("Payroll batch disbursed successfully");
      setDialog(null);
    } catch (err: unknown) {
      if (!(err instanceof ApiClientError && (err.status === 0 || err.status === 408 || err.status >= 500))) {
        disburseKeyRef.current = null;
      }
      toast.error(err instanceof Error ? err.message : "Failed to disburse payroll");
    }
  };

  const handleVoidAdvance = async () => {
    if (!selectedId) return;
    try {
      await deleteAdvance.mutateAsync({ id: selectedId });
      toast.success("Salary advance voided");
      setDialog(null);
      setSelectedId("");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to void advance");
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
                disabled={disbursePayroll.isPending || payrollRows.length === 0}
                className="bg-[#0052FF] text-white hover:bg-[#0047E0]"
              >
                {disbursePayroll.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <WalletCards className="mr-2 h-4 w-4" />
                )}
                Batch Disburse Payroll
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
            <MetricCard label="Advance deductions" value={formatBDT(totals.advances)} icon={History} />
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
                        <TableHead className="text-right">Advances</TableHead>
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
                              ? new Date(row.paidAt || row.disbursedAt!).toLocaleString("en-BD", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: true,
                                })
                              : ""}
                          </TableCell>
                          <TableCell className="text-right">
                            {!row.processed ? (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={processPayroll.isPending}
                                onClick={() => handleProcessSingle(row.cashierId)}
                              >
                                {processPayroll.isPending ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  "Process"
                                )}
                              </Button>
                            ) : (
                              <span className="text-xs text-slate-400">Disbursed</span>
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
            <strong>Salary Advance Governance:</strong> Advances are logged against employee monthly salaries and
            auto-deducted during end-of-month payroll computation. Admins can audit and void pending advances.
          </Card>
          {advanceSummary ? (
            <div className="grid gap-4 sm:grid-cols-3">
              <MetricCard
                label="Total Active Advances"
                value={formatBDT(advanceSummary.totalActiveAdvances)}
                icon={HandCoins}
              />
              <MetricCard
                label="Pending Deductions"
                value={String(advanceSummary.pendingCount)}
                icon={WalletCards}
              />
              <MetricCard
                label="Deducted Settled"
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
                        <TableHead>Date</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell>{row.cashierName || row.cashierId}</TableCell>
                          <TableCell>{new Date(row.createdAt).toLocaleDateString("en-BD")}</TableCell>
                          <TableCell>{row.note || "—"}</TableCell>
                          <TableCell className={`text-right font-mono ${row.status === "VOIDED" ? "line-through text-slate-400" : ""}`}>
                            {formatBDT(row.amount)}
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
                              {row.status === "VOIDED" ? "DELETED" : (row.status || "PENDING")}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {row.status !== "DEDUCTED" && row.status !== "VOIDED" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedId(row.id);
                                  setDialog("void");
                                }}
                                className="text-rose-600 hover:text-rose-700"
                              >
                                Void
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
      <Dialog open={dialog !== null} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialog === "disburse"
                ? "Batch Disburse Monthly Payroll"
                : "Void Salary Advance"}
            </DialogTitle>
            <DialogDescription>
              {dialog === "disburse"
                ? `Execute batch disbursement for month ${currentMonth}/${currentYear}. This will deduct all pending advances and finalize payroll records.`
                : "Are you sure you want to void this salary advance? It will be excluded from monthly advance summaries and payroll deductions."}
            </DialogDescription>
          </DialogHeader>

          {dialog === "disburse" ? (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                This will disburse <strong>{formatBDT(totals.outstanding)}</strong> outstanding across{" "}
                <strong>{payrollRows.filter((r) => r.status !== "PAID" && r.status !== "SETTLED").length}</strong> unpaid staff members.
              </p>
              <Button
                className="w-full bg-[#0052FF] text-white hover:bg-[#0047E0]"
                onClick={handleDisburseBatch}
                disabled={disbursePayroll.isPending}
              >
                {disbursePayroll.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Confirm Batch Disbursement
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Button
                className="w-full bg-rose-600 text-white hover:bg-rose-700"
                onClick={handleVoidAdvance}
                disabled={deleteAdvance.isPending}
              >
                {deleteAdvance.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Confirm Void Advance
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
