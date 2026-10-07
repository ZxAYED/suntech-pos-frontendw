"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";
import { AUTH_STORAGE_KEY } from "@/lib/utils";
import { hydrateAuth } from "@/redux/actions/authActions";
import { useActiveShiftQuery } from "@/redux/api/shiftsApi";
import { setActiveShift } from "@/redux/actions/shiftActions";
import type { RootState } from "@/redux/types";
import type { AuthSession } from "@/types/domain";

export function DashboardShell({ children }: { children: ReactNode }) {
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const { user, hydrated, accessToken } = useSelector((state: RootState) => state.auth);
  const [collapsed, setCollapsed] = useState(false);
  const shiftQuery = useActiveShiftQuery(undefined, { enabled: Boolean(accessToken) });

  useEffect(() => {
    if (hydrated) return;
    try {
      const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
      dispatch(hydrateAuth(raw ? (JSON.parse(raw) as AuthSession) : null));
    } catch {
      dispatch(hydrateAuth(null));
    }
  }, [dispatch, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    const isAdminPath = pathname.startsWith("/admin");
    const isPosPath = pathname.startsWith("/pos");
    if (user.role === "CASHIER" && isAdminPath) {
      router.replace("/pos/terminal");
    }
    if ((user.role === "ADMIN" || user.role === "SUPER_ADMIN") && isPosPath) {
      router.replace("/admin/dashboard");
    }
  }, [hydrated, pathname, router, user]);

  useEffect(() => {
    if (shiftQuery.data) {
      dispatch(setActiveShift(shiftQuery.data));
    }
  }, [dispatch, shiftQuery.data]);

  if (!hydrated || !user) {
    return <div className="flex h-screen items-center justify-center text-sm text-muted-foreground">Loading register…</div>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar role={user.role} collapsed={collapsed} onToggle={() => setCollapsed((value) => !value)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
