"use client";

import Link from "next/link";
import { LogOut, MapPin, Menu } from "lucide-react";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/types";

interface NavbarProps {
  onOpenMobileMenu?: () => void;
}

export function Navbar({ onOpenMobileMenu }: NavbarProps) {
  const selectedBranch = useSelector(
    (state: RootState) => state.tenant?.selectedBranch,
  );
  const branchName = selectedBranch?.name || "Uttara Doyel Branch (Lane 01)";

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-3 sm:px-6 shrink-0 z-10 font-sans">
      {/* Left: Mobile hamburger + Shift status chip & store location */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {onOpenMobileMenu && (
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="md:hidden flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-[#070B28] cursor-pointer transition-colors"
            title="Open Navigation"
            aria-label="Open Navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}

        {/* Shift status indicator */}
        <div className="inline-flex items-center gap-1.5 sm:gap-2 rounded-md border border-slate-200 bg-slate-50 px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm shrink-0 whitespace-nowrap">
          <span className="font-medium text-slate-600 hidden sm:inline">Shift Open:</span>
          <span className="font-medium text-slate-600 sm:hidden">Open:</span>
          <span className="font-mono font-medium text-[#070B28] tabular-nums">
            <span className="hidden sm:inline">Float </span>10,000 BDT
          </span>
        </div>

        {/* Store Hub info (Responsive: compact on tablet, full on desktop) */}
        <div className="hidden lg:inline-flex items-center gap-1.5 text-sm text-slate-500 font-medium truncate">
          <MapPin className="h-4 w-4 text-[#0052FF] shrink-0" />
          <span className="truncate">{branchName}</span>
        </div>
        <div className="hidden md:inline-flex lg:hidden items-center gap-1 text-xs text-slate-500 font-medium truncate">
          <MapPin className="h-3.5 w-3.5 text-[#0052FF] shrink-0" />
          <span className="truncate">{branchName.split(" ")[0]} Branch</span>
        </div>
      </div>

      {/* Right: Minimal User Profile (Alex Rivera + Avatar + Sign Out) */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-[#070B28] border border-slate-200 shrink-0">
            AR
          </div>
          <span className="text-sm font-medium text-[#070B28] hidden sm:inline">
            Alex Rivera
          </span>
        </div>

        <Link
          href="/login"
          className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-[#070B28] cursor-pointer transition-colors shrink-0"
          title="Sign Out"
          aria-label="Sign Out"
        >
          <LogOut className="h-4 w-4" />
        </Link>
      </div>
    </header>
  );
}
