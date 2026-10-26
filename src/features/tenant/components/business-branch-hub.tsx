"use client";

import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Building2, MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState, TableSkeleton } from "@/components/common/data-state";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  useBusinessesQuery,
  useCreateBusiness,
  useCreateLocation,
  useDeleteBusiness,
  useDeleteLocation,
  useUpdateBusiness,
  useUpdateLocation,
} from "@/features/tenant/api/use-tenant";
import { mapBusinessToTenantCard } from "@/features/tenant/view-models";
import { tenantPreferences } from "@/lib/tenant-preferences";
import { clearCart } from "@/redux/actions/cartActions";
import { setAvailableBusinesses, setBranch, setBusiness, setTenantSelection } from "@/redux/actions/tenantActions";
import type { BusinessItem, BranchItem, RootState } from "@/redux/types";

type EntityDialog = { kind: "business"; item?: BusinessItem } | { kind: "location"; item?: BranchItem } | null;

export function BusinessBranchHub({ initialStep = 1 }: { initialStep?: 1 | 2 }) {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const userId = useSelector((state: RootState) => state.auth.user?.id);
  const cartCount = useSelector((state: RootState) => state.cart.itemCount);
  const selectedBusiness = useSelector((state: RootState) => state.tenant.selectedBusiness);
  const selectedBranch = useSelector((state: RootState) => state.tenant.selectedBranch);
  const [step, setStep] = useState<1 | 2>(initialStep);
  const [dialog, setDialog] = useState<EntityDialog>(null);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");

  const businessesQuery = useBusinessesQuery();
  const createBusiness = useCreateBusiness();
  const updateBusiness = useUpdateBusiness();
  const deleteBusiness = useDeleteBusiness();
  const createLocation = useCreateLocation();
  const updateLocation = useUpdateLocation();
  const deleteLocation = useDeleteLocation();
  const businesses = useMemo(
    () => (businessesQuery.data ?? []).map(mapBusinessToTenantCard),
    [businessesQuery.data],
  );

  useEffect(() => {
    dispatch(setAvailableBusinesses(businesses));
    if (!userId) return;
    if (businessesQuery.isSuccess && businesses.length === 0) {
      tenantPreferences.setBusinessId(userId, null);
      dispatch(setBusiness(null));
      return;
    }
    if (businesses.length === 0) return;
    const savedBusinessId = tenantPreferences.getBusinessId(userId);
    const business = businesses.find((item) => item.id === savedBusinessId);
    if (!business) {
      if (savedBusinessId) tenantPreferences.setBusinessId(userId, null);
      dispatch(setBusiness(null));
      return;
    }
    const savedLocationId = tenantPreferences.getLocationId(userId, business.id);
    const branch = business.branches.find((item) => item.id === savedLocationId);
    if (branch) dispatch(setTenantSelection({ business, branch }));
    else {
      if (savedLocationId) tenantPreferences.setLocationId(userId, business.id, null);
      dispatch(setBusiness(business));
    }
  }, [businesses, businessesQuery.isSuccess, dispatch, userId]);

  const chooseScope = async (business: BusinessItem, branch?: BranchItem) => {
    const changesScope = selectedBusiness?.id !== business.id || (branch ? selectedBranch?.id !== branch.id : false);
    if (changesScope && cartCount > 0 && !window.confirm("Changing tenant scope will clear the current cart. Continue?")) return;
    if (changesScope && cartCount > 0) dispatch(clearCart());
    await queryClient.cancelQueries({ queryKey: ["catalog"] });
    if (branch) {
      dispatch(setTenantSelection({ business, branch }));
      if (userId) {
        tenantPreferences.setBusinessId(userId, business.id);
        tenantPreferences.setLocationId(userId, business.id, branch.id);
      }
    } else {
      dispatch(setBusiness(business));
      if (userId) tenantPreferences.setBusinessId(userId, business.id);
      setStep(2);
    }
    queryClient.removeQueries({ queryKey: ["catalog"] });
  };

  const openDialog = (next: Exclude<EntityDialog, null>) => {
    setDialog(next);
    setName(next.item?.name ?? "");
    setAddress(next.kind === "location" ? next.item?.address ?? "" : "");
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!dialog || !name.trim()) return;
    try {
      if (dialog.kind === "business") {
        if (dialog.item) await updateBusiness.mutateAsync({ id: dialog.item.id, name: name.trim() });
        else await createBusiness.mutateAsync({ name: name.trim() });
      } else if (selectedBusiness) {
        const body = { name: name.trim(), address: address.trim() || undefined };
        if (dialog.item) await updateLocation.mutateAsync({ id: dialog.item.id, ...body });
        else await createLocation.mutateAsync({ businessId: selectedBusiness.id, ...body });
      }
      toast.success(dialog.item ? "Changes saved" : "Created successfully");
      setDialog(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Request failed");
    }
  };

  const removeBusiness = async (business: BusinessItem) => {
    if (!window.confirm(`Delete ${business.name}? All branches must be removed first.`)) return;
    try {
      await deleteBusiness.mutateAsync(business.id);
      if (selectedBusiness?.id === business.id) dispatch(setBusiness(null));
      if (userId) tenantPreferences.setBusinessId(userId, null);
      toast.success("Business deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete business");
    }
  };

  const removeLocation = async (branch: BranchItem) => {
    if (!window.confirm(`Delete branch ${branch.name}?`)) return;
    try {
      await deleteLocation.mutateAsync(branch.id);
      if (userId && selectedBusiness) tenantPreferences.setLocationId(userId, selectedBusiness.id, null);
      dispatch(setBranch(null));
      toast.success("Branch deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete branch");
    }
  };

  const busy = createBusiness.isPending || updateBusiness.isPending || createLocation.isPending || updateLocation.isPending;
  const activeBusiness = businesses.find((item) => item.id === selectedBusiness?.id) ?? selectedBusiness;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Business & branch scope"
        actions={<Button onClick={() => openDialog({ kind: step === 1 ? "business" : "location" })} disabled={step === 2 && !activeBusiness}><Plus className="mr-2 h-4 w-4" />Add {step === 1 ? "business" : "branch"}</Button>}
      />

      <p className="text-sm text-slate-600">Choose the authorized tenant context used by inventory, sales, and reporting.</p>

      <div className="flex items-center gap-2 text-sm"><Badge variant={step === 1 ? "default" : "outline"}>1. Business</Badge><Badge variant={step === 2 ? "default" : "outline"}>2. Branch</Badge></div>

      {businessesQuery.isPending ? <TableSkeleton rows={4} columns={3} /> : businessesQuery.isError ? (
        <ErrorState resource="businesses" onRetry={() => void businessesQuery.refetch()} />
      ) : step === 1 ? (
        businesses.length === 0 ? <EmptyState title="No businesses yet" description="Create the first business to continue." /> :
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{businesses.map((business) => (
          <div key={business.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3"><div className="flex gap-3"><div className="rounded-lg bg-blue-50 p-2"><Building2 className="h-5 w-5 text-blue-600" /></div><div><h2 className="font-semibold text-[#070B28]">{business.name}</h2><p className="text-xs text-slate-500">{business.branches.length} branches</p></div></div><Badge>Active</Badge></div>
            <div className="mt-5 flex gap-2"><Button className="flex-1" onClick={() => void chooseScope(business)}>Choose business</Button><Button variant="outline" size="icon" aria-label="Edit business" onClick={() => openDialog({ kind: "business", item: business })}><Pencil className="h-4 w-4" /></Button><Button variant="outline" size="icon" aria-label="Delete business" onClick={() => void removeBusiness(business)}><Trash2 className="h-4 w-4 text-rose-600" /></Button></div>
          </div>
        ))}</div>
      ) : !activeBusiness ? <EmptyState title="Choose a business first" action={<Button onClick={() => setStep(1)}>Back to businesses</Button>} /> : (
        <div className="space-y-4"><div className="flex items-center justify-between"><div><p className="text-xs uppercase tracking-wide text-slate-500">Selected business</p><h2 className="font-semibold text-[#070B28]">{activeBusiness.name}</h2></div><Button variant="outline" onClick={() => setStep(1)}>Change business</Button></div>
          {activeBusiness.branches.length === 0 ? <EmptyState title="No branches yet" description="Create a branch before entering the admin workspace." /> : <div className="grid gap-4 md:grid-cols-2">{activeBusiness.branches.map((branch) => (
            <div key={branch.id} className="rounded-xl border border-slate-200 bg-white p-5"><div className="flex items-start justify-between"><div className="flex gap-3"><MapPin className="h-5 w-5 text-blue-600" /><div><h3 className="font-semibold">{branch.name}</h3><p className="text-sm text-slate-500">{branch.address || "No address provided"}</p></div></div><Badge>Active</Badge></div><div className="mt-5 flex gap-2"><Button className="flex-1" onClick={() => void chooseScope(activeBusiness, branch)}>Use this branch</Button><Button variant="outline" size="icon" aria-label="Edit branch" onClick={() => openDialog({ kind: "location", item: branch })}><Pencil className="h-4 w-4" /></Button><Button variant="outline" size="icon" aria-label="Delete branch" onClick={() => void removeLocation(branch)}><Trash2 className="h-4 w-4 text-rose-600" /></Button></div></div>
          ))}</div>}
        </div>
      )}

      <Dialog open={Boolean(dialog)} onOpenChange={(open) => !open && setDialog(null)}><DialogContent><DialogHeader><DialogTitle>{dialog?.item ? "Edit" : "Create"} {dialog?.kind === "location" ? "branch" : "business"}</DialogTitle></DialogHeader><form className="space-y-4" onSubmit={save}><label className="block text-sm font-medium">Name<Input className="mt-1" maxLength={120} required value={name} onChange={(event) => setName(event.target.value)} /></label>{dialog?.kind === "location" ? <label className="block text-sm font-medium">Address<Input className="mt-1" value={address} onChange={(event) => setAddress(event.target.value)} /></label> : null}<div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setDialog(null)}>Cancel</Button><Button type="submit" disabled={busy}>{busy ? "Saving..." : "Save"}</Button></div></form></DialogContent></Dialog>
    </div>
  );
}
