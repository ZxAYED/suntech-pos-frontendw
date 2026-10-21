"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
} from "framer-motion";
import { ArrowRight, ArrowUpRight, Menu, ShoppingCart, X } from "lucide-react";
import { BrandLogo } from "@/components/common/brand-logo";
import { Container } from "@/components/common/container";
import { GlowingButton } from "@/components/common/glowing-button";

const navLinks = [
  { href: "/pos/terminal", label: "Terminal", desc: "High-speed SKU checkout" },
  { href: "/pos/custom-sale", label: "Custom Sale", desc: "Unlisted items & repairs" },
  { href: "/admin/dashboard", label: "Dashboard", desc: "Executive store telemetry" },
  { href: "/admin/catalog", label: "Catalog", desc: "Inventory & pricing registry" },
  { href: "/pos/shifts", label: "Shifts", desc: "Drawer float & advance ledger" },
];

export function HeadroomNavbar() {
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 80);
  });

  return (
    <>
      {/* Top Full Navbar */}
      <AnimatePresence>
        {!isScrolled && (
          <motion.header
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 32 }}
            className="fixed top-0 inset-x-0 z-40 h-16 sm:h-20 bg-white/90 backdrop-blur-xl border-b border-slate-200/70 flex items-center"
          >
            <Container className="flex items-center justify-between gap-3">
              {/* Left: Brand Logo (shrink-0 prevents squishing) */}
              <div className="flex items-center gap-10 shrink-0">
                <BrandLogo className="sm:hidden" href="/" size="sm" />
                <BrandLogo className="hidden sm:inline-flex" href="/" size="md" />

                {/* Center Nav: ONLY visible on xl (1280px+) to prevent 768px tablet collision */}
                <nav className="hidden xl:flex items-center gap-7 text-sm font-medium text-slate-600">
                  {navLinks.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="whitespace-nowrap hover:text-[#0052FF] transition-colors cursor-pointer"
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </div>

              {/* Right: Responsive Actions (Never wraps onto 2 lines) */}
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <Link
                  href="/login"
                  className="hidden sm:inline-flex whitespace-nowrap text-sm font-semibold text-slate-700 hover:text-[#0A1138] px-3 py-2 transition-colors cursor-pointer"
                >
                  Sign In
                </Link>

                <GlowingButton href="/pos/terminal" variant="primary" size="sm">
                  <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                  <span className="sm:hidden">Terminal</span>
                  <span className="hidden sm:inline">Launch Terminal</span>
                  <ArrowRight className="hidden sm:inline h-3.5 w-3.5 shrink-0" />
                </GlowingButton>

                {/* Mobile & Tablet Menu Trigger (< 1280px) */}
                <button
                  type="button"
                  onClick={() => setDrawerOpen(true)}
                  className="xl:hidden inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-[#0A1138] hover:bg-slate-50 transition-colors cursor-pointer shrink-0"
                  aria-label="Open Menu"
                >
                  <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              </div>
            </Container>
          </motion.header>
        )}
      </AnimatePresence>

      {/* Scrolled Compact White-Mode Floating Pill (Does not block mobile titles) */}
      <AnimatePresence>
        {isScrolled && (
          <div className="fixed top-3 sm:top-5 inset-x-0 z-50 pointer-events-none">
            <Container className="flex justify-end">
              <motion.button
                initial={{ scale: 0.8, opacity: 0, y: -12 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0, y: -12 }}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setDrawerOpen(true)}
                className="pointer-events-auto flex h-10 sm:h-11 items-center gap-2.5 rounded-full bg-white/95 backdrop-blur-xl border border-slate-200/90 pl-4 pr-4 sm:pr-5 text-[#0A1138] shadow-[0_10px_30px_-5px_rgba(7,11,40,0.14)] cursor-pointer whitespace-nowrap"
                aria-label="Open Navigation Menu"
              >
                <span className="h-2 w-2 rounded-full bg-[#0052FF]" />
                <span className="text-xs sm:text-sm font-semibold tracking-tight">Menu</span>
                <Menu className="h-4 w-4 text-[#0052FF]" />
              </motion.button>
            </Container>
          </div>
        )}
      </AnimatePresence>

      {/* Full-Screen White-Mode Navigation Drawer (NO Direct Register Access Box) */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed inset-0 z-50 bg-white text-[#0A1138] flex flex-col justify-between py-6 sm:py-10 overflow-y-auto"
          >
            <Container className="flex items-center justify-between border-b border-slate-200 pb-5 sm:pb-6">
              <BrandLogo href="/" size="md" />
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-[#0A1138] hover:bg-[#0052FF] hover:text-white hover:border-[#0052FF] transition-colors cursor-pointer"
                aria-label="Close Menu"
              >
                <X className="h-5 w-5" />
              </button>
            </Container>

            {/* Clean Single-Column Navigation List */}
            <Container className="my-auto py-8 max-w-4xl">
              <div className="divide-y divide-slate-200">
                {navLinks.map((item, idx) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setDrawerOpen(false)}
                    className="group flex items-center justify-between py-4 sm:py-6 hover:pl-2 transition-all cursor-pointer"
                  >
                    <div className="flex items-baseline gap-4 sm:gap-6">
                      <span className="font-mono text-xs sm:text-sm font-semibold text-[#0052FF]">
                        0{idx + 1}
                      </span>
                      <span className="text-xl sm:text-3xl font-semibold tracking-tight text-[#0A1138] group-hover:text-[#0052FF] transition-colors">
                        {item.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-500 group-hover:text-[#0052FF]">
                      <span className="hidden sm:inline text-sm">{item.desc}</span>
                      <ArrowUpRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </div>
                  </Link>
                ))}
              </div>
            </Container>

            {/* Bottom Actions inside Drawer */}
            <Container className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200 pt-5">
              <span className="text-xs font-mono text-slate-500">
                SunTech Proprietary Retail OS
              </span>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Link
                  href="/login"
                  onClick={() => setDrawerOpen(false)}
                  className="flex-1 sm:flex-initial inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-5 text-xs sm:text-sm font-semibold text-[#0A1138] hover:bg-slate-50 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/pos/terminal"
                  onClick={() => setDrawerOpen(false)}
                  className="flex-1 sm:flex-initial inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#0052FF] px-5 text-xs sm:text-sm font-semibold text-white hover:bg-[#0047E0] transition-colors"
                >
                  <span>Launch Terminal</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </Container>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
