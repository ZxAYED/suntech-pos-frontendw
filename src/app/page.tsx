"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Laptop,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Star,
  WifiOff,
  Wallet,
  Receipt,
  Layers,
  Store,
  ChevronRight,
} from "lucide-react";
import { HeadroomNavbar } from "@/components/layout/headroom-navbar";
import { Footer } from "@/components/layout/footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50/70 font-sans text-slate-700 selection:bg-[#0052FF] selection:text-white">
      {/* Fixed Sticky Headroom Navbar */}
      <HeadroomNavbar />

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 1: THE HERO STACK (Dynamic, Glowing & Overlapping)
      ═══════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden pt-32 pb-20 sm:pt-36 sm:pb-24 lg:pt-40 lg:pb-32">
        {/* Ambient Radial Background Glow & Subtle Grid Mesh */}
        <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[560px] w-full max-w-7xl bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,rgba(0,82,255,0.14),rgba(255,255,255,0))]" />
          <div className="absolute top-24 left-1/2 -translate-x-1/2 h-72 w-72 rounded-full bg-blue-400/10 blur-3xl" />
          <div
            className="absolute inset-0 opacity-[0.4] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_15%,#000_70%,transparent_100%)]"
            style={{
              backgroundImage:
                "linear-gradient(to right, #0052FF0a 1px, transparent 1px), linear-gradient(to bottom, #0052FF0a 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        <div className="mx-auto max-w-5xl px-6 text-center">
          {/* Top SaaS Pill Badge */}
        
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="text-4xl font-bold tracking-tight text-[#070B28] sm:text-6xl md:text-7xl leading-[1.06]"
          >
            Supercharge your{" "}
            <span className="relative inline-block text-[#0052FF]">
              retail operations.
              <span className="absolute left-0 -bottom-1 h-1 w-full bg-[#0052FF]/20 rounded-full hidden sm:block" />
            </span>
          </motion.h1>

          {/* Focused Body Copy */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
            className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-slate-600 leading-relaxed font-normal"
          >
            The lightning-fast, offline-capable Point of Sale system built
            specifically for electronics, mobile, and accessory shops. Manage
            inventory, process sales, and scale your stores.
          </motion.p>

          {/* Primary Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
            className="mt-8 flex flex-wrap items-center justify-center gap-3.5"
          >
            <Link
              href="/pos/terminal"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#0052FF] px-7 text-sm font-medium text-white shadow-lg shadow-blue-500/25 transition-all hover:bg-[#0047E0] hover:shadow-xl hover:shadow-blue-500/35 cursor-pointer"
            >
              <span>Launch Terminal</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/admin/dashboard"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-7 text-sm font-medium text-slate-700 shadow-xs transition-all hover:bg-slate-50 hover:border-slate-300 hover:text-[#070B28] cursor-pointer"
            >
              <span>Explore Features</span>
            </Link>
          </motion.div>
        </div>

        {/* ── The "Hero Graphic" Overlap (Window-Frame UI Wrapper) ── */}
        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative mx-auto mt-14 max-w-6xl px-4 sm:px-6"
        >
          <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xl shadow-blue-900/10 transition-all">
            {/* macOS / Modern Browser Window Header */}
            <div className="flex h-11 items-center justify-between border-b border-slate-200 bg-slate-100/90 px-4 select-none">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-rose-400" />
                <span className="h-3 w-3 rounded-full bg-amber-400" />
                <span className="h-3 w-3 rounded-full bg-emerald-400" />
                <span className="ml-3 hidden font-mono text-[11px] text-slate-400 sm:inline-block">
                  suntech-pos.local/terminal · Register Lane 01 (Active)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 font-mono text-[11px] font-medium text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Offline Engine Active
                </span>
              </div>
            </div>

            {/* Dashboard Screenshot Graphic */}
            <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-900">
              <Image
                src="/images/asset-1.jpg"
                alt="SunTech POS Terminal Dashboard"
                fill
                priority
                sizes="(max-width: 1400px) 100vw, 1400px"
                className="object-cover object-top"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#070B28]/35 via-transparent to-transparent" />

              {/* Floating Highlight Chips */}
              <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 flex flex-wrap items-center gap-2.5">
                <div className="inline-flex items-center gap-2 rounded-lg border border-white/40 bg-white/90 px-3.5 py-2 font-mono text-xs font-medium text-[#070B28] shadow-lg backdrop-blur-md">
                  <span className="h-2 w-2 rounded-full bg-[#0052FF]" />
                  <span>0.12s Barcode Scanning · Zero Latency</span>
                </div>
                <div className="hidden sm:inline-flex items-center gap-2 rounded-lg border border-white/40 bg-[#070B28]/90 px-3.5 py-2 font-mono text-xs font-medium text-white shadow-lg backdrop-blur-md">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Float Drift: 0 BDT (Verified)</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 2: SOCIAL PROOF / TRUST STRIP
      ═══════════════════════════════════════════════════════════════ */}
      <section className="border-y border-slate-100 bg-slate-50 py-8 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            {/* 5-Star Rating & Trust Headline */}
            <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
              <div className="flex items-center gap-0.5 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs sm:text-sm font-medium text-slate-700">
                Trusted by{" "}
                <span className="font-bold text-[#070B28]">
                  500+ mobile and gadget shops
                </span>{" "}
                across the region.
              </p>
            </div>

            {/* Abstract Partner Retailer Marks */}
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs font-mono font-medium text-slate-400">
              <span className="hover:text-slate-600 transition-colors">
                ✦ GADGET ARENA
              </span>
              <span className="hover:text-slate-600 transition-colors">
                ✦ iSTORE BD
              </span>
              <span className="hover:text-slate-600 transition-colors">
                ✦ VOLT MOBILE
              </span>
              <span className="hover:text-slate-600 transition-colors">
                ✦ GIZMO HUB
              </span>
              <span className="hover:text-slate-600 transition-colors">
                ✦ ELECTRONIX LAB
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 3: Z-PATTERN FEATURE STORYTELLING
      ═══════════════════════════════════════════════════════════════ */}
      <div className="relative space-y-12 sm:space-y-16">
        {/* ── Feature A: Text Left, Image Right ── */}
        <section className="py-20 sm:py-24 px-6">
          <div className="mx-auto max-w-7xl">
            <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
              {/* Text Left (5 Cols) */}
              <div className="lg:col-span-5 space-y-6">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-[#0052FF]">
                  <Laptop className="h-3.5 w-3.5" />
                  <span>Universal Hardware</span>
                </div>

                <h2 className="text-3xl font-bold tracking-tight text-[#070B28] sm:text-4xl md:text-5xl leading-tight">
                  Hardware Agnostic. Run it anywhere.
                </h2>

                <p className="text-base text-slate-600 leading-relaxed font-normal">
                  No need for expensive legacy registers. Suntech runs
                  flawlessly on laptops, tablets, and standard desktop PCs.
                </p>

                {/* Key Value Perks */}
                <div className="space-y-3.5 pt-2">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[#0052FF]">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#070B28]">
                        Zero Proprietary Hardware Lock-In
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Works on Chrome, Edge, Safari, and Windows without driver headaches.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[#0052FF]">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#070B28]">
                        Instant ESC/POS Slip Printing
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Native 80mm &amp; 58mm thermal receipts with automatic cut triggers.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[#0052FF]">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#070B28]">
                        Touch &amp; Keyboard Numpad Ready
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Optimized for lightning cashiers ringing up sales in high-traffic hours.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    href="/pos/terminal"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-[#0052FF] hover:underline cursor-pointer"
                  >
                    <span>Test the cashier terminal</span>
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>

              {/* Image Right (7 Cols) */}
              <div className="lg:col-span-7">
                <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-2.5 shadow-xl transition-all group">
                  <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-slate-100">
                    <Image
                      src="/images/asset-2.jpg"
                      alt="Hardware Agnostic POS Setup"
                      fill
                      sizes="(max-width: 1024px) 100vw, 58vw"
                      className="object-cover object-center group-hover:scale-[1.02] transition-transform duration-500"
                    />
                  </div>
                  {/* Floating Overlay Badge */}
                  <div className="absolute bottom-6 left-6 inline-flex items-center gap-2 rounded-lg border border-white/50 bg-white/95 px-3.5 py-2 font-mono text-xs font-medium text-[#070B28] shadow-lg backdrop-blur-md">
                    <Laptop className="h-4 w-4 text-[#0052FF]" />
                    <span>Mac, Windows &amp; Android Ready</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Feature B: Image Left, Text Right ── */}
        <section className="py-20 sm:py-24 px-6 bg-slate-50/50 border-y border-slate-100">
          <div className="mx-auto max-w-7xl">
            <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
              {/* Image Left (7 Cols) */}
              <div className="order-2 lg:order-1 lg:col-span-7">
                <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-2.5 shadow-xl transition-all group">
                  <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-slate-100">
                    <Image
                      src="/images/asset-3.jpg"
                      alt="Live Stock Audits on Tablet"
                      fill
                      sizes="(max-width: 1024px) 100vw, 58vw"
                      className="object-cover object-center group-hover:scale-[1.02] transition-transform duration-500"
                    />
                  </div>
                  {/* Floating Overlay Badge */}
                  <div className="absolute bottom-6 right-6 inline-flex items-center gap-2 rounded-lg border border-white/50 bg-white/95 px-3.5 py-2 font-mono text-xs font-medium text-[#070B28] shadow-lg backdrop-blur-md">
                    <ScanLine className="h-4 w-4 text-emerald-600" />
                    <span>Real-Time SKU &amp; IMEI Sync</span>
                  </div>
                </div>
              </div>

              {/* Text Right (5 Cols) */}
              <div className="order-1 lg:order-2 lg:col-span-5 space-y-6">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                  <ScanLine className="h-3.5 w-3.5" />
                  <span>Real-Time Inventory</span>
                </div>

                <h2 className="text-3xl font-bold tracking-tight text-[#070B28] sm:text-4xl md:text-5xl leading-tight">
                  Live Stock Audits.
                </h2>

                <p className="text-base text-slate-600 leading-relaxed font-normal">
                  Keep your cables, chargers, and smartphones perfectly synced
                  across multiple branches. Know exactly what&apos;s in the
                  stockroom.
                </p>

                {/* Key Value Perks */}
                <div className="space-y-3.5 pt-2">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#070B28]">
                        Barcode &amp; Serial Number Precision
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Track fast-selling accessories alongside serialized smartphones.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#070B28]">
                        Automated Low-Stock Thresholds
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Receive instant warnings before popular fast chargers run dry.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#070B28]">
                        Wholesale Margin Intelligence
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Calculate exact gross profit after factoring supplier COGS.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    href="/admin/catalog"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-[#0052FF] hover:underline cursor-pointer"
                  >
                    <span>Inspect SKU &amp; inventory manager</span>
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Feature Highlights Mini-Trio (Built for Commercial Gadget Retail) ── */}
        <section className="py-16 px-6">
          <div className="mx-auto max-w-7xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#0052FF]">
                  <WifiOff className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-[#070B28]">
                  Zero-Delay Offline Engine
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 font-normal leading-relaxed">
                  Internet drop during a weekend rush? No problem. Sales continue
                  uninterrupted and synchronize to the cloud once restored.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Wallet className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-[#070B28]">
                  Multi-Tender &amp; MFS Ready
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 font-normal leading-relaxed">
                  Support Cash, bKash, Nagad, and POS Bank Card swipe with
                  automatic change calculations and zero arithmetic mistakes.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Receipt className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-[#070B28]">
                  Shift Drawer Reconciliation
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 font-normal leading-relaxed">
                  Audit opening float against counted cash and staff advances.
                  Seal registers with tamper-evident daily Z-reports.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 4: THE BOTTOM CTA (Vibrant Electric Blue Banner)
      ═══════════════════════════════════════════════════════════════ */}
      <section className="px-6 py-20 sm:py-24">
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl bg-[#0052FF] p-10 sm:p-14 md:p-16 text-center shadow-2xl shadow-blue-500/25">
          {/* Subtle Radiant Background Mesh Glow */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_55%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(0,0,0,0.18),transparent_60%)]" />

          <div className="relative z-10 mx-auto max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl leading-tight">
              Ready to upgrade your shop&apos;s checkout?
            </h2>

            <p className="mx-auto mt-4 max-w-xl text-base text-blue-100 font-normal leading-relaxed">
              Join hundreds of forward-thinking electronics and accessory
              retailers. Experience the fastest checkout terminal today.
            </p>

            {/* Action CTA Buttons */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
              <Link
                href="/pos/terminal"
                className="inline-flex h-12 items-center gap-2 rounded-xl bg-white px-8 text-sm font-medium text-[#0052FF] shadow-lg hover:bg-slate-50 transition-all cursor-pointer"
              >
                <span>Open the Register</span>
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                href="/admin/dashboard"
                className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-7 text-sm font-medium text-white backdrop-blur-md hover:bg-white/20 transition-all cursor-pointer"
              >
                <span>View Dashboard</span>
              </Link>
            </div>

            {/* Perks Subtext */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-blue-100">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-white" />
                Instant Sandbox Demo
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-white" />
                No Credit Card Required
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-white" />
                Preloaded Gadget Catalog
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 5: COMPREHENSIVE SAAS FOOTER
      ═══════════════════════════════════════════════════════════════ */}
      <Footer />
    </div>
  );
}
