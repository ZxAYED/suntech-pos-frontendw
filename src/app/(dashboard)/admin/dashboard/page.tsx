"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Receipt,
  TrendingUp,
  WalletCards,
  RefreshCw,
  Users,
  History,
  Eye,
  Clock,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { DataPagination } from "@/components/common/data-pagination";
import { DataState, MetricGridSkeleton, TenantRequiredState } from "@/components/common/data-state";
import { MetricCard } from "@/components/common/metric-card";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  useDashboardInventoryAlerts,
  useDashboardOverview,
  useDashboardRecentActivity,
} from "@/features/dashboard/api/use-admin-dashboard";
import { useStaff } from "@/features/hr/api/use-hr";
import { useShifts, type ShiftFilters } from "@/features/shifts/api/use-shifts";
import type { ShiftViewModel } from "@/features/shifts/view-models";
import { useTenantScope } from "@/features/tenant/hooks/use-tenant-scope";
import {
  formatBusinessDateTime,
  formatBusinessTime,
  isValidCalendarDate,
} from "@/lib/business-time";
import { cn, formatBDT } from "@/lib/utils";

export default function AdminDashboardPage() {
  const tenant = useTenantScope("admin");

  // Refresh State partitioned by tenant scope (F07)
  const currentScopeKey = `${tenant.businessId ?? ""}:${tenant.locationId ?? ""}`;
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshRecord, setRefreshRecord] = useState<{ scopeKey: string; refreshedAt: string } | null>(null);
  const lastRefreshedAt = refreshRecord?.scopeKey === currentScopeKey ? refreshRecord.refreshedAt : null;

  // Shift History Filters
  const [historyPagination, setHistoryPagination] = useState({ page: 1, limit: 10 });
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [cashierFilter, setCashierFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "OPEN" | "CLOSED">("ALL");
  const [selectedShift, setSelectedShift] = useState<ShiftViewModel | null>(null);

  // F15: Guard against reversed date range
  const isDateRangeReversed = useMemo(() => {
    if (fromDate && toDate && isValidCalendarDate(fromDate) && isValidCalendarDate(toDate)) {
      return fromDate > toDate;
    }
    return false;
  }, [fromDate, toDate]);

  // Parallel dashboard queries
  const overviewQuery = useDashboardOverview(tenant.tenantParams, tenant.isTenantReady);
  const alertsQuery = useDashboardInventoryAlerts(tenant.tenantParams, tenant.isTenantReady);
  const recentActivityQuery = useDashboardRecentActivity(tenant.tenantParams, 5, tenant.isTenantReady);

  // Cashier list for shift filter
  const staffQuery = useStaff(
    {
      businessId: tenant.businessId ?? undefined,
      locationId: tenant.locationId ?? undefined,
    },
    tenant.isTenantReady,
  );

  // Shift history query
  const shiftFilters = useMemo<ShiftFilters>(() => {
    const base: ShiftFilters = { ...tenant.buildQueryParams(historyPagination) };
    if (fromDate && isValidCalendarDate(fromDate) && !isDateRangeReversed) {
      base.fromDate = fromDate;
    }
    if (toDate && isValidCalendarDate(toDate) && !isDateRangeReversed) {
      base.toDate = toDate;
    }
    if (cashierFilter !== "all") {
      base.cashierId = cashierFilter;
    }
    if (statusFilter !== "ALL") {
      base.status = statusFilter;
    }
    return base;
  }, [tenant, historyPagination, fromDate, toDate, isDateRangeReversed, cashierFilter, statusFilter]);

  const shiftsQuery = useShifts(shiftFilters, tenant.isTenantReady);

  if (!tenant.isTenantReady) return <TenantRequiredState />;

  const overview = overviewQuery.data;
  const drawer = overview?.drawer;
  const kpis = overview?.kpis;
  const criticalItems = alertsQuery.data?.criticalItems ?? [];
  const tickets = recentActivityQuery.data?.tickets ?? [];

  const areMetricsLoading = overviewQuery.isLoading && alertsQuery.isLoading;
  const areMetricsFailed = overviewQuery.isError && alertsQuery.isError;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const results = await Promise.allSettled([
        overviewQuery.refetch(),
        alertsQuery.refetch(),
        recentActivityQuery.refetch(),
        shiftsQuery.refetch(),
      ]);

      const anySuccess = results.some((r) => r.status === "fulfilled" && !r.value?.isError);
      const anyError = results.some(
        (r) => r.status === "rejected" || (r.status === "fulfilled" && r.value?.isError),
      );

      if (anySuccess) {
        setRefreshRecord({
          scopeKey: currentScopeKey,
          refreshedAt: formatBusinessTime(new Date()),
        });
      }
      if (anyError) {
        toast.warning("Some dashboard panels could not be refreshed.");
      } else {
        toast.success("Dashboard data refreshed.");
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleResetHistoryFilters = () => {
    setFromDate("");
    setToDate("");
    setCashierFilter("all");
    setStatusFilter("ALL");
    setHistoryPagination((p) => ({ ...p, page: 1 }));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Operations Dashboard"
        description="Monitor today's sales, cash drawer, stock alerts, and recent transactions for your selected branch."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {lastRefreshedAt && (
              <span className="text-xs text-slate-500 font-medium">
                Refreshed at {lastRefreshedAt}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              disabled={isRefreshing}
              onClick={() => void handleRefresh()}
              className="text-xs"
            >
              <RefreshCw className={cn("mr-1.5 h-3.5 w-3.5", isRefreshing && "animate-spin")} />
              Refresh latest data
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/select-business">
                {tenant.activeBusiness?.name} · {tenant.activeBranch?.name}
              </Link>
            </Button>
          </div>
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
                ? `Sales less expenses: ${formatBDT(kpis.netCashflowToday)}`
                : "Branch operational expenses"
            }
          />
        </div>
      )}

      {/* Main Layout: Wide Left Panel + Two Stacked Right Panels */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        {/* Left Column: Recent Receipts (F06) */}
        <Card className="overflow-hidden border-slate-200 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-200 p-5">
            <div>
              <h2 className="font-semibold text-[#070B28]">Recent Receipts</h2>
              <p className="text-xs text-slate-500">Recent receipts for the selected branch.</p>
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
            emptyTitle="No recent sales recorded for this branch."
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
                            {row.itemsSummary ? `${row.itemsSummary} · ` : ""}
                            {row.occurredAt ? formatBusinessDateTime(row.occurredAt) : ""}
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
                  label="Opened at (Dhaka)"
                  value={drawer.openedAt ? formatBusinessDateTime(drawer.openedAt) : "—"}
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

      {/* Staff Sessions & Today's Shift Telemetry (F1) */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Cashier Latest Session State */}
        <Card className="border-slate-200 p-5 shadow-xs">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Users className="h-4 w-4 text-[#0052FF]" />
            <div>
              <h2 className="font-semibold text-[#070B28]">Staff Session State</h2>
              <p className="text-xs text-slate-500">Latest server-managed session activity (Asia/Dhaka).</p>
            </div>
          </div>
          {overview?.cashierLoginStatuses ? (
            overview.cashierLoginStatuses.length === 0 ? (
              <p className="mt-4 text-xs text-slate-500">No cashier sessions recorded for this branch.</p>
            ) : (
              <div className="mt-3 overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead>Cashier</TableHead>
                      <TableHead>Session</TableHead>
                      <TableHead>Latest Login</TableHead>
                      <TableHead>Latest Logout</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {overview.cashierLoginStatuses.map((st) => (
                      <TableRow key={st.cashierId}>
                        <TableCell className="font-medium text-xs">
                          {st.fullName}
                          {st.publicId && <span className="block text-[11px] text-slate-400 font-mono">{st.publicId}</span>}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              st.isLoggedIn
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700 text-[10px]"
                                : "border-slate-200 bg-slate-50 text-slate-500 text-[10px]"
                            }
                          >
                            {st.isLoggedIn ? "ACTIVE SESSION" : "LOGGED OUT"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-slate-600 whitespace-nowrap">
                          {st.lastLoginAt ? formatBusinessDateTime(st.lastLoginAt) : "—"}
                        </TableCell>
                        <TableCell className="text-xs text-slate-600 whitespace-nowrap">
                          {st.lastLogoutAt ? formatBusinessDateTime(st.lastLogoutAt) : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )
          ) : (
            <p className="mt-4 text-xs text-slate-400">
              Session state telemetry extensions unavailable from this server.
            </p>
          )}
        </Card>

        {/* Today's Shifts across All Cashiers */}
        <Card className="border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#0052FF]" />
              <div>
                <h2 className="font-semibold text-[#070B28]">Today&apos;s Branch Shifts</h2>
                <p className="text-xs text-slate-500">Shifts opened on today&apos;s Dhaka calendar date.</p>
              </div>
            </div>
            {overview?.todayShiftCounts && (
              <div className="flex items-center gap-1.5 text-xs">
                <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700 text-[10px]">
                  {overview.todayShiftCounts.open} Open
                </Badge>
                <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600 text-[10px]">
                  {overview.todayShiftCounts.closed} Closed
                </Badge>
              </div>
            )}
          </div>

          {overview?.olderOpenShifts && overview.olderOpenShifts.length > 0 && (
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              <p className="font-semibold">
                Carryover: {overview.olderOpenShiftCount ?? overview.olderOpenShifts.length} shift(s) left open from previous calendar day(s).
              </p>
              <p className="mt-0.5 text-amber-700">
                Opening a new shift today will automatically close previous-day shifts.
              </p>
            </div>
          )}

          {overview?.todayShifts ? (
            overview.todayShifts.length === 0 ? (
              <p className="mt-4 text-xs text-slate-500">No shifts opened today yet.</p>
            ) : (
              <div className="mt-3 overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead>Cashier</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Opened (Dhaka)</TableHead>
                      <TableHead className="text-right">Float</TableHead>
                      <TableHead className="text-right">Closing cash</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {overview.todayShifts.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium text-xs">
                          {s.cashierName || s.cashierId}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              s.status === "OPEN"
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700 text-[10px]"
                                : "border-slate-200 bg-slate-50 text-slate-600 text-[10px]"
                            }
                          >
                            {s.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-slate-600 whitespace-nowrap">
                          {formatBusinessDateTime(s.openedAt)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs">
                          {formatBDT(s.openingFloat ?? 0)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs">
                          {s.status === "CLOSED" && (s.closingCashNotProvided || s.closingAmount === null) ? (
                            <span className="text-amber-600 text-[11px]" title={s.autoCloseReason || "Uncounted"}>
                              Uncounted
                            </span>
                          ) : s.closingAmount != null ? (
                            formatBDT(s.closingAmount)
                          ) : (
                            "—"
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )
          ) : (
            <p className="mt-4 text-xs text-slate-400">
              Today&apos;s shift telemetry extensions unavailable from this server.
            </p>
          )}
        </Card>
      </div>

      {/* Admin Shift History & Detailed Inspection (F2) */}
      <Card className="overflow-hidden border-slate-200 shadow-xs">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-[#0052FF]" />
            <div>
              <h2 className="font-semibold text-[#070B28]">Branch Shift History</h2>
              <p className="text-xs text-slate-500">Historical shift records for the active branch.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* Cashier Filter */}
            <Select
              value={cashierFilter}
              onValueChange={(val) => {
                setCashierFilter(val);
                setHistoryPagination((p) => ({ ...p, page: 1 }));
              }}
            >
              <SelectTrigger className="h-8 min-h-8 w-36 bg-white text-xs">
                <SelectValue placeholder="All Cashiers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cashiers</SelectItem>
                {(staffQuery.data || []).map((staff) => (
                  <SelectItem key={staff.id} value={staff.id}>
                    {staff.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select
              value={statusFilter}
              onValueChange={(val: "ALL" | "OPEN" | "CLOSED") => {
                setStatusFilter(val);
                setHistoryPagination((p) => ({ ...p, page: 1 }));
              }}
            >
              <SelectTrigger className="h-8 min-h-8 w-28 bg-white text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="OPEN">Open</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
              </SelectContent>
            </Select>

            {/* Date Filters */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <span>From:</span>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setHistoryPagination((p) => ({ ...p, page: 1 }));
                }}
                className={cn("h-8 w-36 text-xs bg-white", isDateRangeReversed && "border-rose-400 focus-visible:ring-rose-400")}
              />
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <span>To:</span>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setHistoryPagination((p) => ({ ...p, page: 1 }));
                }}
                className={cn("h-8 w-36 text-xs bg-white", isDateRangeReversed && "border-rose-400 focus-visible:ring-rose-400")}
              />
            </div>

            {isDateRangeReversed && (
              <span className="text-[11px] font-medium text-rose-600 self-center">
                From date cannot be after To date
              </span>
            )}

            {(fromDate || toDate || cashierFilter !== "all" || statusFilter !== "ALL") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetHistoryFilters}
                className="h-8 text-xs text-slate-500 hover:text-slate-800"
              >
                <RotateCcw className="mr-1 h-3 w-3" />
                Reset
              </Button>
            )}
          </div>
        </div>

        <DataState
          data={shiftsQuery.data?.rows ?? []}
          isLoading={shiftsQuery.isLoading}
          isError={shiftsQuery.isError}
          resource="branch shifts"
          emptyTitle="No shifts match the selected filters."
          onRetry={() => void shiftsQuery.refetch()}
        >
          {(rows) => (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead>Cashier</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Opened (Dhaka)</TableHead>
                    <TableHead>Closed (Dhaka)</TableHead>
                    <TableHead className="text-right">Opening Float</TableHead>
                    <TableHead className="text-right">Closing Cash / Variance</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((shift) => (
                    <TableRow key={shift.id}>
                      <TableCell className="font-medium text-xs">
                        {shift.cashierName || shift.cashierId}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            shift.status === "OPEN"
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700 text-[10px]"
                              : "border-slate-200 bg-slate-50 text-slate-600 text-[10px]"
                          }
                        >
                          {shift.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-slate-600 whitespace-nowrap">
                        {formatBusinessDateTime(shift.openedAt)}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600 whitespace-nowrap">
                        {shift.closedAt ? formatBusinessDateTime(shift.closedAt) : "—"}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        {formatBDT(shift.openingFloat)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        {shift.status === "CLOSED" &&
                        (shift.closingCashNotProvided || shift.closingCash === null) ? (
                          <span className="text-amber-600 font-medium text-[11px]" title={shift.autoCloseReason || "Uncounted"}>
                            Closing cash not provided
                          </span>
                        ) : shift.variance != null ? (
                          formatBDT(shift.variance)
                        ) : (
                          "—"
                        )}
                        {shift.autoCloseReason ? (
                          <span className="block text-[10px] text-amber-700 font-sans truncate max-w-[200px] ml-auto">
                            {shift.autoCloseReason}
                          </span>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedShift(shift)}
                          className="h-7 text-xs font-medium"
                        >
                          <Eye className="mr-1 h-3 w-3" />
                          Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DataState>

        <div className="border-t border-slate-200 px-4">
          <DataPagination
            currentPage={shiftsQuery.data?.meta.page ?? historyPagination.page}
            totalPages={shiftsQuery.data?.meta.totalPages ?? 1}
            totalItems={shiftsQuery.data?.meta.total ?? 0}
            pageSize={shiftsQuery.data?.meta.limit ?? historyPagination.limit}
            onPageChange={(page) => setHistoryPagination((current) => ({ ...current, page }))}
            onPageSizeChange={(limit) => setHistoryPagination({ page: 1, limit })}
            itemLabel="shifts"
          />
        </div>
      </Card>

      {/* Selected Shift Detail Dialog */}
      <Dialog open={selectedShift !== null} onOpenChange={(open) => !open && setSelectedShift(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Shift Inspection Details</DialogTitle>
            <DialogDescription>
              Authoritative record returned by server for shift {selectedShift?.id}
            </DialogDescription>
          </DialogHeader>
          {selectedShift && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 rounded-lg border border-slate-100 bg-slate-50/50 p-3">
                <div>
                  <span className="text-slate-400">Cashier:</span>
                  <p className="font-semibold text-slate-800">{selectedShift.cashierName || selectedShift.cashierId}</p>
                </div>
                <div>
                  <span className="text-slate-400">Status:</span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "block w-fit mt-0.5 text-[10px]",
                      selectedShift.status === "OPEN"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-slate-50 text-slate-700",
                    )}
                  >
                    {selectedShift.status}
                  </Badge>
                </div>
                <div>
                  <span className="text-slate-400">Opened (Dhaka):</span>
                  <p className="font-mono text-slate-800">{formatBusinessDateTime(selectedShift.openedAt)}</p>
                </div>
                <div>
                  <span className="text-slate-400">Closed (Dhaka):</span>
                  <p className="font-mono text-slate-800">
                    {selectedShift.closedAt ? formatBusinessDateTime(selectedShift.closedAt) : "— (Active)"}
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 p-3 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Opening float:</span>
                  <span className="font-mono font-semibold">{formatBDT(selectedShift.openingFloat)}</span>
                </div>
                {selectedShift.expectedCash !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Expected cash in drawer:</span>
                    <span className="font-mono font-semibold">{formatBDT(selectedShift.expectedCash)}</span>
                  </div>
                )}
                {selectedShift.cashSales !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Cash sales:</span>
                    <span className="font-mono">{formatBDT(selectedShift.cashSales)}</span>
                  </div>
                )}
                {selectedShift.advancesOut !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Advances disbursed:</span>
                    <span className="font-mono text-rose-600">-{formatBDT(selectedShift.advancesOut)}</span>
                  </div>
                )}
                <div className="border-t border-slate-100 pt-2 flex justify-between">
                  <span className="text-slate-500">Counted closing cash:</span>
                  <span className="font-mono font-semibold">
                    {selectedShift.status === "CLOSED" &&
                    (selectedShift.closingCashNotProvided || selectedShift.closingCash === null) ? (
                      <span className="text-amber-600 font-sans font-medium">
                        Closing cash not provided
                      </span>
                    ) : selectedShift.closingCash !== null && selectedShift.closingCash !== undefined ? (
                      formatBDT(selectedShift.closingCash)
                    ) : (
                      "—"
                    )}
                  </span>
                </div>
                {selectedShift.variance !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Variance:</span>
                    <span
                      className={cn(
                        "font-mono font-bold",
                        selectedShift.variance === 0
                          ? "text-emerald-600"
                          : selectedShift.variance < 0
                          ? "text-rose-600"
                          : "text-blue-600",
                      )}
                    >
                      {formatBDT(selectedShift.variance)}
                    </span>
                  </div>
                )}
              </div>

              {selectedShift.autoCloseReason && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-amber-800">
                  <span className="font-semibold">Auto-close note:</span> {selectedShift.autoCloseReason}
                </div>
              )}

              {selectedShift.notes && (
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-2.5 text-slate-700">
                  <span className="font-semibold">Cashier notes:</span> {selectedShift.notes}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
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
