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
import { cn } from "@/lib/utils";

import type { BranchItem, BusinessItem, RootState } from "@/redux/types";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const dispatch = useDispatch();
  const pathname = usePathname();
  const isTerminal = pathname === "/pos/terminal" || pathname === "/admin/terminal";
  const authUser = useSelector((state: RootState) => state.auth.user);
  const tenant = useSelector((state: RootState) => state.tenant);
  const authHydrated = useSelector((state: RootState) => state.auth.hydrated);

  useEffect(() => {
    if (authHydrated && !authUser) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [authHydrated, authUser, pathname, router]);

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

    if (branch) {
      dispatch(setTenantSelection({ business, branch }));
    } else if (selectedBusinessId !== business.id) {
      dispatch(setBusiness(business));
    }
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

    const stored = tenantPreferences.getTenantContext(authUser.id);
    const targetBusinessId = stored?.businessId ?? selectedBusinessId ?? businesses[0]?.id;
    const business = businesses.find((b) => b.id === targetBusinessId) ?? businesses[0];

    if (business) {
      const targetLocationId = stored?.locationId ?? selectedBranchId ?? business.branches[0]?.id;
      const branch = business.branches.find((b) => b.id === targetLocationId) ?? business.branches[0];

      const alreadyMatches =
        selectedBusinessId === business.id &&
        (selectedBranchId ?? null) === (branch?.id ?? null);

      if (!alreadyMatches) {
        if (branch) {
          dispatch(setTenantSelection({ business, branch }));
          tenantPreferences.setTenantContext(authUser.id, { business, branch });
        } else {
          dispatch(setBusiness(business));
          tenantPreferences.setTenantContext(authUser.id, { business, branch: null });
        }
      }
    }
  }, [authUser?.id, businessesQuery.data, dispatch, role, selectedBranchId, selectedBusinessId, tenant.availableBusinesses]);

  const effectiveLocationId =
    role === "admin"
      ? (tenant.selectedBranch?.id ?? (authUser?.id ? tenantPreferences.getTenantContext(authUser.id)?.locationId : undefined))
      : authUser?.locationId;

  const activeShift = useActiveShift(
    effectiveLocationId ?? undefined,
    authHydrated && Boolean(authUser) && role !== "super-admin" && (role === "cashier" || Boolean(effectiveLocationId)),
  );

  const navbarModel = useMemo(() => {
    if (!authUser) {
      return {
        userName: "Authenticating...",
        initials: "AP",
      };
    }
    const userName = authUser.fullName || authUser.displayName || authUser.email || "Authenticated User";
    const initials =
      userName
        .split(/\s+/)
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase() || "AU";

    return {
      userName,
      initials,
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
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans selection:bg-[#0052FF] selection:text-white">
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
            "flex-1 min-h-0",
            isTerminal
              ? "flex flex-col overflow-hidden bg-white p-0"
              : "overflow-auto bg-slate-50 p-4 sm:p-6 lg:p-8",
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
