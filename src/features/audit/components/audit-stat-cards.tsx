"use client";

import { useMemo } from "react";
import {
  ShieldCheck,
  AlertTriangle,
  KeyRound,
  Coins,
} from "lucide-react";
import { MetricCard } from "@/components/common/metric-card";
import type { AuditLogItem } from "@/features/audit/api/use-audit-logs";

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
        act.includes("SALARY") ||
        act.includes("REFUND") ||
        act.includes("PAYROLL") ||
        item.entityType.toUpperCase() === "EXPENSE"
      ) {
        financialUpdates++;
      } else if (
        act.includes("PASSWORD") ||
        act.includes("ROLE") ||
        act.includes("AUTH") ||
        item.entityType.toUpperCase() === "USER"
      ) {
        securityEvents++;
      }
    }

    return { stockAlerts, securityEvents, financialUpdates };
  }, [items]);

  const viewQualifier = isFiltered ? "in filtered view" : "in current page view";

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard
        label="Total Activity Logs"
        value={totalCount.toLocaleString()}
        subtext="Recorded system-wide audit trail"
        icon={ShieldCheck}
        iconColor="text-[#0052FF]"
      />
      <MetricCard
        label="Stock & Inventory Alerts"
        value={stats.stockAlerts.toLocaleString()}
        subtext={`Low stock & anomaly events ${viewQualifier}`}
        icon={AlertTriangle}
        iconColor="text-amber-600"
      />
      <MetricCard
        label="Security & Staff Actions"
        value={stats.securityEvents.toLocaleString()}
        subtext={`Password resets & role updates ${viewQualifier}`}
        icon={KeyRound}
        iconColor="text-purple-600"
      />
      <MetricCard
        label="Financial & HR Governance"
        value={stats.financialUpdates.toLocaleString()}
        subtext={`Salary adjustments & refunds ${viewQualifier}`}
        icon={Coins}
        iconColor="text-emerald-600"
      />
    </div>
  );
}

