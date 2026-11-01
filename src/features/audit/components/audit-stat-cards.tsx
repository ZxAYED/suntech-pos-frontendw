"use client";

import { useMemo } from "react";
import {
  ShieldCheck,
  AlertTriangle,
  KeyRound,
  Coins,
  type LucideIcon,
} from "lucide-react";
import type { AuditLogItem } from "@/features/audit/api/use-audit-logs";

interface StatItemProps {
  label: string;
  value: number | string;
  subtext: string;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
}

function StatCard({ label, value, subtext, icon: Icon, iconColor, iconBg }: StatItemProps) {
  return (
    <div className="group relative rounded-2xl border border-slate-200/80 bg-white/90 p-4.5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] backdrop-blur-xs transition-all duration-200 hover:border-slate-300 hover:shadow-[0_4px_12px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium tracking-wide uppercase text-slate-400">
          {label}
        </span>
        <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${iconBg} ${iconColor} transition-transform duration-150 group-hover:scale-105`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>

      <div className="mt-2">
        <span className="font-mono text-2xl font-bold tracking-tight text-[#070B28] tabular-nums">
          {typeof value === "number" ? value.toLocaleString() : value}
        </span>
      </div>

      <p className="mt-1 text-xs text-slate-500 font-normal">
        {subtext}
      </p>
    </div>
  );
}

interface AuditStatCardsProps {
  totalCount: number;
  items: AuditLogItem[];
  isFiltered?: boolean;
}

export function AuditStatCards({ totalCount, items, isFiltered = false }: AuditStatCardsProps) {
  const stats = useMemo(() => {
    let stockAlerts = 0;
    let securityEvents = 0;
    let financialUpdates = 0;

    for (const item of items) {
      const act = item.action.toUpperCase();
      if (
        act.includes("LOW_STOCK") ||
        act.includes("UNAVAILABLE") ||
        act.includes("MISMATCH") ||
        act.includes("VOID")
      ) {
        stockAlerts++;
      } else if (
        act.includes("PASSWORD") ||
        act.includes("ROLE") ||
        act.includes("AUTH") ||
        item.entityType.toUpperCase() === "USER"
      ) {
        securityEvents++;
      } else if (
        act.includes("SALARY") ||
        act.includes("REFUND") ||
        act.includes("PAYROLL") ||
        item.entityType.toUpperCase() === "EXPENSE"
      ) {
        financialUpdates++;
      }
    }

    return { stockAlerts, securityEvents, financialUpdates };
  }, [items]);

  const viewQualifier = isFiltered ? "in current filter" : "in current page view";

  return (
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Total Activity Logs"
        value={totalCount}
        subtext="Recorded system-wide audit trail"
        icon={ShieldCheck}
        iconColor="text-[#0052FF]"
        iconBg="bg-blue-50/80"
      />
      <StatCard
        label="Stock & Inventory Alerts"
        value={stats.stockAlerts}
        subtext={`Low stock & anomaly events ${viewQualifier}`}
        icon={AlertTriangle}
        iconColor="text-amber-600"
        iconBg="bg-amber-50/80"
      />
      <StatCard
        label="Security & Staff Actions"
        value={stats.securityEvents}
        subtext={`Password resets & role updates ${viewQualifier}`}
        icon={KeyRound}
        iconColor="text-purple-600"
        iconBg="bg-purple-50/80"
      />
      <StatCard
        label="Financial & HR Governance"
        value={stats.financialUpdates}
        subtext={`Salary adjustments & refunds ${viewQualifier}`}
        icon={Coins}
        iconColor="text-emerald-600"
        iconBg="bg-emerald-50/80"
      />
    </div>
  );
}
