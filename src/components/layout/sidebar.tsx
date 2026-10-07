"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Boxes,
  ChevronsLeft,
  Clock3,
  LayoutDashboard,
  Receipt,
  ShoppingCart,
  Users,
  Wallet,
} from "lucide-react";
import { BrandLogo } from "@/components/common/brand-logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const adminLinks = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/catalog", label: "Catalog", icon: Boxes },
  { href: "/admin/staff", label: "Staff", icon: Users },
  { href: "/admin/payroll", label: "Payroll", icon: Wallet },
  { href: "/admin/reports", label: "Reports", icon: BarChart3 },
];

const cashierLinks = [
  { href: "/pos/terminal", label: "Terminal", icon: ShoppingCart },
  { href: "/pos/shifts", label: "Shifts", icon: Clock3 },
  { href: "/pos/orders", label: "Orders", icon: Receipt },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const isPos = pathname.startsWith("/pos");
  const links = isPos ? cashierLinks : adminLinks;

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-slate-800 bg-[#070B28] text-white transition-all select-none",
        collapsed ? "w-[72px]" : "w-64",
      )}
    >
      <div className="flex h-14 items-center justify-between border-b border-white/10 px-4">
        {collapsed ? (
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#0052FF] text-base font-bold text-white">
            S
          </div>
        ) : (
          <BrandLogo className="[&_p]:text-white [&_.text-primary]:text-[#0052FF] [&_.text-muted-foreground]:text-white/60" />
        )}
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-white/70 hover:bg-white/10 hover:text-white"
          onClick={() => setCollapsed((prev) => !prev)}
        >
          <ChevronsLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
        </Button>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-2">
        <div className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          {collapsed ? "" : isPos ? "Register Suite" : "Enterprise Admin"}
        </div>
        {links.map((link) => {
          const active = pathname === link.href || pathname.startsWith(link.href + "/");
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-[#0052FF] text-white"
                  : "text-slate-300 hover:bg-white/10 hover:text-white",
              )}
              title={collapsed ? link.label : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {collapsed ? null : <span>{link.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-2">
        <Link
          href={isPos ? "/admin/dashboard" : "/pos/terminal"}
          className="flex items-center justify-center gap-2 rounded-md border border-white/15 bg-white/5 px-2 py-2 text-xs font-medium text-white/80 transition-colors hover:bg-white/15 hover:text-white"
        >
          {collapsed ? (isPos ? "ADM" : "POS") : (isPos ? "Switch to Admin Suite" : "Switch to POS Terminal")}
        </Link>
      </div>
    </aside>
  );
}
