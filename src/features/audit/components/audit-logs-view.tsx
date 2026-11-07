"use client";

import { useMemo, useState } from "react";
import {
  RotateCw,
  RotateCcw,
  Clock,
  MapPin,
  Eye,
  SearchX,
  AlertCircle,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { TenantRequiredState } from "@/components/common/data-state";
import { DataPagination } from "@/components/common/data-pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/layout/page-header";
import { useAuditLogs, useAuditLogDetail, type AuditLogItem, type AuditLogFilters } from "@/features/audit/api/use-audit-logs";
import { useLocationsQuery } from "@/features/tenant/api/use-tenant";
import { useTenantScope } from "@/features/tenant/hooks/use-tenant-scope";
import { AuditStatCards } from "@/features/audit/components/audit-stat-cards";
import { AuditFilterToolbar } from "@/features/audit/components/audit-filter-toolbar";
import { AuditDetailModal } from "@/features/audit/components/audit-detail-modal";
import {
  formatBusinessDate,
  formatBusinessTime,
  isValidCalendarDate,
  businessDateRangeToAuditUtc,
} from "@/lib/business-time";

export function formatAuditTimestamp(isoDate: string) {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) {
    return { date: "—", time: "—", relative: "—" };
  }
  const date = formatBusinessDate(isoDate);
  const time = formatBusinessTime(isoDate);

  const diffMs = Date.now() - d.getTime();
  if (diffMs < -1000) {
    return { date, time, relative: "future" };
  }

  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  let relative = "just now";
  if (diffDay > 30) relative = date;
  else if (diffDay > 0) relative = `${diffDay}d ago`;
  else if (diffHour > 0) relative = `${diffHour}h ago`;
  else if (diffMin > 0) relative = `${diffMin}m ago`;
  else if (diffSec > 10) relative = `${diffSec}s ago`;

  return { date, time, relative };
}

export function buildAuditDateBounds(
  fromDate?: string,
  toDate?: string,
): { from?: string; to?: string; error?: string } {
  const result: { from?: string; to?: string; error?: string } = {};
  const hasFrom = Boolean(fromDate && fromDate.trim());
  const hasTo = Boolean(toDate && toDate.trim());

  if (!hasFrom && !hasTo) return result;

  if (hasFrom && !isValidCalendarDate(fromDate!)) {
    result.error = "Invalid from date";
    return result;
  }
  if (hasTo && !isValidCalendarDate(toDate!)) {
    result.error = "Invalid to date";
    return result;
  }

  if (hasFrom && hasTo) {
    if (fromDate! > toDate!) {
      result.error = "From date cannot be after to date";
      return result;
    }
    const bounds = businessDateRangeToAuditUtc(fromDate!, toDate!);
    result.from = bounds.from;
    result.to = bounds.to;
    return result;
  }

  if (hasFrom) {
    result.from = businessDateRangeToAuditUtc(fromDate!, fromDate!).from;
  }
  if (hasTo) {
    result.to = businessDateRangeToAuditUtc(toDate!, toDate!).to;
  }
  return result;
}

function getActionStyle(action: string) {
  const act = action.toUpperCase();
  if (
    act.includes("LOW_STOCK") ||
    act.includes("UNAVAILABLE") ||
    act.includes("MISMATCH") ||
    act.includes("VOID") ||
    act.includes("DELETE")
  ) {
    return {
      badgeClass: "border-rose-200 bg-rose-50 text-rose-700",
      dotClass: "bg-rose-500",
    };
  }
  if (
    act.includes("PASSWORD") ||
    act.includes("ROLE") ||
    act.includes("AUTH") ||
    act.includes("SECURITY")
  ) {
    return {
      badgeClass: "border-purple-200 bg-purple-50 text-purple-700",
      dotClass: "bg-purple-500",
    };
  }
  if (
    act.includes("SALARY") ||
    act.includes("REFUND") ||
    act.includes("PAYROLL") ||
    act.includes("EXPENSE")
  ) {
    return {
      badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-700",
      dotClass: "bg-emerald-500",
    };
  }
  return {
    badgeClass: "border-blue-200 bg-blue-50 text-blue-700",
    dotClass: "bg-blue-500",
  };
}

