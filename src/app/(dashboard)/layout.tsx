"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";
import { useActiveShift } from "@/features/shifts/api/use-shifts";
import { useBusinessesQuery } from "@/features/tenant/api/use-tenant";
import { mapBusinessToTenantCard } from "@/features/tenant/view-models";
import { tenantPreferences } from "@/lib/tenant-preferences";
import { setAvailableBusinesses, setBusiness, setTenantSelection } from "@/redux/actions/tenantActions";
import { useOffline } from "@/features/offline/ui/offline-provider";
import { offlineDb } from "@/features/offline/db/offline-db";
import { readRegisterWork } from "@/features/offline/services/register-work";
import { getUserInitials } from "@/lib/user-utils";
import { cn } from "@/lib/utils";

import type { BranchItem, BusinessItem, RootState } from "@/redux/types";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const offline = useOffline();
  const dispatch = useDispatch();
  const pathname = usePathname();
  const isTerminal = pathname === "/pos/terminal" || pathname === "/admin/terminal";
  const authUser = useSelector((state: RootState) => state.auth.user);
  const tenant = useSelector((state: RootState) => state.tenant);
  const authHydrated = useSelector((state: RootState) => state.auth.hydrated);

  const sessionUnavailable = useSelector((state: RootState) => state.auth.sessionUnavailable);

  useEffect(() => {
    if (authHydrated && !authUser && !sessionUnavailable) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [authHydrated, authUser, sessionUnavailable, pathname, router]);

  const role = authUser
    ? authUser.role === "CASHIER"
      ? "cashier"
      : authUser.role === "SUPER_ADMIN"
        ? "super-admin"
        : "admin"
    : "cashier";

  const businessesQuery = useBusinessesQuery(role === "admin");

  const lastHydratedUserIdRef = useRef<string | null>(null);
  const selectedBusinessId = tenant.selectedBusiness?.id;
  const selectedBranchId = tenant.selectedBranch?.id;

  // Immediate local storage hydration for Admin so refresh preserves names without flicker
  useEffect(() => {
    if (role !== "admin" || !authUser?.id) return;
    if (lastHydratedUserIdRef.current === authUser.id) return;
    lastHydratedUserIdRef.current = authUser.id;

    const stored = tenantPreferences.getTenantContext(authUser.id);
    if (!stored) return;

    const alreadyMatches =
      selectedBusinessId === stored.businessId &&
      (selectedBranchId ?? null) === (stored.locationId ?? null);
    if (alreadyMatches) return;

    const business: BusinessItem = {
      id: stored.businessId,
      name: stored.businessName,
      code: stored.businessId.slice(0, 6).toUpperCase(),
      status: "ACTIVE",
      branches: stored.locationId
        ? [
            {
              id: stored.locationId,
              businessId: stored.businessId,
              name: stored.locationName ?? "Operational Branch",
              code: stored.locationId.slice(0, 6).toUpperCase(),
              address: null,
              status: "ACTIVE",
            },
          ]
        : [],
    };
    const branch: BranchItem | null = stored.locationId
      ? {
          id: stored.locationId,
          businessId: stored.businessId,
          name: stored.locationName ?? "Operational Branch",
          code: stored.locationId.slice(0, 6).toUpperCase(),
          address: null,
          status: "ACTIVE",
        }
      : null;

    let cancelled = false;
    void readRegisterWork(offlineDb, authUser.id, selectedBusinessId, selectedBranchId).then(work => {
      if (cancelled || work.isOutcomeUnknown || work.hasCart || work.hasHeldTickets) return;
      if (branch) dispatch(setTenantSelection({ business, branch }));
      else if (selectedBusinessId !== business.id) dispatch(setBusiness(business));
    });
    return () => { cancelled = true; };
  }, [authUser?.id, dispatch, role, selectedBranchId, selectedBusinessId]);

  // Reconcile and synchronize with live backend business & branch list
  useEffect(() => {
    if (role !== "admin" || !authUser?.id || !businessesQuery.data?.length) return;
    const businesses = businessesQuery.data.map(mapBusinessToTenantCard);

    const currentAvailableIds = tenant.availableBusinesses.map((b) => b.id).join(",");
    const newAvailableIds = businesses.map((b) => b.id).join(",");
    if (currentAvailableIds !== newAvailableIds) {
      dispatch(setAvailableBusinesses(businesses));
    }

    let cancelled = false;
    void (async () => {
      const work = await readRegisterWork(offlineDb, authUser.id, selectedBusinessId, selectedBranchId);
      if (cancelled) return;
      const hasWork = work.isOutcomeUnknown || work.hasCart || work.hasHeldTickets;
      const stored = tenantPreferences.getTenantContext(authUser.id);
      const targetBusinessId = stored?.businessId ?? selectedBusinessId;
      if (!targetBusinessId) return; // Selection is an explicit operator action.
      const business = businesses.find(item => item.id === targetBusinessId);
      if (!business) {
        if (offline.mode === "OFFLINE" || hasWork) return;
        tenantPreferences.clearAll(authUser.id);
        dispatch(setBusiness(null));
        return;
      }
      const targetLocationId = stored?.locationId ?? selectedBranchId;
      const branch = targetLocationId ? business.branches.find(item => item.id === targetLocationId) ?? null : null;
      const alreadyMatches = selectedBusinessId === business.id && (selectedBranchId ?? null) === (branch?.id ?? null);
      if (alreadyMatches || hasWork) return;
      if (branch) dispatch(setTenantSelection({ business, branch }));
      else dispatch(setBusiness(business));
    })();
    return () => { cancelled = true; };
  }, [authUser?.id, businessesQuery.data, dispatch, offline.mode, role, selectedBranchId, selectedBusinessId, tenant.availableBusinesses]);

  const effectiveLocationId =
    role === "admin"
      ? (tenant.selectedBranch?.id ?? (authUser?.id ? tenantPreferences.getTenantContext(authUser.id)?.locationId : undefined))
      : authUser?.locationId;

  const effectiveBusinessId =
    role === "admin"
      ? (tenant.selectedBusiness?.id ?? (authUser?.id ? tenantPreferences.getTenantContext(authUser.id)?.businessId : undefined))
      : authUser?.businessId;

  const activeShift = useActiveShift(
    { locationId: effectiveLocationId ?? undefined, businessId: effectiveBusinessId ?? undefined },
    authHydrated && Boolean(authUser) && role !== "super-admin" && (role === "cashier" || Boolean(effectiveLocationId)),
  );

  const navbarModel = useMemo(() => {
    if (!authUser) {
      return {
        userName: "Authenticating...",
        initials: "AU",
      };
    }
    const userName = authUser.fullName || authUser.displayName || authUser.email || "Authenticated User";
    const initials = getUserInitials(userName);

    return {
      userName,
      initials,
      profileImageUrl: authUser.profileImageUrl,
      role: authUser.role,
      locationName:
        (role === "admin"
          ? (tenant.selectedBranch?.name ?? (authUser?.id ? tenantPreferences.getTenantContext(authUser.id)?.locationName : undefined))
          : role === "cashier"
            ? authUser.locationName
            : undefined) ?? undefined,
      shift: activeShift.data
        ? { status: activeShift.data.status, openingFloat: activeShift.data.openingFloat }
        : undefined,
    };
  }, [activeShift.data, authUser, role, tenant.selectedBranch?.name]);

  const authUserId = authUser?.id;
  const storedContext = useMemo(() => {
    if (role !== "admin" || !authUserId) return null;
    return tenantPreferences.getTenantContext(authUserId);
  }, [authUserId, role]);

  const activeBusiness: BusinessItem | null =
    tenant.selectedBusiness ??
    (storedContext
      ? {
          id: storedContext.businessId,
          name: storedContext.businessName,
          code: storedContext.businessId.slice(0, 6).toUpperCase(),
          status: "ACTIVE",
          branches: [],
        }
      : null);

  const activeBranch: BranchItem | null =
    tenant.selectedBranch ??
    (storedContext?.locationId
      ? {
          id: storedContext.locationId,
          businessId: storedContext.businessId,
          name: storedContext.locationName ?? "Operational Branch",
          code: storedContext.locationId.slice(0, 6).toUpperCase(),
          address: null,
          status: "ACTIVE",
        }
      : null);

  if (sessionUnavailable && !authUser && !offline.ready) {
    return (
      <main className="grid min-h-screen place-content-center gap-4 bg-slate-50 p-6 text-center">
        <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-3">
          <h1 className="text-xl font-semibold text-[#070B28]">Offline session unavailable</h1>
          <p className="text-sm text-slate-600">
            {offline.error || "Reconnect to the server and sign in to continue."}
          </p>
          <button
            type="button"
            className="mx-auto rounded-lg bg-[#0052FF] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0047E0] cursor-pointer"
            onClick={() => window.location.assign("/login")}
          >
            Go to Sign In
          </button>
        </div>
      </main>
    );
  }

  if (!authHydrated || !authUser) {
    return (
      <div
        className="min-h-screen animate-pulse bg-slate-50"
        aria-busy="true"
        aria-label="Restoring secure session"
      />
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 font-sans selection:bg-[#0052FF] selection:text-white">
      {/* Desktop Left Reusable Animated Sidebar */}
      <Sidebar role={role} activeBusiness={activeBusiness} activeBranch={activeBranch} className="hidden md:flex" />

      {/* Mobile Slide-Over Sheet Navbar */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-[#070B28]/70 backdrop-blur-xs cursor-pointer"
            />

            {/* Slide-in Sheet Panel */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
              className="relative z-10 flex h-full w-[280px] max-w-[85vw] flex-col bg-[#070B28] shadow-2xl"
            >
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="absolute right-3 top-4 z-30 flex h-8 w-8 items-center justify-center rounded-md bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white cursor-pointer transition-colors"
                title="Close Navigation"
              >
                <X className="h-4 w-4" />
              </button>
              <Sidebar role={role} activeBusiness={activeBusiness} activeBranch={activeBranch} onNavigate={() => setMobileMenuOpen(false)} className="w-full border-r-0" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Right Column: Navbar + Main View */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Top Navbar: Minimal, high-taste enterprise cockpit standard */}
        <Navbar viewModel={navbarModel} onOpenMobileMenu={() => setMobileMenuOpen(true)} />

        {/* Main Area: Full-bleed and overflow-hidden for POS Terminal; standard padded view for all other pages */}
        <main
          className={cn(
            "flex-1 min-h-0 min-w-0",
            isTerminal
              ? "flex flex-col overflow-hidden bg-white p-0"
              : "overflow-y-auto overflow-x-hidden bg-slate-50 p-4 sm:p-6 lg:p-8",
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
