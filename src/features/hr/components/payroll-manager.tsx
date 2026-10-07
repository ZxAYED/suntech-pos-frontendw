"use client";

import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCentsToCurrency } from "@/lib/utils";
import { useAdvancesQuery, usePayrollSummaryQuery, useProcessPayrollMutation } from "@/redux/api/payrollApi";
import { useCashiersQuery } from "@/redux/api/usersApi";

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function PayrollManager() {
  const cashiers = useCashiersQuery();
  const [cashierId, setCashierId] = useState("");
  const [month, setMonth] = useState(() => new Date().getMonth() + 1);
  const [year, setYear] = useState(() => new Date().getFullYear());
  const enabled = Boolean(cashierId);
  const summary = usePayrollSummaryQuery({ cashierId, month, year }, { enabled });
  const advances = useAdvancesQuery({ cashierId, month, year }, { enabled });
  const processPayroll = useProcessPayrollMutation();
  const years = [year - 1, year, year + 1];

  return (
    <div className="space-y-6">
      <PageHeader title="Payroll" accent="advances" description="Filter by cashier and period, then process net pay." />
      <div className="flex flex-wrap gap-3">
        <Select value={cashierId} onValueChange={setCashierId}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Cashier" />
          </SelectTrigger>
          <SelectContent>
            {(cashiers.data ?? []).map((cashier) => (
              <SelectItem key={cashier.id} value={cashier.id}>
                {cashier.displayName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={String(month)} onValueChange={(value) => setMonth(Number(value))}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {months.map((label, index) => (
              <SelectItem key={label} value={String(index + 1)}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={String(year)} onValueChange={(value) => setYear(Number(value))}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map((value) => (
              <SelectItem key={value} value={String(value)}>
                {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {summary.data ? (
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="Monthly salary" valueCents={summary.data.monthlySalary} />
          <StatCard label="Advances" valueCents={summary.data.advancesTotal} />
          <StatCard label="Net payable" valueCents={summary.data.netPayable} />
        </div>
      ) : null}
      <Card>
        <CardContent className="p-5">
          <h3 className="mb-3 font-semibold text-secondary">Advance ledger</h3>
          <div className="space-y-2">
            {(advances.data ?? []).map((entry) => (
              <div className="flex justify-between text-sm" key={entry.id}>
                <span>{new Date(entry.createdAt).toLocaleDateString()}</span>
                <span className="font-mono tabular-nums">{formatCentsToCurrency(entry.amount)}</span>
              </div>
            ))}
            {(advances.data ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No advances for this period.</p>
            ) : null}
          </div>
        </CardContent>
      </Card>
      <Button
        disabled={!cashierId || summary.data?.processed}
        loading={processPayroll.isPending}
        onClick={async () => {
          try {
            await processPayroll.mutateAsync({ cashierId, month, year });
            toast.success("Payroll processed");
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Payroll failed");
          }
        }}
      >
        Process payroll
      </Button>
    </div>
  );
}
