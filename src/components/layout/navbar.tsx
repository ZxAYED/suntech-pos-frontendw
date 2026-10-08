"use client";

import Link from "next/link";
import { LogOut, MapPin, Menu } from "lucide-react";

interface NavbarProps {
  onOpenMobileMenu?: () => void;
}

export function Navbar({ onOpenMobileMenu }: NavbarProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 shrink-0 z-10 font-sans">
      {/* Left: Mobile hamburger + Shift status chip & store location */}
      <div className="flex items-center gap-3">
        {onOpenMobileMenu && (
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="md:hidden flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-[#070B28] cursor-pointer transition-colors"
            title="Open Navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}

        {/* Shift status indicator */}
        <div className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs sm:text-sm">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-medium text-slate-600">Shift Open:</span>
          <span className="font-mono font-medium text-[#070B28] tabular-nums">
            Float 10,000 BDT
          </span>
        </div>

        {/* Store Hub info */}
        <div className="hidden lg:inline-flex items-center gap-2 text-sm text-slate-500 font-medium">
          <MapPin className="h-4 w-4 text-[#0052FF]" />
          <span>Jamuna Future Park (Lane 01)</span>
        </div>
      </div>

      {/* Right: Minimal User Profile (Alex Rivera in #070B28 font-medium + Avatar) */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xs font-medium text-[#070B28] border border-slate-200">
            AR
          </div>
          <span className="text-sm font-medium text-[#070B28] hidden sm:inline">
            Alex Rivera
          </span>
        </div>

        <Link
          href="/login"
          className="flex h-9 w-9 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-[#070B28] cursor-pointer transition-colors"
          title="Sign Out"
        >
          <LogOut className="h-4 w-4" />
        </Link>
      </div>
    </header>
  );
}
