"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  Download,
  Receipt,
  TrendingUp,
  WalletCards,
  Loader2,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Building2,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { DataState, MetricGridSkeleton, TenantRequiredState } from "@/components/common/data-state";
import { MetricCard } from "@/components/common/metric-card";
import { SegmentedTabs } from "@/components/common/segmented-tabs";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
  useAnalyticsReport,
  useExportReport,
  useTransactionsReport,
  type ReportDateParams,
  type TransactionReportFilters,
} from "@/features/reports/api/use-reports";
import { mapDashboardSummary } from "@/features/reports/view-models";
import { useLocationsQuery } from "@/features/tenant/api/use-tenant";
import { useTenantScope } from "@/features/tenant/hooks/use-tenant-scope";
import { formatBDT } from "@/lib/utils";

const MONTH_OPTIONS = [
  { value: "all", label: "All Months" },
  { value: "current", label: "Current Month" },
  { value: "1", label: "January (01)" },
  { value: "2", label: "February (02)" },
  { value: "3", label: "March (03)" },
  { value: "4", label: "April (04)" },
  { value: "5", label: "May (05)" },
  { value: "6", label: "June (06)" },
  { value: "7", label: "July (07)" },
  { value: "8", label: "August (08)" },
  { value: "9", label: "September (09)" },
  { value: "10", label: "October (10)" },
  { value: "11", label: "November (11)" },
  { value: "12", label: "December (12)" },
];

const RANGE_TABS = [
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "daily", label: "Daily" },
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
  { id: "quarterly", label: "Quarterly" },
  { id: "year", label: "Year" },
];

