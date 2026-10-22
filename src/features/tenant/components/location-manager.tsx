"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Store,
  MapPin,
  Users,
  Search,
  Plus,
  Building2,
  FileText,
  Trash2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  X,
  History,
  ShieldCheck,
  Check,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { setBranch } from "@/redux/actions/tenantActions";
import type { RootState, BranchItem } from "@/redux/types";
import { DUMMY_LOCATIONS, DUMMY_LOCATION_AUDIT_LOGS } from "../data/dummy-locations";
import type { BranchLocation, BranchFormData } from "../types";

const CITIES = [
  "Dhaka / Banani",
  "Dhaka / Uttara",
  "Dhaka / Dhanmondi",
  "Dhaka / Mirpur",
  "Chittagong",
  "Sylhet",
];

const INITIAL_FORM: BranchFormData = {
  name: "",
  code: "",
  businessId: "",
  phone: "",
  email: "",
  address: "",
  city: "Dhaka / Banani",
  initialFloat: 10000,
  allowOffline: true,
};

export function LocationManager() {
  const dispatch = useDispatch();
  const { selectedBusiness, selectedBranch } = useSelector(
    (state: RootState) => state.tenant
  );

  // Local state initialized with rich dummy data (as per instruction: dont integrate APIs, use dummy data)
  const [locations, setLocations] = useState<BranchLocation[]>(DUMMY_LOCATIONS);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "DRAFT">("ALL");
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form mode: either "CREATE" or "EDIT"
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(
    selectedBranch?.id || DUMMY_LOCATIONS[0].id
  );
  const [formMode, setFormMode] = useState<"CREATE" | "EDIT">("EDIT");

  // Active form data
  const selectedLocation = useMemo(
    () => locations.find((l) => l.id === selectedLocationId) || null,
    [locations, selectedLocationId]
  );

  const [formData, setFormData] = useState<BranchFormData>(() => {
    if (selectedLocation) {
      return {
        name: selectedLocation.name,
        code: selectedLocation.code,
        businessId: selectedLocation.businessId,
        phone: selectedLocation.phone,
        email: selectedLocation.email || "",
        address: selectedLocation.address,
        city: selectedLocation.city,
        initialFloat: selectedLocation.initialFloat,
        allowOffline: selectedLocation.allowOffline,
      };
    }
    return INITIAL_FORM;
  });

  // Filtered branches for directory
  const filteredLocations = useMemo(() => {
    return locations.filter((loc) => {
      const matchesSearch =
        loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loc.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loc.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loc.managerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loc.city.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "ALL" || loc.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [locations, searchQuery, statusFilter]);

  // Handle selecting a branch from left column to view/edit
  const handleSelectLocation = (loc: BranchLocation) => {
    setSelectedLocationId(loc.id);
    setFormMode("EDIT");
    setFormData({
      name: loc.name,
      code: loc.code,
      businessId: loc.businessId,
      phone: loc.phone,
      email: loc.email || "",
      address: loc.address,
      city: loc.city,
      initialFloat: loc.initialFloat,
      allowOffline: loc.allowOffline,
    });

    // Also update active branch in Redux
    const branchItem: BranchItem = {
      id: loc.id,
      businessId: loc.businessId,
      name: loc.name,
      code: loc.code,
      address: `${loc.address}, ${loc.city}`,
      laneCount: loc.laneCount,
      isMain: loc.isMain,
      status: loc.status === "DRAFT" ? "INACTIVE" : loc.status,
    };
    dispatch(setBranch(branchItem));
  };

  // Switch to Create Mode
  const handleSwitchToCreate = () => {
    setSelectedLocationId(null);
    setFormMode("CREATE");
    setFormData({
      ...INITIAL_FORM,
      businessId: selectedBusiness?.id || "biz-suntech-elec",
    });
  };

  // Form submission (Create or Update)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      toast.error("Branch Name is required.");
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      if (formMode === "CREATE") {
        // Validation: Duplicate name check
        const exists = locations.some(
          (l) => l.name.toLowerCase() === trimmedName.toLowerCase()
        );
        if (exists) {
          toast.error("A location with that name already exists in your business");
          setIsSubmitting(false);
          return;
        }

        const generatedCode =
          formData.code.trim().toUpperCase() ||
          trimmedName.replace(/[^A-Za-z0-9]/g, "").slice(0, 6).toUpperCase() +
            "-0" +
            (locations.length + 1);

        const newBranch: BranchLocation = {
          id: `loc-${Date.now()}`,
          businessId: selectedBusiness?.id || "biz-suntech-elec",
          name: trimmedName,
          code: generatedCode,
          address: formData.address.trim() || "Commercial Zone, Dhaka",
          city: formData.city,
          phone: formData.phone.trim() || "+880 1700-000000",
          email: formData.email.trim() || undefined,
          managerName: "Assigned Lead",
          staffCount: 1,
          laneCount: 2,
          initialFloat: Number(formData.initialFloat) || 10000,
          allowOffline: formData.allowOffline,
          status: "ACTIVE",
          isMain: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        setLocations((prev) => [newBranch, ...prev]);
        setSelectedLocationId(newBranch.id);
        setFormMode("EDIT");

        // Sync with Redux tenant state immediately
        const branchItem: BranchItem = {
          id: newBranch.id,
          businessId: newBranch.businessId,
          name: newBranch.name,
          code: newBranch.code,
          address: `${newBranch.address}, ${newBranch.city}`,
          laneCount: newBranch.laneCount,
          isMain: false,
          status: "ACTIVE",
        };
        dispatch(setBranch(branchItem));

        toast.success("Branch successfully registered!");
      } else {
        // Edit mode
        if (!selectedLocationId) return;

        setLocations((prev) =>
          prev.map((loc) => {
            if (loc.id === selectedLocationId) {
              return {
                ...loc,
                name: trimmedName,
                code: formData.code.trim().toUpperCase() || loc.code,
                address: formData.address.trim() || loc.address,
                city: formData.city,
                phone: formData.phone.trim() || loc.phone,
                email: formData.email.trim() || undefined,
                initialFloat: Number(formData.initialFloat) || loc.initialFloat,
                allowOffline: formData.allowOffline,
                updatedAt: new Date().toISOString(),
              };
            }
            return loc;
          })
        );

        // Update active branch in Redux if it's the currently active branch
        if (selectedBranch?.id === selectedLocationId) {
          const updatedItem: BranchItem = {
            ...selectedBranch,
            name: trimmedName,
            code: formData.code.trim().toUpperCase() || selectedBranch.code,
            address: `${formData.address.trim()}, ${formData.city}`,
          };
          dispatch(setBranch(updatedItem));
        }

        toast.success("Branch details updated successfully!");
      }

      setIsSubmitting(false);
    }, 400);
  };

  // Delete Location Handler
  const handleDeleteLocation = (loc: BranchLocation, e: React.MouseEvent) => {
    e.stopPropagation();

    // Validation rule: Graceful 409 Conflict toast if active open shift or main branch
    if (loc.isMain || loc.id === "loc-doyel") {
      toast.error("Cannot delete branch with active open shift");
      return;
    }

    setLocations((prev) => prev.filter((item) => item.id !== loc.id));

    if (selectedLocationId === loc.id) {
      handleSwitchToCreate();
    }

    toast.success(`Removed "${loc.name}" from operational directory.`);
  };

  const activeBusinessName = selectedBusiness?.name || "SunTech Electronics Ltd";

  return (
    <div className="space-y-6">
      {/* ── SECTION A: Breadcrumbs & Page Header ── */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          <span>Admin Controls</span>
          <span>/</span>
          <span>Settings</span>
          <span>/</span>
          <span className="text-[#0052FF]">Locations &amp; Branches</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#070B28]">
              Manage Locations
            </h1>
            <p className="mt-0.5 text-sm text-slate-500">
              Configure physical storefronts, regional distribution hubs, and POS register lane assignments.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            {/* Active Business Pill Indicator */}
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-[#070B28] shadow-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="truncate max-w-[180px] sm:max-w-none">
                {activeBusinessName}
              </span>
            </div>

            {/* View Audit Log Button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAuditModalOpen(true)}
              className="gap-1.5 border-slate-200 text-[#070B28] hover:bg-slate-50 font-medium"
            >
              <History className="h-4 w-4 text-slate-500" />
              <span>View Audit Log</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ── SECTION B: Two-Column Split Workbench (Grid: 12 Columns) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ── LEFT COLUMN: Branch Directory & Search (4 of 12 Columns / ~35% Width) ── */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-4">
          {/* Search Input Bar + Add Trigger */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <Input
                type="text"
                placeholder="Search branches, codes, cities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 min-h-11 border-slate-200 text-sm bg-white placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Status Filter Badges + Add Button */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs">
                {(["ALL", "ACTIVE", "DRAFT"] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-md font-medium text-xs transition-colors cursor-pointer ${
                      statusFilter === st
                        ? "bg-[#070B28] text-white"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {st === "ALL" ? `All (${locations.length})` : st}
                  </button>
                ))}
              </div>

              <Button
                type="button"
                size="sm"
                variant={formMode === "CREATE" ? "default" : "outline"}
                onClick={handleSwitchToCreate}
                className="gap-1 text-xs shrink-0"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New Branch</span>
              </Button>
            </div>
          </div>

          {/* Vertical Branch Cards List */}
          <div className="max-h-[calc(100vh-280px)] overflow-y-auto space-y-3 pr-1">
            <AnimatePresence mode="popLayout">
              {filteredLocations.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center">
                  <Store className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                  <p className="text-sm font-medium text-slate-600">No branches match your search</p>
                  <p className="text-xs text-slate-400 mt-1">Try another keyword or register a new branch.</p>
                </div>
              ) : (
                filteredLocations.map((branch) => {
                  const isSelected = selectedLocationId === branch.id && formMode === "EDIT";
                  const isCurrentActiveTenantBranch = selectedBranch?.id === branch.id;

                  return (
                    <motion.div
                      key={branch.id}
                      layout
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      whileHover={{ y: -2 }}
                      onClick={() => handleSelectLocation(branch)}
                      className={`relative rounded-xl p-4 cursor-pointer transition-all border ${
                        isSelected
                          ? "border-[#0052FF] ring-2 ring-[#0052FF]/15 bg-blue-50/25 shadow-xs"
                          : "border-slate-200 bg-white hover:border-[#0052FF]/60 shadow-xs"
                      }`}
                    >
                      {/* Top Row: Storefront Icon inside circle + Branch Name + Status Badge */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="h-9 w-9 rounded-full bg-blue-50 text-[#0052FF] flex items-center justify-center shrink-0 border border-blue-100/80 mt-0.5">
                            <Store className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h3 className="text-sm font-semibold text-[#070B28] truncate">
                                {branch.name}
                              </h3>
                              {branch.isMain && (
                                <span className="text-[10px] font-mono font-medium text-[#0052FF] bg-blue-50 border border-blue-200 px-1.5 py-0.2 rounded">
                                  HQ Main
                                </span>
                              )}
                            </div>
                            <span className="font-mono text-[11px] text-slate-400">
                              {branch.code}
                            </span>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="shrink-0 flex items-center gap-1.5">
                          {branch.status === "ACTIVE" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200/80">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                              Draft
                            </span>
                          )}

                          {/* Quick Delete action (blocked if main branch) */}
                          {!branch.isMain && (
                            <button
                              type="button"
                              onClick={(e) => handleDeleteLocation(branch, e)}
                              className="text-slate-300 hover:text-rose-500 p-1 transition-colors"
                              title="Delete branch"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Middle Row: Manager name, staff count badge, manager avatar thumbnail */}
                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="h-5 w-5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 shrink-0">
                            {branch.managerName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)}
                          </div>
                          <span className="truncate text-slate-700 font-medium">
                            {branch.managerName}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 font-mono text-[11px]">
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200/60">
                            Staff: {branch.staffCount}
                          </span>
                          <span className="text-slate-400">
                            {branch.laneCount} Lanes
                          </span>
                        </div>
                      </div>

                      {/* Bottom Row: Map pin icon with street address / city */}
                      <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                        <div className="flex items-center gap-1.5 truncate pr-2">
                          <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                          <span className="truncate">{branch.address}, {branch.city}</span>
                        </div>

                        {isCurrentActiveTenantBranch && (
                          <span className="text-[10px] font-semibold text-[#0052FF] bg-blue-50 px-1.5 py-0.5 rounded shrink-0">
                            Active Node
                          </span>
                        )}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── RIGHT COLUMN: Branch Creation & Setup Form (8 of 12 Columns / ~65% Width) ── */}
        <div className="lg:col-span-7 xl:col-span-8">
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-8"
          >
            {/* Card Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-5 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-bold text-[#070B28]">
                  {formMode === "CREATE"
                    ? "Create New Operational Branch"
                    : `Edit Operational Branch: ${formData.name || selectedLocation?.name}`}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {formMode === "CREATE"
                    ? `Register a new branch, warehouse, or operational retail location for ${activeBusinessName}.`
                    : `Update address details, offline policies, and cash floats for this operational branch.`}
                </p>
              </div>

              {formMode === "EDIT" && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSwitchToCreate}
                  className="text-xs gap-1 border-slate-200 text-[#0052FF] hover:bg-blue-50 shrink-0"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Create New Branch Instead</span>
                </Button>
              )}
            </div>

            {/* ── Form Section 1: Branch Information ── */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Branch Information
                </span>
                <div className="h-px flex-1 bg-slate-100" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                {/* Branch Name */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-semibold text-[#070B28] flex items-center justify-between">
                    <span>
                      Branch Name <span className="text-rose-500">* Required</span>
                    </span>
                    <span className="text-[11px] font-normal text-slate-400">
                      Public store &amp; receipt identifier
                    </span>
                  </label>
                  <Input
                    type="text"
                    required
                    placeholder="e.g., Banani Hub (Lane 02)"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="min-h-11 border-slate-200 text-sm bg-white"
                  />
                </div>

                {/* Short Code / Prefix */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#070B28] flex items-center justify-between">
                    <span>Short Code / Prefix</span>
                    <span className="text-[11px] font-normal text-slate-400">
                      Auto-generated if empty
                    </span>
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g., BANANI-02"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value.toUpperCase() })
                    }
                    className="min-h-11 border-slate-200 text-sm font-mono uppercase bg-white"
                  />
                  <p className="text-[11px] text-slate-400">
                    Helps generate invoice numbers (e.g. INV-BANANI-02-1004)
                  </p>
                </div>

                {/* Associated Business */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#070B28] flex items-center justify-between">
                    <span>Associated Business</span>
                    <span className="text-[11px] font-normal text-emerald-600 flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3" /> Locked
                    </span>
                  </label>
                  <div className="min-h-11 flex items-center justify-between px-3.5 rounded-md border border-slate-200 bg-slate-50 text-sm text-[#070B28] font-medium">
                    <span className="truncate">{activeBusinessName}</span>
                    <Badge variant="outline" className="text-[10px] font-mono bg-white">
                      {selectedBusiness?.code || "ST-ELEC"}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Bound to current active multi-tenant enterprise ledger
                  </p>
                </div>
              </div>
            </div>

            {/* ── Form Section 2: Contact & Address ── */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Contact &amp; Address
                </span>
                <div className="h-px flex-1 bg-slate-100" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                {/* Phone Number */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#070B28]">
                    Phone Number
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g., +880 1XXX-XXXXXX"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="min-h-11 border-slate-200 text-sm font-mono bg-white"
                  />
                </div>

                {/* Email Address */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#070B28]">
                    Email Address (Optional)
                  </label>
                  <Input
                    type="email"
                    placeholder="store.banani@suntechpos.bd"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="min-h-11 border-slate-200 text-sm bg-white"
                  />
                </div>

                {/* Street Address */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-semibold text-[#070B28]">
                    Street Address
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g., House 42, Road 11, Block C, Banani"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="min-h-11 border-slate-200 text-sm bg-white"
                  />
                </div>

                {/* City / Area Dropdown */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-semibold text-[#070B28]">
                    City / Area
                  </label>
                  <select
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full min-h-11 h-11 rounded-md border border-slate-200 bg-white px-3.5 py-2 text-sm text-[#070B28] shadow-xs focus-visible:outline-none focus-visible:border-[#0052FF] focus-visible:ring-2 focus-visible:ring-[#0052FF]/20"
                  >
                    {CITIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* ── Form Section 3: Operations & Cash Management ── */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Operations &amp; Cash Management
                </span>
                <div className="h-px flex-1 bg-slate-100" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                {/* Initial Cash Float */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#070B28] flex items-center justify-between">
                    <span>Initial Cash Float</span>
                    <span className="text-[11px] font-normal text-slate-400">
                      Standard register opening balance
                    </span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-sm text-slate-400">
                      ৳
                    </span>
                    <Input
                      type="number"
                      step="500"
                      min="0"
                      placeholder="10,000"
                      value={formData.initialFloat}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          initialFloat: Math.max(0, Number(e.target.value)),
                        })
                      }
                      className="pl-8 pr-14 min-h-11 border-slate-200 text-sm font-mono tabular-nums bg-white font-semibold text-[#070B28]"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-medium text-slate-400">
                      BDT
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Allocated during daily shift morning seal protocols
                  </p>
                </div>

                {/* Allow Offline Checkout? */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <label
                      htmlFor="offline-sync-toggle"
                      className="text-xs font-semibold text-[#070B28] cursor-pointer"
                    >
                      Enable offline register syncing for this lane
                    </label>
                    <p className="text-[11px] text-slate-500 leading-normal">
                      Allows cashier terminal to queue sales in IndexedDB during network outages.
                    </p>
                  </div>
                  <Switch
                    id="offline-sync-toggle"
                    checked={formData.allowOffline}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, allowOffline: checked })
                    }
                  />
                </div>
              </div>
            </div>

            {/* ── Footer Actions & Footnote ── */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <p className="text-xs text-slate-400 max-w-md">
                * This will initialize database indexing for POS registers and staff assignments at this location.
              </p>

              <div className="flex items-center gap-3 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (selectedLocation) {
                      setFormData({
                        name: selectedLocation.name,
                        code: selectedLocation.code,
                        businessId: selectedLocation.businessId,
                        phone: selectedLocation.phone,
                        email: selectedLocation.email || "",
                        address: selectedLocation.address,
                        city: selectedLocation.city,
                        initialFloat: selectedLocation.initialFloat,
                        allowOffline: selectedLocation.allowOffline,
                      });
                    } else {
                      setFormData(INITIAL_FORM);
                    }
                    toast.info("Form reset.");
                  }}
                  className="min-h-11 px-5 border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="min-h-11 px-7 bg-[#0052FF] hover:bg-[#0047E0] text-white font-medium shadow-xs gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      <span>{formMode === "CREATE" ? "Create Branch" : "Save Changes"}</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* ── AUDIT LOG MODAL ── */}
      <Dialog open={isAuditModalOpen} onOpenChange={setIsAuditModalOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#070B28] flex items-center gap-2">
              <History className="h-5 w-5 text-[#0052FF]" />
              <span>Location Operations &amp; Audit Log</span>
            </DialogTitle>
            <p className="text-xs text-slate-500">
              Cryptographically verified initialization logs and branch register events for {activeBusinessName}.
            </p>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 pr-1 mt-2">
            {DUMMY_LOCATION_AUDIT_LOGS.map((log) => (
              <div key={log.id} className="py-3.5 flex items-start gap-3 text-xs">
                <div className="mt-0.5">
                  {log.status === "SUCCESS" && (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  )}
                  {log.status === "WARNING" && (
                    <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                  )}
                  {log.status === "INFO" && (
                    <History className="h-4 w-4 text-sky-500 shrink-0" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-[#070B28]">
                      {log.locationName}
                    </span>
                    <span className="font-mono text-[11px] text-slate-400">
                      {log.timestamp}
                    </span>
                  </div>

                  <p className="text-slate-600 mt-0.5 leading-normal">
                    {log.details}
                  </p>

                  <div className="mt-1.5 flex items-center gap-2 font-mono text-[10px] text-slate-400">
                    <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
                      {log.action}
                    </Badge>
                    <span>Operator: {log.operator}</span>
                    <span>•</span>
                    <span>Node: {log.node}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAuditModalOpen(false)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
