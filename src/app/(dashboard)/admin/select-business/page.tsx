"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ChevronRight,
  GitBranch,
  Layers,
  MapPin,
  ShieldCheck,
  Sparkles,
  Store,
} from "lucide-react";
import { toast } from "sonner";
import { BrandLogo } from "@/components/common/brand-logo";
import { Button } from "@/components/ui/button";
import { setTenantSelection } from "@/redux/actions/tenantActions";
import type { BranchItem, BusinessItem, RootState } from "@/redux/types";
import { cn } from "@/lib/utils";

export default function SelectBusinessPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const tenant = useSelector((state: RootState) => state.tenant);

  const availableBusinesses = tenant?.availableBusinesses || [];

  // Local state for current step: 1 = Choose Business, 2 = Choose Branch
  const [step, setStep] = useState<1 | 2>(1);

  // Picked business (defaults to currently selected in Redux or first available)
  const [pickedBusiness, setPickedBusiness] = useState<BusinessItem | null>(
    () => tenant?.selectedBusiness || availableBusinesses[0] || null,
  );

  // Picked branch
  const [pickedBranch, setPickedBranch] = useState<BranchItem | null>(() => {
    const biz = tenant?.selectedBusiness || availableBusinesses[0];
    return tenant?.selectedBranch || biz?.branches[0] || null;
  });

  const handleSelectBusiness = (biz: BusinessItem) => {
    setPickedBusiness(biz);
    // Auto-select first branch of this business
    const defaultBranch = biz.branches.find((b) => b.isMain) || biz.branches[0];
    setPickedBranch(defaultBranch);
    setStep(2);
  };

  const handleConfirmAndEnter = () => {
    if (!pickedBusiness || !pickedBranch) {
      toast.error("Please select both a business and an operational branch.");
      return;
    }

    dispatch(
      setTenantSelection({
        business: pickedBusiness,
        branch: pickedBranch,
      }),
    );

    toast.success(`Access granted: ${pickedBranch.name}`, {
      description: `Active business: ${pickedBusiness.name}`,
    });

    router.push("/admin/dashboard");
  };

  return (
    <div className="min-h-full py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto flex flex-col justify-center font-sans">
      {/* ═══ Header Section ═══ */}
      <div className="text-center space-y-3 mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[#0052FF] text-xs font-medium">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Multi-Tenant Enterprise Hierarchy</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#070B28]">
          Select Business & Operational Branch
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
          Choose an enterprise entity and assigned location to route all POS registers, inventory ledgers, and reporting APIs.
        </p>

        {/* ═══ Step Breadcrumb Pill ═══ */}
        <div className="inline-flex items-center gap-2 p-1 rounded-xl bg-slate-100 border border-slate-200/80 text-xs mt-3">
          <button
            type="button"
            onClick={() => setStep(1)}
            className={cn(
              "px-3.5 py-1.5 rounded-lg font-medium transition-all cursor-pointer border-0 outline-none",
              step === 1
                ? "bg-white text-[#0052FF] shadow-xs"
                : "text-slate-600 hover:text-[#070B28]",
            )}
          >
            <span>1. Select Business</span>
            {pickedBusiness && step === 2 && (
              <span className="ml-1 text-[11px] text-slate-400 truncate max-w-[120px] inline-block align-bottom">
                ({pickedBusiness.name})
              </span>
            )}
          </button>

          <ChevronRight className="h-3.5 w-3.5 text-slate-400" />

          <button
            type="button"
            onClick={() => pickedBusiness && setStep(2)}
            disabled={!pickedBusiness}
            className={cn(
              "px-3.5 py-1.5 rounded-lg font-medium transition-all border-0 outline-none",
              step === 2
                ? "bg-white text-[#0052FF] shadow-xs cursor-pointer"
                : "text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed",
            )}
          >
            <span>2. Select Branch</span>
            {pickedBranch && (
              <span className="ml-1 text-[11px] text-slate-400 truncate max-w-[120px] inline-block align-bottom">
                ({pickedBranch.name})
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ═══ Animated Step Container ═══ */}
      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.div
            key="step-business"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {availableBusinesses.map((biz) => {
                const isSelected = pickedBusiness?.id === biz.id;
                return (
                  <motion.div
                    key={biz.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelectBusiness(biz)}
                    className={cn(
                      "relative rounded-xl border p-5 cursor-pointer transition-all flex flex-col justify-between min-h-[220px]",
                      isSelected
                        ? "border-[#0052FF] bg-blue-50/20 ring-2 ring-[#0052FF]/20 shadow-md"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs",
                    )}
                  >
                    {/* Top Row: Plan & Active Badge */}
                    <div className="flex items-start justify-between">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-[#0052FF]">
                        <Building2 className="h-5 w-5" />
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded text-[11px] font-medium border",
                            biz.plan === "Enterprise"
                              ? "bg-purple-50 text-purple-700 border-purple-200"
                              : biz.plan === "Pro"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200",
                          )}
                        >
                          {biz.plan}
                        </span>

                        {isSelected && (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0052FF] text-white">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Middle: Business Name & Code */}
                    <div className="mt-4 space-y-1">
                      <h3 className="font-bold text-base text-[#070B28]">
                        {biz.name}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                          {biz.code}
                        </span>
                        <span>•</span>
                        <span>{biz.branches.length} Operational {biz.branches.length === 1 ? "Branch" : "Branches"}</span>
                      </div>
                    </div>

                    {/* Bottom CTA */}
                    <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-[#0052FF]">
                      <span>Select & View Branches</span>
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="step-branch"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Active Business Bar */}
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-[#0052FF]">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-wider font-medium text-slate-400">
                      Selected Business
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-blue-50 text-blue-700">
                      {pickedBusiness?.plan}
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-[#070B28]">
                    {pickedBusiness?.name}
                  </h2>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setStep(1)}
                className="text-xs font-medium border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer h-8"
              >
                Change Business
              </Button>
            </div>

            {/* Branch Cards */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  Select Branch Location ({pickedBusiness?.branches.length} Available)
                </span>
                <span className="text-xs text-slate-400">
                  Click a branch to select
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pickedBusiness?.branches.map((branch) => {
                  const isSelected = pickedBranch?.id === branch.id;
                  return (
                    <motion.div
                      key={branch.id}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => setPickedBranch(branch)}
                      className={cn(
                        "relative rounded-xl border p-5 cursor-pointer transition-all flex flex-col justify-between space-y-3",
                        isSelected
                          ? "border-[#0052FF] bg-blue-50/25 ring-2 ring-[#0052FF]/20 shadow-md"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs",
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg mt-0.5",
                              isSelected
                                ? "bg-[#0052FF] text-white"
                                : "bg-slate-100 text-slate-600",
                            )}
                          >
                            <Store className="h-4 w-4" />
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-sm text-[#070B28]">
                                {branch.name}
                              </h4>
                              {branch.isMain && (
                                <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] px-1.5 py-0.2 rounded font-medium">
                                  HQ Main
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                              <MapPin className="h-3 w-3 shrink-0 text-slate-400" />
                              <span className="truncate max-w-[260px]">{branch.address}</span>
                            </p>
                          </div>
                        </div>

                        {isSelected ? (
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#0052FF] text-white">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          </span>
                        ) : (
                          <span className="h-5 w-5 shrink-0 rounded-full border border-slate-300" />
                        )}
                      </div>

                      {/* Footer Info: Lanes & Active Indicator */}
                      <div className="pt-2 border-t border-slate-100/80 flex items-center justify-between text-xs">
                        <span className="font-mono text-slate-500 text-[11px]">
                          Code: {branch.code} · {branch.laneCount} POS Registers
                        </span>

                        <span className="inline-flex items-center gap-1.5 text-emerald-600 font-medium text-[11px]">
                          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span>Active Status</span>
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Actions Confirmation */}
            <div className="pt-4 flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
                className="min-h-11 h-11 px-5 border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-50 cursor-pointer"
              >
                ← Back to Businesses
              </Button>

              <Button
                type="button"
                onClick={handleConfirmAndEnter}
                disabled={!pickedBranch}
                className="min-h-11 h-11 px-6 bg-[#0052FF] hover:bg-[#0047E0] text-white text-xs font-medium shadow-xs cursor-pointer gap-2 disabled:bg-slate-200 disabled:text-slate-500"
              >
                <span>Enter {pickedBranch?.name || "Workspace"}</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
