"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart3,
  Boxes,
  ChevronsLeft,
  Clock3,
  LayoutDashboard,
  LogOut,
  Receipt,
  ShoppingCart,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import { BrandLogo } from "@/components/common/brand-logo";
import { cn } from "@/lib/utils";

export type UserRole = "cashier" | "admin";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

// Cashier Workspace: 4 distinct routes
const cashierNavItems: NavItem[] = [
  {
    href: "/pos/terminal",
    label: "Catalog Register",
    icon: ShoppingCart,
  },
  {
    href: "/pos/custom-sale",
    label: "Quick Custom Sale",
    icon: Zap,
  },
  {
    href: "/pos/shifts",
    label: "Shifts",
    icon: Clock3,
  },
  {
    href: "/pos/orders",
    label: "Orders",
    icon: Receipt,
  },
];

// Admin Workspace: 8 routes (Dual Register + Admin Controllers)
const adminNavItems: NavItem[] = [
  {
    href: "/pos/terminal",
    label: "Catalog Register",
    icon: ShoppingCart,
  },
  {
    href: "/pos/custom-sale",
    label: "Quick Custom Sale",
    icon: Zap,
  },
  {
    href: "/admin/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/admin/catalog",
    label: "Catalog",
    icon: Boxes,
  },
  {
    href: "/admin/staff",
    label: "Staff",
    icon: Users,
  },
  {
    href: "/admin/payroll",
    label: "Payroll",
    icon: Wallet,
  },
  {
    href: "/admin/reports",
    label: "Reports",
    icon: BarChart3,
  },
];

interface SidebarProps {
  initialRole?: UserRole;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onNavigate?: () => void;
  className?: string;
}

export function Sidebar({
  initialRole,
  collapsed: externalCollapsed,
  onToggleCollapse,
  onNavigate,
  className,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [internalCollapsed, setInternalCollapsed] = useState(false);

  // Derive active workspace role from current pathname, defaulting intelligently
  const derivedRole: UserRole = pathname.startsWith("/admin") ? "admin" : "cashier";
  const [currentRole, setCurrentRole] = useState<UserRole>(initialRole || derivedRole);

  useEffect(() => {
    if (pathname.startsWith("/admin")) {
      setCurrentRole("admin");
    } else if (pathname.startsWith("/pos") && pathname !== "/pos/terminal") {
      setCurrentRole("cashier");
    }
  }, [pathname]);

  const isCollapsed = externalCollapsed !== undefined ? externalCollapsed : internalCollapsed;
  const toggleCollapse = onToggleCollapse || (() => setInternalCollapsed((prev) => !prev));

  // Render ONLY the authorized items for the selected workspace role
  const visibleItems = currentRole === "admin" ? adminNavItems : cashierNavItems;

  const handleRoleChange = (role: UserRole) => {
    setCurrentRole(role);
    if (role === "admin" && !pathname.startsWith("/admin") && pathname !== "/pos/terminal") {
      router.push("/admin/dashboard");
      onNavigate?.();
    } else if (role === "cashier" && !pathname.startsWith("/pos")) {
      router.push("/pos/terminal");
      onNavigate?.();
    }
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 68 : 260 }}
      transition={{ type: "spring", stiffness: 350, damping: 28 }}
      className={cn(
        "flex h-full flex-col border-r border-slate-800/80 bg-[#070B28] text-slate-300 select-none z-20 shrink-0 overflow-hidden outline-none ring-0",
        className,
      )}
    >
      {/* Brand Header: Clean and completely borderless */}
      <div className="flex h-16 items-center justify-between px-4 shrink-0 bg-[#070B28]">
        <div className="flex items-center overflow-hidden">
          <BrandLogo size="sm" iconOnly={isCollapsed} inverse href="/" />
        </div>

        <motion.button
          type="button"
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.8 }}
          onClick={toggleCollapse}
          className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-white/10 hover:text-white cursor-pointer transition-colors border-0 outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronsLeft
            className={cn("h-4 w-4 transition-transform duration-200", isCollapsed && "rotate-180")}
          />
        </motion.button>
      </div>

      {/* Role Switcher Filter: Borderless, high-taste segmented control */}
      {!isCollapsed && (
        <div className="px-3.5 py-2 shrink-0">
          <div className="flex items-center justify-between mb-1.5 px-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Workspace
            </span>
            <span className="text-xs font-bold text-[#3B82F6] capitalize">
              {currentRole}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1 bg-white/5 p-1 rounded-lg border-0">
            {(["cashier", "admin"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => handleRoleChange(r)}
                className={cn(
                  "py-1.5 text-xs font-semibold rounded-md capitalize cursor-pointer transition-all border-0 outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 select-none",
                  currentRole === r
                    ? "bg-[#0052FF] text-white shadow-xs"
                    : "text-slate-400 hover:text-white hover:bg-white/5",
                )}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Navigation Links with Framer Motion Active Indicator */}
      <nav className="flex flex-1 flex-col gap-1.5 overflow-y-auto p-2.5 overflow-x-hidden">
        {!isCollapsed && (
          <div className="px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-slate-400">
            {currentRole === "admin" ? "Admin Controls" : "Cashier Desk"}
          </div>
        )}

        {visibleItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/admin/dashboard" && pathname.startsWith(item.href + "/"));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => onNavigate?.()}
              title={isCollapsed ? item.label : undefined}
              className={cn(
                "relative flex items-center gap-3.5 rounded-lg px-3 py-2.5 text-[15px] font-medium cursor-pointer transition-colors group",
                "border-0 outline-none ring-0 focus:outline-none focus:ring-0 focus:border-0 focus-visible:outline-none focus-visible:ring-0 select-none",
                isActive
                  ? "text-white font-semibold"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/40",
              )}
            >
              {/* Active Tab Indicator: Smooth primary tint without harsh white borders */}
              {isActive && (
                <motion.div
                  layoutId="activeSidebarIndicator"
                  transition={{ type: "spring", stiffness: 450, damping: 32 }}
                  className="absolute inset-0 rounded-lg bg-[#0052FF] border-0"
                />
              )}

              <span className="relative z-10 flex items-center justify-center">
                <Icon
                  className={cn(
                    "h-5 w-5 shrink-0 transition-colors",
                    isActive ? "text-white" : "text-slate-400 group-hover:text-white",
                  )}
                />
              </span>

              <AnimatePresence>
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.15 }}
                    className="relative z-10 truncate text-[15px]"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </nav>

      {/* Footer: Dedicated Clean Sign Out Button */}
      <div className="p-3 shrink-0">
        <Link
          href="/login"
          onClick={() => onNavigate?.()}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer",
            "border-0 outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 select-none",
            isCollapsed && "justify-center px-0",
          )}
          title="Sign Out"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!isCollapsed && <span>Sign Out</span>}
        </Link>
      </div>
    </motion.aside>
  );
}
