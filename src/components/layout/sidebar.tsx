"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { BarChart3, Boxes, Building2, ChevronRight, ChevronsLeft, ClipboardList, Clock3, LayoutDashboard, LogOut, Receipt, ShieldAlert, ShieldCheck, ShoppingCart, Store, Users, Wallet, Zap } from "lucide-react";
import { useSelector } from "react-redux";
import { BrandLogo } from "@/components/common/brand-logo";
import { useSignOut } from "@/features/auth/hooks/use-sign-out";
import { tenantPreferences } from "@/lib/tenant-preferences";
import { cn } from "@/lib/utils";
import type { BranchItem, BusinessItem, RootState } from "@/redux/types";

export type WorkspaceRole = "cashier" | "admin" | "super-admin";
interface NavItem { href: string; label: string; icon: React.ComponentType<{ className?: string }>; }

const cashierNavItems: NavItem[] = [
  { href: "/pos/custom-sale", label: "Quick Custom Sale", icon: Zap },
  { href: "/pos/terminal", label: "Catalog Register", icon: ShoppingCart },
  { href: "/pos/shifts", label: "Shifts", icon: Clock3 },
  { href: "/pos/orders", label: "Orders", icon: Receipt },
];
const adminNavItems: NavItem[] = [
  { href: "/admin/terminal", label: "Catalog Register", icon: ShoppingCart },
  { href: "/admin/custom-sale", label: "Quick Custom Sale", icon: Zap },
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Store Orders", icon: ClipboardList },
  { href: "/admin/catalog", label: "Catalog", icon: Boxes },
  { href: "/admin/staff", label: "Staff", icon: Users },
  { href: "/admin/payroll", label: "Payroll", icon: Wallet },
  { href: "/admin/expenses", label: "Expenses", icon: Receipt },
  { href: "/admin/reports", label: "Reports", icon: BarChart3 },
  { href: "/admin/audit-logs", label: "Audit Logs", icon: ShieldAlert },
];
const platformNavItems: NavItem[] = [{ href: "/super-admin", label: "Platform users", icon: ShieldCheck }];

interface SidebarProps {
  role: WorkspaceRole;
  activeBusiness?: BusinessItem | null;
  activeBranch?: BranchItem | null;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onNavigate?: () => void;
  className?: string;
}

export function Sidebar({ role, activeBusiness, activeBranch, collapsed: externalCollapsed, onToggleCollapse, onNavigate, className }: SidebarProps) {
  const pathname = usePathname();
  const { signOut, isPending } = useSignOut();
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const isCollapsed = externalCollapsed ?? internalCollapsed;
  const toggleCollapse = onToggleCollapse ?? (() => setInternalCollapsed((value) => !value));
  const visibleItems = role === "admin" ? adminNavItems : role === "cashier" ? cashierNavItems : platformNavItems;

  const userId = useSelector((state: RootState) => state.auth.user?.id);
  const fallback = useMemo(() => {
    if (role !== "admin" || !userId) return null;
    return tenantPreferences.getTenantContext(userId);
  }, [role, userId]);

  const displayBusinessName = activeBusiness?.name || fallback?.businessName || "No business selected";
  const displayBranchName = activeBranch?.name || fallback?.locationName || "No branch selected";

  return (
    <motion.aside initial={false} animate={{ width: isCollapsed ? 68 : 260 }} transition={{ type: "spring", stiffness: 350, damping: 28 }} className={cn("flex h-full flex-col border-r border-slate-800/80 bg-[#070B28] text-slate-300 z-20 shrink-0 overflow-hidden", className)}>
      <div className="flex h-16 items-center justify-between px-4 shrink-0">
        <BrandLogo size="sm" iconOnly={isCollapsed} inverse href="/" />
        <button type="button" onClick={toggleCollapse} className="flex h-9 w-9 items-center justify-center rounded-md text-slate-400 hover:bg-white/10 hover:text-white" aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}>
          <ChevronsLeft className={cn("h-4 w-4 transition-transform", isCollapsed && "rotate-180")} aria-hidden="true" />
        </button>
      </div>

      {!isCollapsed ? (
        <div className="px-3.5 py-2">
          <div className="rounded-lg bg-white/5 px-3 py-2 text-xs">
            <span className="text-slate-400">Authenticated workspace</span>
            <p className="mt-0.5 font-semibold capitalize text-white">{role}</p>
          </div>
        </div>
      ) : null}

      {role === "admin" ? (
        <div className={cn("my-1.5 shrink-0", isCollapsed ? "px-2" : "px-3.5")}>
          <Link href="/admin/select-business" onClick={onNavigate} className={cn("group flex rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08]", isCollapsed ? "h-10 items-center justify-center" : "flex-col p-3")}>
            {isCollapsed ? <Building2 className="h-4 w-4 text-[#3B82F6]" aria-hidden="true" /> : (
              <>
                <div className="flex w-full items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400"><Building2 className="h-3.5 w-3.5 text-[#3B82F6]" aria-hidden="true" />Active business</div>
                <div className="mt-1 w-full truncate text-xs font-semibold text-white">{displayBusinessName}</div>
                <div className="mt-2 flex w-full items-center justify-between gap-2 border-t border-white/5 pt-2 text-[11px]"><span className="flex min-w-0 items-center gap-1.5 text-slate-300"><Store className="h-3 w-3 text-blue-400 shrink-0" aria-hidden="true" /><span className="truncate">{displayBranchName}</span></span><span className="flex items-center text-[#3B82F6]">Switch<ChevronRight className="h-3 w-3" /></span></div>
              </>
            )}
          </Link>
        </div>
      ) : null}

      <nav className="flex flex-1 flex-col gap-1.5 overflow-y-auto p-2.5 overflow-x-hidden">
        {!isCollapsed ? <div className="px-2.5 py-1 text-xs font-medium uppercase tracking-wider text-slate-400">{role === "admin" ? "Admin controls" : "Cashier desk"}</div> : null}
        {visibleItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return <Link key={item.href} href={item.href} onClick={onNavigate} title={isCollapsed ? item.label : undefined} className={cn("relative flex items-center gap-3.5 rounded-lg px-3 py-2.5 text-[15px] font-medium transition-colors", active ? "text-white" : "text-slate-400 hover:bg-slate-800/40 hover:text-white")}>
            {active ? <motion.div layoutId="activeSidebarIndicator" className="absolute inset-0 rounded-lg bg-[#0052FF]" /> : null}
            <Icon className="relative z-10 h-5 w-5 shrink-0" aria-hidden="true" />
            <AnimatePresence>{!isCollapsed ? <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative z-10 truncate">{item.label}</motion.span> : null}</AnimatePresence>
          </Link>;
        })}
      </nav>
      <div className="p-3"><button type="button" disabled={isPending} onClick={() => void signOut()} className={cn("flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 disabled:opacity-50", isCollapsed && "justify-center px-0")} aria-label="Sign out"><LogOut className="h-5 w-5" aria-hidden="true" />{!isCollapsed ? <span>{isPending ? "Signing out…" : "Sign out"}</span> : null}</button></div>
    </motion.aside>
  );
}
