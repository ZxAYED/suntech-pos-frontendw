"use client";

import { useState } from "react";
import { Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { DataState, TenantRequiredState } from "@/components/common/data-state";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuditLogs, type AuditLogItem } from "@/features/audit/api/use-audit-logs";
import { useTenantScope } from "@/features/tenant/hooks/use-tenant-scope";

export function AuditLogsView() {
  const tenant = useTenantScope("admin");
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState("");
  const [entityFilter, setEntityFilter] = useState("");
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  const logs = useAuditLogs({
    page,
    limit: 20,
    action: actionFilter.trim() || undefined,
    entityType: entityFilter.trim() || undefined,
    businessId: tenant.businessId,
  });

  if (!tenant.isTenantReady) return <TenantRequiredState />;

  const items = logs.data?.items ?? [];
  const meta = logs.data?.meta ?? { page: 1, limit: 20, total: 0, totalPages: 1 };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Logs & Governance"
        description="Review recorded system activities, security events, and configuration changes."
      />

      {/* Filter toolbar */}
      <Card className="border-slate-200 p-4 shadow-xs">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="text-xs font-medium text-slate-600">Action Name</label>
            <Input
              className="mt-1"
              placeholder="e.g. CREATE, ORDER_REFUND, DELETE"
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Entity Type</label>
            <Input
              className="mt-1"
              placeholder="e.g. Order, Shift, Product, Expense"
              value={entityFilter}
              onChange={(e) => {
                setEntityFilter(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>
      </Card>

      {/* Table */}
      <DataState
        data={items}
        isLoading={logs.isLoading}
        isError={logs.isError}
        resource="audit logs"
        emptyTitle="No audit log records found for this criteria."
        onRetry={() => void logs.refetch()}
      >
        {(rows) => (
          <Card className="overflow-hidden border-slate-200 shadow-xs">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Actor UUID</TableHead>
                    <TableHead className="text-right">Inspection</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-mono text-xs text-slate-600">
                        {new Date(row.createdAt).toLocaleString("en-BD")}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            row.action.includes("DELETE") || row.action.includes("VOID")
                              ? "border-rose-200 bg-rose-50 text-rose-700"
                              : row.action.includes("REFUND")
                              ? "border-amber-200 bg-amber-50 text-amber-700"
                              : "border-blue-200 bg-blue-50 text-blue-700"
                          }
                        >
                          {row.action}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium text-[#070B28]">{row.entityType}</p>
                        <p className="font-mono text-xs text-slate-400">{row.entityId}</p>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-500">
                        {row.actorId}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedLog(row)}
                        >
                          <Eye className="mr-1 h-3.5 w-3.5" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
              <p className="text-xs text-slate-500">
                Page {meta.page} of {meta.totalPages} ({meta.total} records)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= meta.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        )}
      </DataState>

      {/* JSON Inspection Modal */}
      <Dialog open={selectedLog !== null} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Audit Log Entry Details</DialogTitle>
            <DialogDescription>
              {selectedLog?.action} on {selectedLog?.entityType} ({selectedLog?.entityId})
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Metadata
                </h4>
                <pre className="mt-1.5 max-h-48 overflow-auto rounded-lg bg-slate-900 p-3 text-xs text-emerald-400">
                  {JSON.stringify(selectedLog.metadata || {}, null, 2)}
                </pre>
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  State Changes / Diff
                </h4>
                <pre className="mt-1.5 max-h-48 overflow-auto rounded-lg bg-slate-900 p-3 text-xs text-blue-300">
                  {JSON.stringify(selectedLog.diff || {}, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
