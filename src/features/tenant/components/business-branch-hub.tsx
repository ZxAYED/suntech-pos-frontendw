"use client";

import React, { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ChevronRight,
  MapPin,
  Plus,
  Pencil,
  Trash2,
  Store,
  X,
  Search,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState, TableSkeleton } from "@/components/common/data-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  setBusiness,
  setBranch,
  setTenantSelection,
  setAvailableBusinesses,
} from "@/redux/actions/tenantActions";
import {
  useGetBusinessesQuery,
  useCreateBusinessMutation,
  useUpdateBusinessMutation,
  useDeleteBusinessMutation,
  useCreateLocationMutation,
  useUpdateLocationMutation,
  useDeleteLocationMutation,
  type BusinessApiItem,
  type LocationItem,
} from "@/mocks/tenant/hooks";
import type { BranchItem, BusinessItem, RootState } from "@/redux/types";
import { cn } from "@/lib/utils";

interface BusinessBranchHubProps {
  initialStep?: 1 | 2;
}

// Pure Framer Motion Spring Configuration (NO duration or delay)
const springConfig = {
  type: "spring" as const,
  stiffness: 400,
  damping: 30,
};

const listVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: springConfig,
  },
};

export function BusinessBranchHub({ initialStep = 1 }: BusinessBranchHubProps) {
  const dispatch = useDispatch();
  const tenant = useSelector((state: RootState) => state.tenant);

  // RTK Query API Hooks
  const { data: apiBusinesses, isLoading, isError, refetch: refetchBusinesses } = useGetBusinessesQuery();
  const createBusinessMutation = useCreateBusinessMutation();
  const updateBusinessMutation = useUpdateBusinessMutation();
  const deleteBusinessMutation = useDeleteBusinessMutation();
  const createLocationMutation = useCreateLocationMutation();
  const updateLocationMutation = useUpdateLocationMutation();
  const deleteLocationMutation = useDeleteLocationMutation();

  // Sync API businesses with Redux when fetched
  useEffect(() => {
    if (apiBusinesses && Array.isArray(apiBusinesses) && apiBusinesses.length > 0) {
      const mappedBusinesses: BusinessItem[] = apiBusinesses.map((b: BusinessApiItem) => ({
        id: b.id,
        name: b.name,
        code: b.name.slice(0, 4).toUpperCase(),
        logoUrl: b.profileImageUrl || undefined,
        profileImageUrl: b.profileImageUrl,
        ownerId: b.ownerId,
        createdAt: b.createdAt,
        updatedAt: b.updatedAt,
        plan: "Enterprise",
        status: "ACTIVE",
        branches: (b.locations || []).map((loc: LocationItem) => ({
          id: loc.id,
          businessId: loc.businessId,
          name: loc.name,
          code: loc.name.slice(0, 6).toUpperCase().replace(/\s+/g, "-"),
          address: loc.address,
          laneCount: 2,
          isMain: false,
          status: "ACTIVE" as const,
          createdAt: loc.createdAt,
          updatedAt: loc.updatedAt,
        })),
      }));
      dispatch(setAvailableBusinesses(mappedBusinesses));
    }
  }, [apiBusinesses, dispatch]);

  // Available businesses state from Redux
  const businesses = useMemo(() => tenant?.availableBusinesses || [], [tenant?.availableBusinesses]);
  const selectedBusiness = tenant?.selectedBusiness;
  const selectedBranch = tenant?.selectedBranch;

  // Active Stepper Step: 1 = Business Selection, 2 = Branch Selection & Management
  const [step, setStep] = useState<1 | 2>(() => {
    if (initialStep === 2 && selectedBusiness) return 2;
    return initialStep;
  });

  // Currently focused/picked business (for Step 2 exploration)
  const [focusedBusinessId, setFocusedBusinessId] = useState<string>(() => {
    return selectedBusiness?.id || businesses[0]?.id || "";
  });

  const currentBusiness = useMemo(() => {
    return (
      businesses.find((b) => b.id === focusedBusinessId) ||
      selectedBusiness ||
      businesses[0] ||
      null
    );
  }, [businesses, focusedBusinessId, selectedBusiness]);

  // Branch search query for Step 2
  const [branchSearch, setBranchSearch] = useState("");

  // ═══════════════════════════════════════════════════════════════
  // MODAL & FORM STATES
  // ═══════════════════════════════════════════════════════════════

  // Business Modal (Create / Edit)
  const [isBusinessModalOpen, setIsBusinessModalOpen] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<BusinessItem | null>(null);
  const [businessName, setBusinessName] = useState("");
  const [businessCode, setBusinessCode] = useState("");
  const [businessPlan, setBusinessPlan] = useState<"Enterprise" | "Pro" | "Growth">("Enterprise");
  const [businessProfileImage, setBusinessProfileImage] = useState<string | null>(null);

  // Delete Business Confirmation Modal
  const [isDeleteBusinessModalOpen, setIsDeleteBusinessModalOpen] = useState(false);
  const [businessToDelete, setBusinessToDelete] = useState<BusinessItem | null>(null);

  // Right-side Branch Workbench Form States (matching screenshot)
  const [editingBranchId, setEditingBranchId] = useState<string | null>(null);
  const [formBranchName, setFormBranchName] = useState("");
  const [formShortCode, setFormShortCode] = useState("");
  const [formAssociatedBusinessId, setFormAssociatedBusinessId] = useState<string>(
    () => selectedBusiness?.id || businesses[0]?.id || "",
  );
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formStreetAddress, setFormStreetAddress] = useState("");
  const [formCityArea, setFormCityArea] = useState("Dhaka / Banani");
  const [formCashFloat, setFormCashFloat] = useState("10,000");
  const [formAllowOffline, setFormAllowOffline] = useState(true);

  // Delete Branch Confirmation Modal
  const [isDeleteBranchModalOpen, setIsDeleteBranchModalOpen] = useState(false);
  const [branchToDelete, setBranchToDelete] = useState<BranchItem | null>(null);

  // ═══════════════════════════════════════════════════════════════
  // BUSINESS HANDLERS
  // ═══════════════════════════════════════════════════════════════

  const handleOpenCreateBusiness = () => {
    setEditingBusiness(null);
    setBusinessName("");
    setBusinessCode("");
    setBusinessPlan("Enterprise");
    setBusinessProfileImage(null);
    setIsBusinessModalOpen(true);
  };

  const handleOpenEditBusiness = (biz: BusinessItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingBusiness(biz);
    setBusinessName(biz.name);
    setBusinessCode(biz.code);
    setBusinessPlan(biz.plan ?? "Enterprise");
    setBusinessProfileImage(biz.profileImageUrl || biz.logoUrl || null);
    setIsBusinessModalOpen(true);
  };

  const handleSaveBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = businessName.trim();
    if (!trimmedName) {
      toast.error("Please enter a business name.");
      return;
    }

    try {
      if (editingBusiness) {
        await updateBusinessMutation.mutateAsync({ id: editingBusiness.id, name: trimmedName });
        const updatedList = businesses.map((b) =>
          b.id === editingBusiness.id
            ? {
                ...b,
                name: trimmedName,
                code: businessCode.trim() || b.code,
                plan: businessPlan,
                profileImageUrl: businessProfileImage,
                logoUrl: businessProfileImage || undefined,
              }
            : b
        );
        dispatch(setAvailableBusinesses(updatedList));
        if (selectedBusiness?.id === editingBusiness.id) {
          dispatch(
            setBusiness({
              ...selectedBusiness,
              name: trimmedName,
              code: businessCode.trim() || selectedBusiness.code,
              plan: businessPlan,
              profileImageUrl: businessProfileImage,
              logoUrl: businessProfileImage || undefined,
            })
          );
        }
        toast.success(`Business "${trimmedName}" updated successfully.`);
      } else {
        const response = await createBusinessMutation.mutateAsync({ name: trimmedName });
        const newBizId = response.business.id;
        const newBiz: BusinessItem = {
          id: newBizId,
          name: trimmedName,
          code: businessCode.trim() || trimmedName.slice(0, 4).toUpperCase(),
          logoUrl: businessProfileImage || undefined,
          profileImageUrl: businessProfileImage,
          plan: businessPlan,
          status: "ACTIVE",
          branches: [],
        };
        const updatedList = [...businesses, newBiz];
        dispatch(setAvailableBusinesses(updatedList));
        dispatch(setBusiness(newBiz));
        setFocusedBusinessId(newBizId);
        setFormAssociatedBusinessId(newBizId);
        toast.success(`Business "${trimmedName}" created and set as active.`);
      }
      refetchBusinesses();
      setIsBusinessModalOpen(false);
    } catch (err: unknown) {
      const msg = (err as { data?: { message?: string } })?.data?.message || "Could not save business.";
      toast.error(msg);
    }
  };

  const handleSelectBusinessOnly = async (biz: BusinessItem) => {
    dispatch(setBusiness(biz));
    setFocusedBusinessId(biz.id);
    setFormAssociatedBusinessId(biz.id);
    setStep(2);
    toast.success(`Switched active business to "${biz.name}".`);
  };

  const handleDeleteBusinessClick = (biz: BusinessItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setBusinessToDelete(biz);
    setIsDeleteBusinessModalOpen(true);
  };

  const handleConfirmDeleteBusiness = async () => {
    if (!businessToDelete) return;
    try {
      await deleteBusinessMutation.mutateAsync(businessToDelete.id);
      const updatedList = businesses.filter((b) => b.id !== businessToDelete.id);
      dispatch(setAvailableBusinesses(updatedList));
      if (selectedBusiness?.id === businessToDelete.id) {
        const next = updatedList[0] || null;
        if (next) dispatch(setBusiness(next));
      }
      toast.success(`Business "${businessToDelete.name}" deleted.`);
      refetchBusinesses();
    } catch (err: unknown) {
      const msg = (err as { data?: { message?: string } })?.data?.message || "Cannot delete business with active branches or open shifts.";
      toast.error(msg);
    } finally {
      setIsDeleteBusinessModalOpen(false);
      setBusinessToDelete(null);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // BRANCH WORKBENCH HANDLERS (2-COLUMN SPLIT VIEW)
  // ═══════════════════════════════════════════════════════════════

  const handleResetBranchForm = () => {
    setEditingBranchId(null);
    setFormBranchName("");
    setFormShortCode("");
    setFormAssociatedBusinessId(currentBusiness?.id || "");
    setFormPhone("");
    setFormEmail("");
    setFormStreetAddress("");
    setFormCityArea("Dhaka / Banani");
    setFormCashFloat("10,000");
    setFormAllowOffline(true);
  };

  const handleSelectBranchCard = (branch: BranchItem) => {
    if (!currentBusiness) return;
    dispatch(
      setTenantSelection({
        business: currentBusiness,
        branch,
      })
    );
    toast.success(`Active branch set to "${branch.name}".`);
  };

  const handleEditBranchClick = (branch: BranchItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingBranchId(branch.id);
    setFormBranchName(branch.name);
    setFormShortCode(branch.code);
    setFormAssociatedBusinessId(branch.businessId || currentBusiness?.id || "");
    setFormPhone("+880 1711-000000");
    setFormEmail("");
    setFormStreetAddress(branch.address || "");
    setFormCityArea("Dhaka / Banani");
    setFormCashFloat("10,000");
    setFormAllowOffline(true);
  };

  const handleDeleteBranchClick = (branch: BranchItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setBranchToDelete(branch);
    setIsDeleteBranchModalOpen(true);
  };

  const handleConfirmDeleteBranch = async () => {
    if (!branchToDelete || !currentBusiness) return;
    try {
      await deleteLocationMutation.mutateAsync(branchToDelete.id);
      const updatedBranches = currentBusiness.branches.filter((b) => b.id !== branchToDelete.id);
      const updatedBusiness = { ...currentBusiness, branches: updatedBranches };
      const updatedList = businesses.map((b) => (b.id === currentBusiness.id ? updatedBusiness : b));
      dispatch(setAvailableBusinesses(updatedList));
      if (selectedBranch?.id === branchToDelete.id) {
        const nextBranch = updatedBranches[0] || null;
        if (nextBranch) dispatch(setBranch(nextBranch));
      }
      if (editingBranchId === branchToDelete.id) {
        handleResetBranchForm();
      }
      toast.success(`Branch "${branchToDelete.name}" deleted.`);
      refetchBusinesses();
    } catch (err: unknown) {
      const msg = (err as { data?: { message?: string } })?.data?.message || "Cannot delete branch with active shifts.";
      toast.error(msg);
    } finally {
      setIsDeleteBranchModalOpen(false);
      setBranchToDelete(null);
    }
  };

  const handleSaveBranchForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = formBranchName.trim();
    if (!trimmedName) {
      toast.error("Please enter a branch name.");
      return;
    }

    const targetBusinessId = formAssociatedBusinessId || currentBusiness?.id;
    if (!targetBusinessId) {
      toast.error("Please select an associated business.");
      return;
    }

    try {
      if (editingBranchId) {
        await updateLocationMutation.mutateAsync({
          id: editingBranchId,
          name: trimmedName,
          address: formStreetAddress.trim() || undefined,
        });

        const updatedBusinesses = businesses.map((biz) => {
          if (biz.id !== targetBusinessId) return biz;
          return {
            ...biz,
            branches: biz.branches.map((b) =>
              b.id === editingBranchId
                ? {
                    ...b,
                    name: trimmedName,
                    code: formShortCode.trim() || b.code,
                    address: formStreetAddress.trim() || b.address,
                  }
                : b
            ),
          };
        });
        dispatch(setAvailableBusinesses(updatedBusinesses));
        if (selectedBranch?.id === editingBranchId) {
          dispatch(
            setBranch({
              ...selectedBranch,
              name: trimmedName,
              code: formShortCode.trim() || selectedBranch.code,
              address: formStreetAddress.trim() || selectedBranch.address,
            })
          );
        }
        toast.success(`Branch "${trimmedName}" updated successfully.`);
      } else {
        const createdLocation = await createLocationMutation.mutateAsync({
          name: trimmedName,
          address: formStreetAddress.trim() || undefined,
          businessId: targetBusinessId,
        });

        const newBranch: BranchItem = {
          id: createdLocation.id,
          businessId: targetBusinessId,
          name: createdLocation.name,
          code: formShortCode.trim() || createdLocation.name.slice(0, 6).toUpperCase().replace(/\s+/g, "-"),
          address: createdLocation.address,
          laneCount: 2,
          isMain: false,
          status: "ACTIVE",
          createdAt: createdLocation.createdAt,
          updatedAt: createdLocation.updatedAt,
        };

        const updatedBusinesses = businesses.map((biz) => {
          if (biz.id !== targetBusinessId) return biz;
          return {
            ...biz,
            branches: [...biz.branches, newBranch],
          };
        });
        dispatch(setAvailableBusinesses(updatedBusinesses));
        if (targetBusinessId === currentBusiness?.id) {
          dispatch(setBranch(newBranch));
        }
        toast.success(`Operational Branch "${trimmedName}" registered.`);
      }

      refetchBusinesses();
      handleResetBranchForm();
    } catch (err: unknown) {
      const msg = (err as { data?: { message?: string } })?.data?.message || "Could not save branch location.";
      toast.error(msg);
    }
  };

  // Filtered branches for Step 2 left list
  const filteredBranches = useMemo(() => {
    if (!currentBusiness) return [];
    if (!branchSearch.trim()) return currentBusiness.branches;
    const q = branchSearch.toLowerCase();
    return currentBusiness.branches.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.code.toLowerCase().includes(q) ||
        (b.address && b.address.toLowerCase().includes(q))
    );
  }, [currentBusiness, branchSearch]);

  if (isLoading) return <TableSkeleton rows={3} columns={3} />;
  if (isError) return <ErrorState resource="businesses" onRetry={() => void refetchBusinesses()} />;
  if (businesses.length === 0) {
    return <EmptyState title="No businesses yet." description="Create a business to begin configuring operational branches." action={<Button onClick={handleOpenCreateBusiness}>Create business</Button>} />;
  }

  return (
    <div className="space-y-6 font-sans w-full">
      {/* ═══════════════════════════════════════════════════════════════
          STANDARD REUSABLE PAGE HEADER (NO EXCESSIVE TOP PADDING)
      ═══════════════════════════════════════════════════════════════ */}
      <PageHeader
        title={step === 1 ? "Select Business & Branch" : "Locations & Branches"}
        actions={
          <div className="flex items-center gap-2.5">
            {/* Pill Stepper */}
            <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setStep(1)}
                className={cn(
                  "px-3 py-1.5 rounded-lg font-medium cursor-pointer outline-none",
                  step === 1
                    ? "bg-white text-[#0052FF] shadow-xs font-semibold"
                    : "text-slate-600 hover:text-[#070B28]"
                )}
              >
                1. Businesses
              </button>
              <ChevronRight className="h-3 w-3 text-slate-400 shrink-0" />
              <button
                type="button"
                onClick={() => currentBusiness && setStep(2)}
                disabled={!currentBusiness}
                className={cn(
                  "px-3 py-1.5 rounded-lg font-medium outline-none",
                  step === 2
                    ? "bg-white text-[#0052FF] shadow-xs font-semibold cursor-pointer"
                    : "text-slate-400 cursor-not-allowed"
                )}
              >
                2. Branches
              </button>
            </div>

            {step === 2 ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setStep(1)}
                className="min-h-11 h-11 px-4 text-xs font-medium border-slate-200 text-[#0052FF] hover:bg-blue-50"
              >
                ← Switch Business
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                onClick={handleOpenCreateBusiness}
                className="min-h-11 h-11 px-4 bg-[#0052FF] hover:bg-[#0047E0] text-white font-medium text-xs gap-1.5 shadow-xs"
              >
                <Plus className="h-4 w-4" />
                <span>Create Business</span>
              </Button>
            )}
          </div>
        }
      />

      {/* ═══════════════════════════════════════════════════════════════
          STEP 1: BUSINESS GRID (MULTI-BUSINESS PER ADMIN)
      ═══════════════════════════════════════════════════════════════ */}
      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.div
            key="step-business"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={springConfig}
            className="w-full space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {businesses.map((biz) => {
                const isSelected = selectedBusiness?.id === biz.id;
                const logoSrc = biz.profileImageUrl || biz.logoUrl;

                return (
                  <motion.div
                    key={biz.id}
                    layout
                    whileHover={{ y: -3 }}
                    transition={springConfig}
                    className={cn(
                      "relative rounded-2xl border bg-white p-6 shadow-sm flex flex-col justify-between group",
                      isSelected
                        ? "border-[#0052FF] ring-2 ring-[#0052FF]/15 bg-blue-50/10"
                        : "border-slate-200 hover:border-[#0052FF]/50"
                    )}
                  >
                    {/* Top Row: Business Logo & Action Icons */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="relative">
                        {logoSrc ? (
                          <Image
                            src={logoSrc}
                            alt={biz.name}
                            width={48}
                            height={48}
                            unoptimized
                            className="h-12 w-12 rounded-xl object-cover border border-slate-200 bg-white"
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-[#0052FF] border border-blue-100 font-semibold text-base font-mono">
                            {biz.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {isSelected ? (
                          <Badge variant="paid">Active</Badge>
                        ) : (
                          <Badge variant="outline">Ready</Badge>
                        )}

                        <button
                          type="button"
                          onClick={(e) => handleOpenEditBusiness(biz, e)}
                          className="h-8 w-8 rounded-lg text-slate-400 hover:text-[#0052FF] hover:bg-blue-50 flex items-center justify-center cursor-pointer"
                          title="Edit business"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleDeleteBusinessClick(biz, e)}
                          className="h-8 w-8 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center cursor-pointer"
                          title="Delete business"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Middle Info */}
                    <div className="mt-4 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono tabular-nums font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          {biz.code}
                        </span>
                        <span className="text-xs font-medium text-blue-600 uppercase tracking-wide">
                          {biz.plan}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold tracking-tight text-[#070B28] leading-tight">
                        {biz.name}
                      </h3>
                      <p className="text-sm text-slate-500 font-normal leading-relaxed">
                        <span className="font-mono tabular-nums font-medium">{biz.branches.length}</span> Operational {biz.branches.length === 1 ? "Branch" : "Branches"}
                      </p>
                    </div>

                    {/* Bottom Action */}
                    <div className="mt-6 pt-4 border-t border-slate-100">
                      <Button
                        type="button"
                        onClick={() => handleSelectBusinessOnly(biz)}
                        variant={isSelected ? "default" : "outline"}
                        className={cn(
                          "w-full min-h-11 h-11 text-xs font-medium gap-1.5",
                          isSelected
                            ? "bg-[#0052FF] hover:bg-[#0047E0] text-white"
                            : "border-slate-200 text-slate-700 hover:bg-blue-50 hover:text-[#0052FF]"
                        )}
                      >
                        <span>{isSelected ? "Manage Branches" : "Select & Manage Branches"}</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </motion.div>
                );
              })}

              {/* + Register New Business Dashed Card */}
              <motion.div
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                transition={springConfig}
                onClick={handleOpenCreateBusiness}
                className="border-2 border-dashed border-slate-200 hover:border-[#0052FF] hover:bg-blue-50/20 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer min-h-[220px] group"
              >
                <div className="h-12 w-12 rounded-xl bg-slate-100 group-hover:bg-[#0052FF] text-slate-500 group-hover:text-white flex items-center justify-center shadow-xs">
                  <Plus className="h-6 w-6" />
                </div>
                <h4 className="mt-4 text-base font-semibold text-[#070B28] group-hover:text-[#0052FF]">
                  + Register New Business
                </h4>
                <p className="mt-1 text-sm text-slate-500 font-normal leading-relaxed max-w-[220px]">
                  Add a new multi-tenant enterprise company or retail brand.
                </p>
              </motion.div>
            </div>
          </motion.div>
        ) : (
          /* ═══════════════════════════════════════════════════════════════
             STEP 2: MANAGE LOCATIONS WORKBENCH (FLUID 12-COLUMN GRID)
             Left (col-span-5): Search + Branch Cards List
             Right (col-span-7): Create/Edit Operational Branch Form
          ═══════════════════════════════════════════════════════════════ */
          <motion.div
            key="step-locations-workbench"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={springConfig}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full items-start"
          >
            {/* ═══════════════════════════════════════════════════════════
                LEFT COLUMN (lg:col-span-5): SEARCH & BRANCH CARDS LIST
            ═══════════════════════════════════════════════════════════════ */}
            <div className="lg:col-span-5 space-y-4">
              {/* Search Bar */}
              <div className="relative w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <Input
                  type="text"
                  placeholder="Search branches..."
                  value={branchSearch}
                  onChange={(e) => setBranchSearch(e.target.value)}
                  className="pl-10 min-h-11 h-11 text-sm bg-white"
                />
                {branchSearch && (
                  <button
                    type="button"
                    onClick={() => setBranchSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Counter & Action */}
              <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                <span>
                  <strong className="font-mono tabular-nums font-medium text-[#070B28]">{filteredBranches.length}</strong> Operational Branches
                </span>
                <button
                  type="button"
                  onClick={handleResetBranchForm}
                  className="text-[#0052FF] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>New Branch</span>
                </button>
              </div>

              {/* Scrollable List with Framer Motion Layout Stagger */}
              <motion.div
                layout
                variants={listVariants}
                initial="hidden"
                animate="show"
                className="flex flex-col gap-3 max-h-[calc(100vh-220px)] overflow-y-auto pr-1"
              >
                {filteredBranches.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-400 bg-white shadow-sm">
                    <Store className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                    <p className="text-sm font-medium text-slate-600">No branches found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Register your first branch location using the workbench on the right.
                    </p>
                  </div>
                ) : (
                  filteredBranches.map((branch) => {
                    const isActiveSelected = selectedBranch?.id === branch.id;
                    const isFormEditingThis = editingBranchId === branch.id;

                    return (
                      <motion.div
                        key={branch.id}
                        layout
                        variants={itemVariants}
                        whileHover={{ y: -2 }}
                        transition={springConfig}
                        onClick={() => handleSelectBranchCard(branch)}
                        className={cn(
                          "relative rounded-xl border bg-white p-4 shadow-sm cursor-pointer select-none",
                          isActiveSelected
                            ? "border-[#0052FF] ring-2 ring-[#0052FF]/20 bg-blue-50/10"
                            : isFormEditingThis
                            ? "border-amber-400 bg-amber-50/10"
                            : "border-slate-200 hover:border-slate-300"
                        )}
                      >
                        {/* Top Row: Store Icon + Badge & Actions */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#0052FF] border border-blue-100">
                            <Store className="h-5 w-5" />
                          </div>

                          <div className="flex items-center gap-1.5">
                            {isActiveSelected ? (
                              <Badge variant="paid">Active</Badge>
                            ) : (
                              <Badge variant="pending">Draft</Badge>
                            )}

                            <button
                              type="button"
                              onClick={(e) => handleEditBranchClick(branch, e)}
                              className="h-7 w-7 rounded-md text-slate-400 hover:text-[#0052FF] hover:bg-blue-50 flex items-center justify-center"
                              title="Edit in workbench"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={(e) => handleDeleteBranchClick(branch, e)}
                              className="h-7 w-7 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center"
                              title="Delete location"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Branch Title */}
                        <div className="mt-2.5">
                          <h4 className="text-base font-semibold tracking-tight text-[#070B28] leading-snug truncate">
                            {branch.name}
                          </h4>
                        </div>

                        {/* Middle: Manager & Staff Row with Avatar */}
                        <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                          <div className="space-y-0.5 font-normal">
                            <div>Manager: Alex Rivera</div>
                            <div>
                              Staff: <span className="font-mono tabular-nums font-medium text-slate-700">{(branch.laneCount ?? 0) + 1}</span>
                            </div>
                          </div>

                          {/* Manager Avatar Pill */}
                          <div className="h-8 w-8 rounded-full border border-slate-200 overflow-hidden bg-slate-100 flex items-center justify-center text-xs font-semibold text-slate-700">
                            AR
                          </div>
                        </div>

                        {/* Bottom: MapPin Location */}
                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center gap-1.5 text-xs text-slate-400">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                          <span className="truncate">{branch.address || "Uttara, Dhaka"}</span>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </motion.div>
            </div>

            {/* ═══════════════════════════════════════════════════════════
                RIGHT COLUMN (lg:col-span-7): WORKBENCH FORM CONTAINER
            ═══════════════════════════════════════════════════════════ */}
            <motion.div
              layout
              transition={springConfig}
              className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm"
            >
              {/* Form Title & Subtitle */}
              <div className="border-b border-slate-100 pb-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold tracking-tight text-[#070B28]">
                    {editingBranchId ? "Edit Operational Branch" : "Create New Operational Branch"}
                  </h2>
                  {editingBranchId && (
                    <Badge variant="outline" className="border-blue-200 text-[#0052FF] bg-blue-50/50">
                      Editing Mode
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-slate-500 font-normal leading-relaxed mt-1">
                  Register a new branch, warehouse, or operational retail location for{" "}
                  <strong className="font-medium text-[#070B28]">{currentBusiness?.name || "SunTech Electronics Ltd"}</strong>.
                </p>
              </div>

              <form onSubmit={handleSaveBranchForm} className="mt-6 space-y-6">
                {/* SECTION 1: BRANCH INFORMATION */}
                <div className="space-y-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 border-b border-slate-100 pb-2">
                    Branch Information
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    {/* Branch Name */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-600 mb-1.5 block">
                        Branch Name
                      </label>
                      <Input
                        type="text"
                        required
                        placeholder="e.g., Banani Hub (Lane 02)"
                        value={formBranchName}
                        onChange={(e) => setFormBranchName(e.target.value)}
                        className="min-h-11 h-11 text-sm"
                      />
                    </div>

                    {/* Short Code / Prefix */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-600 mb-1.5 block">
                        Short Code / Prefix
                      </label>
                      <Input
                        type="text"
                        placeholder="e.g., BANANI-02"
                        value={formShortCode}
                        onChange={(e) => setFormShortCode(e.target.value)}
                        className="min-h-11 h-11 text-sm font-mono tabular-nums font-medium uppercase"
                      />
                      <p className="text-[11px] text-slate-400 font-normal">
                        Helps generate invoice numbers.
                      </p>
                    </div>

                    {/* Associated Business Custom Select */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-medium text-slate-600 mb-1.5 block">
                        Associated Business
                      </label>
                      <Select
                        value={formAssociatedBusinessId}
                        onValueChange={setFormAssociatedBusinessId}
                      >
                        <SelectTrigger className="min-h-11 h-11">
                          <SelectValue placeholder="Select business" />
                        </SelectTrigger>
                        <SelectContent>
                          {businesses.map((b) => (
                            <SelectItem key={b.id} value={b.id}>
                              {b.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* SECTION 2: CONTACT & ADDRESS */}
                <div className="space-y-4 pt-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 border-b border-slate-100 pb-2">
                    Contact &amp; Address
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    {/* Phone Number */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-600 mb-1.5 block">
                        Phone Number
                      </label>
                      <Input
                        type="text"
                        placeholder="e.g., +880 1XXX-XXXXXX"
                        value={formPhone}
                        onChange={(e) => setFormPhone(e.target.value)}
                        className="min-h-11 h-11 text-sm font-mono tabular-nums font-medium"
                      />
                    </div>

                    {/* Email Address */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-600 mb-1.5 block">
                        Email Address (optional)
                      </label>
                      <Input
                        type="email"
                        placeholder="Email Address"
                        value={formEmail}
                        onChange={(e) => setFormEmail(e.target.value)}
                        className="min-h-11 h-11 text-sm"
                      />
                    </div>

                    {/* Street Address */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-600 mb-1.5 block">
                        Street Address
                      </label>
                      <Input
                        type="text"
                        placeholder="e.g., House 42, Road 11, Banani"
                        value={formStreetAddress}
                        onChange={(e) => setFormStreetAddress(e.target.value)}
                        className="min-h-11 h-11 text-sm"
                      />
                    </div>

                    {/* City / Area Custom Select */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-600 mb-1.5 block">
                        City / Area
                      </label>
                      <Select
                        value={formCityArea}
                        onValueChange={setFormCityArea}
                      >
                        <SelectTrigger className="min-h-11 h-11">
                          <SelectValue placeholder="Select city/area" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Dhaka / Banani">Dhaka / Banani</SelectItem>
                          <SelectItem value="Dhaka / Uttara">Dhaka / Uttara</SelectItem>
                          <SelectItem value="Dhaka / Gulshan">Dhaka / Gulshan</SelectItem>
                          <SelectItem value="Dhaka / Dhanmondi">Dhaka / Dhanmondi</SelectItem>
                          <SelectItem value="Dhaka / Mirpur">Dhaka / Mirpur</SelectItem>
                          <SelectItem value="Chattogram / Agrabad">Chattogram / Agrabad</SelectItem>
                          <SelectItem value="Sylhet / Zindabazar">Sylhet / Zindabazar</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* SECTION 3: OPERATIONS & CASH MANAGEMENT */}
                <div className="space-y-4 pt-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 border-b border-slate-100 pb-2">
                    Operations &amp; Cash Management
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 items-center">
                    {/* Initial Cash Float */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-600 mb-1.5 block">
                        Initial Cash Float
                      </label>
                      <div className="relative">
                        <Input
                          type="text"
                          placeholder="e.g., 10,000"
                          value={formCashFloat}
                          onChange={(e) => setFormCashFloat(e.target.value)}
                          className="min-h-11 h-11 text-sm pr-16 font-mono tabular-nums font-medium"
                        />
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 pointer-events-none select-none">
                          ৳ BDT
                        </span>
                      </div>
                    </div>

                    {/* Allow Offline Checkout? Reusable Switch */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-600 mb-1.5 block">
                        Allow Offline Checkout?
                      </label>
                      <div className="flex items-center gap-3 min-h-11 h-11">
                        <Switch
                          checked={formAllowOffline}
                          onCheckedChange={setFormAllowOffline}
                        />
                        <span className="text-sm text-slate-600 font-normal">
                          {formAllowOffline ? "Enabled" : "Disabled"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* BOTTOM ACTION BAR */}
                <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <p className="text-xs text-slate-400 font-normal leading-relaxed">
                    * This will initialize database indexing for POS registers and staff assignments at this location.
                  </p>

                  <div className="flex items-center gap-3 shrink-0">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleResetBranchForm}
                      className="min-h-11 h-11 px-5 text-sm font-medium border-slate-200"
                    >
                      Cancel
                    </Button>

                    <Button
                      type="submit"
                      variant="default"
                      className="min-h-11 h-11 px-6 text-sm font-medium bg-[#0052FF] hover:bg-[#0047E0] text-white"
                    >
                      {editingBranchId ? "Save Changes" : "Create Branch"}
                    </Button>
                  </div>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════════
          MODAL: CREATE / EDIT BUSINESS
      ═══════════════════════════════════════════════════════════════ */}
      <Dialog open={isBusinessModalOpen} onOpenChange={setIsBusinessModalOpen}>
        <DialogContent className="sm:max-w-[480px] p-6 rounded-2xl bg-white border-slate-200">
          <DialogHeader className="border-b border-slate-100 pb-3">
            <DialogTitle className="text-lg font-semibold tracking-tight text-[#070B28]">
              {editingBusiness ? "Edit Business Entity" : "Register New Business"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveBusiness} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600 mb-1.5 block">Business Name</label>
              <Input
                type="text"
                required
                placeholder="e.g., SunTech Electronics Ltd"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="min-h-11 h-11 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600 mb-1.5 block">Entity Code</label>
                <Input
                  type="text"
                  placeholder="e.g., STEL"
                  value={businessCode}
                  onChange={(e) => setBusinessCode(e.target.value)}
                  className="min-h-11 h-11 text-sm font-mono tabular-nums font-medium uppercase"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600 mb-1.5 block">Tier / Plan</label>
                <Select
                  value={businessPlan}
                  onValueChange={(val) => setBusinessPlan(val as "Enterprise" | "Pro" | "Growth")}
                >
                  <SelectTrigger className="min-h-11 h-11">
                    <SelectValue placeholder="Select plan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Enterprise">Enterprise</SelectItem>
                    <SelectItem value="Pro">Pro</SelectItem>
                    <SelectItem value="Growth">Growth</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600 mb-1.5 block">Logo URL (Optional)</label>
              <Input
                type="text"
                placeholder="https://..."
                value={businessProfileImage || ""}
                onChange={(e) => setBusinessProfileImage(e.target.value)}
                className="min-h-11 h-11 text-sm"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsBusinessModalOpen(false)}
                className="min-h-11 h-11 px-4 text-xs font-medium"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="default"
                className="min-h-11 h-11 px-5 text-xs font-medium bg-[#0052FF] hover:bg-[#0047E0] text-white"
              >
                {editingBusiness ? "Save Changes" : "Create Business"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════
          MODAL: CONFIRM DELETE BUSINESS
      ═══════════════════════════════════════════════════════════════ */}
      <Dialog open={isDeleteBusinessModalOpen} onOpenChange={setIsDeleteBusinessModalOpen}>
        <DialogContent className="sm:max-w-[420px] p-6 rounded-2xl bg-white border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-rose-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-rose-500" />
              <span>Delete Business Entity?</span>
            </DialogTitle>
          </DialogHeader>

          <p className="text-sm text-slate-500 font-normal leading-relaxed mt-2">
            Are you sure you want to delete <strong className="font-semibold text-[#070B28]">{businessToDelete?.name}</strong>?
            This will soft-delete the business and its operational branches.
          </p>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteBusinessModalOpen(false)}
              className="min-h-11 h-11 px-4 text-xs font-medium"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirmDeleteBusiness}
              className="min-h-11 h-11 px-5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium"
            >
              Confirm Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════
          MODAL: CONFIRM DELETE BRANCH
      ═══════════════════════════════════════════════════════════════ */}
      <Dialog open={isDeleteBranchModalOpen} onOpenChange={setIsDeleteBranchModalOpen}>
        <DialogContent className="sm:max-w-[420px] p-6 rounded-2xl bg-white border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-rose-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-rose-500" />
              <span>Delete Branch Location?</span>
            </DialogTitle>
          </DialogHeader>

          <p className="text-sm text-slate-500 font-normal leading-relaxed mt-2">
            Are you sure you want to delete branch <strong className="font-semibold text-[#070B28]">{branchToDelete?.name}</strong>?
            Branches with active open shift sessions cannot be deleted until closed.
          </p>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteBranchModalOpen(false)}
              className="min-h-11 h-11 px-4 text-xs font-medium"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirmDeleteBranch}
              className="min-h-11 h-11 px-5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium"
            >
              Confirm Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
