"use client";

import React, { useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ChevronRight,
  MapPin,
  Plus,
  Pencil,
  Trash2,
  ShieldCheck,
  Store,
  Upload,
  X,
  Search,
  AlertTriangle,
  Check,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import type { BranchItem, BusinessItem, RootState } from "@/redux/types";
import { cn } from "@/lib/utils";

interface BusinessBranchHubProps {
  initialStep?: 1 | 2;
}

export function BusinessBranchHub({ initialStep = 1 }: BusinessBranchHubProps) {
  const router = useRouter();
  const dispatch = useDispatch();
  const tenant = useSelector((state: RootState) => state.tenant);

  // Available businesses state from Redux
  const businesses = useMemo(() => tenant?.availableBusinesses || [], [tenant?.availableBusinesses]);
  const selectedBusiness = tenant?.selectedBusiness;
  const selectedBranch = tenant?.selectedBranch;

  // Active Stepper Step: 1 = Business Selection & Management, 2 = Branch Selection & Management
  const [step, setStep] = useState<1 | 2>(() => {
    if (initialStep === 2 && selectedBusiness) return 2;
    return 1;
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
  // MODAL STATES & FORM DATA
  // ═══════════════════════════════════════════════════════════════

  // Business Modal (Create / Edit)
  const [isBusinessModalOpen, setIsBusinessModalOpen] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<BusinessItem | null>(null);
  const [businessName, setBusinessName] = useState("");
  const [businessCode, setBusinessCode] = useState("");
  const [businessPlan, setBusinessPlan] = useState<"Enterprise" | "Pro" | "Growth">("Enterprise");
  const [businessProfileImage, setBusinessProfileImage] = useState<string | null>(null);
  const [businessImageFileName, setBusinessImageFileName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Branch Modal (Create / Edit)
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<BranchItem | null>(null);
  const [branchName, setBranchName] = useState("");
  const [branchAddress, setBranchAddress] = useState("");
  const [branchCode, setBranchCode] = useState("");
  const [branchLanes, setBranchLanes] = useState(2);
  const [branchIsMain, setBranchIsMain] = useState(false);

  // Delete Branch Confirmation Modal
  const [isDeleteBranchModalOpen, setIsDeleteBranchModalOpen] = useState(false);
  const [branchToDelete, setBranchToDelete] = useState<BranchItem | null>(null);

  // Delete Business Confirmation Modal
  const [isDeleteBusinessModalOpen, setIsDeleteBusinessModalOpen] = useState(false);
  const [businessToDelete, setBusinessToDelete] = useState<BusinessItem | null>(null);

  // ═══════════════════════════════════════════════════════════════
  // BUSINESS CRUD HANDLERS
  // ═══════════════════════════════════════════════════════════════

  const handleOpenCreateBusiness = () => {
    setEditingBusiness(null);
    setBusinessName("");
    setBusinessCode("");
    setBusinessPlan("Enterprise");
    setBusinessProfileImage(null);
    setBusinessImageFileName("");
    setIsBusinessModalOpen(true);
  };

  const handleOpenEditBusiness = (biz: BusinessItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingBusiness(biz);
    setBusinessName(biz.name);
    setBusinessCode(biz.code);
    setBusinessPlan(biz.plan);
    setBusinessProfileImage(biz.profileImageUrl || biz.logoUrl || null);
    setBusinessImageFileName("");
    setIsBusinessModalOpen(true);
  };

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/^image\/(png|jpe?g|webp)$/i)) {
      toast.error("Please select a valid image file (PNG, JPEG, or WebP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size exceeds 5MB limit.");
      return;
    }

    setBusinessImageFileName(`${file.name} (${(file.size / 1024).toFixed(0)} KB)`);

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setBusinessProfileImage(result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setBusinessProfileImage(null);
    setBusinessImageFileName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSaveBusiness = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = businessName.trim();
    if (!trimmedName) {
      toast.error("Business name is required.");
      return;
    }

    // Auto-generate short code if empty
    const generatedCode =
      businessCode.trim().toUpperCase() ||
      trimmedName.replace(/[^A-Za-z0-9]/g, "").slice(0, 6).toUpperCase() ||
      "BIZ";

    if (editingBusiness) {
      // Update existing business
      const updatedBusiness: BusinessItem = {
        ...editingBusiness,
        name: trimmedName,
        code: generatedCode,
        plan: businessPlan,
        profileImageUrl: businessProfileImage,
        logoUrl: businessProfileImage || editingBusiness.logoUrl,
        updatedAt: new Date().toISOString(),
      };

      const updatedList = businesses.map((b) =>
        b.id === editingBusiness.id ? updatedBusiness : b
      );

      dispatch(setAvailableBusinesses(updatedList));

      // If active business was updated, update Redux state
      if (selectedBusiness?.id === editingBusiness.id) {
        dispatch(setBusiness(updatedBusiness));
      }

      toast.success(`Business "${trimmedName}" updated successfully!`);
    } else {
      // Create new business with 1 default branch
      const newBusinessId = `biz-${Date.now()}`;
      const defaultBranch: BranchItem = {
        id: `loc-${Date.now()}`,
        businessId: newBusinessId,
        name: `${trimmedName} (HQ Main Branch)`,
        code: `${generatedCode}-01`,
        address: "Commercial District, Dhaka",
        laneCount: 2,
        isMain: true,
        status: "ACTIVE",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const newBusiness: BusinessItem = {
        id: newBusinessId,
        name: trimmedName,
        code: generatedCode,
        plan: businessPlan,
        profileImageUrl: businessProfileImage,
        logoUrl: businessProfileImage || undefined,
        ownerId: "usr-admin-owner",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        branches: [defaultBranch],
      };

      const updatedList = [...businesses, newBusiness];
      dispatch(setAvailableBusinesses(updatedList));

      // Focus newly created business and select it in Redux
      setFocusedBusinessId(newBusinessId);
      dispatch(setTenantSelection({ business: newBusiness, branch: defaultBranch }));

      toast.success(`Registered new enterprise: "${trimmedName}"!`);
    }

    setIsBusinessModalOpen(false);
  };

  const handlePromptDeleteBusiness = (biz: BusinessItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (businesses.length <= 1) {
      toast.error("Cannot delete the only available enterprise entity.");
      return;
    }
    setBusinessToDelete(biz);
    setIsDeleteBusinessModalOpen(true);
  };

  const handleConfirmDeleteBusiness = () => {
    if (!businessToDelete) return;

    const remaining = businesses.filter((b) => b.id !== businessToDelete.id);
    dispatch(setAvailableBusinesses(remaining));

    // If active business was deleted, fallback to first available
    if (selectedBusiness?.id === businessToDelete.id) {
      const fallbackBiz = remaining[0];
      const fallbackBranch = fallbackBiz.branches[0];
      dispatch(setTenantSelection({ business: fallbackBiz, branch: fallbackBranch }));
      setFocusedBusinessId(fallbackBiz.id);
    } else if (focusedBusinessId === businessToDelete.id) {
      setFocusedBusinessId(remaining[0].id);
    }

    toast.success(`Deleted business "${businessToDelete.name}".`);
    setIsDeleteBusinessModalOpen(false);
    setBusinessToDelete(null);
  };

  // ═══════════════════════════════════════════════════════════════
  // BRANCH CRUD HANDLERS
  // ═══════════════════════════════════════════════════════════════

  const handleOpenCreateBranch = () => {
    if (!currentBusiness) {
      toast.error("Please select a business first.");
      return;
    }
    setEditingBranch(null);
    setBranchName("");
    setBranchAddress("");
    setBranchCode("");
    setBranchLanes(2);
    setBranchIsMain(currentBusiness.branches.length === 0);
    setIsBranchModalOpen(true);
  };

  const handleOpenEditBranch = (branch: BranchItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingBranch(branch);
    setBranchName(branch.name);
    setBranchAddress(branch.address || "");
    setBranchCode(branch.code);
    setBranchLanes(branch.laneCount);
    setBranchIsMain(!!branch.isMain);
    setIsBranchModalOpen(true);
  };

  const handleSaveBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBusiness) return;

    const trimmedName = branchName.trim();
    if (!trimmedName) {
      toast.error("Branch name is required.");
      return;
    }

    // Validation: Tenant-scoped duplicate check (case-insensitive)
    const duplicate = currentBusiness.branches.some(
      (b) =>
        b.name.toLowerCase() === trimmedName.toLowerCase() &&
        b.id !== editingBranch?.id
    );
    if (duplicate) {
      toast.error("A location with that name already exists in your business");
      return;
    }

    const trimmedAddress = branchAddress.trim() || null;
    const generatedCode =
      branchCode.trim().toUpperCase() ||
      `${currentBusiness.code}-${(currentBusiness.branches.length + 1).toString().padStart(2, "0")}`;

    let updatedBranches: BranchItem[];

    if (editingBranch) {
      // Edit existing branch
      const updatedBranch: BranchItem = {
        ...editingBranch,
        name: trimmedName,
        address: trimmedAddress,
        code: generatedCode,
        laneCount: Number(branchLanes) || 1,
        isMain: branchIsMain,
        updatedAt: new Date().toISOString(),
      };

      updatedBranches = currentBusiness.branches.map((b) => {
        if (b.id === editingBranch.id) return updatedBranch;
        // If this branch became main, un-main others
        if (branchIsMain && b.isMain) return { ...b, isMain: false };
        return b;
      });

      // If active branch was edited, update Redux
      if (selectedBranch?.id === editingBranch.id) {
        dispatch(setBranch(updatedBranch));
      }

      toast.success(`Updated branch: "${trimmedName}"`);
    } else {
      // Create new branch
      const newBranch: BranchItem = {
        id: `loc-${Date.now()}`,
        businessId: currentBusiness.id,
        name: trimmedName,
        address: trimmedAddress,
        code: generatedCode,
        laneCount: Number(branchLanes) || 2,
        isMain: branchIsMain,
        status: "ACTIVE",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      updatedBranches = [
        ...currentBusiness.branches.map((b) =>
          branchIsMain ? { ...b, isMain: false } : b
        ),
        newBranch,
      ];

      // Auto-set as active branch if desired
      dispatch(
        setTenantSelection({
          business: currentBusiness,
          branch: newBranch,
        })
      );

      toast.success(`Registered new branch: "${trimmedName}"!`);
    }

    // Persist to business list
    const updatedBusiness: BusinessItem = {
      ...currentBusiness,
      branches: updatedBranches,
      updatedAt: new Date().toISOString(),
    };

    const updatedBusinesses = businesses.map((b) =>
      b.id === currentBusiness.id ? updatedBusiness : b
    );

    dispatch(setAvailableBusinesses(updatedBusinesses));
    dispatch(setBusiness(updatedBusiness));

    setIsBranchModalOpen(false);
  };

  const handlePromptDeleteBranch = (branch: BranchItem, e?: React.MouseEvent) => {
    e?.stopPropagation();

    // Guard: Branches with active shifts or primary main branch
    if (branch.isMain || branch.id === "loc-doyel") {
      toast.error("Cannot delete branch with active open shift");
      return;
    }

    if (currentBusiness && currentBusiness.branches.length <= 1) {
      toast.error("At least one operational branch must remain for this business.");
      return;
    }

    setBranchToDelete(branch);
    setIsDeleteBranchModalOpen(true);
  };

  const handleConfirmDeleteBranch = () => {
    if (!branchToDelete || !currentBusiness) return;

    const remainingBranches = currentBusiness.branches.filter(
      (b) => b.id !== branchToDelete.id
    );

    const updatedBusiness: BusinessItem = {
      ...currentBusiness,
      branches: remainingBranches,
      updatedAt: new Date().toISOString(),
    };

    const updatedBusinesses = businesses.map((b) =>
      b.id === currentBusiness.id ? updatedBusiness : b
    );

    dispatch(setAvailableBusinesses(updatedBusinesses));
    dispatch(setBusiness(updatedBusiness));

    // If active branch was deleted, switch to first available branch
    if (selectedBranch?.id === branchToDelete.id) {
      const fallback = remainingBranches[0];
      dispatch(setBranch(fallback));
    }

    toast.success("Location deleted");
    setIsDeleteBranchModalOpen(false);
    setBranchToDelete(null);
  };

  // ═══════════════════════════════════════════════════════════════
  // SELECTION & NAVIGATION
  // ═══════════════════════════════════════════════════════════════

  const handlePickBusiness = (biz: BusinessItem) => {
    setFocusedBusinessId(biz.id);
    dispatch(setBusiness(biz));
    // Default to main or first branch
    const targetBranch = biz.branches.find((b) => b.isMain) || biz.branches[0];
    if (targetBranch) {
      dispatch(setBranch(targetBranch));
    }
    setStep(2);
  };

  const handleSetActiveBranch = (branch: BranchItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!currentBusiness) return;

    dispatch(
      setTenantSelection({
        business: currentBusiness,
        branch,
      })
    );

    toast.success(`Active workspace updated: ${branch.name}`, {
      description: `Routed to ${currentBusiness.name}`,
    });
  };

  const handleEnterWorkspace = () => {
    if (!currentBusiness || !selectedBranch) {
      toast.error("Please choose a branch location to enter workspace.");
      return;
    }

    toast.success(`Entering ${selectedBranch.name}`, {
      description: `Active business: ${currentBusiness.name}`,
    });

    router.push("/admin/dashboard");
  };

  // Filtered branches for Step 2
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

  return (
    <div className="min-h-full py-6 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto flex flex-col justify-center font-sans space-y-6">
      {/* ═══════════════════════════════════════════════════════════════
          A. TOP HEADER & INTERACTIVE STEPPER BAR
      ═══════════════════════════════════════════════════════════════ */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[#0052FF] text-xs font-semibold">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Multi-Tenant Enterprise Hierarchy</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#070B28]">
          Select Business &amp; Operational Branch
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-2xl mx-auto">
          Choose an enterprise entity and assigned location to route all POS registers, inventory ledgers, and reporting APIs.
        </p>

        {/* Stepper + Quick Action Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 max-w-4xl mx-auto">
          {/* Back Action / Empty Spacer */}
          <div className="hidden sm:flex w-36 justify-start">
            {step === 2 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setStep(1)}
                className="text-xs text-slate-500 hover:text-[#070B28] gap-1 cursor-pointer"
              >
                ← All Businesses
              </Button>
            )}
          </div>

          {/* Center Pill Stepper */}
          <div className="inline-flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200/80 text-xs">
            <button
              type="button"
              onClick={() => setStep(1)}
              className={cn(
                "px-3.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer border-0 outline-none",
                step === 1
                  ? "bg-white text-[#0052FF] shadow-xs"
                  : "text-slate-600 hover:text-[#070B28]"
              )}
            >
              <span>1. Select Business</span>
              {currentBusiness && step === 2 && (
                <span className="ml-1 text-[11px] text-slate-400 font-normal truncate max-w-[120px] inline-block align-bottom">
                  ({currentBusiness.name})
                </span>
              )}
            </button>

            <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />

            <button
              type="button"
              onClick={() => currentBusiness && setStep(2)}
              disabled={!currentBusiness}
              className={cn(
                "px-3.5 py-1.5 rounded-lg font-semibold transition-all border-0 outline-none",
                step === 2
                  ? "bg-white text-[#0052FF] shadow-xs cursor-pointer"
                  : "text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              <span>2. Select Branch</span>
              {selectedBranch && (
                <span className="ml-1 text-[11px] text-slate-400 font-normal truncate max-w-[120px] inline-block align-bottom">
                  ({selectedBranch.name})
                </span>
              )}
            </button>
          </div>

          {/* Right Action Button */}
          <div className="flex sm:w-36 justify-end">
            {step === 1 ? (
              <Button
                type="button"
                size="sm"
                onClick={handleOpenCreateBusiness}
                className="bg-[#0052FF] hover:bg-[#0047E0] text-white font-medium text-xs gap-1.5 shadow-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Create Business</span>
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                onClick={handleOpenCreateBranch}
                className="bg-[#0052FF] hover:bg-[#0047E0] text-white font-medium text-xs gap-1.5 shadow-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add New Branch</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          B. STEP 1: BUSINESS GRID + CRUD ACTIONS
      ═══════════════════════════════════════════════════════════════ */}
      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.div
            key="step-business"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="space-y-6 max-w-5xl mx-auto w-full"
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
                    className={cn(
                      "relative rounded-2xl border bg-white p-6 shadow-xs flex flex-col justify-between transition-all group",
                      isSelected
                        ? "border-[#0052FF] ring-2 ring-[#0052FF]/15 bg-blue-50/10 shadow-sm"
                        : "border-slate-200 hover:border-[#0052FF]/50 hover:shadow-xs"
                    )}
                  >
                    {/* Top Row: Business Logo & Action Icons */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="relative">
                        {logoSrc ? (
                          <img
                            src={logoSrc}
                            alt={biz.name}
                            className="h-12 w-12 rounded-xl object-cover border border-slate-200/90 shadow-2xs"
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-[#0052FF] border border-blue-100">
                            <Building2 className="h-6 w-6" />
                          </div>
                        )}
                        {isSelected && (
                          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#0052FF] text-white shadow-xs">
                            <Check className="h-2.5 w-2.5 stroke-[3]" />
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded text-[11px] font-semibold border",
                            biz.plan === "Enterprise"
                              ? "bg-purple-50 text-purple-700 border-purple-200"
                              : biz.plan === "Pro"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          )}
                        >
                          {biz.plan}
                        </span>

                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={(e) => handleOpenEditBusiness(biz, e)}
                          className="h-7 w-7 rounded-lg text-slate-400 hover:text-[#0052FF] hover:bg-blue-50 flex items-center justify-center transition-colors cursor-pointer"
                          title="Edit business details"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>

                        {/* Delete Button (allowed if more than 1 business) */}
                        {businesses.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => handlePromptDeleteBusiness(biz, e)}
                            className="h-7 w-7 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer"
                            title="Delete business"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Middle: Business Name & Monospace Code */}
                    <div className="mt-5 space-y-1.5">
                      <h3 className="font-bold text-base sm:text-lg text-[#070B28] leading-tight line-clamp-1">
                        {biz.name}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-semibold border border-slate-200/60">
                          {biz.code}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-500 font-sans font-medium text-xs">
                          {biz.branches.length} Operational {biz.branches.length === 1 ? "Branch" : "Branches"}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Row: Select & View Branches CTA */}
                    <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                      <Button
                        type="button"
                        onClick={() => handlePickBusiness(biz)}
                        className={cn(
                          "w-full justify-between min-h-10 text-xs font-semibold cursor-pointer transition-all",
                          isSelected
                            ? "bg-[#0052FF] hover:bg-[#0047E0] text-white shadow-xs"
                            : "bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-[#0052FF] border border-slate-200/80"
                        )}
                      >
                        <span>Select &amp; View Branches</span>
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </motion.div>
                );
              })}

              {/* + Register New Business Dashed Card */}
              <motion.div
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleOpenCreateBusiness}
                className="border-2 border-dashed border-slate-200 hover:border-[#0052FF] hover:bg-blue-50/20 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer min-h-[220px] transition-all group"
              >
                <div className="h-12 w-12 rounded-xl bg-slate-100 group-hover:bg-[#0052FF] text-slate-500 group-hover:text-white flex items-center justify-center transition-all shadow-2xs">
                  <Plus className="h-6 w-6" />
                </div>
                <h4 className="mt-4 font-bold text-sm text-[#070B28] group-hover:text-[#0052FF] transition-colors">
                  + Register New Business
                </h4>
                <p className="mt-1 text-xs text-slate-400 max-w-[200px]">
                  Add a new multi-tenant enterprise company or retail brand.
                </p>
              </motion.div>
            </div>
          </motion.div>
        ) : (
          /* ═══════════════════════════════════════════════════════════════
             C. STEP 2: OPERATIONAL BRANCHES GRID + CRUD
          ═══════════════════════════════════════════════════════════════ */
          <motion.div
            key="step-branch"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="space-y-6 max-w-5xl mx-auto w-full"
          >
            {/* Active Business Context Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="flex items-center gap-3.5">
                {currentBusiness?.profileImageUrl || currentBusiness?.logoUrl ? (
                  <img
                    src={currentBusiness.profileImageUrl || currentBusiness.logoUrl!}
                    alt={currentBusiness.name}
                    className="h-12 w-12 rounded-xl object-cover border border-slate-200"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-[#0052FF] border border-blue-100">
                    <Building2 className="h-6 w-6" />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                      Active Business Entity
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
                      {currentBusiness?.plan}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-[#070B28]">
                    {currentBusiness?.name}
                  </h2>
                  <p className="text-xs font-mono text-slate-400">
                    Code: {currentBusiness?.code} • {currentBusiness?.branches.length} Registered Locations
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => currentBusiness && handleOpenEditBusiness(currentBusiness)}
                  className="text-xs font-medium border-slate-200 text-slate-700 hover:bg-slate-50 gap-1.5"
                >
                  <Pencil className="h-3.5 w-3.5 text-slate-500" />
                  <span>Edit Business</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setStep(1)}
                  className="text-xs font-medium border-slate-200 text-[#0052FF] hover:bg-blue-50"
                >
                  Change Business
                </Button>
              </div>
            </div>

            {/* Search & Actions Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <Input
                  type="text"
                  placeholder="Search branch by name or address..."
                  value={branchSearch}
                  onChange={(e) => setBranchSearch(e.target.value)}
                  className="pl-10 min-h-11 border-slate-200 text-sm bg-white"
                />
                {branchSearch && (
                  <button
                    type="button"
                    onClick={() => setBranchSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 text-xs text-slate-500">
                <span>
                  Showing <strong>{filteredBranches.length}</strong> of{" "}
                  <strong>{currentBusiness?.branches.length || 0}</strong> branches
                </span>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleOpenCreateBranch}
                  className="bg-[#0052FF] hover:bg-[#0047E0] text-white font-medium text-xs gap-1.5 shadow-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>+ New Branch</span>
                </Button>
              </div>
            </div>

            {/* Branch Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBranches.map((branch) => {
                const isSelected = selectedBranch?.id === branch.id;

                return (
                  <motion.div
                    key={branch.id}
                    layout
                    whileHover={{ y: -3 }}
                    className={cn(
                      "relative rounded-2xl border bg-white p-6 shadow-xs flex flex-col justify-between transition-all group",
                      isSelected
                        ? "border-[#0052FF] ring-2 ring-[#0052FF]/15 bg-blue-50/20 shadow-sm"
                        : "border-slate-200 hover:border-[#0052FF]/50 hover:shadow-xs"
                    )}
                  >
                    {/* Top Row: Store Icon & Badges */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#0052FF] border border-blue-100">
                        <Store className="h-5 w-5" />
                      </div>

                      <div className="flex items-center gap-1.5">
                        {isSelected ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Active</span>
                          </span>
                        ) : branch.status === "ACTIVE" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-50 text-slate-600 border border-slate-200">
                            Ready
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                            Draft
                          </span>
                        )}

                        {/* Edit Branch Button */}
                        <button
                          type="button"
                          onClick={(e) => handleOpenEditBranch(branch, e)}
                          className="h-7 w-7 rounded-lg text-slate-400 hover:text-[#0052FF] hover:bg-blue-50 flex items-center justify-center transition-colors cursor-pointer"
                          title="Edit branch"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>

                        {/* Delete Branch Button */}
                        {!branch.isMain && (
                          <button
                            type="button"
                            onClick={(e) => handlePromptDeleteBranch(branch, e)}
                            className="h-7 w-7 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer"
                            title="Delete branch"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Middle: Name, Address, Code */}
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-bold text-base text-[#070B28] leading-tight">
                          {branch.name}
                        </h4>
                        {branch.isMain && (
                          <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] px-1.5 py-0.2 rounded font-semibold">
                            HQ Main
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-500 flex items-start gap-1 line-clamp-2 min-h-[32px]">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400 mt-0.5" />
                        <span>{branch.address || "No physical street address recorded"}</span>
                      </p>

                      <div className="flex items-center gap-2 pt-1 font-mono text-[11px] text-slate-400">
                        <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200/50">
                          {branch.code}
                        </span>
                        <span>•</span>
                        <span>{branch.laneCount} POS Registers</span>
                      </div>
                    </div>

                    {/* Bottom Row: Set as Active Button */}
                    <div className="mt-5 pt-3 border-t border-slate-100">
                      {isSelected ? (
                        <div className="w-full min-h-10 rounded-lg bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-xs font-semibold flex items-center justify-center gap-1.5">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Active Workspace ✓</span>
                        </div>
                      ) : (
                        <Button
                          type="button"
                          onClick={(e) => handleSetActiveBranch(branch, e)}
                          className="w-full min-h-10 bg-[#0052FF] hover:bg-[#0047E0] text-white text-xs font-semibold shadow-xs cursor-pointer"
                        >
                          Set as Active Branch
                        </Button>
                      )}
                    </div>
                  </motion.div>
                );
              })}

              {/* + Create New Branch Dashed Card */}
              <motion.div
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleOpenCreateBranch}
                className="border-2 border-dashed border-slate-200 hover:border-[#0052FF] hover:bg-blue-50/20 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer min-h-[220px] transition-all group"
              >
                <div className="h-12 w-12 rounded-xl bg-slate-100 group-hover:bg-[#0052FF] text-slate-500 group-hover:text-white flex items-center justify-center transition-all shadow-2xs">
                  <Plus className="h-6 w-6" />
                </div>
                <h4 className="mt-4 font-bold text-sm text-[#070B28] group-hover:text-[#0052FF] transition-colors">
                  + Add New Branch
                </h4>
                <p className="mt-1 text-xs text-slate-400 max-w-[200px]">
                  Register a physical store lane, retail counter, or regional hub.
                </p>
              </motion.div>
            </div>

            {/* Bottom Actions Confirmation */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
                className="min-h-11 px-5 border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-50 cursor-pointer w-full sm:w-auto"
              >
                ← Back to Businesses
              </Button>

              <Button
                type="button"
                onClick={handleEnterWorkspace}
                disabled={!selectedBranch}
                className="min-h-11 px-7 bg-[#0052FF] hover:bg-[#0047E0] text-white text-xs font-medium shadow-xs cursor-pointer gap-2 disabled:bg-slate-200 disabled:text-slate-500 w-full sm:w-auto"
              >
                <span>Enter {selectedBranch?.name || "Workspace"}</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════════
          MODAL 1: CREATE / EDIT BUSINESS MODAL
      ═══════════════════════════════════════════════════════════════ */}
      <Dialog open={isBusinessModalOpen} onOpenChange={setIsBusinessModalOpen}>
        <DialogContent className="max-w-lg p-6 font-sans">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#070B28] flex items-center gap-2">
              <Building2 className="h-5 w-5 text-[#0052FF]" />
              <span>{editingBusiness ? `Edit Business: ${editingBusiness.name}` : "Create New Business"}</span>
            </DialogTitle>
            <p className="text-xs text-slate-500">
              {editingBusiness
                ? "Update enterprise organization metadata and logo."
                : "Register a top-level enterprise entity to group operational branches."}
            </p>
          </DialogHeader>

          <form onSubmit={handleSaveBusiness} className="space-y-4 pt-2">
            {/* Field: Business Name (Required, max 120) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#070B28] flex items-center justify-between">
                <span>
                  Business / Company Name <span className="text-rose-500">*</span>
                </span>
                <span className="text-[11px] font-normal text-slate-400">
                  {businessName.length}/120
                </span>
              </label>
              <Input
                type="text"
                required
                maxLength={120}
                placeholder="e.g. SunTech Retail Ltd."
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="min-h-11 border-slate-200 text-sm bg-white"
              />
            </div>

            {/* Field: Short Code (Prefix for invoices) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#070B28] flex items-center justify-between">
                <span>Enterprise Short Code</span>
                <span className="text-[11px] font-normal text-slate-400">
                  Auto-generated if empty
                </span>
              </label>
              <Input
                type="text"
                maxLength={10}
                placeholder="e.g. ST-RETAIL"
                value={businessCode}
                onChange={(e) => setBusinessCode(e.target.value.toUpperCase())}
                className="min-h-11 border-slate-200 text-sm font-mono uppercase bg-white"
              />
            </div>

            {/* Field: Subscription Plan */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#070B28]">
                Subscription Plan Tier
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["Enterprise", "Pro", "Growth"] as const).map((plan) => (
                  <button
                    key={plan}
                    type="button"
                    onClick={() => setBusinessPlan(plan)}
                    className={cn(
                      "py-2 px-3 text-xs font-medium rounded-lg border text-center transition-all cursor-pointer",
                      businessPlan === plan
                        ? "border-[#0052FF] bg-blue-50/60 text-[#0052FF] font-semibold shadow-2xs"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    {plan}
                  </button>
                ))}
              </div>
            </div>

            {/* Field: Business Logo (profileImageUrl dropzone with live preview) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#070B28] flex items-center justify-between">
                <span>Business Logo (Optional)</span>
                <span className="text-[11px] font-normal text-slate-400">
                  PNG, JPEG, WebP up to 5MB
                </span>
              </label>

              {businessProfileImage ? (
                <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/80">
                  <img
                    src={businessProfileImage}
                    alt="Logo Preview"
                    className="h-12 w-12 rounded-lg object-cover border border-slate-200 bg-white shadow-2xs"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[#070B28] truncate">
                      {businessImageFileName || "Custom Logo Selected"}
                    </p>
                    <p className="text-[11px] text-emerald-600 font-medium">Ready to upload</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveLogo}
                    className="h-8 px-2.5 text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 hover:border-[#0052FF] rounded-xl p-4 text-center cursor-pointer transition-colors bg-white hover:bg-blue-50/20"
                >
                  <Upload className="mx-auto h-6 w-6 text-slate-400 mb-1" />
                  <p className="text-xs font-medium text-slate-700">
                    Click or drag &amp; drop to upload company logo
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Recommended resolution: 256x256 px
                  </p>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleLogoFileChange}
              />
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsBusinessModalOpen(false)}
                className="min-h-10 px-4 border-slate-200 text-slate-600 hover:bg-slate-50 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="min-h-10 px-6 bg-[#0052FF] hover:bg-[#0047E0] text-white text-xs font-medium shadow-xs"
              >
                {editingBusiness ? "Save Changes" : "Create Business"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════
          MODAL 2: CREATE / EDIT OPERATIONAL BRANCH MODAL
      ═══════════════════════════════════════════════════════════════ */}
      <Dialog open={isBranchModalOpen} onOpenChange={setIsBranchModalOpen}>
        <DialogContent className="max-w-lg p-6 font-sans">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#070B28] flex items-center gap-2">
              <Store className="h-5 w-5 text-[#0052FF]" />
              <span>{editingBranch ? `Edit Branch: ${editingBranch.name}` : "Create Operational Branch"}</span>
            </DialogTitle>
            <p className="text-xs text-slate-500">
              For enterprise: <strong>{currentBusiness?.name}</strong>
            </p>
          </DialogHeader>

          <form onSubmit={handleSaveBranch} className="space-y-4 pt-2">
            {/* Field: Branch Name (Required, max 120) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#070B28] flex items-center justify-between">
                <span>
                  Branch / Store Location Name <span className="text-rose-500">*</span>
                </span>
                <span className="text-[11px] font-normal text-slate-400">
                  {branchName.length}/120
                </span>
              </label>
              <Input
                type="text"
                required
                maxLength={120}
                placeholder="e.g. Uttara Doyel Branch (Lane 01)"
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                className="min-h-11 border-slate-200 text-sm bg-white"
              />
            </div>

            {/* Field: Address (Optional, max 240) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#070B28] flex items-center justify-between">
                <span>Physical Street Address (Optional)</span>
                <span className="text-[11px] font-normal text-slate-400">
                  {branchAddress.length}/240
                </span>
              </label>
              <Input
                type="text"
                maxLength={240}
                placeholder="e.g. House 12, Road 4, Sector 3, Uttara, Dhaka"
                value={branchAddress}
                onChange={(e) => setBranchAddress(e.target.value)}
                className="min-h-11 border-slate-200 text-sm bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Field: Code Prefix */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#070B28]">
                  Branch Code
                </label>
                <Input
                  type="text"
                  maxLength={12}
                  placeholder="e.g. DOYEL-01"
                  value={branchCode}
                  onChange={(e) => setBranchCode(e.target.value.toUpperCase())}
                  className="min-h-11 border-slate-200 text-sm font-mono uppercase bg-white"
                />
              </div>

              {/* Field: Lane Count */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#070B28]">
                  POS Register Lanes
                </label>
                <Input
                  type="number"
                  min={1}
                  max={50}
                  value={branchLanes}
                  onChange={(e) => setBranchLanes(Math.max(1, Number(e.target.value)))}
                  className="min-h-11 border-slate-200 text-sm font-mono bg-white"
                />
              </div>
            </div>

            {/* Primary HQ Checkbox */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <label
                  htmlFor="is-main-checkbox"
                  className="text-xs font-semibold text-[#070B28] cursor-pointer"
                >
                  Set as Primary Enterprise HQ Branch
                </label>
                <p className="text-[11px] text-slate-500">
                  Default location loaded during admin terminal logins.
                </p>
              </div>
              <input
                id="is-main-checkbox"
                type="checkbox"
                checked={branchIsMain}
                onChange={(e) => setBranchIsMain(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-[#0052FF] focus:ring-[#0052FF] cursor-pointer"
              />
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsBranchModalOpen(false)}
                className="min-h-10 px-4 border-slate-200 text-slate-600 hover:bg-slate-50 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="min-h-10 px-6 bg-[#0052FF] hover:bg-[#0047E0] text-white text-xs font-medium shadow-xs"
              >
                {editingBranch ? "Save Changes" : "Create Branch"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════
          MODAL 3: DELETE BRANCH CONFIRMATION MODAL
      ═══════════════════════════════════════════════════════════════ */}
      <Dialog open={isDeleteBranchModalOpen} onOpenChange={setIsDeleteBranchModalOpen}>
        <DialogContent className="max-w-md p-6 font-sans">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-rose-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-rose-500" />
              <span>Delete Branch Location?</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2 text-sm text-slate-600">
            <p>
              Are you sure you want to delete{" "}
              <strong className="text-[#070B28]">{branchToDelete?.name}</strong>?
            </p>
            <div className="rounded-lg bg-amber-50 border border-amber-200/80 p-3 text-xs text-amber-800 flex items-start gap-2">
              <Info className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
              <span>
                <strong>Note:</strong> Branches with an active open register shift cannot be deleted. Any un-synced POS transactions must be audited before removal.
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteBranchModalOpen(false)}
              className="border-slate-200 text-slate-600"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleConfirmDeleteBranch}
              className="bg-rose-600 hover:bg-rose-700 text-white font-medium gap-1.5"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete Location</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════
          MODAL 4: DELETE BUSINESS CONFIRMATION MODAL
      ═══════════════════════════════════════════════════════════════ */}
      <Dialog open={isDeleteBusinessModalOpen} onOpenChange={setIsDeleteBusinessModalOpen}>
        <DialogContent className="max-w-md p-6 font-sans">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-rose-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-rose-500" />
              <span>Delete Enterprise Business?</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2 text-sm text-slate-600">
            <p>
              Are you sure you want to delete{" "}
              <strong className="text-[#070B28]">{businessToDelete?.name}</strong>?
            </p>
            <p className="text-xs text-slate-500">
              All {businessToDelete?.branches.length} associated operational branches, catalog mappings, and register assignments will be unlinked.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteBusinessModalOpen(false)}
              className="border-slate-200 text-slate-600"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleConfirmDeleteBusiness}
              className="bg-rose-600 hover:bg-rose-700 text-white font-medium gap-1.5"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete Business</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
