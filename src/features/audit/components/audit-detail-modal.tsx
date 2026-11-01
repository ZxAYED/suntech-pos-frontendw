"use client";

import { useState } from "react";
import {
  Copy,
  Check,
  MapPin,
  User,
  Box,
  Package,
  ShoppingBag,
  Receipt,
  Building2,
  FileText,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Clock,
  Sparkles,
  ArrowRightLeft,
  KeyRound,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AuditLogItem } from "@/features/audit/api/use-audit-logs";
import { formatBDT } from "@/lib/utils";

interface AuditDetailModalProps {
  item: AuditLogItem | null;
  isOpen: boolean;
  onClose: () => void;
}

function getActionMeta(action: string) {
  const act = action.toUpperCase();
  if (
    act.includes("LOW_STOCK") ||
    act.includes("UNAVAILABLE") ||
    act.includes("MISMATCH") ||
    act.includes("VOID") ||
    act.includes("DELETE")
  ) {
    return {
      badgeClass: "border-rose-200/80 bg-rose-50/70 text-rose-700",
      dotClass: "bg-rose-500",
      type: "alert",
    };
  }
  if (
    act.includes("PASSWORD") ||
    act.includes("ROLE") ||
    act.includes("AUTH") ||
    act.includes("SECURITY")
  ) {
    return {
      badgeClass: "border-purple-200/80 bg-purple-50/70 text-purple-700",
      dotClass: "bg-purple-500",
      type: "security",
    };
  }
  if (
    act.includes("SALARY") ||
    act.includes("REFUND") ||
    act.includes("PAYROLL") ||
    act.includes("EXPENSE")
  ) {
    return {
      badgeClass: "border-emerald-200/80 bg-emerald-50/70 text-emerald-700",
      dotClass: "bg-emerald-500",
      type: "financial",
    };
  }
  return {
    badgeClass: "border-blue-200/80 bg-blue-50/70 text-blue-700",
    dotClass: "bg-blue-500",
    type: "default",
  };
}

function EntityTypeIcon({ type, className }: { type: string; className?: string }) {
  switch (type.toUpperCase()) {
    case "VARIANT":
      return <Box className={className} />;
    case "PRODUCT":
      return <Package className={className} />;
    case "USER":
      return <User className={className} />;
    case "ORDER":
      return <ShoppingBag className={className} />;
    case "EXPENSE":
      return <Receipt className={className} />;
    case "LOCATION":
      return <Building2 className={className} />;
    default:
      return <FileText className={className} />;
  }
}

