"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Boxes,
  LayoutDashboard,
  Receipt,
  ShoppingCart,
  Users,
  Wallet,
  Clock3,
  ChevronsLeft,
} from "lucide-react";
import { BrandLogo } from "@/components/common/brand-logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/domain";

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

export function Sidebar({
  role,
  collapsed,
  onToggle,
}: {
  role: UserRole | null;
  collapsed: boolean;
  onToggle: () => void;
}) {
  const pathname = usePathname();
  const links = role === "CASHIER" ? cashierLinks : adminLinks;

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-border bg-secondary text-secondary-foreground transition-all",
        collapsed ? "w-[76px]" : "w-64",
      )}
    >
      <div className="flex items-center justify-between px-4 py-4">
        {collapsed ? (
          <span className="text-lg font-bold text-primary">S</span>
        ) : (
          <BrandLogo className="[&_p]:text-white [&_.text-primary]:text-primary [&_.text-muted-foreground]:text-white/60" />
        )}
        <Button size="icon" variant="ghost" className="text-white hover:bg-white/10" onClick={onToggle}>
          <ChevronsLeft className={cn("h-4 w-4", collapsed && "rotate-180")} />
        </Button>
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-2">
        {links.map((link) => {
          const active = pathname.startsWith(link.href);
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white",
                active && "bg-primary text-white hover:bg-primary hover:text-white",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {collapsed ? null : link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
