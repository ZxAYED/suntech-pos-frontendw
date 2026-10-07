"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Boxes,
  ChevronsLeft,
  Clock3,
  LayoutDashboard,
  LogOut,
  MapPin,
  ShoppingCart,
  Users,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavLinkItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const mainNavLinks: NavLinkItem[] = [
  { href: "/pos/terminal", label: "Cashier Terminal", icon: ShoppingCart },
  { href: "/admin/dashboard", label: "Admin Dashboard", icon: LayoutDashboard },
  { href: "/admin/catalog", label: "Product Catalog", icon: Boxes },
  { href: "/pos/shifts", label: "Shift Balancing", icon: Clock3 },
  { href: "/admin/staff", label: "Staff & Attendance", icon: Users },
  { href: "/admin/payroll", label: "Payroll Ledger", icon: Wallet },
  { href: "/admin/reports", label: "Financial Reports", icon: BarChart3 },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans selection:bg-[#0052FF] selection:text-white">
      {/* Task 2: Left Sidebar - Collapsible with 1px border and exact text hierarchy */}
      <aside
        className={cn(
          "flex h-full flex-col border-r border-slate-200 bg-white transition-all duration-200 select-none z-20 shrink-0",
          collapsed ? "w-16" : "w-64",
        )}
      >
        {/* Brand Header */}
        <div className="flex h-14 items-center justify-between border-b border-slate-200 px-3.5">
          {collapsed ? (
            <Link
              href="/"
              className="flex h-8 w-8 items-center justify-center rounded-md bg-[#0052FF] text-sm font-bold text-white shadow-sm"
              title="SunTech POS"
            >
              S
            </Link>
          ) : (
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#0052FF] text-sm font-bold text-white shadow-sm">
                S
              </div>
              <div>
                <span className="text-sm font-bold tracking-tight text-[#070B28]">
                  SunTech <span className="text-[#0052FF]">POS</span>
                </span>
                <span className="block text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                  Bangladesh Retail
                </span>
              </div>
            </Link>
          )}

          <button
            type="button"
            onClick={() => setCollapsed((prev) => !prev)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-[#070B28] transition-colors"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronsLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-2">
          {!collapsed && (
            <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Operations Menu
            </div>
          )}

          {mainNavLinks.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin/dashboard" && pathname.startsWith(item.href + "/"));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-md px-2.5 py-2 text-xs transition-colors",
                  isActive
                    ? "bg-slate-100 text-[#070B28] font-semibold shadow-xs"
                    : "text-slate-500 hover:bg-slate-100 hover:text-[#070B28]",
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0 transition-colors",
                    isActive ? "text-[#0052FF]" : "text-slate-500",
                  )}
                />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Switcher / Mode strip */}
        <div className="border-t border-slate-200 p-2">
          {collapsed ? (
            <Link
              href={pathname.startsWith("/pos") ? "/admin/dashboard" : "/pos/terminal"}
              className="flex h-8 w-full items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-[11px] font-bold text-[#070B28] hover:bg-slate-100"
              title={pathname.startsWith("/pos") ? "Switch to Admin" : "Switch to POS"}
            >
              {pathname.startsWith("/pos") ? "ADM" : "POS"}
            </Link>
          ) : (
            <Link
              href={pathname.startsWith("/pos") ? "/admin/dashboard" : "/pos/terminal"}
              className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs font-semibold text-[#070B28] hover:bg-slate-100 transition-colors"
            >
              <span>{pathname.startsWith("/pos") ? "Switch to Admin" : "Switch to POS"}</span>
              <span className="font-mono text-[10px] uppercase text-[#0052FF] bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                Alt+Tab
              </span>
            </Link>
          )}
        </div>
      </aside>

      {/* Right Column: Navbar + Main View */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Task 2: Top Navbar */}
        <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 shrink-0 z-10">
          {/* Shift status chip & store location */}
          <div className="flex items-center gap-3">
            {/* Exact Prompt Chip: Shift Open: Float 10,000 BDT in text-[#070B28] */}
            <div className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs shadow-xs">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-medium text-slate-700">Shift Open:</span>
              <span className="font-mono font-bold text-[#070B28] tabular-nums">
                Float 10,000 BDT
              </span>
            </div>

            {/* Store Hub info */}
            <div className="hidden md:inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700">
              <MapPin className="h-3.5 w-3.5 text-[#0052FF]" />
              <span>Jamuna Future Park (Lane 01)</span>
            </div>
          </div>

          {/* Quick Keyboard Shortcut Triggers + Active Cashier Profile */}
          <div className="flex items-center gap-4">
            {/* Quick Keyboard Shortcut Triggers */}
            <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-500">
              <div className="flex items-center gap-1 rounded border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-[11px] text-slate-700">
                <kbd className="font-bold text-[#070B28]">F2</kbd>
                <span className="text-slate-500">Search</span>
              </div>
              <div className="flex items-center gap-1 rounded border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-[11px] text-slate-700">
                <kbd className="font-bold text-[#070B28]">F4</kbd>
                <span className="text-slate-500">Barcode</span>
              </div>
              <div className="flex items-center gap-1 rounded border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-[11px] text-slate-700">
                <kbd className="font-bold text-[#070B28]">F9</kbd>
                <span className="text-slate-500">COD Pay</span>
              </div>
            </div>

            {/* Active Cashier Profile */}
            <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
              <div className="text-right">
                <p className="text-xs font-semibold text-[#070B28]">Alex Rivera</p>
                <p className="text-[11px] font-medium text-slate-500">Active Cashier</p>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-xs font-bold text-[#070B28]">
                AR
              </div>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white p-1.5 text-slate-500 hover:bg-slate-100 hover:text-[#070B28] transition-colors"
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </header>

        {/* Task 2: Main Area - Wraps {children} with bg-slate-50 */}
        <main className="flex-1 overflow-auto bg-slate-50 p-4">
          {children}
        </main>
      </div>
    </div>
  );
}