export function AuditDetailModal({ item, isOpen, onClose }: AuditDetailModalProps) {
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!item) return null;

  const actionMeta = getActionMeta(item.action);

  const formattedDate = new Date(item.createdAt).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(item, null, 2));
    setCopiedPayload(true);
    toast.success("Audit log JSON copied to clipboard");
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  const handleCopyString = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(label);
    toast.success(`${label} copied to clipboard`);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const meta = item.metadata || {};

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[88vh] overflow-hidden flex flex-col p-0 rounded-2xl border-slate-200/90 shadow-xl">
        {/* Modal Header */}
        <div className="border-b border-slate-200/80 p-5 pb-4 bg-slate-50/50">
          <div className="flex items-start justify-between gap-4">
            <DialogHeader className="space-y-1 text-left">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`h-2 w-2 rounded-full ${actionMeta.dotClass}`} />
                <DialogTitle className="text-lg font-semibold tracking-tight text-[#070B28]">
                  {item.issue || item.action}
                </DialogTitle>
                <Badge
                  variant="outline"
                  className={`text-[11px] font-mono px-2 py-0.5 border ${actionMeta.badgeClass}`}
                >
                  {item.action}
                </Badge>
              </div>

              <DialogDescription className="text-xs text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                <Clock className="h-3 w-3 text-slate-400" />
                {formattedDate}
              </DialogDescription>
            </DialogHeader>

            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyJson}
              className="h-8 text-xs shrink-0 rounded-lg border-slate-200 bg-white hover:bg-slate-50 active:scale-[0.98] transition-transform"
            >
              {copiedPayload ? (
                <>
                  <Check className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="mr-1.5 h-3.5 w-3.5 text-slate-500" />
                  Copy JSON
                </>
              )}
            </Button>
          </div>

          {/* Primary Summary Callout - Apple-style subtle container */}
          <div className="mt-3.5 rounded-xl border border-slate-200/80 bg-white p-3.5 text-xs text-slate-700 leading-relaxed shadow-2xs flex items-start gap-2.5">
            <Sparkles className="h-4 w-4 text-[#0052FF] shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold text-[#070B28]">Event Summary: </span>
              {item.summary}
            </div>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <Tabs defaultValue="visual" className="w-full">
            <TabsList className="mb-4 bg-slate-100/80 p-0.5 rounded-xl h-8">
              <TabsTrigger
                value="visual"
                className="text-xs rounded-lg px-3 data-[state=active]:bg-white data-[state=active]:shadow-2xs"
              >
                Overview & Impact
              </TabsTrigger>
              <TabsTrigger
                value="json"
                className="text-xs rounded-lg px-3 data-[state=active]:bg-white data-[state=active]:shadow-2xs"
              >
                Technical & Raw JSON
              </TabsTrigger>
            </TabsList>

            {/* Visual Overview Tab */}
            <TabsContent value="visual" className="space-y-4.5 mt-0">
              {/* Event Context: 3 Clean Apple Cards */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {/* Target Entity Card */}
                <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-medium uppercase tracking-wider text-slate-400">
                    <span>Target Entity</span>
                    <EntityTypeIcon type={item.entityType} className="h-3.5 w-3.5 text-slate-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-xs text-[#070B28] leading-snug line-clamp-2" title={item.entityName}>
                      {item.entityName}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded">
                        {item.entityType}
                      </span>
                      {item.sku && (
                        <span className="text-[10px] font-mono bg-blue-50 text-blue-700 border border-blue-200/60 px-1.5 py-0.2 rounded">
                          SKU: {item.sku}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between">
                    <span className="font-mono text-[9px] text-slate-400 truncate max-w-[130px]">
                      {item.entityId}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyString(item.entityId, "Entity ID")}
                      className="text-slate-400 hover:text-slate-700"
                      title="Copy Entity ID"
                    >
                      {copiedId === "Entity ID" ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                    </button>
                  </div>
                </div>

                {/* Actor / Staff Card */}
                <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-medium uppercase tracking-wider text-slate-400">
                    <span>Performed By</span>
                    <User className="h-3.5 w-3.5 text-slate-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-700 uppercase">
                        {item.actorName?.slice(0, 2) || "U"}
                      </div>
                      <p className="font-semibold text-xs text-[#070B28]">
                        {item.actorName}
                      </p>
                    </div>
                    <div className="mt-1">
                      <span className="text-[10px] font-mono uppercase bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded">
                        Role: {item.actorRole || "STAFF"}
                      </span>
                    </div>
                  </div>
                  <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between">
                    <span className="font-mono text-[9px] text-slate-400 truncate max-w-[130px]">
                      {item.actorId}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyString(item.actorId, "Actor ID")}
                      className="text-slate-400 hover:text-slate-700"
                      title="Copy Actor ID"
                    >
                      {copiedId === "Actor ID" ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                    </button>
                  </div>
                </div>

                {/* Location & Network Card */}
                <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-medium uppercase tracking-wider text-slate-400">
                    <span>Branch & Origin</span>
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-xs text-[#070B28] truncate">
                      {item.locationName || "All Outlets / HQ"}
                    </p>
                    <p className="font-mono text-[10px] text-slate-500 mt-0.5">
                      IP: {item.ipAddress || "Internal Server"}
                    </p>
                  </div>
                  <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between">
                    <span className="font-mono text-[9px] text-slate-400 truncate max-w-[130px]">
                      {item.id}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyString(item.id, "Log ID")}
                      className="text-slate-400 hover:text-slate-700"
                      title="Copy Log ID"
                    >
                      {copiedId === "Log ID" ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Event-Specific Business Impact Visualizers */}
              <div className="space-y-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
                  Business Impact & State Transition
                </span>

                {/* 1. Inventory Stock Transition (Connected Horizontal / Vertical) */}
                {typeof meta.resultingStock === "number" && (
                  <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                        Inventory Stock Transition
                      </span>
                      {Boolean(meta.invoiceNumber) && (
                        <span className="font-mono text-[11px] bg-slate-50 border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md">
                          Invoice: {String(meta.invoiceNumber)}
                        </span>
                      )}
                    </div>

                    {/* Connected Progression Pipeline */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-0 items-center">
                      {/* Step 1: Previous */}
                      <div className="rounded-xl sm:rounded-r-none border border-slate-200 bg-slate-50/60 p-3 text-center sm:border-r-0">
                        <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                          Previous Stock
                        </span>
                        <p className="font-mono text-xl font-bold text-slate-800 mt-0.5">
                          {String(meta.previousStock ?? "—")} <span className="text-xs font-normal text-slate-500">units</span>
                        </p>
                      </div>

                      {/* Step 2: Delta (Sold) */}
                      <div className="rounded-xl sm:rounded-none border border-amber-200 bg-amber-50/70 p-3 text-center sm:border-r-0 flex flex-col justify-center items-center">
                        <span className="text-[10px] uppercase font-semibold text-amber-800 flex items-center gap-1">
                          <TrendingDown className="h-3 w-3" />
                          Quantity Sold
                        </span>
                        <p className="font-mono text-xl font-bold text-amber-900 mt-0.5">
                          −{String(meta.quantitySold ?? 0)} <span className="text-xs font-normal text-amber-700">units</span>
                        </p>
                      </div>

                      {/* Step 3: Resulting */}
                      <div className={`rounded-xl sm:rounded-l-none border p-3 text-center ${
                        Number(meta.resultingStock) <= 5
                          ? "border-rose-300 bg-rose-50/80"
                          : "border-slate-200 bg-slate-50/60"
                      }`}>
                        <span className={`text-[10px] uppercase font-semibold block ${
                          Number(meta.resultingStock) <= 5 ? "text-rose-700" : "text-slate-500"
                        }`}>
                          Remaining Stock {Number(meta.resultingStock) <= 5 && "(Low)"}
                        </span>
                        <p className={`font-mono text-xl font-bold mt-0.5 ${
                          Number(meta.resultingStock) <= 5 ? "text-rose-700" : "text-slate-800"
                        }`}>
                          {String(meta.resultingStock)} <span className="text-xs font-normal text-slate-500">units</span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Salary / Payroll Revision */}
                {typeof meta.newSalary === "number" && (
                  <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs space-y-3">
                    <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                      <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                      Staff Monthly Salary Revision
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-0 items-center">
                      <div className="rounded-xl sm:rounded-r-none border border-slate-200 bg-slate-50/60 p-3 text-center sm:border-r-0">
                        <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                          Previous Salary
                        </span>
                        <p className="font-mono text-base font-bold text-slate-800 mt-0.5">
                          {typeof meta.previousSalary === "number" ? formatBDT(meta.previousSalary) : "—"}
                        </p>
                      </div>

                      <div className="rounded-xl sm:rounded-none border border-emerald-200 bg-emerald-50/70 p-3 text-center sm:border-r-0">
                        <span className="text-[10px] uppercase font-semibold text-emerald-800 block">
                          Net Revision
                        </span>
                        <p className="font-mono text-base font-bold text-emerald-900 mt-0.5">
                          {typeof meta.previousSalary === "number"
                            ? `+${formatBDT(meta.newSalary - meta.previousSalary)}`
                            : "—"}
                        </p>
                      </div>

                      <div className="rounded-xl sm:rounded-l-none border border-emerald-300 bg-emerald-50/40 p-3 text-center">
                        <span className="text-[10px] uppercase font-semibold text-emerald-700 block">
                          Updated Salary
                        </span>
                        <p className="font-mono text-base font-bold text-emerald-800 mt-0.5">
                          {formatBDT(meta.newSalary)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Offline Price Mismatch */}
                {Boolean(meta.chargedUnitPrice !== undefined && meta.currentSellingPrice !== undefined) && (
                  <div className="rounded-2xl border border-rose-200/90 bg-rose-50/40 p-4 shadow-2xs space-y-3">
                    <span className="text-xs font-semibold text-rose-900 flex items-center gap-1.5">
                      <ShieldAlert className="h-3.5 w-3.5 text-rose-600" />
                      Price Disparity Details
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="rounded-xl border border-rose-200 bg-white p-3">
                        <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                          Charged Offline Price
                        </span>
                        <p className="font-mono text-lg font-bold text-rose-600 mt-0.5">
                          ৳{String(meta.chargedUnitPrice)}
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-white p-3">
                        <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                          Current Catalog Price
                        </span>
                        <p className="font-mono text-lg font-bold text-slate-800 mt-0.5">
                          ৳{String(meta.currentSellingPrice)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. Branch Reassignment */}
                {Boolean(meta.previousLocation || meta.newLocation) && (
                  <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs space-y-3">
                    <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                      <ArrowRightLeft className="h-3.5 w-3.5 text-blue-600" />
                      Branch Reassignment
                    </span>

                    <div className="flex items-center justify-between gap-3 p-3 bg-slate-50/70 rounded-xl border border-slate-200">
                      <div>
                        <span className="text-[10px] font-semibold uppercase text-slate-400 block">From Branch</span>
                        <span className="text-xs font-bold text-slate-700">{String(meta.previousLocation || "Unassigned")}</span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-400 shrink-0" />
                      <div>
                        <span className="text-[10px] font-semibold uppercase text-slate-400 block">To Branch</span>
                        <span className="text-xs font-bold text-[#0052FF]">{String(meta.newLocation || "Unassigned")}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. Password Reset / Security Event */}
                {item.action === "ADMIN_PASSWORD_RESET" && (
                  <div className="rounded-2xl border border-purple-200/80 bg-purple-50/30 p-4 shadow-2xs space-y-2">
                    <span className="text-xs font-semibold text-purple-900 flex items-center gap-1.5">
                      <KeyRound className="h-3.5 w-3.5 text-purple-600" />
                      Administrative Credential Reset
                    </span>
                    <p className="text-xs text-purple-800">
                      The password for staff member <span className="font-semibold">{item.entityName}</span> was reset by administrator <span className="font-semibold">{item.actorName}</span>. Staff must authenticate using new credentials on next terminal login.
                    </p>
                  </div>
                )}

                {/* Additional Clean Metadata Key-Value List */}
                {Object.keys(meta).length > 0 && (
                  <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 block mb-2">
                      Event Attributes & Parameters
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {Object.entries(meta).map(([key, val]) => (
                        <div
                          key={key}
                          className="flex items-center justify-between rounded-lg bg-white px-3 py-2 border border-slate-200/70"
                        >
                          <span className="text-[11px] font-medium text-slate-500">
                            {key.replace(/([A-Z])/g, " $1").toLowerCase()}
                          </span>
                          <span className="font-mono text-xs font-semibold text-slate-800 truncate max-w-[150px]">
                            {typeof val === "object" ? JSON.stringify(val) : String(val)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Diff / State Changes if available */}
                {item.diff && Object.keys(item.diff).length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
                      State Changes & Mutation Diff
                    </span>
                    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden text-xs">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-medium uppercase text-slate-400">
                          <tr>
                            <th className="p-2.5">Field</th>
                            <th className="p-2.5">Previous Value</th>
                            <th className="p-2.5">New Value</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                          {Object.entries(item.diff).map(([field, delta]) => {
                            const d = delta as { from?: unknown; to?: unknown };
                            return (
                              <tr key={field}>
                                <td className="p-2.5 font-medium text-slate-700">{field}</td>
                                <td className="p-2.5 text-slate-500">{String(d?.from ?? "—")}</td>
                                <td className="p-2.5 text-[#0052FF] font-semibold">{String(d?.to ?? "—")}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Technical Details & Raw JSON Tab */}
            <TabsContent value="json" className="space-y-4 mt-0">
              <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-2">
                <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 block">
                  System Identifiers & Scopes
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 font-mono text-[11px]">
                    <span className="text-slate-400">Log ID:</span>
                    <span className="text-slate-700 select-all">{item.id}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 font-mono text-[11px]">
                    <span className="text-slate-400">Business ID:</span>
                    <span className="text-slate-700 select-all">{item.businessId}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 font-mono text-[11px]">
                    <span className="text-slate-400">Actor ID:</span>
                    <span className="text-slate-700 select-all">{item.actorId}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 font-mono text-[11px]">
                    <span className="text-slate-400">Entity ID:</span>
                    <span className="text-slate-700 select-all">{item.entityId}</span>
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="flex items-center justify-between pb-1.5">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Raw JSON Payload
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyJson}
                    className="text-xs text-[#0052FF] hover:underline flex items-center gap-1 font-medium"
                  >
                    <Copy className="h-3 w-3" />
                    Copy Payload
                  </button>
                </div>
                <pre className="rounded-xl border border-slate-200 bg-slate-950 p-4 text-xs font-mono text-emerald-400 overflow-x-auto max-h-72 leading-relaxed">
                  {JSON.stringify(item, null, 2)}
                </pre>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
