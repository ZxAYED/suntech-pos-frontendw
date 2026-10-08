"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Terminal } from "lucide-react";
import { BrandLogo } from "@/components/common/brand-logo";

export function HeadroomNavbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/70 bg-white/80 backdrop-blur-xl shadow-2xs transition-all">
      <div className="mx-auto flex h-[70px] max-w-7xl items-center justify-between px-6 lg:px-8">
        {/* Brand Logo & Main Navigation */}
        <div className="flex items-center gap-7">
          <BrandLogo size="md" href="/" />

          <div className="h-4 w-px bg-slate-200/80 hidden md:block" />

          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/pos/terminal"
              className="text-sm font-medium text-slate-600 hover:text-[#070B28] hover:bg-slate-100/70 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer"
            >
              Terminal
            </Link>
            <Link
              href="/admin/dashboard"
              className="text-sm font-medium text-slate-600 hover:text-[#070B28] hover:bg-slate-100/70 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer"
            >
              Dashboard
            </Link>
            <Link
              href="/admin/catalog"
              className="text-sm font-medium text-slate-600 hover:text-[#070B28] hover:bg-slate-100/70 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer"
            >
              Catalog
            </Link>
            <Link
              href="/pos/shifts"
              className="text-sm font-medium text-slate-600 hover:text-[#070B28] hover:bg-slate-100/70 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer"
            >
              Shifts
            </Link>
          </nav>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-medium text-slate-600 hover:text-[#070B28] hover:bg-slate-100/70 px-3.5 py-2 rounded-lg transition-all cursor-pointer"
          >
            Sign In
          </Link>

          <Link href="/pos/terminal">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-[#0052FF] to-blue-600 px-4.5 text-sm font-medium text-white shadow-sm shadow-blue-500/25 hover:shadow-md hover:shadow-blue-500/35 hover:from-[#0047E0] hover:to-blue-700 transition-all cursor-pointer"
            >
              <Terminal className="h-4 w-4" />
              <span>Launch Terminal</span>
              <ArrowRight className="h-4 w-4 ml-0.5" />
            </motion.div>
          </Link>
        </div>
      </div>
    </header>
  );
}
