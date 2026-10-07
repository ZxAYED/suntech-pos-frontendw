"use client";

import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { useDashboardQuery } from "@/redux/api/reportsApi";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/types";

export default function AdminDashboardPage() {
  const role = useSelector((state: RootState) => state.auth.user?.role ?? "ADMIN");
  const dashboard = useDashboardQuery(role);

  return (
    <div>
      <PageHeader title="Operations" accent="overview" description="Live retail performance for this business." />
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Daily revenue" valueCents={dashboard.data?.dailyRevenue ?? 0} />
        <StatCard label="30-day volume" valueCents={dashboard.data?.volume30d ?? 0} />
        <StatCard label="Orders today" value={String(dashboard.data?.orderCountToday ?? 0)} />
      </div>
    </div>
  );
}
