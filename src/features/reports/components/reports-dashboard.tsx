"use client";

import { useState } from "react";
import { BarChart3, Download, Receipt, TrendingUp, WalletCards } from "lucide-react";
import { toast } from "sonner";
import { DataState, MetricGridSkeleton, TenantRequiredState } from "@/components/common/data-state";
import { MetricCard } from "@/components/common/metric-card";
import { SegmentedTabs } from "@/components/common/segmented-tabs";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMockDashboardReport, useMockTransactions } from "@/features/reports/api/use-reports";
import { mapDashboardSummary } from "@/features/reports/view-models";
import { useTenantScope } from "@/features/tenant/hooks/use-tenant-scope";
import { formatBDT } from "@/lib/utils";

type Range = "daily" | "weekly" | "monthly" | "quarterly";

export function ReportsDashboard() {
  const tenant = useTenantScope("admin");
  const report = useMockDashboardReport();
  const transactions = useMockTransactions();
  const [range, setRange] = useState<Range>("daily");
  if (!tenant.isTenantReady) return <TenantRequiredState />;
  const summary = mapDashboardSummary(report.data.summary);

  return (
    <div className="space-y-6">
      <PageHeader title="Sales Analytics & Reports" actions={<div className="flex gap-2"><Button variant="outline" onClick={() => toast.info("CSV export remains a static Phase 0 control.")}><Download className="mr-2 h-4 w-4" />Export CSV</Button><Button variant="outline" onClick={() => toast.info("PDF export remains a static Phase 0 control.")}><Download className="mr-2 h-4 w-4" />Export PDF</Button></div>} />
      <SegmentedTabs tabs={[{ id: "daily", label: "Daily" }, { id: "weekly", label: "Weekly" }, { id: "monthly", label: "Monthly" }, { id: "quarterly", label: "Quarterly" }]} activeTab={range} onChange={setRange} />

      {report.isLoading ? <MetricGridSkeleton /> : report.isError ? <DataState data={[]} isLoading={false} isError resource="report summary" emptyTitle="No report data." onRetry={() => void report.refetch()}>{() => null}</DataState> : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="Gross sales" value={formatBDT(summary.grossSales)} icon={TrendingUp} /><MetricCard label="Average ticket" value={formatBDT(summary.averageTicket)} icon={Receipt} /><MetricCard label="Orders" value={summary.orderCount} icon={BarChart3} /><MetricCard label="Gross margin (Admin)" value={`${summary.grossMargin ?? 0}%`} icon={WalletCards} /></div>}

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="border-slate-200 p-5 shadow-xs"><h2 className="font-semibold text-[#070B28]">Category performance</h2><div className="mt-5 space-y-4">{report.data.categories.map((category) => <div key={category.categoryId}><div className="mb-1.5 flex justify-between text-sm"><span className="font-medium text-slate-700">{category.categoryName}</span><span className="font-mono text-[#070B28]">{formatBDT(category.revenue)}</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#0052FF]" style={{ width: `${category.percentage}%` }} /></div><p className="mt-1 text-[11px] text-slate-400">{category.quantity} units · {category.percentage}%</p></div>)}</div></Card>
        <Card className="border-slate-200 p-5 shadow-xs"><h2 className="font-semibold text-[#070B28]">Payment breakdown</h2><div className="mt-5 space-y-3">{report.data.summary.paymentBreakdown.map((payment) => <div key={payment.method} className="flex items-center justify-between rounded-lg border border-slate-100 p-3"><div><p className="font-medium text-[#070B28]">{payment.method}</p><p className="text-xs text-slate-400">{payment.percentage}% of gross sales</p></div><span className="font-mono font-semibold">{formatBDT(payment.amount)}</span></div>)}</div></Card>
      </div>

      <Card className="overflow-hidden border-slate-200 shadow-xs"><div className="border-b border-slate-200 p-5"><h2 className="font-semibold text-[#070B28]">Transactions</h2><p className="text-xs text-slate-500">Prepared for search, scope, range, page, and limit query parameters.</p></div><DataState data={transactions.data} isLoading={transactions.isLoading} isError={transactions.isError} resource="transactions" emptyTitle="No transactions found." onRetry={() => void transactions.refetch()}>{(rows) => <div className="overflow-x-auto"><Table><TableHeader className="bg-slate-50"><TableRow><TableHead>Invoice</TableHead><TableHead>Customer</TableHead><TableHead>Payment</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader><TableBody>{rows.map((row) => <TableRow key={row.id}><TableCell className="font-mono">{row.invoiceNumber}</TableCell><TableCell>{row.customerName || "Walk-in customer"}</TableCell><TableCell>{row.paymentLabel}</TableCell><TableCell>{row.status}</TableCell><TableCell className="text-right font-mono">{formatBDT(row.totalAmount)}</TableCell></TableRow>)}</TableBody></Table></div>}</DataState></Card>
    </div>
  );
}
