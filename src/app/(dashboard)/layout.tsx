"use client";

import { useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useSelector } from "react-redux";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";
import { useActiveShift } from "@/features/shifts/api/use-shifts";
import { cn } from "@/lib/utils";
import { mockAdminNavbar, mockCashierNavbar } from "@/mocks/auth/shell";
import type { RootState } from "@/redux/types";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const isTerminal = pathname === "/pos/terminal" || pathname === "/admin/terminal";
  const authUser = useSelector((state: RootState) => state.auth.user);
  const tenant = useSelector((state: RootState) => state.tenant);
  const authHydrated = useSelector((state: RootState) => state.auth.hydrated);
  const role = authUser
    ? authUser.role === "CASHIER" ? "cashier" : authUser.role === "SUPER_ADMIN" ? "super-admin" : "admin"
    : pathname.startsWith("/admin") ? "admin" : pathname.startsWith("/super-admin") ? "super-admin" : "cashier";
  const activeShift = useActiveShift(authHydrated && role !== "super-admin");
  const navbarModel = useMemo(() => {
    const preview = role === "cashier" ? mockCashierNavbar : mockAdminNavbar;
    const userName = authUser?.fullName ?? authUser?.displayName ?? preview.userName;
    const initials = userName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
    return {
      ...preview,
      userName,
      initials,
      locationName: role === "admin" ? tenant.selectedBranch?.name : role === "cashier" ? authUser?.locationName ?? preview.locationName : undefined,
      shift: activeShift.data ? { status: activeShift.data.status, openingFloat: activeShift.data.openingFloat } : undefined,
    };
  }, [activeShift.data, authUser, role, tenant.selectedBranch?.name]);

  if (!authHydrated) return <div className="min-h-screen animate-pulse bg-slate-50" aria-busy="true" aria-label="Restoring secure session" />;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans selection:bg-[#0052FF] selection:text-white">
      {/* Desktop Left Reusable Animated Sidebar */}
      <Sidebar role={role} activeBusiness={tenant.selectedBusiness} activeBranch={tenant.selectedBranch} className="hidden md:flex" />

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
              <Sidebar role={role} activeBusiness={tenant.selectedBusiness} activeBranch={tenant.selectedBranch} onNavigate={() => setMobileMenuOpen(false)} className="w-full border-r-0" />
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
