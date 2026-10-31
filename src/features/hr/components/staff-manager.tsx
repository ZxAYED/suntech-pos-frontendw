"use client";

import { useMemo, useState } from "react";
import { MoreHorizontal, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { DataPagination } from "@/components/common/data-pagination";
import { DataState, TenantRequiredState } from "@/components/common/data-state";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCreateCashier, useDeleteCashier, useStaff, useUpdateCashier, useUpdateCashierStatus } from "@/features/hr/api/use-hr";
import type { StaffRowViewModel } from "@/features/hr/view-models";
import { useLocationsQuery } from "@/features/tenant/api/use-tenant";
import { useTenantScope } from "@/features/tenant/hooks/use-tenant-scope";
import { useDebounce } from "@/hooks/use-debounce";
import { formatBDT } from "@/lib/utils";
import { createCashierSchema, updateCashierSchema } from "@/lib/validations";
import type { AccountStatus } from "@/types/domain";

type StaffDialog = "create" | "edit" | "status" | "delete" | null;
const emptyForm = { fullName: "", email: "", phoneNumber: "", password: "", locationId: "", monthlySalary: "" };

export function StaffManager() {
  const tenant = useTenantScope("admin");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<AccountStatus | "ALL">("ALL");
  const debouncedSearch = useDebounce(search, 250);
  const query = useStaff({ businessId: tenant.businessId, search: debouncedSearch || undefined, status: statusFilter === "ALL" ? undefined : statusFilter }, tenant.isTenantReady);
  const locations = useLocationsQuery(tenant.businessId, tenant.isTenantReady);
  const locationMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const loc of locations.data ?? []) {
      map.set(loc.id, loc.name);
    }
    return map;
  }, [locations.data]);
  const createCashier = useCreateCashier();
  const updateCashier = useUpdateCashier();
  const updateStatus = useUpdateCashierStatus();
  const deleteCashier = useDeleteCashier();
  const [pagination, setPagination] = useState({ page: 1, limit: 8 });
  const [dialog, setDialog] = useState<StaffDialog>(null);
  const [selected, setSelected] = useState<StaffRowViewModel | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [nextStatus, setNextStatus] = useState<"ACTIVE" | "SUSPENDED">("ACTIVE");
  const [statusReason, setStatusReason] = useState("");
  const rows = (query.data ?? []).slice((pagination.page - 1) * pagination.limit, pagination.page * pagination.limit);
  const pending = createCashier.isPending || updateCashier.isPending || updateStatus.isPending || deleteCashier.isPending;

  if (!tenant.isTenantReady) return <TenantRequiredState />;

  const open = (kind: Exclude<StaffDialog, null>, row?: StaffRowViewModel) => {
    setDialog(kind);
    setSelected(row ?? null);
    setNextStatus(row?.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE");
    setStatusReason("");
    setForm({
      fullName: row?.fullName ?? "",
      email: row?.email ?? "",
      phoneNumber: row?.phoneNumber ?? "",
      password: "",
      locationId: row?.locationId ?? tenant.locationId ?? "",
      monthlySalary: row?.monthlySalary == null ? "" : String(row.monthlySalary),
    });
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      if (dialog === "create" || dialog === "edit") {
        const salary = Number(form.monthlySalary);
        if (dialog === "create") {
          const validation = createCashierSchema.safeParse({
            fullName: form.fullName.trim(),
            email: form.email.trim() || undefined,
            phoneNumber: form.phoneNumber.trim() || undefined,
            password: form.password,
            locationId: form.locationId,
            monthlySalary: salary,
            businessId: tenant.businessId,
          });
          if (!validation.success) {
            toast.error(validation.error.issues[0]?.message || "Invalid cashier details");
            return;
          }
          const created = (await createCashier.mutateAsync(validation.data)) as { publicId?: string };
          toast.success(`Cashier created${created.publicId ? `: ${created.publicId}` : "."}`);
        } else if (selected) {
          const validation = updateCashierSchema.safeParse({
            id: selected.id,
            fullName: form.fullName.trim(),
            phoneNumber: form.phoneNumber.trim() || undefined,
            locationId: form.locationId,
            monthlySalary: salary,
            password: form.password || undefined,
          });
          if (!validation.success) {
            toast.error(validation.error.issues[0]?.message || "Invalid cashier details");
            return;
          }
          await updateCashier.mutateAsync({ id: selected.id, ...validation.data });
          toast.success("Cashier updated.");
        }
      } else if (dialog === "status" && selected) {
        await updateStatus.mutateAsync({ id: selected.id, status: nextStatus, statusReason: statusReason.trim() || undefined });
        toast.success(`Cashier ${nextStatus === "ACTIVE" ? "activated" : "suspended"}.`);
      } else if (dialog === "delete" && selected) {
        await deleteCashier.mutateAsync(selected.id);
        toast.success("Cashier deleted.");
      }
      setDialog(null);
      setForm(emptyForm);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The staff action failed.");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff & Cashier Accounts"
        description="Manage employee accounts, assigned branches, and cashier permissions."
        actions={
          <Button onClick={() => open("create")} className="bg-[#0052FF] text-white hover:bg-[#0047E0]">
            <Plus className="mr-2 h-4 w-4" />Create cashier
          </Button>
        }
      />
      <Card className="flex flex-col gap-3 border-slate-200 p-4 shadow-xs sm:flex-row">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input value={search} onChange={(event) => { setSearch(event.target.value); setPagination((current) => ({ ...current, page: 1 })); }} placeholder="Search name, public ID, or phone" className="pl-9" /></div>
        <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value as AccountStatus | "ALL"); setPagination((current) => ({ ...current, page: 1 })); }}><SelectTrigger className="sm:w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">All statuses</SelectItem><SelectItem value="ACTIVE">Active</SelectItem><SelectItem value="SUSPENDED">Suspended</SelectItem><SelectItem value="REJECTED">Rejected</SelectItem></SelectContent></Select>
      </Card>

      <DataState data={rows} isLoading={query.isLoading} isError={query.isError} resource="staff" emptyTitle={debouncedSearch || statusFilter !== "ALL" ? "No staff match these filters." : "No cashier accounts yet."} onRetry={() => void query.refetch()}>
        {(data) => <Card className="overflow-hidden border-slate-200 shadow-xs"><div className="overflow-x-auto"><Table><TableHeader className="bg-slate-50"><TableRow><TableHead>Cashier</TableHead><TableHead>Contact</TableHead><TableHead>Location</TableHead><TableHead className="text-right">Monthly salary</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{data.map((row) => <TableRow key={row.id}><TableCell><p className="font-medium text-[#070B28]">{row.fullName}</p>{row.publicId && !/^[0-9a-f-]{36}$/i.test(row.publicId) ? <p className="font-mono text-xs text-slate-400">{row.publicId}</p> : null}</TableCell><TableCell><p className="text-sm">{row.email || "No external email"}</p><p className="text-xs text-slate-400">{row.phoneNumber || "No phone"}</p></TableCell><TableCell>{(row.locationId ? locationMap.get(row.locationId) : null) || row.locationName || "Main Branch"}</TableCell><TableCell className="text-right font-mono">{row.monthlySalary === undefined ? "—" : formatBDT(row.monthlySalary)}</TableCell><TableCell><Badge variant="outline" className={row.status === "ACTIVE" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}>{row.status}</Badge></TableCell><TableCell className="text-right"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label={`Actions for ${row.fullName}`}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => open("edit", row)}>Edit account</DropdownMenuItem><DropdownMenuItem onClick={() => open("status", row)}>{row.status === "ACTIVE" ? "Suspend account" : "Activate account"}</DropdownMenuItem><DropdownMenuItem onClick={() => open("delete", row)} className="text-rose-600">Delete</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell></TableRow>)}</TableBody></Table></div><div className="border-t border-slate-200 px-4"><DataPagination currentPage={pagination.page} totalPages={Math.max(1, Math.ceil((query.data?.length ?? 0) / pagination.limit))} totalItems={query.data?.length ?? 0} pageSize={pagination.limit} onPageChange={(page) => setPagination((value) => ({ ...value, page }))} onPageSizeChange={(limit) => setPagination({ page: 1, limit })} itemLabel="staff" /></div></Card>}
      </DataState>

      <Dialog open={dialog !== null} onOpenChange={(value) => !value && setDialog(null)}><DialogContent><DialogHeader><DialogTitle>{dialog === "create" ? "Create cashier" : dialog === "edit" ? `Edit ${selected?.fullName}` : dialog === "status" ? "Change account status" : "Delete cashier"}</DialogTitle></DialogHeader><form onSubmit={save} className="space-y-4">
        {dialog === "create" || dialog === "edit" ? <><Field label="Full name *"><Input maxLength={dialog === "create" ? 120 : 80} required value={form.fullName} onChange={(event) => setForm((value) => ({ ...value, fullName: event.target.value }))} /></Field>{dialog === "create" ? <Field label="Email (optional)"><Input type="email" value={form.email} onChange={(event) => setForm((value) => ({ ...value, email: event.target.value }))} /></Field> : null}<Field label="Phone (optional)"><Input type="tel" value={form.phoneNumber} onChange={(event) => setForm((value) => ({ ...value, phoneNumber: event.target.value }))} /></Field><Field label="Branch *"><Select value={form.locationId} onValueChange={(value) => setForm((current) => ({ ...current, locationId: value }))}><SelectTrigger><SelectValue placeholder={locations.isLoading ? "Loading branches…" : "Choose branch"} /></SelectTrigger><SelectContent>{(locations.data ?? []).map((branch) => <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>)}</SelectContent></Select></Field><Field label="Monthly salary (BDT) *"><Input type="number" min={dialog === "create" ? 1 : 0} step="1" required value={form.monthlySalary} onChange={(event) => setForm((value) => ({ ...value, monthlySalary: event.target.value }))} /></Field><Field label={dialog === "create" ? "Password *" : "Reset password (optional)"}><Input type="password" minLength={8} maxLength={72} required={dialog === "create"} autoComplete="new-password" value={form.password} onChange={(event) => setForm((value) => ({ ...value, password: event.target.value }))} /></Field></> : dialog === "status" ? <><p className="text-sm text-slate-600">Change {selected?.fullName} to {nextStatus}.</p><Field label="Audit reason (optional)"><Input maxLength={240} value={statusReason} onChange={(event) => setStatusReason(event.target.value)} /></Field></> : <p className="text-sm text-slate-600">Delete {selected?.fullName}? This soft-deletes the account. Cashiers with an open shift cannot be deleted.</p>}
        <div className="flex justify-end gap-2"><Button type="button" variant="outline" disabled={pending} onClick={() => setDialog(null)}>Cancel</Button><Button type="submit" loading={pending} className={dialog === "delete" ? "bg-rose-600 text-white" : "bg-[#0052FF] text-white"}>Confirm</Button></div>
      </form></DialogContent></Dialog>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><label className="text-xs font-medium text-[#070B28]">{label}</label>{children}</div>;
}
