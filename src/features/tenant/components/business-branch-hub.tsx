"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ExternalLink,
  MapPin,
  Pencil,
  Plus,
  Store,
  Trash2,
} from "lucide-react";
import { motion } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { DeleteConfirmDialog } from "@/components/common/delete-confirm-dialog";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState, TableSkeleton } from "@/components/common/data-state";
import { MetricCard } from "@/components/common/metric-card";
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
import { cn } from "@/lib/utils";
import { clearCart } from "@/redux/actions/cartActions";
import { setAvailableBusinesses, setBranch, setBusiness, setTenantSelection } from "@/redux/actions/tenantActions";
import type { BusinessItem, BranchItem, RootState } from "@/redux/types";

type EntityDialog = { kind: "business"; item?: BusinessItem } | { kind: "location"; item?: BranchItem } | null;

export function BusinessBranchHub({ initialStep = 1 }: { initialStep?: 1 | 2 }) {
  const router = useRouter();
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
  const [deleteTarget, setDeleteTarget] = useState<{
    title: string;
    description?: string;
    itemName?: string;
    action: () => Promise<unknown>;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  // Synchronize available businesses and hydrate selections cleanly from LocalStorage
  useEffect(() => {
    dispatch(setAvailableBusinesses(businesses));
    if (!userId) return;

    if (businessesQuery.isSuccess && businesses.length === 0) {
      tenantPreferences.clearAll(userId);
      dispatch(setBusiness(null));
      return;
    }
    if (businesses.length === 0) return;

    const stored = tenantPreferences.getTenantContext(userId);
    const targetBusinessId = stored?.businessId ?? businesses[0]?.id;
    const business = businesses.find((item) => item.id === targetBusinessId);

    if (!business) {
      tenantPreferences.clearAll(userId);
      dispatch(setBusiness(null));
      return;
    }

    const targetLocationId = stored?.locationId ?? business.branches[0]?.id;
    const branch = business.branches.find((item) => item.id === targetLocationId);

    const alreadyMatches =
      selectedBusiness?.id === business.id &&
      (selectedBranch?.id ?? null) === (branch?.id ?? null);

    if (!alreadyMatches) {
      if (branch) {
        dispatch(setTenantSelection({ business, branch }));
        tenantPreferences.setTenantContext(userId, { business, branch });
      } else {
        dispatch(setBusiness(business));
        tenantPreferences.setTenantContext(userId, { business, branch: null });
      }
    }
  }, [businesses, businessesQuery.isSuccess, dispatch, selectedBranch?.id, selectedBusiness?.id, userId]);

  const chooseScope = async (business: BusinessItem, branch?: BranchItem) => {
    const changesScope = selectedBusiness?.id !== business.id || (branch ? selectedBranch?.id !== branch.id : false);
    if (changesScope && cartCount > 0 && !window.confirm("Changing tenant scope will clear the current cart. Continue?")) return;
    if (changesScope && cartCount > 0) dispatch(clearCart());
    await queryClient.cancelQueries({ queryKey: ["catalog"] });

    if (branch) {
      dispatch(setTenantSelection({ business, branch }));
      if (userId) {
        // Clear previous keys and save new business + location names & IDs
        tenantPreferences.setTenantContext(userId, { business, branch });
      }
      toast.success(`Active context set to ${branch.name}. Redirecting to register…`);
      router.push("/admin/terminal");
    } else {
      dispatch(setBusiness(business));
      if (userId) {
        tenantPreferences.setTenantContext(userId, { business, branch: null });
      }
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

  const removeBusiness = (business: BusinessItem) => {
    setDeleteTarget({
      title: "Delete Business",
      itemName: business.name,
      description: `Are you sure you want to delete "${business.name}"? All associated branches must be deleted first. This action cannot be undone.`,
      action: async () => {
        await deleteBusiness.mutateAsync(business.id);
        if (selectedBusiness?.id === business.id) {
          dispatch(setBusiness(null));
          if (userId) tenantPreferences.clearAll(userId);
        }
        toast.success("Business deleted");
      },
    });
  };

  const removeLocation = (branch: BranchItem) => {
    setDeleteTarget({
      title: "Delete Branch",
      itemName: branch.name,
      description: `Are you sure you want to delete branch "${branch.name}"? This action cannot be undone.`,
      action: async () => {
        await deleteLocation.mutateAsync(branch.id);
        if (selectedBranch?.id === branch.id) {
          dispatch(setBranch(null));
          if (userId && selectedBusiness) {
            tenantPreferences.setTenantContext(userId, { business: selectedBusiness, branch: null });
          }
        }
        toast.success("Branch deleted");
      },
    });
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await deleteTarget.action();
      setDeleteTarget(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Deletion failed");
    } finally {
      setIsDeleting(false);
    }
  };

  const busy = createBusiness.isPending || updateBusiness.isPending || createLocation.isPending || updateLocation.isPending;
  const activeBusiness = businesses.find((item) => item.id === selectedBusiness?.id) ?? selectedBusiness;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Business & Branch Selection"
        description="Select the business and branch used for inventory, sales, and reporting."
        actions={
          <Button
            onClick={() => openDialog({ kind: step === 1 ? "business" : "location" })}
            disabled={step === 2 && !activeBusiness}
            className="bg-[#0052FF] hover:bg-[#0047E0] text-white py-3 px-6 text-base font-medium rounded-md shadow-xs flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add {step === 1 ? "Business" : "Branch"}
          </Button>
        }
      />

      {/* Metrics Summary Cards (Matching Catalog & Expenses) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          label="Total Businesses"
          value={businesses.length}
          icon={Building2}
        />
        <MetricCard
          label="Branches in Business"
          value={activeBusiness?.branches.length ?? 0}
          icon={Store}
          subtext={activeBusiness ? activeBusiness.name : "Select a business to view branches"}
        />
        <MetricCard
          label="Current Active Branch"
          value={selectedBranch ? selectedBranch.name : "None Selected"}
          icon={CheckCircle2}
          subtext={selectedBusiness ? `Entity: ${selectedBusiness.name}` : "Pending branch selection"}
        />
      </div>

      {/* Segmented Tab Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="inline-flex rounded-lg bg-slate-100 p-1.5 border border-slate-200">
          <motion.button
            type="button"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => setStep(1)}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-6 py-2.5 text-base font-medium cursor-pointer transition-colors",
              step === 1
                ? "bg-[#070B28] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50",
            )}
          >
            <Building2 className="h-4 w-4" />
            <span>01. Business Selection ({businesses.length})</span>
          </motion.button>
          <motion.button
            type="button"
            whileHover={activeBusiness ? { scale: 1.01 } : undefined}
            whileTap={activeBusiness ? { scale: 0.99 } : undefined}
            onClick={() => activeBusiness && setStep(2)}
            disabled={!activeBusiness}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-6 py-2.5 text-base font-medium cursor-pointer transition-colors",
              step === 2
                ? "bg-[#070B28] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 disabled:opacity-40 disabled:cursor-not-allowed",
            )}
          >
            <Store className="h-4 w-4" />
            <span>02. Branch Location ({activeBusiness?.branches.length ?? 0})</span>
          </motion.button>
        </div>

        {step === 2 && activeBusiness ? (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-500">Currently scoping:</span>
            <span className="font-medium text-[#070B28] bg-blue-50 px-3 py-1 rounded-md border border-blue-200/60">
              {activeBusiness.name}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep(1)}
              className="text-sm font-medium text-[#0052FF] hover:text-[#0047E0] hover:bg-blue-50"
            >
              Switch Business
            </Button>
          </div>
        ) : null}
      </div>

      {/* Main Dual-Column Cockpit Layout */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Interactive Cards (Businesses or Branches) */}
        <div className="lg:col-span-7 xl:col-span-8">
          {businessesQuery.isPending ? (
            <TableSkeleton rows={4} columns={2} />
          ) : businessesQuery.isError ? (
            <ErrorState resource="businesses" onRetry={() => void businessesQuery.refetch()} />
          ) : step === 1 ? (
            businesses.length === 0 ? (
              <EmptyState
                title="No businesses yet"
                description="Create your first enterprise business entity to configure branches and launch sales."
                action={
                  <Button onClick={() => openDialog({ kind: "business" })} className="bg-[#0052FF] hover:bg-[#0047E0] text-white py-3 px-6 text-base font-medium rounded-md shadow-xs">
                    <Plus className="mr-2 h-4 w-4" /> Create Business
                  </Button>
                }
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {businesses.map((business) => {
                  const isCurrent = selectedBusiness?.id === business.id;
                  return (
                    <motion.div
                      key={business.id}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className={cn(
                        "rounded-lg border bg-white p-5 flex flex-col justify-between transition-colors",
                        isCurrent
                          ? "ring-2 ring-[#0052FF]/20 border-[#0052FF] bg-blue-50/[0.04] shadow-xs"
                          : "border-slate-200 hover:border-slate-300 shadow-2xs",
                      )}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0">
                            <Building2
                              className={cn(
                                "h-5 w-5 shrink-0 mt-0.5",
                                isCurrent ? "text-[#0052FF]" : "text-slate-600",
                              )}
                            />
                            <div className="min-w-0">
                              <h3 className="font-semibold text-slate-900 text-base leading-snug truncate" title={business.name}>
                                {business.name}
                              </h3>
                              <p className="text-xs text-slate-500 mt-1">
                                {business.branches.length} operational {business.branches.length === 1 ? "branch" : "branches"}
                              </p>
                            </div>
                          </div>
                          {isCurrent ? (
                            <Badge className="bg-[#0052FF] text-white text-xs px-2.5 py-0.5 font-medium rounded-md shrink-0">
                              Active Business
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-slate-500 border-slate-200 text-xs px-2 py-0.5 rounded-md shrink-0">
                              Available
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Card Action Row */}
                      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
                        <span className="text-xs font-medium text-slate-500">
                          {business.branches?.length ? `${business.branches.length} ${business.branches.length === 1 ? "branch" : "branches"}` : "Retail Enterprise"}
                        </span>
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => void chooseScope(business)}
                            className={cn(
                              "py-2.5 px-5 text-sm sm:text-base font-medium rounded-md transition-colors",
                              isCurrent
                                ? "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 shadow-xs"
                                : "bg-[#0052FF] hover:bg-[#0047E0] text-white shadow-xs",
                            )}
                          >
                            <span>{isCurrent ? "View Branches" : "Select Business"}</span>
                            <ArrowRight className="ml-1.5 h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-0"
                            aria-label={`Edit ${business.name}`}
                            onClick={() => openDialog({ kind: "business", item: business })}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-0"
                            aria-label={`Delete ${business.name}`}
                            onClick={() => void removeBusiness(business)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )
          ) : !activeBusiness ? (
            <EmptyState
              title="Choose an enterprise business first"
              description="A business scope must be selected before you can view and choose branch locations."
              action={
                <Button onClick={() => setStep(1)} className="bg-[#0052FF] hover:bg-[#0047E0] text-white py-3 px-6 text-base font-medium rounded-md shadow-xs">
                  Back to businesses
                </Button>
              }
            />
          ) : activeBusiness.branches.length === 0 ? (
            <EmptyState
              title={`No branches configured for ${activeBusiness.name}`}
              description="Create a branch location to enable catalog sales, cash shifts, and staff assignments."
              action={
                <Button onClick={() => openDialog({ kind: "location" })} className="bg-[#0052FF] hover:bg-[#0047E0] text-white py-3 px-6 text-base font-medium rounded-md shadow-xs">
                  <Plus className="mr-2 h-4 w-4" /> Add Branch
                </Button>
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {activeBusiness.branches.map((branch) => {
                const isSelected = selectedBranch?.id === branch.id;
                return (
                  <motion.div
                    key={branch.id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className={cn(
                      "rounded-lg border bg-white p-5 flex flex-col justify-between transition-colors",
                      isSelected
                        ? "ring-2 ring-[#0052FF]/20 border-[#0052FF] bg-blue-50/[0.04] shadow-xs"
                        : "border-slate-200 hover:border-slate-300 shadow-2xs",
                    )}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <Store
                            className={cn(
                              "h-5 w-5 shrink-0 mt-0.5",
                              isSelected ? "text-[#0052FF]" : "text-slate-600",
                            )}
                          />
                          <div className="min-w-0">
                            <h3 className="font-semibold text-slate-900 text-base leading-snug truncate" title={branch.name}>
                              {branch.name}
                            </h3>
                            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                              <span className="truncate">{branch.address || "Main operational branch"}</span>
                            </p>
                          </div>
                        </div>
                        {isSelected ? (
                          <Badge className="bg-[#0052FF] text-white text-xs px-2.5 py-0.5 font-medium rounded-md shrink-0 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Active Branch
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-slate-500 border-slate-200 text-xs px-2 py-0.5 rounded-md shrink-0">
                            Ready
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Card Action Row */}
                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
                      <span className="text-xs font-medium text-slate-500 truncate max-w-[180px]">
                        {branch.address || "Active Branch"}
                      </span>
                      <div className="flex items-center gap-2">
                        {isSelected ? (
                          <Button
                            variant="outline"
                            disabled
                            className="border border-slate-300 bg-slate-50 text-slate-600 py-2.5 px-5 text-sm sm:text-base font-medium rounded-md opacity-90 cursor-default"
                          >
                            <CheckCircle2 className="mr-1.5 h-4 w-4 text-[#0052FF]" />
                            Current Branch
                          </Button>
                        ) : (
                          <Button
                            onClick={() => void chooseScope(activeBusiness, branch)}
                            className="bg-[#0052FF] hover:bg-[#0047E0] text-white py-2.5 px-5 text-sm sm:text-base font-medium rounded-md shadow-xs transition-colors"
                          >
                            <span>Select Branch</span>
                            <ArrowRight className="ml-1.5 h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-0"
                          aria-label={`Edit ${branch.name}`}
                          onClick={() => openDialog({ kind: "location", item: branch })}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-0"
                          aria-label={`Delete ${branch.name}`}
                          onClick={() => void removeLocation(branch)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Operational Context Panel */}
        <div className="lg:col-span-5 xl:col-span-4">
          <div className="sticky top-6 rounded-lg bg-[#070B28] p-6 text-white border border-slate-800 shadow-sm">
            {/* Header: Clean title without technical buzzwords */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <Store className="h-4 w-4 text-blue-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Current Branch
                </span>
              </div>
              {selectedBranch ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-md border border-emerald-500/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Live
                </span>
              ) : null}
            </div>

            {/* Selection Display */}
            <div className="mt-5">
              <p className="text-xs font-medium text-slate-400">
                Operational Scope
              </p>
              <h2 className="text-xl font-bold text-white tracking-tight mt-1 truncate" title={selectedBranch?.name || "No branch selected"}>
                {selectedBranch?.name || "No branch selected"}
              </h2>
              <div className="mt-1.5 flex items-center gap-1.5 text-sm text-blue-300">
                <Building2 className="h-4 w-4 text-blue-400 shrink-0" />
                <span className="font-medium truncate">{selectedBusiness?.name || "No business selected"}</span>
              </div>
              <p className="mt-1 text-xs text-slate-400 truncate">
                {selectedBranch?.address || "No address specified for this branch"}
              </p>
            </div>

            {/* Scope Summary Details (Clean, without duplicating top-level metrics) */}
            <div className="mt-6 rounded-md bg-white/[0.04] border border-white/5 p-4 text-xs space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Operational Status</span>
                <span className="text-emerald-400 font-medium">
                  {selectedBranch ? "Ready for Orders" : "Pending Selection"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Inventory & Shift Scope</span>
                <span className="text-slate-200 font-medium">
                  {selectedBranch ? "Branch Synchronized" : "Unassigned"}
                </span>
              </div>
            </div>

            {/* Quick Action Shortcuts */}
            <div className="mt-6 flex flex-col gap-3">
              <Button
                asChild
                disabled={!selectedBranch}
                className="w-full bg-[#0052FF] hover:bg-[#0047E0] text-white py-3 px-6 text-base font-medium rounded-md shadow-xs flex items-center justify-center gap-2"
              >
                <Link href="/admin/terminal">
                  <span>Open Catalog Register</span>
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white py-3 px-6 text-base font-medium rounded-md flex items-center justify-center"
              >
                <Link href="/admin/dashboard">
                  Go to Operations Dashboard
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Dialog for creating/editing business or branch */}
      <Dialog open={Boolean(dialog)} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#070B28]">
              {dialog?.item ? "Edit" : "Create"} {dialog?.kind === "location" ? "Branch" : "Business"}
            </DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={save}>
            <label className="block text-sm font-medium">
              Name
              <Input
                className="mt-1"
                maxLength={120}
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={dialog?.kind === "location" ? "e.g. Uttara Doyel Branch" : "e.g. SunTech Retail Ltd."}
              />
            </label>
            {dialog?.kind === "location" ? (
              <label className="block text-sm font-medium">
                Address
                <Input
                  className="mt-1"
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  placeholder="e.g. Sector 12, Uttara, Dhaka"
                />
              </label>
            ) : null}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setDialog(null)} className="py-2.5 px-5 text-sm font-medium rounded-md">
                Cancel
              </Button>
              <Button type="submit" disabled={busy} className="bg-[#0052FF] hover:bg-[#0047E0] text-white py-2.5 px-5 text-sm font-medium rounded-md">
                {busy ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reusable Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={deleteTarget?.title}
        itemName={deleteTarget?.itemName}
        description={deleteTarget?.description}
        isDeleting={isDeleting}
        onConfirm={executeDelete}
      />
    </div>
  );
}