export function ReportsDashboard() {
  const tenant = useTenantScope("admin");
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  // Query parameter states matching GET /reports/dashboard, /reports/analytics & /reports/transactions
  const [range, setRange] = useState<string>("monthly");
  const [month, setMonth] = useState<string>("all");
  const [week, setWeek] = useState<string>("all");
  const [year, setYear] = useState<string>(String(currentYear));
  const [locationId, setLocationId] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(20);

  const locations = useLocationsQuery(tenant.businessId, tenant.isTenantReady);
  const exportReport = useExportReport();

  // Unified report query parameters
  const reportParams = useMemo<ReportDateParams>(() => {
    const params: ReportDateParams = {};
    if (range && range !== "all") params.range = range;
    if (month && month !== "all") params.month = month;
    if (week && week !== "all") params.week = week;
    if (year && year !== "all") params.year = Number(year);
    if (locationId && locationId !== "all") params.locationId = locationId;
    if (tenant.businessId) params.businessId = tenant.businessId;
    return params;
  }, [range, month, week, year, locationId, tenant.businessId]);

  const transactionFilters = useMemo<TransactionReportFilters>(() => {
    return {
      ...reportParams,
      search: search.trim() || undefined,
      page,
      limit,
    };
  }, [reportParams, search, page, limit]);

  const report = useAnalyticsReport(reportParams, tenant.isTenantReady);
  const transactions = useTransactionsReport(transactionFilters, tenant.isTenantReady);

  if (!tenant.isTenantReady) return <TenantRequiredState />;

  const rawSummary = report.data?.summary ?? {
    grossSales: 0,
    averageTicket: 0,
    orderCount: 0,
    grossMargin: 0,
    paymentBreakdown: [],
  };
  const summary = mapDashboardSummary(rawSummary);
  const categories = report.data?.categories ?? [];
  const rows = transactions.data?.rows ?? [];
  const total = transactions.data?.total ?? 0;
  const totalPages = transactions.data?.totalPages ?? 1;

  const handleResetFilters = () => {
    setRange("monthly");
    setMonth("all");
    setWeek("all");
    setYear(String(currentYear));
    setLocationId("all");
    setSearch("");
    setPage(1);
  };

  const handleExport = async (format: "csv" | "pdf") => {
    try {
      const expMonth =
        month !== "all" && !Number.isNaN(Number(month))
          ? Number(month)
          : currentMonth;
      const expYear =
        year !== "all" && !Number.isNaN(Number(year))
          ? Number(year)
          : currentYear;

      await exportReport.mutateAsync({
        type: "sales",
        format,
        month: expMonth,
        year: expYear,
        locationId: locationId !== "all" ? locationId : undefined,
        search: search.trim() || undefined,
      });
      toast.success(`Sales report exported to ${format.toUpperCase()}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : `Failed to export ${format.toUpperCase()}`);
    }
  };

  const startIndex = total === 0 ? 0 : (page - 1) * limit + 1;
  const endIndex = Math.min(page * limit, total);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales Analytics & Reports"
        description="Explore sales performance, revenue metrics, and transaction history."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={exportReport.isPending}
              onClick={() => handleExport("csv")}
            >
              {exportReport.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={exportReport.isPending}
              onClick={() => handleExport("pdf")}
            >
              {exportReport.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Export PDF
            </Button>
          </div>
        }
      />

      {/* Primary Range Selector Tabs */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <SegmentedTabs
          tabs={RANGE_TABS}
          activeTab={range}
          onChange={(newRange) => {
            setRange(newRange);
            setPage(1);
          }}
        />

        <Button
          variant="ghost"
          size="sm"
          onClick={handleResetFilters}
          className="self-start text-xs text-slate-500 hover:text-slate-800"
        >
          <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
          Reset filters
        </Button>
      </div>

      {/* Detailed Granular Filter Toolbar */}
      <Card className="border-slate-200 bg-slate-50/50 p-4 shadow-2xs">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Location / Branch Filter */}
          <div className="space-y-1">
            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
              <Building2 className="h-3.5 w-3.5 text-slate-400" />
              Branch Location
            </label>
            <Select
              value={locationId}
              onValueChange={(val) => {
                setLocationId(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-9 min-h-9 bg-white text-xs">
                <SelectValue placeholder="All Branches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {(locations.data || []).map((loc) => (
                  <SelectItem key={loc.id} value={loc.id}>
                    {loc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Month Filter */}
          <div className="space-y-1">
            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              Calendar Month
            </label>
            <Select
              value={month}
              onValueChange={(val) => {
                setMonth(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-9 min-h-9 bg-white text-xs">
                <SelectValue placeholder="All Months" />
              </SelectTrigger>
              <SelectContent>
                {MONTH_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Week Filter */}
          <div className="space-y-1">
            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              Week of Year
            </label>
            <Select
              value={week}
              onValueChange={(val) => {
                setWeek(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-9 min-h-9 bg-white text-xs">
                <SelectValue placeholder="All Weeks" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Weeks</SelectItem>
                <SelectItem value="current">Current Week</SelectItem>
                {Array.from({ length: 52 }, (_, i) => i + 1).map((w) => (
                  <SelectItem key={w} value={String(w)}>
                    Week {w}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Year Filter */}
          <div className="space-y-1">
            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              Calendar Year
            </label>
            <Select
              value={year}
              onValueChange={(val) => {
                setYear(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-9 min-h-9 bg-white text-xs">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                <SelectItem value="2026">2026</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2023">2023</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* KPI Metrics */}
      {report.isLoading ? (
        <MetricGridSkeleton />
      ) : report.isError ? (
        <DataState
          data={[]}
          isLoading={false}
          isError
          resource="report summary"
          emptyTitle="No report data."
          onRetry={() => void report.refetch()}
        >
          {() => null}
        </DataState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Gross sales" value={formatBDT(summary.grossSales)} icon={TrendingUp} />
          <MetricCard label="Average ticket" value={formatBDT(summary.averageTicket)} icon={Receipt} />
          <MetricCard label="Orders" value={summary.orderCount} icon={BarChart3} />
          <MetricCard label="Gross margin (Admin)" value={`${summary.grossMargin ?? 0}%`} icon={WalletCards} />
        </div>
      )}

      {/* Category Performance & Payment Breakdown */}
      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="border-slate-200 p-5 shadow-xs">
          <h2 className="font-semibold text-[#070B28]">Category performance</h2>
          <div className="mt-5 space-y-4">
            {categories.length === 0 ? (
              <p className="text-xs text-slate-400">No category performance available for this range.</p>
            ) : (
              categories.map((category) => (
                <div key={category.categoryId}>
                  <div className="mb-1.5 flex justify-between text-sm">
                    <span className="font-medium text-slate-700">{category.categoryName}</span>
                    <span className="font-mono text-[#070B28]">{formatBDT(category.revenue)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-[#0052FF]"
                      style={{ width: `${Math.min(100, Math.max(0, category.percentage))}%` }}
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">
                    {category.percentage}% of category sales
                  </p>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="border-slate-200 p-5 shadow-xs">
          <h2 className="font-semibold text-[#070B28]">Payment breakdown</h2>
          <div className="mt-5 space-y-3">
            {rawSummary.paymentBreakdown.length === 0 ? (
              <p className="text-xs text-slate-400">No payment records available for this range.</p>
            ) : (
              rawSummary.paymentBreakdown.map((payment) => (
                <div
                  key={payment.method}
                  className="flex items-center justify-between rounded-lg border border-slate-100 p-3"
                >
                  <div>
                    <p className="font-medium text-[#070B28]">{payment.method}</p>
                    <p className="text-xs text-slate-400">{payment.percentage}% of gross sales</p>
                  </div>
                  <span className="font-mono font-semibold">{formatBDT(payment.amount)}</span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Transactions Audit Log */}
      <Card className="overflow-hidden border-slate-200 shadow-xs">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-[#070B28]">Transactions</h2>
            <p className="text-xs text-slate-500">
              Real-time audit log of completed orders, refunds, and tender methods.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search invoice, customer, cashier..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="h-9 min-h-9 pl-8 pr-8 text-xs"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setPage(1);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/orders">View All Orders</Link>
            </Button>
          </div>
        </div>

        <DataState
          data={rows}
          isLoading={transactions.isLoading}
          isError={transactions.isError}
          resource="transactions"
          emptyTitle="No transactions found matching criteria."
          onRetry={() => void transactions.refetch()}
        >
          {(tableRows) => (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Cashier / Seller</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tableRows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-mono text-xs font-medium text-[#070B28]">
                          {row.invoiceNumber}
                        </TableCell>
                        <TableCell className="text-xs text-slate-600 whitespace-nowrap">
                          {row.createdAt
                            ? new Date(row.createdAt).toLocaleString("en-BD", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true,
                              })
                            : "—"}
                        </TableCell>
                        <TableCell className="text-xs text-slate-700">
                          {row.locationName || tenant.activeBranch?.name || "Main Branch"}
                        </TableCell>
                        <TableCell className="text-xs text-slate-700">
                          {row.sellerName || row.cashierName || "Cashier"}
                        </TableCell>
                        <TableCell className="text-xs">
                          <p className="font-medium text-[#070B28]">
                            {row.customerName || "Walk-in customer"}
                          </p>
                          {row.customerPhone && (
                            <p className="text-[11px] text-slate-400">{row.customerPhone}</p>
                          )}
                        </TableCell>
                        <TableCell className="text-xs">
                          <span className="font-medium text-slate-700">{row.paymentLabel}</span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              row.status === "PAID"
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700 text-[10px]"
                                : row.status === "REFUNDED"
                                ? "border-rose-200 bg-rose-50 text-rose-700 text-[10px]"
                                : "border-slate-200 bg-slate-50 text-slate-700 text-[10px]"
                            }
                          >
                            {row.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs font-semibold text-[#070B28]">
                          {formatBDT(row.totalAmount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Controls */}
              <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 px-5 py-3 sm:flex-row">
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span>
                    Showing {startIndex} to {endIndex} of {total} records
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span>Rows per page:</span>
                    <Select
                      value={String(limit)}
                      onValueChange={(val) => {
                        setLimit(Number(val));
                        setPage(1);
                      }}
                    >
                      <SelectTrigger className="h-7 w-16 min-h-0 px-2 py-0 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1 || transactions.isLoading}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="h-8 px-2 text-xs"
                  >
                    <ChevronLeft className="mr-1 h-3.5 w-3.5" />
                    Previous
                  </Button>
                  <span className="text-xs font-medium text-slate-600">
                    Page {page} of {Math.max(1, totalPages)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages || transactions.isLoading}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="h-8 px-2 text-xs"
                  >
                    Next
                    <ChevronRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </DataState>
      </Card>
    </div>
  );
}
