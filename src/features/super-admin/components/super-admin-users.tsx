"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { DataState } from "@/components/common/data-state";
import { SegmentedTabs } from "@/components/common/segmented-tabs";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  useAdminUsers,
  useApproveAdminUser,
  useUpdateAdminUserStatus,
  type AdminUserItem,
} from "@/features/super-admin/api/use-super-admin";
import type { AccountStatus } from "@/types/domain";

type TabId = "ALL" | "PENDING_APPROVAL" | "ACTIVE" | "SUSPENDED";

export function SuperAdminUsers() {
  const [tab, setTab] = useState<TabId>("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filters = {
    page,
    limit: 20,
    status: tab === "ALL" ? undefined : (tab as AccountStatus),
    search: search.trim() || undefined,
  };

  const usersQuery = useAdminUsers(filters);
  const approveMutation = useApproveAdminUser();
  const statusMutation = useUpdateAdminUserStatus();

  const handleApprove = async (user: AdminUserItem) => {
    try {
      await approveMutation.mutateAsync(user.id);
      toast.success(`Admin account approved for ${user.fullName}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to approve admin account");
    }
  };

  const handleStatusChange = async (user: AdminUserItem, status: "ACTIVE" | "SUSPENDED" | "REJECTED") => {
    try {
      await statusMutation.mutateAsync({ id: user.id, status });
      toast.success(`Admin status updated to ${status}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update admin status");
    }
  };

  const items = usersQuery.data?.items ?? [];
  const total = usersQuery.data?.total ?? 0;
  const totalPages = Math.ceil(total / 20) || 1;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Administration & Approvals"
        description="Review and approve store admin registrations, manage tenant access, and account statuses."
      />

      {/* Tabs */}
      <SegmentedTabs
        tabs={[
          { id: "ALL", label: "All Admins" },
          { id: "PENDING_APPROVAL", label: "Pending Approval" },
          { id: "ACTIVE", label: "Active Stores" },
          { id: "SUSPENDED", label: "Suspended" },
        ]}
        activeTab={tab}
        onChange={(val) => {
          setTab(val as TabId);
          setPage(1);
        }}
      />

      {/* Search Bar */}
      <Card className="border-slate-200 p-4 shadow-xs">
        <div className="max-w-md">
          <Input
            placeholder="Search by name, email, public ID..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </Card>

      {/* Table */}
      <DataState
        data={items}
        isLoading={usersQuery.isLoading}
        isError={usersQuery.isError}
        resource="platform admins"
        emptyTitle="No admin accounts match this filter."
        onRetry={() => void usersQuery.refetch()}
      >
        {(rows) => (
          <Card className="overflow-hidden border-slate-200 shadow-xs">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead>Administrator</TableHead>
                    <TableHead>Public ID</TableHead>
                    <TableHead>Store / Business</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Registered</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <p className="font-medium text-[#070B28]">{user.fullName}</p>
                        <p className="text-xs text-slate-400">{user.email}</p>
                        {user.phoneNumber && (
                          <p className="text-xs text-slate-400">{user.phoneNumber}</p>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs font-semibold text-slate-700">
                        {user.publicId || (
                          <span className="font-normal italic text-amber-600">
                            Pending Assignment
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.business ? (
                          <div>
                            <p className="font-medium text-slate-700">{user.business.name}</p>
                            <p className="text-xs text-slate-400">
                              {user.business._count.locations} branch location(s)
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">No store attached</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            user.status === "ACTIVE"
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : user.status === "PENDING_APPROVAL"
                              ? "border-amber-200 bg-amber-50 text-amber-700"
                              : "border-rose-200 bg-rose-50 text-rose-700"
                          }
                        >
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {new Date(user.createdAt).toLocaleDateString("en-BD")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {user.status === "PENDING_APPROVAL" && (
                            <Button
                              size="sm"
                              className="bg-emerald-600 text-white hover:bg-emerald-700"
                              disabled={approveMutation.isPending}
                              onClick={() => handleApprove(user)}
                            >
                              {approveMutation.isPending ? (
                                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <UserCheck className="mr-1 h-3.5 w-3.5" />
                              )}
                              Approve
                            </Button>
                          )}

                          {user.status === "ACTIVE" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                              disabled={statusMutation.isPending}
                              onClick={() => handleStatusChange(user, "SUSPENDED")}
                            >
                              Suspend
                            </Button>
                          )}

                          {user.status === "SUSPENDED" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                              disabled={statusMutation.isPending}
                              onClick={() => handleStatusChange(user, "ACTIVE")}
                            >
                              Activate
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
              <p className="text-xs text-slate-500">
                Page {page} of {totalPages} ({total} accounts)
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
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        )}
      </DataState>
    </div>
  );
}