export function AuditLogsView() {
  const tenant = useTenantScope("admin");

  // Filter States
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [entityTypeFilter, setEntityTypeFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [showDateRange, setShowDateRange] = useState(false);

  // Detail Modal State
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [cachedSelectedLog, setCachedSelectedLog] = useState<AuditLogItem | null>(null);

  // Available Locations for Branch Filter
  const locationsQuery = useLocationsQuery(tenant.businessId, tenant.isTenantReady);
  const locations = useMemo(() => {
    return (locationsQuery.data ?? []).map((l) => ({ id: l.id, name: l.name }));
  }, [locationsQuery.data]);

  // Backend Query Filters
  const queryFilters = useMemo<AuditLogFilters>(() => {
    const f: AuditLogFilters = {
      page,
      limit,
      businessId: tenant.businessId,
    };
    if (actionFilter !== "all") f.action = actionFilter;
    if (entityTypeFilter !== "all") f.entityType = entityTypeFilter;
    if (locationFilter !== "all") f.locationId = locationFilter;
    const dateBounds = buildAuditDateBounds(fromDate, toDate);
    if (dateBounds.from) f.from = dateBounds.from;
    if (dateBounds.to) f.to = dateBounds.to;
    return f;
  }, [page, limit, tenant.businessId, actionFilter, entityTypeFilter, locationFilter, fromDate, toDate]);

  // Main Audit Logs Query
  const logsQuery = useAuditLogs(queryFilters, tenant.isTenantReady);

  // Single Log Detail Query (for inspection modal)
  const detailQuery = useAuditLogDetail(selectedLogId, tenant.businessId, Boolean(selectedLogId));
  const activeDetail: AuditLogItem | null = detailQuery.data ?? cachedSelectedLog;

  const rawItems = useMemo(() => logsQuery.data?.items ?? [], [logsQuery.data?.items]);
  const meta = logsQuery.data?.meta ?? { page: 1, limit, total: 0, totalPages: 1 };

  // Local text search over currently fetched results
  const items = useMemo(() => {
    if (!search.trim()) return rawItems;
    const q = search.toLowerCase().trim();
    return rawItems.filter((item) => {
      return (
        item.action.toLowerCase().includes(q) ||
        item.issue.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.entityName.toLowerCase().includes(q) ||
        item.actorName.toLowerCase().includes(q) ||
        (item.sku && item.sku.toLowerCase().includes(q)) ||
        (item.locationName && item.locationName.toLowerCase().includes(q))
      );
    });
  }, [rawItems, search]);

  const hasActiveFilters =
    actionFilter !== "all" ||
    entityTypeFilter !== "all" ||
    locationFilter !== "all" ||
    fromDate !== "" ||
    toDate !== "" ||
    search.trim() !== "";

  const handleResetFilters = () => {
    setSearch("");
    setActionFilter("all");
    setEntityTypeFilter("all");
    setLocationFilter("all");
    setFromDate("");
    setToDate("");
    setPage(1);
    toast.info("All audit log filters have been reset.");
  };

  const handleOpenDetail = (item: AuditLogItem) => {
    setCachedSelectedLog(item);
    setSelectedLogId(item.id);
  };

  if (!tenant.isTenantReady) return <TenantRequiredState />;

  return (
    <div className="space-y-6">
      {/* Standard Admin Page Header */}
      <PageHeader
        title="Audit Logs & Governance"
        description="Review tamper-evident system audit trails, inventory alerts, salary adjustments, and staff actions."
        actions={
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-9 px-3 text-sm text-slate-500 hover:text-slate-800"
              >
                <RotateCcw className="mr-1.5 h-4 w-4" />
                Reset Filters
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  const result = await logsQuery.refetch();
                  if (result.isError) {
                    toast.error("Failed to refresh audit logs. Please try again.");
                  } else {
                    toast.success("Refreshed latest audit logs");
                  }
                } catch {
                  toast.error("Failed to refresh audit logs. Please check network.");
                }
              }}
              disabled={logsQuery.isFetching}
              className="h-9 px-3.5 border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium shadow-2xs"
            >
              <RotateCw
                className={`mr-1.5 h-4 w-4 text-slate-500 ${
                  logsQuery.isFetching ? "animate-spin text-[#0052FF]" : ""
                }`}
              />
              Refresh Activity
            </Button>
          </div>
        }
      />


      {/* Summary / Statistics Cards */}
      <AuditStatCards
        totalCount={meta.total}
        items={rawItems}
        isFiltered={hasActiveFilters}
      />

      {/* Unified Search & Filter Toolbar */}
      <AuditFilterToolbar
        search={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        action={actionFilter}
        onActionChange={(v) => {
          setActionFilter(v);
          setPage(1);
        }}
        entityType={entityTypeFilter}
        onEntityTypeChange={(v) => {
          setEntityTypeFilter(v);
          setPage(1);
        }}
        locationId={locationFilter}
        onLocationChange={(v) => {
          setLocationFilter(v);
          setPage(1);
        }}
        locations={locations}
        fromDate={fromDate}
        onFromDateChange={(v) => {
          setFromDate(v);
          setPage(1);
        }}
        toDate={toDate}
        onToDateChange={(v) => {
          setToDate(v);
          setPage(1);
        }}
        showDateRange={showDateRange}
        onToggleDateRange={() => setShowDateRange((p) => !p)}
        onReset={handleResetFilters}
        hasActiveFilters={hasActiveFilters}
        totalFiltered={items.length}
        totalCount={meta.total}
      />

      {/* Audit Logs Table / Data Container */}
      <Card className="overflow-hidden border-slate-200 shadow-xs">
        {logsQuery.isLoading ? (
          /* Loading Skeletons */
          <div className="p-6 space-y-4">
            <div className="h-6 w-48 bg-slate-100 rounded-md animate-pulse" />
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-14 w-full bg-slate-50 rounded-xl animate-pulse" />
              ))}
            </div>
          </div>
        ) : logsQuery.isError ? (
          /* Error State */
          <div className="py-16 px-4 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-semibold text-[#070B28]">Failed to load audit logs</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              We encountered an issue communicating with the audit service. Please check your network and retry.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void logsQuery.refetch()}
              className="text-xs"
            >
              Retry Loading
            </Button>
          </div>
        ) : items.length === 0 ? (
          /* Empty State */
          <div className="py-16 px-4 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <SearchX className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-semibold text-[#070B28]">No audit logs match your criteria</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {hasActiveFilters
                ? "No audit records match the current search or filters. Try adjusting your parameters or resetting filters."
                : "No audit events have been recorded for this business yet."}
            </p>
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetFilters}
                className="text-xs"
              >
                Reset All Filters
              </Button>
            )}
          </div>
        ) : (
          /* Loaded Table */
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-[170px] text-xs font-semibold uppercase tracking-wider text-slate-500 py-3.5 px-4">
                    Timestamp
                  </TableHead>
                  <TableHead className="w-[200px] text-xs font-semibold uppercase tracking-wider text-slate-500 py-3.5 px-4">
                    Issue & Event
                  </TableHead>
                  <TableHead className="min-w-[300px] text-xs font-semibold uppercase tracking-wider text-slate-500 py-3.5 px-4">
                    Activity Summary & Target
                  </TableHead>
                  <TableHead className="w-[180px] text-xs font-semibold uppercase tracking-wider text-slate-500 py-3.5 px-4">
                    Performed By
                  </TableHead>
                  <TableHead className="w-[200px] text-xs font-semibold uppercase tracking-wider text-slate-500 py-3.5 px-4">
                    Branch Location
                  </TableHead>
                  <TableHead className="w-[100px] text-right text-xs font-semibold uppercase tracking-wider text-slate-500 py-3.5 px-4">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody className="divide-y divide-slate-100">
                {items.map((row) => {
                  const style = getActionStyle(row.action);
                  const ts = formatAuditTimestamp(row.createdAt);

                  return (
                    <TableRow key={row.id} className="hover:bg-slate-50/70 transition-colors cv-auto">
                      {/* Timestamp */}
                      <TableCell className="py-4 px-4 align-middle">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-[#070B28]">
                            {ts.date}
                          </span>
                          <span className="flex items-center gap-1 font-mono text-xs text-slate-500 tabular-nums mt-0.5">
                            <Clock className="h-3.5 w-3.5 text-slate-400" />
                            {ts.time}
                          </span>
                          <span className="text-xs text-slate-400 mt-0.5">
                            {ts.relative}
                          </span>
                        </div>
                      </TableCell>

                      {/* Issue & Event Code */}
                      <TableCell className="py-4 px-4 align-middle">
                        <div className="space-y-1.5">
                          <p className="font-semibold text-sm text-[#070B28] leading-snug">
                            {row.issue || row.action}
                          </p>
                          <Badge
                            variant="outline"
                            className={`text-xs font-mono font-medium px-2 py-0.5 border ${style.badgeClass}`}
                          >
                            <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${style.dotClass}`} />
                            {row.action}
                          </Badge>
                        </div>
                      </TableCell>

                      {/* Summary & Target Entity (Clean, without repeating entity name twice) */}
                      <TableCell className="py-4 px-4 align-middle">
                        <div className="space-y-1.5 max-w-xl">
                          <p className="text-sm text-slate-700 leading-relaxed font-normal">
                            {row.summary}
                          </p>

                          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                            {row.sku && (
                              <span className="font-mono text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded font-medium">
                                SKU: {row.sku}
                              </span>
                            )}

                            <span className="text-xs font-mono uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                              {row.entityType}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      {/* Performed By (Actor: user icon prevents repeating name initials as text) */}
                      <TableCell className="py-4 px-4 align-middle">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-500 shrink-0">
                              <User className="h-3.5 w-3.5" />
                            </div>
                            <span className="font-medium text-sm text-[#070B28]">
                              {row.actorName}
                            </span>
                          </div>
                          <Badge
                            variant="outline"
                            className="text-[10px] font-mono uppercase bg-slate-50 text-slate-600 px-1.5 py-0"
                          >
                            {row.actorRole || "CASHIER"}
                          </Badge>
                        </div>
                      </TableCell>

                      {/* Branch Location (Properly aligned with icon and clear title) */}
                      <TableCell className="py-4 px-4 align-middle">
                        {row.locationName ? (
                          <div className="flex items-center gap-2 text-sm text-slate-700">
                            <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                            <span className="font-medium text-slate-800 truncate" title={row.locationName}>
                              {row.locationName}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400 italic">
                            All Outlets / HQ
                          </span>
                        )}
                      </TableCell>

                      {/* Inspect Button */}
                      <TableCell className="py-4 px-4 align-middle text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDetail(row)}
                          className="h-8 px-2.5 text-sm font-medium text-[#0052FF] hover:bg-blue-50"
                        >
                          <Eye className="mr-1.5 h-4 w-4" />
                          Inspect
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination Controls */}
        {!logsQuery.isLoading && !logsQuery.isError && meta.total > 0 && (
          <div className="border-t border-slate-200 bg-white px-4 py-3">
            <DataPagination
              currentPage={page}
              totalPages={meta.totalPages}
              totalItems={meta.total}
              pageSize={limit}
              onPageChange={(p) => setPage(p)}
              onPageSizeChange={(newSize) => {
                setLimit(newSize);
                setPage(1);
              }}
              pageSizeOptions={[10, 20, 50, 100]}
              itemLabel="audit records"
            />
          </div>
        )}
      </Card>

      {/* Inspection Modal */}
      <AuditDetailModal
        item={activeDetail}
        isOpen={Boolean(selectedLogId)}
        onClose={() => {
          setSelectedLogId(null);
          setCachedSelectedLog(null);
        }}
      />
    </div>
  );
}
