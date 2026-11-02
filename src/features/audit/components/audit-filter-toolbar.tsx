"use client";

import { Search, X, RotateCcw, Calendar, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

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
    <Card className="border-slate-200 p-4 shadow-xs">
      {/* Primary Toolbar Controls Matching Store Orders & Catalog */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-12 items-center">
        {/* Search Field */}
        <div className="relative sm:col-span-2 lg:col-span-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search this page (actor, entity, summary)..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-10 pl-9 pr-9 text-sm"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-md"
              title="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Action Event Select */}
        <div className="lg:col-span-3">
          <Select value={action} onValueChange={onActionChange}>
            <SelectTrigger className="h-10 text-sm">
              <SelectValue placeholder="All Actions & Events" />
            </SelectTrigger>
            <SelectContent>
              {ACTION_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-sm">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Entity Type Select */}
        <div className="lg:col-span-2">
          <Select value={entityType} onValueChange={onEntityTypeChange}>
            <SelectTrigger className="h-10 text-sm">
              <SelectValue placeholder="Entity Type" />
            </SelectTrigger>
            <SelectContent>
              {ENTITY_TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-sm">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Branch / Outlet Select */}
        <div className="lg:col-span-3">
          <Select value={locationId} onValueChange={onLocationChange}>
            <SelectTrigger className="h-10 text-sm">
              <SelectValue placeholder="All Branches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-sm">
                All Outlets / Branches
              </SelectItem>
              {locations.map((loc) => (
                <SelectItem key={loc.id} value={loc.id} className="text-sm">
                  {loc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Secondary Bar: Date Bounds Button, Active Chips, & Record Count */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 mt-3 border-t border-slate-100 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onToggleDateRange}
            className={cn(
              "h-8 text-xs font-medium text-slate-700",
              (showDateRange || fromDate || toDate) && "border-blue-300 bg-blue-50/70 text-[#0052FF]"
            )}
          >
            <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5" />
            {showDateRange ? "Hide Date Range" : "Filter by Date"}
          </Button>

          {/* Active Chips */}
          {action !== "all" && (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 border border-slate-200">
              <span>Action: {selectedActionLabel}</span>
              <button
                type="button"
                onClick={() => onActionChange("all")}
                className="hover:bg-slate-200 rounded p-0.5 text-slate-400 hover:text-slate-700"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {entityType !== "all" && (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 border border-slate-200">
              <span>Entity: {selectedEntityLabel || entityType}</span>
              <button
                type="button"
                onClick={() => onEntityTypeChange("all")}
                className="hover:bg-slate-200 rounded p-0.5 text-slate-400 hover:text-slate-700"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {locationId !== "all" && (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 border border-slate-200">
              <span>Branch: {selectedLocationLabel || locationId}</span>
              <button
                type="button"
                onClick={() => onLocationChange("all")}
                className="hover:bg-slate-200 rounded p-0.5 text-slate-400 hover:text-slate-700"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {(fromDate || toDate) && (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 border border-slate-200">
              <span>Date: {fromDate || "Start"} → {toDate || "Now"}</span>
              <button
                type="button"
                onClick={() => {
                  onFromDateChange("");
                  onToDateChange("");
                }}
                className="hover:bg-slate-200 rounded p-0.5 text-slate-400 hover:text-slate-700"
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
              className="h-8 px-2 text-xs text-slate-500 hover:text-slate-900"
            >
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
              Reset Filters
            </Button>
          )}
        </div>

        <div className="text-xs text-slate-500">
          Showing <span className="font-semibold text-slate-800">{totalFiltered}</span> of{" "}
          <span className="font-semibold text-slate-800">{totalCount}</span> logs
        </div>
      </div>

      {/* Date Range Fields (Collapsible) */}
      {showDateRange && (
        <div className="pt-3 mt-3 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium text-slate-500">Calendar Boundaries: Asia/Dhaka (+06:00)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 flex items-center gap-1 mb-1.5">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                From Date (Dhaka)
              </label>
              <Input
                type="date"
                className="h-10 text-sm"
                value={fromDate}
                onChange={(e) => onFromDateChange(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600 flex items-center gap-1 mb-1.5">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                To Date (Dhaka)
              </label>
              <Input
                type="date"
                className="h-10 text-sm"
                value={toDate}
                onChange={(e) => onToDateChange(e.target.value)}
              />
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

