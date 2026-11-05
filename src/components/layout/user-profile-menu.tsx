"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, LayoutDashboard, LogOut, Shield, Store } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSignOut } from "@/features/auth/hooks/use-sign-out";
import { getUserInitials } from "@/lib/user-utils";
import { cn } from "@/lib/utils";
import type { User, UserRole } from "@/types/domain";

export interface UserProfileMenuProps {
  user: User;
  showName?: boolean;
  className?: string;
  align?: "start" | "end" | "center";
}

function getWorkspaceDestination(role: UserRole): { href: string; label: string } {
  switch (role) {
    case "SUPER_ADMIN":
      return { href: "/super-admin", label: "Super Admin Portal" };
    case "CASHIER":
      return { href: "/pos/terminal", label: "POS Terminal" };
    case "ADMIN":
    default:
      return { href: "/admin/dashboard", label: "Admin Dashboard" };
  }
}

export function UserProfileMenu({
  user,
  showName = true,
  className,
  align = "end",
}: UserProfileMenuProps) {
  const [imageError, setImageError] = useState(false);
  const { signOut, isPending } = useSignOut();

  const displayName = user.fullName || user.displayName || user.email || "Authenticated User";
  const initials = getUserInitials(displayName);
  const workspace = getWorkspaceDestination(user.role);
  const showImage = Boolean(user.profileImageUrl && !imageError);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "group flex items-center gap-2 sm:gap-2.5 rounded-full p-1 sm:px-2.5 sm:py-1.5 text-left transition-colors hover:bg-slate-100/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0052FF] cursor-pointer",
            className,
          )}
          aria-label="User account menu"
        >
          {/* Circular Profile Avatar */}
          <div className="relative flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs sm:text-xs font-semibold text-[#070B28] border border-slate-200 overflow-hidden shadow-xs select-none">
            {showImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.profileImageUrl!}
                alt={displayName}
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
                onError={() => setImageError(true)}
              />
            ) : (
              <span>{initials}</span>
            )}
          </div>

          {/* User Name */}
          {showName ? (
            <span className="hidden sm:inline text-xs sm:text-sm font-semibold text-[#070B28] max-w-[130px] md:max-w-[160px] truncate">
              {displayName}
            </span>
          ) : null}

          <ChevronDown
            className="hidden sm:inline h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 transition-transform duration-200 group-data-[state=open]:rotate-180 shrink-0"
            aria-hidden="true"
          />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align={align}
        sideOffset={6}
        className="w-64 p-1.5 bg-white rounded-xl shadow-xl border border-slate-200 z-50 font-sans"
      >
        {/* User Info Header Card */}
        <div className="p-2 flex items-center gap-3">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-[#070B28] border border-slate-200 overflow-hidden">
            {showImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.profileImageUrl!}
                alt={displayName}
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span>{initials}</span>
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">{displayName}</p>
            {user.email ? (
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            ) : user.publicId ? (
              <p className="text-xs text-slate-500 font-mono">{user.publicId}</p>
            ) : null}
            <div className="mt-1 flex items-center gap-1.5">
              <span className="inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider bg-blue-50 text-[#0052FF] border border-blue-100">
                {user.role}
              </span>
            </div>
          </div>
        </div>

        <DropdownMenuSeparator className="my-1 border-slate-100" />

        {/* Primary Workspace Link */}
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link
            href={workspace.href}
            className="flex items-center gap-2 px-2.5 py-2 text-xs sm:text-sm font-medium text-slate-700 hover:text-[#0052FF] hover:bg-slate-50 rounded-lg transition-colors"
          >
            <LayoutDashboard className="h-4 w-4 text-slate-500 shrink-0" />
            <span>{workspace.label}</span>
          </Link>
        </DropdownMenuItem>

        {user.role === "ADMIN" ? (
          <DropdownMenuItem asChild className="cursor-pointer">
            <Link
              href="/admin/select-business"
              className="flex items-center gap-2 px-2.5 py-2 text-xs sm:text-sm font-medium text-slate-700 hover:text-[#0052FF] hover:bg-slate-50 rounded-lg transition-colors"
            >
              <Store className="h-4 w-4 text-slate-500 shrink-0" />
              <span>Switch Business</span>
            </Link>
          </DropdownMenuItem>
        ) : null}

        {user.role === "SUPER_ADMIN" ? (
          <DropdownMenuItem asChild className="cursor-pointer">
            <Link
              href="/super-admin"
              className="flex items-center gap-2 px-2.5 py-2 text-xs sm:text-sm font-medium text-slate-700 hover:text-[#0052FF] hover:bg-slate-50 rounded-lg transition-colors"
            >
              <Shield className="h-4 w-4 text-slate-500 shrink-0" />
              <span>Super Admin</span>
            </Link>
          </DropdownMenuItem>
        ) : null}

        <DropdownMenuSeparator className="my-1 border-slate-100" />

        {/* Logout Button */}
        <DropdownMenuItem
          onClick={() => void signOut()}
          disabled={isPending}
          className="flex items-center gap-2 px-2.5 py-2 text-xs sm:text-sm font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{isPending ? "Signing out..." : "Log Out"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
