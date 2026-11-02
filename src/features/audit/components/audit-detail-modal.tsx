"use client";

import {
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
  ArrowRightLeft,
  KeyRound,
  ShieldAlert,
  WalletCards,
  RotateCcw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { AuditLogItem } from "@/features/audit/api/use-audit-logs";
import { formatBDT, cn } from "@/lib/utils";

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
      badgeClass: "border-rose-200 bg-rose-50 text-rose-700",
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
      badgeClass: "border-purple-200 bg-purple-50 text-purple-700",
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
      badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-700",
      dotClass: "bg-emerald-500",
      type: "financial",
    };
  }
  return {
    badgeClass: "border-blue-200 bg-blue-50 text-blue-700",
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
  if (!item) return null;

  const excludedKeys = new Set([
    "id",
    "businessId",
    "locationId",
    "actorId",
    "entityId",
    "userId",
    "productId",
    "variantId",
    "tenantId",
    "createdAt",
    "updatedAt",
    "ipAddress",
  ]);
  const diffEntries =
    item.diff && typeof item.diff === "object"
      ? Object.entries(item.diff).filter(([key]) => !excludedKeys.has(key))
      : [];

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

  const meta = item.metadata || {};

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      {/* 
        Inspect Modal:
        ~1000px desktop width, max 90dvh height, scrollable internal content,
        cleanly responsive on mobile and tablet without horizontal overflow.
      */}
      <DialogContent className="max-w-[1000px] w-[95vw] max-h-[90dvh] flex flex-col p-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
        {/* Fixed Modal Header */}
        <div className="border-b border-slate-200 p-6 pb-5 bg-white shrink-0">
          <div className="flex items-start justify-between gap-4 pr-6">
            <DialogHeader className="space-y-1.5 text-left mb-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className={cn("h-2.5 w-2.5 rounded-full shrink-0", actionMeta.dotClass)} />
                <DialogTitle className="text-xl sm:text-2xl font-bold tracking-tight text-[#070B28]">
                  {item.issue || item.action}
                </DialogTitle>
                <Badge
                  variant="outline"
                  className={cn("text-xs font-mono font-medium px-2.5 py-0.5 border", actionMeta.badgeClass)}
                >
                  {item.action}
                </Badge>
              </div>

              <DialogDescription className="text-xs sm:text-sm text-slate-500 flex items-center gap-2 mt-1">
                <Clock className="h-4 w-4 text-slate-400 shrink-0" />
                <span>{formattedDate}</span>
              </DialogDescription>
            </DialogHeader>
          </div>

          {/* Prominent Event Summary Callout */}
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
              Event Summary
            </span>
            <p className="text-sm sm:text-base text-slate-800 leading-relaxed font-normal">
              {item.summary}
            </p>
          </div>
        </div>

        {/* Scrollable Modal Body: Clean, unified, polished view */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Event Context: 3 Balanced Desktop Columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Target Entity Card */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  <span>Target Entity</span>
                  <EntityTypeIcon type={item.entityType} className="h-4 w-4 text-slate-400" />
                </div>
                <p className="text-base font-semibold text-[#070B28] leading-snug line-clamp-2" title={item.entityName}>
                  {item.entityName}
                </p>
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-xs font-mono font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                    {item.entityType}
                  </span>
                  {item.sku && (
                    <span className="text-xs font-mono font-medium bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded">
                      SKU: {item.sku}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Actor / Staff Card (Subtle User icon avoids repeating initials next to name) */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  <span>Performed By</span>
                  <User className="h-4 w-4 text-slate-400" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 shrink-0">
                    <User className="h-4 w-4" />
                  </div>
                  <p className="text-base font-semibold text-[#070B28]">
                    {item.actorName}
                  </p>
                </div>
                <div className="mt-2">
                  <Badge variant="outline" className="text-xs font-mono uppercase bg-slate-50 text-slate-700 px-2 py-0.5">
                    Role: {item.actorRole || "CASHIER"}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Location & Origin Card */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  <span>Branch Location</span>
                  <MapPin className="h-4 w-4 text-slate-400" />
                </div>
                <p className="text-base font-semibold text-[#070B28] truncate">
                  {item.locationName || "All Outlets / HQ"}
                </p>
                <div className="mt-2">
                  <span className="text-xs font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200/60 inline-flex items-center gap-1.5">
                    <Building2 className="h-3 w-3 text-slate-400" />
                    Authorized Store Branch
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Event-Specific Business Impact Visualizers */}
          <div className="space-y-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
              Business Impact &amp; State Mutation
            </span>

            {/* 1. Inventory Stock Transition: 7 units → −3 sold → 4 units remaining */}
            {typeof meta.resultingStock === "number" && (
              <div className="rounded-xl border border-amber-200/90 bg-amber-50/30 p-5 shadow-2xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                      <AlertTriangle className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">
                        Inventory Depletion &amp; Stock Alert
                      </h4>
                      <p className="text-xs text-slate-500">
                        Critical stock threshold reached following recorded sales transaction
                      </p>
                    </div>
                  </div>
                  {Boolean(meta.invoiceNumber) && (
                    <span className="font-mono text-xs bg-white border border-amber-200 text-amber-900 font-semibold px-3 py-1 rounded-md shadow-2xs">
                      Invoice: #{String(meta.invoiceNumber)}
                    </span>
                  )}
                </div>

                {/* Connected Progression Pipeline: 7 units → -3 sold → 4 units remaining */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-0 items-stretch">
                  {/* Step 1: Initial Stock */}
                  <div className="rounded-xl sm:rounded-r-none border border-slate-200 bg-white p-4 text-center sm:border-r-0 flex flex-col justify-center">
                    <span className="text-xs uppercase font-semibold text-slate-400 tracking-wider">
                      Initial Stock
                    </span>
                    <p className="font-mono text-3xl sm:text-4xl font-bold text-[#070B28] mt-1">
                      {String(meta.previousStock ?? "—")}
                      <span className="text-sm font-normal text-slate-400 ml-1">units</span>
                    </p>
                  </div>

                  {/* Step 2: Sold Delta */}
                  <div className="rounded-xl sm:rounded-none border border-amber-300 bg-amber-100/70 p-4 text-center sm:border-r-0 flex flex-col justify-center items-center">
                    <span className="text-xs uppercase font-semibold text-amber-900 tracking-wider flex items-center gap-1.5">
                      <TrendingDown className="h-4 w-4" />
                      Quantity Sold
                    </span>
                    <p className="font-mono text-3xl sm:text-4xl font-bold text-amber-900 mt-1">
                      −{String(meta.quantitySold ?? 0)}
                      <span className="text-sm font-normal text-amber-800 ml-1">units</span>
                    </p>
                  </div>

                  {/* Step 3: Resulting Remaining Stock */}
                  <div
                    className={cn(
                      "rounded-xl sm:rounded-l-none border p-4 text-center flex flex-col justify-center",
                      Number(meta.resultingStock) <= 5
                        ? "border-rose-300 bg-rose-50 text-rose-900"
                        : "border-slate-200 bg-white text-[#070B28]"
                    )}
                  >
                    <span
                      className={cn(
                        "text-xs uppercase font-semibold tracking-wider",
                        Number(meta.resultingStock) <= 5 ? "text-rose-700" : "text-slate-400"
                      )}
                    >
                      Remaining Stock {Number(meta.resultingStock) <= 5 && "· Critical Warning"}
                    </span>
                    <p
                      className={cn(
                        "font-mono text-3xl sm:text-4xl font-bold mt-1",
                        Number(meta.resultingStock) <= 5 ? "text-rose-700" : "text-[#070B28]"
                      )}
                    >
                      {String(meta.resultingStock)}
                      <span className="text-sm font-normal text-slate-400 ml-1">units</span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Salary / Payroll Revision */}
            {typeof meta.newSalary === "number" && (
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">
                      Staff Compensation Adjustment
                    </h4>
                    <p className="text-xs text-slate-500">
                      Monthly base compensation modification logged by authorized HR administrator
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-0 items-stretch">
                  <div className="rounded-xl sm:rounded-r-none border border-slate-200 bg-slate-50 p-4 text-center sm:border-r-0">
                    <span className="text-xs uppercase font-semibold text-slate-400 tracking-wider">
                      Previous Base Salary
                    </span>
                    <p className="font-mono text-xl sm:text-2xl font-bold text-slate-700 mt-1">
                      {typeof meta.previousSalary === "number" ? formatBDT(meta.previousSalary) : "—"}
                    </p>
                  </div>

                  <div className="rounded-xl sm:rounded-none border border-emerald-200 bg-emerald-50/70 p-4 text-center sm:border-r-0">
                    <span className="text-xs uppercase font-semibold text-emerald-800 tracking-wider">
                      Net Adjustment
                    </span>
                    <p className="font-mono text-xl sm:text-2xl font-bold text-emerald-800 mt-1">
                      {typeof meta.previousSalary === "number"
                        ? `${meta.newSalary >= meta.previousSalary ? "+" : ""}${formatBDT(
                            meta.newSalary - meta.previousSalary
                          )}`
                        : "—"}
                    </p>
                  </div>

                  <div className="rounded-xl sm:rounded-l-none border border-emerald-300 bg-emerald-50/40 p-4 text-center">
                    <span className="text-xs uppercase font-semibold text-emerald-700 tracking-wider">
                      Updated Base Salary
                    </span>
                    <p className="font-mono text-xl sm:text-2xl font-bold text-emerald-900 mt-1">
                      {formatBDT(meta.newSalary)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 3. Offline Price Disparity */}
            {Boolean(meta.chargedUnitPrice !== undefined && meta.currentSellingPrice !== undefined) && (
              <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-5 shadow-2xs space-y-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 text-rose-700">
                    <ShieldAlert className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-rose-950">
                      Offline Price Disparity Detected
                    </h4>
                    <p className="text-xs text-rose-700">
                      Billed register rate diverges from current server catalog price
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-rose-200 bg-white p-4">
                    <span className="text-xs uppercase font-semibold text-slate-400 tracking-wider">
                      Billed Offline Price
                    </span>
                    <p className="font-mono text-2xl font-bold text-rose-600 mt-1">
                      ৳{String(meta.chargedUnitPrice)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <span className="text-xs uppercase font-semibold text-slate-400 tracking-wider">
                      Current Catalog Price
                    </span>
                    <p className="font-mono text-2xl font-bold text-[#070B28] mt-1">
                      ৳{String(meta.currentSellingPrice)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 4. Branch Reassignment */}
            {Boolean(meta.previousLocation || meta.newLocation) && (
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-[#0052FF]">
                    <ArrowRightLeft className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">
                      Store Location Reassignment
                    </h4>
                    <p className="text-xs text-slate-500">
                      Branch assignment transferred between store outlets
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-center sm:text-left">
                    <span className="text-xs font-semibold uppercase text-slate-400 block tracking-wider">
                      Origin Branch
                    </span>
                    <span className="text-base font-bold text-slate-800">
                      {String(meta.previousLocation || "Unassigned")}
                    </span>
                  </div>
                  <ArrowRight className="h-5 w-5 text-slate-400 shrink-0 hidden sm:block" />
                  <div className="text-center sm:text-right">
                    <span className="text-xs font-semibold uppercase text-slate-400 block tracking-wider">
                      Destination Branch
                    </span>
                    <span className="text-base font-bold text-[#0052FF]">
                      {String(meta.newLocation || "Unassigned")}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 5. Password Reset / Security Event */}
            {item.action === "ADMIN_PASSWORD_RESET" && (
              <div className="rounded-xl border border-purple-200 bg-purple-50/40 p-5 shadow-2xs space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-purple-700">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <h4 className="text-sm font-semibold text-purple-950">
                    Administrative Credential Reset
                  </h4>
                </div>
                <p className="text-sm text-purple-900 leading-relaxed">
                  The credentials for user <span className="font-semibold text-purple-950">{item.entityName}</span> were reset by administrator <span className="font-semibold text-purple-950">{item.actorName}</span>. Staff must authenticate using their temporary credentials upon their next terminal session.
                </p>
              </div>
            )}

            {/* 6. Order Refund / Void */}
            {(item.action === "ORDER_REFUND" || item.action === "ORDER_VOID") && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/30 p-5 shadow-2xs space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                    <RotateCcw className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-emerald-950">
                      Order Financial Reversal / Refund
                    </h4>
                    <p className="text-xs text-emerald-700">
                      Transaction reversed and ledger updated
                    </p>
                  </div>
                </div>
                {Boolean(meta.refundAmount) && (
                  <div className="p-3 bg-white rounded-lg border border-emerald-200">
                    <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Refund Amount</span>
                    <p className="font-mono text-2xl font-bold text-emerald-800">{formatBDT(Number(meta.refundAmount))}</p>
                  </div>
                )}
              </div>
            )}

            {/* 7. Expense Creation */}
            {item.action === "EXPENSE_CREATE" && (
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-[#0052FF]">
                    <WalletCards className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">Manual Operating Expense</h4>
                    <p className="text-xs text-slate-500">Expenditure disbursed from cash drawer or bank ledger</p>
                  </div>
                </div>
                {Boolean(meta.amount) && (
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Disbursed Amount</span>
                    <p className="font-mono text-2xl font-bold text-[#070B28]">{formatBDT(Number(meta.amount))}</p>
                  </div>
                )}
              </div>
            )}

            {/* Diff / State Changes Table (Filtered for meaningful business properties) */}
            {diffEntries.length > 0 && (
              <div className="space-y-2 pt-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                  State Changes &amp; Mutation Diff
                </span>
                <div className="rounded-xl border border-slate-200 bg-white overflow-hidden text-sm">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase text-slate-500 tracking-wider">
                      <tr>
                        <th className="py-2.5 px-4">Field</th>
                        <th className="py-2.5 px-4">Previous Value</th>
                        <th className="py-2.5 px-4">New Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-xs">
                      {diffEntries.map(([field, delta]) => {
                        const d = delta as { from?: unknown; to?: unknown };
                        return (
                          <tr key={field} className="hover:bg-slate-50/50">
                            <td className="py-2.5 px-4 font-medium font-sans text-slate-800">{field}</td>
                            <td className="py-2.5 px-4 text-slate-500">{String(d?.from ?? "—")}</td>
                            <td className="py-2.5 px-4 text-[#0052FF] font-semibold">{String(d?.to ?? "—")}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

