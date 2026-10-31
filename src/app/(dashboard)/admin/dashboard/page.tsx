"use client";

import Link from "next/link";
import { AlertTriangle, Receipt, TrendingUp, WalletCards } from "lucide-react";
import { DataState, MetricGridSkeleton, TenantRequiredState } from "@/components/common/data-state";
import { MetricCard } from "@/components/common/metric-card";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  useDashboardInventoryAlerts,
  useDashboardOverview,
  useDashboardRecentActivity,
} from "@/features/dashboard/api/use-admin-dashboard";
import { useTenantScope } from "@/features/tenant/hooks/use-tenant-scope";
import { cn, formatBDT } from "@/lib/utils";

export default function AdminDashboardPage() {
  const tenant = useTenantScope("admin");

  // Three dedicated, independent parallel dashboard queries
  const overviewQuery = useDashboardOverview(tenant.tenantParams, tenant.isTenantReady);
  const alertsQuery = useDashboardInventoryAlerts(tenant.tenantParams, tenant.isTenantReady);
  const recentActivityQuery = useDashboardRecentActivity(tenant.tenantParams, 5, tenant.isTenantReady);

  if (!tenant.isTenantReady) return <TenantRequiredState />;

  const overview = overviewQuery.data;
  const drawer = overview?.drawer;
  const kpis = overview?.kpis;
  const criticalItems = alertsQuery.data?.criticalItems ?? [];
  const tickets = recentActivityQuery.data?.tickets ?? [];

  const areMetricsLoading = overviewQuery.isLoading && alertsQuery.isLoading;
  const areMetricsFailed = overviewQuery.isError && alertsQuery.isError;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Operations Dashboard"
        description="Monitor today's sales, cash drawer, stock alerts, and recent transactions for your selected branch."
        actions={
          <Button asChild variant="outline">
            <Link href="/admin/select-business">
              {tenant.activeBusiness?.name} · {tenant.activeBranch?.name}
            </Link>
          </Button>
        }
      />

      {/* Four Horizontal Real-Time Operational KPI Cards */}
      {areMetricsLoading ? (
        <MetricGridSkeleton />
      ) : areMetricsFailed ? (
        <DataState
          data={[]}
          isLoading={false}
          isError
          resource="dashboard overview"
          emptyTitle="Could not load dashboard metrics."
          onRetry={() => {
            void overviewQuery.refetch();
            void alertsQuery.refetch();
          }}
        >
          {() => null}
        </DataState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {/* Card 1: Today's Net Sales */}
          <MetricCard
            label="Today's net sales"
            value={
              overviewQuery.isLoading
                ? "—"
                : overviewQuery.isError
                ? "Unavailable"
                : formatBDT(kpis?.todayNetSales ?? 0)
            }
            icon={TrendingUp}
            subtext={
              overviewQuery.isLoading
                ? "Loading sales…"
                : overviewQuery.isError
                ? "Failed to fetch sales"
                : `${kpis?.todayOrderCount ?? 0} orders today`
            }
          />

          {/* Card 2: Cash in Drawer */}
          <MetricCard
            label="Cash in drawer"
            value={
              overviewQuery.isLoading
                ? "—"
                : overviewQuery.isError
                ? "Unavailable"
                : drawer?.hasActiveShift
                ? formatBDT(drawer.expectedCashInDrawer)
                : "No active shift"
            }
            icon={WalletCards}
            subtext={
              overviewQuery.isLoading
                ? "Checking shift…"
                : overviewQuery.isError
                ? "Failed to fetch drawer"
                : drawer?.hasActiveShift
                ? `Opening float: ${formatBDT(drawer.openingFloat)}`
                : "Open shift to track drawer"
            }
          />

          {/* Card 3: Low Stock SKUs */}
          <MetricCard
            label="Low stock SKUs"
            value={
              alertsQuery.isLoading
                ? "—"
                : alertsQuery.isError
                ? "Unavailable"
                : alertsQuery.data?.lowStockCount ?? 0
            }
            icon={AlertTriangle}
            subtext={
              alertsQuery.isLoading
                ? "Checking inventory…"
                : alertsQuery.isError
                ? "Failed to fetch stock"
                : `${alertsQuery.data?.outOfStockCount ?? 0} out of stock`
            }
          />

          {/* Card 4: Today's Expenses */}
          <MetricCard
            label="Today's expenses"
            value={
              overviewQuery.isLoading
                ? "—"
                : overviewQuery.isError
                ? "Unavailable"
                : formatBDT(kpis?.todayExpenseTotal ?? 0)
            }
            icon={Receipt}
            subtext={
              overviewQuery.isLoading
                ? "Loading expenses…"
                : overviewQuery.isError
                ? "Failed to fetch expenses"
                : kpis?.netCashflowToday !== undefined
                ? `Net cashflow: ${formatBDT(kpis.netCashflowToday)}`
                : "Branch operational expenses"
            }
          />
        </div>
      )}

      {/* Main Layout: Wide Left Panel + Two Stacked Right Panels */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        {/* Left Column: Today's Live Receipts */}
        <Card className="overflow-hidden border-slate-200 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-200 p-5">
            <div>
              <h2 className="font-semibold text-[#070B28]">Today&apos;s Live Receipts</h2>
              <p className="text-xs text-slate-500">Real-time receipts for the selected branch.</p>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/orders">View all</Link>
            </Button>
          </div>
          <DataState
            data={tickets}
            isLoading={recentActivityQuery.isLoading}
            isError={recentActivityQuery.isError}
            resource="recent receipts"
            emptyTitle="No sales recorded for this branch today."
            onRetry={() => void recentActivityQuery.refetch()}
          >
            {(rows) => (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-mono">{row.invoiceNumber}</TableCell>
                        <TableCell>
                          <p className="font-medium text-[#070B28]">{row.customerName || "Walk-in customer"}</p>
                          <p className="text-xs text-slate-400">
                            {row.itemsSummary ||
                              (row.occurredAt
                                ? new Date(row.occurredAt).toLocaleTimeString("en-BD", {
                                    timeZone: "Asia/Dhaka",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : "")}
                          </p>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs font-medium text-slate-700">
                            {row.paymentLabel || row.paymentMethod}
                          </span>
                          {row.status ? (
                            <Badge variant="outline" className="ml-2 text-[10px] px-1.5 py-0">
                              {row.status}
                            </Badge>
                          ) : null}
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold text-[#070B28]">
                          {formatBDT(row.totalAmount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </DataState>
        </Card>

        {/* Right Column: Active Shift & Cash + Critical Stock Alerts */}
        <div className="space-y-6">
          {/* Card 1: Active Shift & Cash */}
          <Card className="border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="font-semibold text-[#070B28]">Active Shift &amp; Cash</h2>
              <Badge
                variant="outline"
                className={drawer?.hasActiveShift ? "border-emerald-200 bg-emerald-50 text-emerald-700" : ""}
              >
                {drawer?.hasActiveShift ? "OPEN" : "NO SHIFT"}
              </Badge>
            </div>
            {overviewQuery.isLoading ? (
              <p className="mt-4 text-sm text-slate-400">Loading shift telemetry…</p>
            ) : overviewQuery.isError ? (
              <div className="mt-4">
                <p role="alert" className="text-sm text-rose-600">
                  Could not load shift information.
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => void overviewQuery.refetch()}
                  className="mt-2 text-xs text-[#0052FF]"
                >
                  Retry
                </Button>
              </div>
            ) : drawer?.hasActiveShift ? (
              <dl className="mt-4 space-y-2.5 text-sm">
                <Row
                  label="Cashier"
                  value={drawer.cashierName + (drawer.cashierPublicId ? ` (${drawer.cashierPublicId})` : "")}
                />
                <Row
                  label="Opened at"
                  value={
                    drawer.openedAt
                      ? new Date(drawer.openedAt).toLocaleTimeString("en-BD", {
                          timeZone: "Asia/Dhaka",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"
                  }
                />
                <Row label="Opening float" value={formatBDT(drawer.openingFloat)} />
                <Row label="Cash collected" value={formatBDT(drawer.cashCollected)} />
                <Row label="Cash paid out" value={formatBDT(drawer.cashPaidOut)} />
                <div className="border-t border-slate-100 pt-2.5">
                  <Row label="Expected cash" value={formatBDT(drawer.expectedCashInDrawer)} highlight />
                </div>
              </dl>
            ) : (
              <p className="mt-4 text-sm text-slate-500">
                No active shift. Checkout may still proceed without shiftId.
              </p>
            )}
          </Card>

          {/* Card 2: Critical Stock Alerts */}
          <Card className="border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="font-semibold text-[#070B28]">Critical Stock Alerts</h2>
                <p className="text-xs text-slate-500">Items below branch reorder threshold.</p>
              </div>
              <Button asChild variant="ghost" size="sm" className="text-xs text-[#0052FF] hover:text-[#0047E0]">
                <Link href="/admin/catalog">View Catalog</Link>
              </Button>
            </div>
            {alertsQuery.isLoading ? (
              <p className="mt-4 text-sm text-slate-400">Checking stock levels…</p>
            ) : alertsQuery.isError ? (
              <div className="mt-4">
                <p role="alert" className="text-sm text-rose-600">
                  Could not load stock alerts.
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => void alertsQuery.refetch()}
                  className="mt-2 text-xs text-[#0052FF]"
                >
                  Retry
                </Button>
              </div>
            ) : criticalItems.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">No critical stock alerts for this branch.</p>
            ) : (
              <div className="mt-3 divide-y divide-slate-100">
                {criticalItems.map((item) => {
                  const isOutOfStock = item.currentStock <= 0;
                  return (
                    <div
                      key={item.variantId || item.sku}
                      className="py-2.5 first:pt-1 last:pb-1 flex items-start justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#070B28] truncate">{item.productName}</p>
                        <p className="text-xs text-slate-500 truncate">
                          {item.variantName ? `${item.variantName} · ` : ""}
                          <span className="font-mono text-slate-400">SKU: {item.sku}</span>
                        </p>
                        <p className="mt-0.5 text-xs text-slate-400">
                          Stock:{" "}
                          <span
                            className={cn(
                              "font-mono font-semibold",
                              isOutOfStock ? "text-rose-600" : "text-amber-600",
                            )}
                          >
                            {item.currentStock}
                          </span>
                          {item.reorderLevel !== undefined ? ` · Reorder at: ${item.reorderLevel}` : ""}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          "shrink-0 text-[10px] px-2 py-0.5 font-medium rounded-md",
                          isOutOfStock
                            ? "border-rose-200 bg-rose-50 text-rose-700"
                            : "border-amber-200 bg-amber-50 text-amber-700",
                        )}
                      >
                        {isOutOfStock ? "Out of stock" : "Low stock"}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className={highlight ? "font-medium text-[#070B28]" : "text-slate-500"}>{label}</dt>
      <dd className={cn("font-mono font-medium", highlight ? "text-[#0052FF] font-bold" : "text-[#070B28]")}>
        {value}
      </dd>
    </div>
  );
}
