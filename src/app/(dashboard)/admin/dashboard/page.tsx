"use client";

import Link from "next/link";
import { BarChart3, Receipt, TrendingUp, WalletCards } from "lucide-react";
import { DataState, MetricGridSkeleton, TenantRequiredState } from "@/components/common/data-state";
import { MetricCard } from "@/components/common/metric-card";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMockOrders } from "@/features/pos/api/use-pos";
import { useMockDashboardReport } from "@/features/reports/api/use-reports";
import { useMockShifts } from "@/features/shifts/api/use-shifts";
import { useTenantScope } from "@/features/tenant/hooks/use-tenant-scope";
import { formatBDT } from "@/lib/utils";

export default function AdminDashboardPage() {
  const tenant = useTenantScope("admin");
  const report = useMockDashboardReport();
  const orders = useMockOrders({ search: "", page: 1, limit: 5 });
  const shifts = useMockShifts();
  if (!tenant.isTenantReady) return <TenantRequiredState />;
  const summary = report.data.summary;
  const activeShift = shifts.data.find((shift) => shift.status === "OPEN");

  return (
    <div className="space-y-6">
      <PageHeader title="Operations Dashboard" actions={<Button asChild variant="outline"><Link href="/admin/select-business">{tenant.activeBusiness?.name} · {tenant.activeBranch?.name}</Link></Button>} />

      {report.isLoading ? <MetricGridSkeleton /> : report.isError ? <DataState data={[]} isLoading={false} isError resource="dashboard summary" emptyTitle="No summary available." onRetry={() => void report.refetch()}>{() => null}</DataState> : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="Gross sales" value={formatBDT(summary.grossSales)} icon={TrendingUp} /><MetricCard label="Average ticket" value={formatBDT(summary.averageTicket)} icon={Receipt} /><MetricCard label="Orders today" value={summary.orderCount} icon={BarChart3} /><MetricCard label="Gross margin (Admin)" value={`${summary.grossMargin ?? 0}%`} icon={WalletCards} /></div>}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <Card className="overflow-hidden border-slate-200 shadow-xs"><div className="flex items-center justify-between border-b border-slate-200 p-5"><div><h2 className="font-semibold text-[#070B28]">Recent terminal tickets</h2><p className="text-xs text-slate-500">Mapped from Order entities.</p></div><Button asChild variant="ghost" size="sm"><Link href="/pos/orders">View all</Link></Button></div><DataState data={orders.data.slice(0, 5)} isLoading={orders.isLoading} isError={orders.isError} resource="recent orders" emptyTitle="No orders found." onRetry={() => void orders.refetch()}>{(rows) => <div className="overflow-x-auto"><Table><TableHeader className="bg-slate-50"><TableRow><TableHead>Invoice</TableHead><TableHead>Customer</TableHead><TableHead>Payment</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader><TableBody>{rows.map((row) => <TableRow key={row.id}><TableCell className="font-mono">{row.invoiceNumber}</TableCell><TableCell><p className="font-medium">{row.customerName || "Walk-in customer"}</p><p className="text-xs text-slate-400">{row.summary}</p></TableCell><TableCell>{row.paymentLabel}</TableCell><TableCell className="text-right font-mono font-semibold">{formatBDT(row.totalAmount)}</TableCell></TableRow>)}</TableBody></Table></div>}</DataState></Card>

        <div className="space-y-6">
          <Card className="border-slate-200 p-5 shadow-xs"><div className="flex items-center justify-between"><h2 className="font-semibold text-[#070B28]">Active shift telemetry</h2><Badge variant="outline" className={activeShift ? "border-emerald-200 bg-emerald-50 text-emerald-700" : ""}>{activeShift ? "OPEN" : "NO SHIFT"}</Badge></div>{shifts.isLoading ? <p className="mt-4 text-sm text-slate-400">Loading telemetry…</p> : shifts.isError ? <p role="alert" className="mt-4 text-sm text-rose-600">Could not load shift telemetry.</p> : activeShift ? <dl className="mt-4 space-y-3 text-sm"><Row label="Cashier" value={activeShift.cashierName || "Unknown"} /><Row label="Opening float" value={formatBDT(activeShift.openingFloat)} /><Row label="Expected cash" value={formatBDT(activeShift.expectedCash ?? 0)} /><Row label="Variance" value={formatBDT(activeShift.variance ?? 0)} /></dl> : <p className="mt-4 text-sm text-slate-500">No active shift. Checkout may still proceed without shiftId.</p>}</Card>
          <Card className="border-slate-200 p-5 shadow-xs"><h2 className="font-semibold text-[#070B28]">Category sales volume</h2><div className="mt-4 space-y-4">{report.data.categories.map((category) => <div key={category.categoryId}><div className="mb-1 flex justify-between text-sm"><span>{category.categoryName}</span><span className="font-mono">{formatBDT(category.revenue)}</span></div><div className="h-2 rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#0052FF]" style={{ width: `${category.percentage}%` }} /></div></div>)}</div></Card>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) { return <div className="flex justify-between gap-4"><dt className="text-slate-500">{label}</dt><dd className="font-mono font-medium text-[#070B28]">{value}</dd></div>; }
