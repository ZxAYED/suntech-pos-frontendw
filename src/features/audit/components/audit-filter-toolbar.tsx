"use client";

import { Search, X, RotateCcw, Calendar, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const ACTION_OPTIONS = [
  { value: "all", label: "All Actions & Events" },
  { value: "LOW_STOCK_AFTER_SALE", label: "Low Stock Alert (Sales)" },
  { value: "SALARY_UPDATE", label: "Salary Updated (Payroll)" },
  { value: "ADMIN_PASSWORD_RESET", label: "Password Reset (Security)" },
  { value: "ORDER_REFUND", label: "Order Refunded (Finance)" },
  { value: "OFFLINE_PRICE_MISMATCH", label: "Offline Price Mismatch" },
  { value: "VARIANT_UNAVAILABLE", label: "Unavailable Variant Sold" },
  { value: "BRANCH_REASSIGNMENT", label: "Branch Reassignment" },
  { value: "INVENTORY_ADJUST", label: "Stock Adjustment" },
  { value: "EXPENSE_CREATE", label: "Expense Recorded" },
];

export const ENTITY_TYPE_OPTIONS = [
  { value: "all", label: "All Entity Types" },
  { value: "VARIANT", label: "Product Variant (SKU)" },
  { value: "USER", label: "Staff Member (User)" },
  { value: "ORDER", label: "Customer Order" },
  { value: "PRODUCT", label: "Catalog Product" },
  { value: "EXPENSE", label: "Financial Expense" },
  { value: "LOCATION", label: "Branch Location" },
  { value: "CATEGORY", label: "Catalog Category" },
];

export interface LocationOption {
  id: string;
  name: string;
}

interface AuditFilterToolbarProps {
  search: string;
  onSearchChange: (val: string) => void;
  action: string;
  onActionChange: (val: string) => void;
  entityType: string;
  onEntityTypeChange: (val: string) => void;
  locationId: string;
  onLocationChange: (val: string) => void;
  locations: LocationOption[];
  fromDate: string;
  onFromDateChange: (val: string) => void;
  toDate: string;
  onToDateChange: (val: string) => void;
  showDateRange: boolean;
  onToggleDateRange: () => void;
  onReset: () => void;
  hasActiveFilters: boolean;
  totalFiltered: number;
  totalCount: number;
}

export function AuditFilterToolbar({
  search,
  onSearchChange,
  action,
  onActionChange,
  entityType,
  onEntityTypeChange,
  locationId,
  onLocationChange,
  locations,
  fromDate,
  onFromDateChange,
  toDate,
  onToDateChange,
  showDateRange,
  onToggleDateRange,
  onReset,
  hasActiveFilters,
  totalFiltered,
  totalCount,
}: AuditFilterToolbarProps) {
  const selectedActionLabel = ACTION_OPTIONS.find((a) => a.value === action)?.label;
  const selectedEntityLabel = ENTITY_TYPE_OPTIONS.find((e) => e.value === entityType)?.label;
  const selectedLocationLabel = locations.find((l) => l.id === locationId)?.name;

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-3">
      {/* Primary Toolbar Controls */}
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-12 items-center">
        {/* Search Field */}
        <div className="relative sm:col-span-2 lg:col-span-4">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search issue, summary, entity, or actor..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-9 pl-8.5 pr-8 text-xs rounded-xl bg-slate-50/70 hover:bg-slate-100/60 focus:bg-white border-slate-200/80 transition-colors placeholder:text-slate-400"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-100"
              title="Clear search"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Action Event Select */}
        <div className="lg:col-span-3">
          <Select value={action} onValueChange={onActionChange}>
            <SelectTrigger className="h-9 text-xs rounded-xl border-slate-200/80 bg-white">
              <SelectValue placeholder="All Actions & Events" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {ACTION_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-xs">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Entity Type Select */}
        <div className="lg:col-span-2">
          <Select value={entityType} onValueChange={onEntityTypeChange}>
            <SelectTrigger className="h-9 text-xs rounded-xl border-slate-200/80 bg-white">
              <SelectValue placeholder="Entity Type" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {ENTITY_TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-xs">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Branch / Outlet Select */}
        <div className="lg:col-span-3">
          <Select value={locationId} onValueChange={onLocationChange}>
            <SelectTrigger className="h-9 text-xs rounded-xl border-slate-200/80 bg-white">
              <SelectValue placeholder="Branch Location" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all" className="text-xs">
                All Outlets / Branches
              </SelectItem>
              {locations.map((loc) => (
                <SelectItem key={loc.id} value={loc.id} className="text-xs">
                  {loc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Secondary Row: Date Range Toggle, Active Chips, & Record Count */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-slate-100 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onToggleDateRange}
            className={`h-7.5 px-2.5 rounded-lg text-xs font-normal transition-colors active:scale-[0.98] ${
              showDateRange || fromDate || toDate
                ? "bg-blue-50 text-[#0052FF] hover:bg-blue-100/60"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5" />
            {showDateRange ? "Hide Date Bounds" : "Date Range"}
          </Button>

          {/* Active Chips */}
          {action !== "all" && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100/90 text-slate-700 text-[11px] font-medium pl-2.5 pr-1.5 py-0.5 border border-slate-200/60">
              Action: {selectedActionLabel}
              <button
                type="button"
                onClick={() => onActionChange("all")}
                className="hover:bg-slate-200 rounded-full p-0.5 text-slate-400 hover:text-slate-700"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {entityType !== "all" && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100/90 text-slate-700 text-[11px] font-medium pl-2.5 pr-1.5 py-0.5 border border-slate-200/60">
              Entity: {selectedEntityLabel || entityType}
              <button
                type="button"
                onClick={() => onEntityTypeChange("all")}
                className="hover:bg-slate-200 rounded-full p-0.5 text-slate-400 hover:text-slate-700"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {locationId !== "all" && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100/90 text-slate-700 text-[11px] font-medium pl-2.5 pr-1.5 py-0.5 border border-slate-200/60">
              Branch: {selectedLocationLabel || locationId}
              <button
                type="button"
                onClick={() => onLocationChange("all")}
                className="hover:bg-slate-200 rounded-full p-0.5 text-slate-400 hover:text-slate-700"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {(fromDate || toDate) && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100/90 text-slate-700 text-[11px] font-medium pl-2.5 pr-1.5 py-0.5 border border-slate-200/60">
              Date: {fromDate || "Start"} → {toDate || "Now"}
              <button
                type="button"
                onClick={() => {
                  onFromDateChange("");
                  onToDateChange("");
                }}
                className="hover:bg-slate-200 rounded-full p-0.5 text-slate-400 hover:text-slate-700"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="h-7 px-2 text-[11px] text-slate-500 hover:text-slate-900 active:scale-95 transition-transform"
            >
              <RotateCcw className="mr-1 h-3 w-3" />
              Reset All
            </Button>
          )}
        </div>

        <div className="text-[11px] text-slate-400 font-normal">
          Showing <span className="font-medium text-slate-700">{totalFiltered}</span> of{" "}
          <span className="font-medium text-slate-700">{totalCount}</span> logs
        </div>
      </div>

      {/* Date Range Fields (Collapsible / Expandable) */}
      {showDateRange && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
          <div>
            <label className="text-[11px] font-medium text-slate-500 flex items-center gap-1 mb-1">
              <Calendar className="h-3 w-3 text-slate-400" />
              From Date
            </label>
            <Input
              type="date"
              className="h-8.5 text-xs rounded-xl bg-slate-50/60 border-slate-200/80"
              value={fromDate}
              onChange={(e) => onFromDateChange(e.target.value)}
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-500 flex items-center gap-1 mb-1">
              <Calendar className="h-3 w-3 text-slate-400" />
              To Date
            </label>
            <Input
              type="date"
              className="h-8.5 text-xs rounded-xl bg-slate-50/60 border-slate-200/80"
              value={toDate}
              onChange={(e) => onToDateChange(e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
