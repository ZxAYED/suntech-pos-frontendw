"use client";

import { LogOut, MapPin, Menu } from "lucide-react";
import { useSignOut } from "@/features/auth/hooks/use-sign-out";
import { formatBDT } from "@/lib/utils";

export interface NavbarViewModel {
  userName: string;
  initials: string;
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
  const { signOut, isPending } = useSignOut();
  const shiftLabel =
    viewModel.shift?.status === "OPEN"
      ? `Shift open${viewModel.shift.openingFloat !== undefined ? ` · Float ${formatBDT(viewModel.shift.openingFloat)}` : ""}`
      : viewModel.shift?.status === "CLOSED"
        ? "Shift closed"
        : "No active shift";

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

      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-[#070B28] border border-slate-200">
            {viewModel.initials}
          </div>
          <span className="hidden sm:inline text-sm font-medium text-[#070B28]">{viewModel.userName}</span>
        </div>
        <button type="button" disabled={isPending} onClick={() => void signOut()} className="flex h-10 w-10 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-[#070B28] disabled:opacity-50" aria-label="Sign out">
          <LogOut className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
