"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import type { LegacyColumnDef } from "@tanstack/react-table/legacy";
import { DataTable } from "@/components/common/data-table";
import { DateRangePicker } from "@/components/common/date-range-picker";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { Button } from "@/components/ui/button";
import { formatCentsToCurrency } from "@/lib/utils";
import { useDashboardQuery, useExportReportsMutation, useTransactionsQuery } from "@/redux/api/reportsApi";
import type { RootState } from "@/redux/types";
import type { Order } from "@/types/domain";

const columns: LegacyColumnDef<Order, unknown>[] = [
  { accessorKey: "id", header: "Txn" },
  {
    accessorKey: "createdAt",
    header: "When",
    cell: ({ row }) => new Date(row.original.createdAt).toLocaleString(),
  },
  {
    accessorKey: "totalAmount",
    header: "Amount",
    cell: ({ row }) => formatCentsToCurrency(row.original.totalAmount),
  },
  { accessorKey: "status", header: "Status" },
];

export function ReportsDashboard() {
  const role = useSelector((state: RootState) => state.auth.user?.role ?? "ADMIN");
  const dashboard = useDashboardQuery(role);
  const [range, setRange] = useState<DateRange | undefined>();
  const params = useMemo(
    () => ({
      from: range?.from ? format(range.from, "yyyy-MM-dd") : undefined,
      to: range?.to ? format(range.to, "yyyy-MM-dd") : undefined,
    }),
    [range],
  );
  const transactions = useTransactionsQuery(params);
  const exportReport = useExportReportsMutation();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        accent="exports"
        description="Daily revenue, volume, and staff leaderboards."
        actions={
          <>
            <DateRangePicker value={range} onChange={setRange} />
            <Button
              variant="outline"
              loading={exportReport.isPending}
              onClick={async () => {
                try {
                  await exportReport.mutateAsync({ format: "csv", ...params });
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "CSV export failed");
                }
              }}
            >
              CSV
            </Button>
            <Button
              variant="navy"
              loading={exportReport.isPending}
              onClick={async () => {
                try {
                  await exportReport.mutateAsync({ format: "pdf", ...params });
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "PDF export failed");
                }
              }}
            >
              PDF
            </Button>
          </>
        }
      />
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Daily revenue" valueCents={dashboard.data?.dailyRevenue ?? 0} />
        <StatCard label="30-day volume" valueCents={dashboard.data?.volume30d ?? 0} />
        <StatCard label="Orders today" value={String(dashboard.data?.orderCountToday ?? 0)} />
      </div>
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Staff leaderboard</h2>
        <div className="grid gap-2">
          {(dashboard.data?.staffLeaderboard ?? []).map((entry) => (
            <div className="flex items-center justify-between rounded-md border border-border bg-white px-4 py-3" key={entry.cashierId}>
              <span>{entry.cashierName}</span>
              <span className="font-mono tabular-nums">{formatCentsToCurrency(entry.totalAmount)}</span>
            </div>
          ))}
        </div>
      </div>
      <DataTable columns={columns} data={transactions.data ?? []} loading={transactions.isLoading} />
    </div>
  );
}
