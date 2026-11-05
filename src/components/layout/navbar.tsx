"use client";

import { useState } from "react";
import { ChevronDown, LogOut, MapPin, Menu } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSignOut } from "@/features/auth/hooks/use-sign-out";
import { formatBDT } from "@/lib/utils";

export interface NavbarViewModel {
  userName: string;
  initials: string;
  profileImageUrl?: string | null;
  role?: string;
  locationName?: string;
  shift?: {
    status: "OPEN" | "CLOSED" | "UNKNOWN";
    openingFloat?: number;
  };
}

interface NavbarProps {
  viewModel: NavbarViewModel;
  onOpenMobileMenu?: () => void;
}

export function Navbar({ viewModel, onOpenMobileMenu }: NavbarProps) {
  const [imageError, setImageError] = useState(false);
  const { signOut, isPending } = useSignOut();
  const shiftLabel =
    viewModel.shift?.status === "OPEN"
      ? `Shift open${viewModel.shift.openingFloat !== undefined ? ` · Float ${formatBDT(viewModel.shift.openingFloat)}` : ""}`
      : viewModel.shift?.status === "CLOSED"
        ? "Shift closed"
        : "No active shift";

  const showImage = Boolean(viewModel.profileImageUrl && !imageError);

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-3 sm:px-6 shrink-0 z-10 font-sans">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {onOpenMobileMenu ? (
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="md:hidden flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
        ) : null}

        <div className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs sm:text-sm whitespace-nowrap">
          <span className={`h-2 w-2 rounded-full ${viewModel.shift?.status === "OPEN" ? "bg-emerald-500" : "bg-slate-300"}`} />
          <span className="font-medium text-slate-700">{shiftLabel}</span>
        </div>

        {viewModel.locationName ? (
          <div className="hidden md:inline-flex items-center gap-1.5 text-sm text-slate-500 font-medium truncate">
            <MapPin className="h-4 w-4 text-[#0052FF] shrink-0" aria-hidden="true" />
            <span className="truncate">{viewModel.locationName}</span>
          </div>
        ) : null}
      </div>

      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 sm:gap-2.5 rounded-full sm:rounded-lg p-1 sm:px-2.5 sm:py-1.5 text-left transition-colors hover:bg-slate-100/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0052FF] cursor-pointer"
              aria-label="User profile menu"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-[#070B28] border border-slate-200 overflow-hidden shrink-0 select-none shadow-xs">
                {showImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={viewModel.profileImageUrl!}
                    alt={viewModel.userName}
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <span>{viewModel.initials}</span>
                )}
              </div>
              <span className="hidden sm:inline text-sm font-medium text-[#070B28] max-w-[130px] truncate">
                {viewModel.userName}
              </span>
              <ChevronDown className="hidden sm:inline h-3.5 w-3.5 text-slate-400 shrink-0" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" sideOffset={6} className="w-56 p-1.5 bg-white rounded-xl shadow-xl border border-slate-200 z-50 font-sans">
            <div className="p-2 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-[#070B28] border border-slate-200 overflow-hidden">
                {showImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={viewModel.profileImageUrl!}
                    alt={viewModel.userName}
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span>{viewModel.initials}</span>
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{viewModel.userName}</p>
                {viewModel.role ? (
                  <span className="inline-flex items-center mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider bg-blue-50 text-[#0052FF] border border-blue-100 w-fit">
                    {viewModel.role}
                  </span>
                ) : null}
              </div>
            </div>

            <DropdownMenuSeparator className="my-1 border-slate-100" />

            <DropdownMenuItem
              onClick={() => void signOut()}
              disabled={isPending}
              className="flex items-center gap-2 px-2.5 py-2 text-xs sm:text-sm font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
            >
              <LogOut className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{isPending ? "Signing out..." : "Log out"}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <button
          type="button"
          disabled={isPending}
          onClick={() => void signOut()}
          className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-[#070B28] disabled:opacity-50 transition-colors"
          title="Sign out"
          aria-label="Sign out"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
