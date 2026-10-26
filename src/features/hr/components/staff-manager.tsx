"use client";

import { useState } from "react";
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
import { useMockStaff } from "@/features/hr/api/use-hr";
import type { StaffRowViewModel } from "@/features/hr/view-models";
import { useTenantScope } from "@/features/tenant/hooks/use-tenant-scope";
import { useDebounce } from "@/hooks/use-debounce";
import { formatBDT } from "@/lib/utils";

type StaffDialog = "create" | "edit" | "status" | "delete" | null;

export function StaffManager() {
  const tenant = useTenantScope("admin");
  const [search, setSearch] = useState("");
  const query = useMockStaff(useDebounce(search, 250));
  const [pagination, setPagination] = useState({ page: 1, limit: 8 });
  const [dialog, setDialog] = useState<StaffDialog>(null);
  const [selected, setSelected] = useState<StaffRowViewModel | null>(null);
  const [form, setForm] = useState({ fullName: "", email: "", phoneNumber: "", password: "", locationId: "", monthlySalary: "" });
  const rows = query.data.slice((pagination.page - 1) * pagination.limit, pagination.page * pagination.limit);
  if (!tenant.isTenantReady) return <TenantRequiredState />;

  const open = (kind: Exclude<StaffDialog, null>, row?: StaffRowViewModel) => {
    setDialog(kind); setSelected(row ?? null); setForm({ fullName: row?.fullName ?? "", email: row?.email ?? "", phoneNumber: row?.phoneNumber ?? "", password: "", locationId: row?.locationId ?? tenant.locationId ?? "", monthlySalary: row?.monthlySalary ? String(row.monthlySalary) : "" });
  };
  const save = (event: React.FormEvent) => {
    event.preventDefault();
    if ((dialog === "create" || dialog === "edit") && (!form.fullName.trim() || !form.locationId || !Number.isInteger(Number(form.monthlySalary)) || Number(form.monthlySalary) < 0 || (dialog === "create" && form.password.length < 8))) { toast.error("Enter a name, location, integer salary, and an 8+ character password for new cashiers."); return; }
    toast.success(`${dialog === "create" ? "Cashier created" : dialog === "edit" ? "Cashier updated" : dialog === "status" ? "Account status updated" : "Cashier deleted"} in mock state.`); setDialog(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Staff & Cashier Accounts" actions={<Button onClick={() => open("create")} className="bg-[#0052FF] text-white hover:bg-[#0047E0]"><Plus className="mr-2 h-4 w-4" />Create cashier</Button>} />
      <Card className="border-slate-200 p-4 shadow-xs"><div className="relative max-w-lg"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input value={search} onChange={(event) => { setSearch(event.target.value); setPagination((value) => ({ ...value, page: 1 })); }} placeholder="Search name, Public ID, or location" className="pl-9" /></div></Card>
      <DataState data={rows} isLoading={query.isLoading} isError={query.isError} resource="staff" emptyTitle="No staff members found." onRetry={() => void query.refetch()}>
        {(data) => <Card className="overflow-hidden border-slate-200 shadow-xs"><div className="overflow-x-auto"><Table><TableHeader className="bg-slate-50"><TableRow><TableHead>Cashier</TableHead><TableHead>Contact</TableHead><TableHead>Location</TableHead><TableHead className="text-right">Monthly salary</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{data.map((row) => <TableRow key={row.id}><TableCell><p className="font-medium text-[#070B28]">{row.fullName}</p><p className="font-mono text-xs text-slate-400">{row.publicId}</p></TableCell><TableCell><p className="text-sm">{row.email || "No email"}</p><p className="text-xs text-slate-400">{row.phoneNumber || "No phone"}</p></TableCell><TableCell>{row.locationName || row.locationId}</TableCell><TableCell className="text-right font-mono">{row.monthlySalary === undefined ? "—" : formatBDT(row.monthlySalary)}</TableCell><TableCell><Badge variant="outline" className={row.status === "ACTIVE" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}>{row.status}</Badge></TableCell><TableCell className="text-right"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label={`Actions for ${row.fullName}`}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => open("edit", row)}>Edit account</DropdownMenuItem><DropdownMenuItem onClick={() => open("status", row)}>Activate / suspend</DropdownMenuItem><DropdownMenuItem onClick={() => open("delete", row)} className="text-rose-600">Delete</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell></TableRow>)}</TableBody></Table></div><div className="border-t border-slate-200 px-4"><DataPagination currentPage={pagination.page} totalPages={Math.max(1, Math.ceil(query.data.length / pagination.limit))} totalItems={query.data.length} pageSize={pagination.limit} onPageChange={(page) => setPagination((value) => ({ ...value, page }))} onPageSizeChange={(limit) => setPagination({ page: 1, limit })} itemLabel="staff" /></div></Card>}
      </DataState>

      <Dialog open={dialog !== null} onOpenChange={(value) => !value && setDialog(null)}><DialogContent><DialogHeader><DialogTitle>{dialog === "create" ? "Create cashier" : dialog === "edit" ? `Edit ${selected?.fullName}` : dialog === "status" ? "Change account status" : "Delete cashier"}</DialogTitle></DialogHeader><form onSubmit={save} className="space-y-4">{dialog === "create" || dialog === "edit" ? <><Field label="Full name *"><Input value={form.fullName} onChange={(event) => setForm((value) => ({ ...value, fullName: event.target.value }))} /></Field><Field label="Email (optional)"><Input type="email" value={form.email} onChange={(event) => setForm((value) => ({ ...value, email: event.target.value }))} /></Field><Field label="Phone (optional)"><Input type="tel" value={form.phoneNumber} onChange={(event) => setForm((value) => ({ ...value, phoneNumber: event.target.value }))} /></Field><Field label="Location *"><Select value={form.locationId} onValueChange={(value) => setForm((current) => ({ ...current, locationId: value }))}><SelectTrigger><SelectValue placeholder="Choose location" /></SelectTrigger><SelectContent>{tenant.activeBusiness?.branches.map((branch) => <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>)}</SelectContent></Select></Field><Field label="Monthly salary (BDT)"><Input type="number" min="0" step="1" value={form.monthlySalary} onChange={(event) => setForm((value) => ({ ...value, monthlySalary: event.target.value }))} /></Field><Field label={dialog === "create" ? "Password *" : "Reset password (optional)"}><Input type="password" minLength={8} value={form.password} onChange={(event) => setForm((value) => ({ ...value, password: event.target.value }))} /></Field></> : <p className="text-sm text-slate-600">{dialog === "status" ? `Toggle ${selected?.fullName} between ACTIVE and SUSPENDED.` : `Delete ${selected?.fullName}? This only updates the Phase 0 mock.`}</p>}<div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setDialog(null)}>Cancel</Button><Button type="submit" className={dialog === "delete" ? "bg-rose-600 text-white" : "bg-[#0052FF] text-white"}>Confirm mock action</Button></div></form></DialogContent></Dialog>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="space-y-1.5"><label className="text-xs font-medium text-[#070B28]">{label}</label>{children}</div>; }
