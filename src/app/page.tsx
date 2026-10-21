"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Lock,
  Activity,
  ShieldCheck,
  Building2,
  Boxes,
  Database,
  Terminal,
  Receipt,
  Plus,
  CreditCard,
  Banknote,
  Smartphone,
  Cpu,
  Wrench,
  Coins,
} from "lucide-react";
import { Container } from "@/components/common/container";
import { HeadroomNavbar } from "@/components/layout/headroom-navbar";
import { Footer } from "@/components/layout/footer";
import { HeroSection } from "@/components/landing/hero-section";

export default function LandingPage() {
  const [checkoutMode, setCheckoutMode] = useState<"catalog" | "custom">("catalog");

  return (
    <div className="relative min-h-screen bg-[#F8FAFC] flex flex-col font-sans overflow-x-hidden selection:bg-[#0052FF] selection:text-white">
      {/* ── React Bits Morphing Navbar ── */}
      <HeadroomNavbar />

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 1: HERO SECTION (OPERATIONS CORE & INTERACTIVE WORKSPACE)
      ═══════════════════════════════════════════════════════════════ */}
      <HeroSection />

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 2: TELEMETRY TICKER BAR (ALWAYS WHITE MODE, 1400PX)
      ═══════════════════════════════════════════════════════════════ */}
      <section className="w-full bg-[#070B28] border-y border-slate-800 py-4 select-none">
        <Container className="flex flex-wrap items-center justify-between gap-6 text-xs sm:text-sm font-mono text-slate-300">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="font-bold text-white">System Online</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Response Speed:</span>
            <span className="text-emerald-400 font-bold">&lt; 10ms</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Database className="h-3.5 w-3.5 text-sky-400" />
            <span className="text-slate-400">Database Engine:</span>
            <span className="text-white font-bold">Multi-Tenant SQL</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-sky-400" />
            <span className="text-slate-400">Active Node:</span>
            <span className="text-white font-bold truncate">Uttara Doyel Branch (Lane 01)</span>
          </div>

          <div className="flex items-center gap-1.5 col-span-2 sm:col-span-1 justify-center sm:justify-start">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-slate-400">Sync Status:</span>
            <span className="text-sky-400 font-bold">Real-Time Reconciled</span>
          </div>
        </Container>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 3: REDESIGNED "ONE ENGINE. TWO CHECKOUT MODES." (1400PX)
      ═══════════════════════════════════════════════════════════════ */}
      <section id="workspace-preview" className="w-full bg-slate-50/60 scroll-mt-20">
        <Container className="py-20 sm:py-28 lg:py-36 text-center">
          {/* Header (Controlled Size for Mobile/Desktop) */}
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-[#070B28] mb-3">
            One Engine.{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0052FF] to-sky-400">
              Two Checkout Modes.
            </span>
          </h2>
          <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto mb-8 leading-relaxed font-normal">
            Seamlessly switch between high-speed catalog product sales and rapid custom repair workbenches.
          </p>

          {/* Interactive Mode Switcher Tabs (Navy Background + White Selector Pill) */}
          <div className="mt-8 mb-12 flex justify-center">
            <div className="inline-flex items-center rounded-xl bg-[#070B28] p-1.5 shadow-sm max-w-full overflow-x-auto">
              {(
                [
                  { id: "catalog", label: "01. Catalog SKU Register" },
                  { id: "custom", label: "02. Direct Custom Sale" },
                ] as const
              ).map((tab) => {
                const active = checkoutMode === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setCheckoutMode(tab.id)}
                    className={`relative rounded-lg px-4 sm:px-6 py-2.5 text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                      active ? "text-[#070B28]" : "text-slate-300 hover:text-white"
                    }`}
                  >
                    {active && (
                      <motion.div
                        layoutId="checkoutModeTab"
                        transition={{ type: "spring", stiffness: 450, damping: 32 }}
                        className="absolute inset-0 rounded-lg bg-white shadow-xs"
                      />
                    )}
                    <span className="relative z-10">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Stage Layout: 12-Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-stretch text-left">
            {/* Left 7 Columns: Compact Item Cards with Standalone Icons (NO Background Boxes) */}
            <div className="lg:col-span-7 flex flex-col justify-between">
              <AnimatePresence mode="wait">
                {checkoutMode === "catalog" ? (
                  <motion.div
                    key="mode-catalog"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                    className="space-y-3.5"
                  >
                    {/* Item 1 */}
                    <div className="p-4 sm:p-5 rounded-xl border border-slate-200 bg-white hover:border-[#0052FF]/40 transition-all flex items-center justify-between gap-3 shadow-xs">
                      <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                        {/* Standalone large SVG with ZERO background box */}
                        <Smartphone className="w-6 h-6 sm:w-7 sm:h-7 text-[#0052FF] shrink-0" />
                        <div className="min-w-0">
                          <div className="text-sm sm:text-base font-medium text-[#070B28] truncate">
                            Infinix 45W Fast Charger
                          </div>
                          <div className="font-mono text-xs text-slate-400 mt-0.5">SKU: INF-45W-CHG • Stock: 42 pcs</div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-mono text-sm sm:text-base font-semibold text-[#0052FF] tabular-nums whitespace-nowrap">
                          1,450 BDT
                        </div>
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                          <Plus className="h-3 w-3" /> In Ticket
                        </span>
                      </div>
                    </div>

                    {/* Item 2 */}
                    <div className="p-4 sm:p-5 rounded-xl border border-slate-200 bg-white hover:border-[#0052FF]/40 transition-all flex items-center justify-between gap-3 shadow-xs">
                      <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                        {/* Standalone large SVG with ZERO background box */}
                        <Cpu className="w-6 h-6 sm:w-7 sm:h-7 text-[#0052FF] shrink-0" />
                        <div className="min-w-0">
                          <div className="text-sm sm:text-base font-medium text-[#070B28] truncate">
                            Anker R50i True Wireless
                          </div>
                          <div className="font-mono text-xs text-slate-400 mt-0.5">SKU: ANK-R50I-BLK • Stock: 18 pcs</div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-mono text-sm sm:text-base font-semibold text-[#0052FF] tabular-nums whitespace-nowrap">
                          2,150 BDT
                        </div>
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                          <Plus className="h-3 w-3" /> In Ticket
                        </span>
                      </div>
                    </div>

                    {/* Item 3 */}
                    <div className="p-4 sm:p-5 rounded-xl border border-slate-200 bg-white hover:border-[#0052FF]/40 transition-all flex items-center justify-between gap-3 shadow-xs">
                      <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                        {/* Standalone large SVG with ZERO background box */}
                        <Coins className="w-6 h-6 sm:w-7 sm:h-7 text-[#0052FF] shrink-0" />
                        <div className="min-w-0">
                          <div className="text-sm sm:text-base font-medium text-[#070B28] truncate">
                            Baseus 65W GaN5 Pro Charger
                          </div>
                          <div className="font-mono text-xs text-slate-400 mt-0.5">SKU: BAS-GAN5-65W • Stock: 14 pcs</div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-mono text-sm sm:text-base font-semibold text-[#0052FF] tabular-nums whitespace-nowrap">
                          2,999 BDT
                        </div>
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                          <Plus className="h-3 w-3" /> In Ticket
                        </span>
                      </div>
                    </div>

                    {/* Item 4 */}
                    <div className="p-4 sm:p-5 rounded-xl border border-slate-200 bg-white hover:border-[#0052FF]/40 transition-all flex items-center justify-between gap-3 shadow-xs">
                      <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                        {/* Standalone large SVG with ZERO background box */}
                        <Smartphone className="w-6 h-6 sm:w-7 sm:h-7 text-[#0052FF] shrink-0" />
                        <div className="min-w-0">
                          <div className="text-sm sm:text-base font-medium text-[#070B28] truncate">
                            Samsung A15 5G (8GB/128GB)
                          </div>
                          <div className="font-mono text-xs text-slate-400 mt-0.5">SKU: SM-A156B-DS • Stock: 9 pcs</div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-mono text-sm sm:text-base font-semibold text-[#0052FF] tabular-nums whitespace-nowrap">
                          20,000 BDT
                        </div>
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                          <Plus className="h-3 w-3" /> In Ticket
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="mode-custom"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                    className="space-y-3.5"
                  >
                    {/* Step 1 */}
                    <div className="p-4 sm:p-5 rounded-xl border border-slate-200 bg-white flex items-center gap-4 shadow-xs">
                      <Wrench className="w-6 h-6 sm:w-7 sm:h-7 text-[#0052FF] shrink-0" />
                      <div>
                        <div className="text-sm sm:text-base font-medium text-[#070B28]">
                          1. Enter Custom Item or Service
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Instant manual description input for uncataloged repairs, technician labor, or client hardware parts.
                        </p>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="p-4 sm:p-5 rounded-xl border border-slate-200 bg-white flex items-center gap-4 shadow-xs">
                      <Banknote className="w-6 h-6 sm:w-7 sm:h-7 text-[#0052FF] shrink-0" />
                      <div>
                        <div className="text-sm sm:text-base font-medium text-[#070B28]">
                          2. Instant BDT Pricing
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Direct tariff entry with customer warranty and IMEI/SN audit attachment without catalog restrictions.
                        </p>
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className="p-4 sm:p-5 rounded-xl border border-slate-200 bg-white flex items-center gap-4 shadow-xs">
                      <ShieldCheck className="w-6 h-6 sm:w-7 sm:h-7 text-[#0052FF] shrink-0" />
                      <div>
                        <div className="text-sm sm:text-base font-medium text-[#070B28]">
                          3. Zero Stock Decrement
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Immediate ledger credit without altering warehouse or shelf SKU inventory counts.
                        </p>
                      </div>
                    </div>

                    {/* Step 4 */}
                    <div className="p-4 sm:p-5 rounded-xl border border-slate-200 bg-white flex items-center gap-4 shadow-xs">
                      <Receipt className="w-6 h-6 sm:w-7 sm:h-7 text-[#0052FF] shrink-0" />
                      <div>
                        <div className="text-sm sm:text-base font-medium text-[#070B28]">
                          4. Instant Thermal Slip & Audit Hash
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Prints customized thermal ticket with IMEI/SN note and cashier signature line at Uttara Doyel Branch.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Right 5 Columns: Sleek Live Ticket HUD */}
            <div className="lg:col-span-5 rounded-2xl lg:rounded-3xl bg-[#070B28] p-6 sm:p-8 lg:p-10 text-white flex flex-col justify-between shadow-xl border border-slate-800">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-sky-400" />
                    <span className="text-xs font-semibold tracking-wider uppercase text-slate-300">
                      Active Register Ticket
                    </span>
                  </div>
                  <span className="text-xs font-mono text-sky-400 bg-blue-500/20 px-2.5 py-1 rounded-full border border-blue-400/20">
                    #TCK-9904
                  </span>
                </div>

                <div className="mt-6 sm:mt-8">
                  <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block mb-1">
                    Settlement Due
                  </span>
                  <div className="font-mono text-3xl sm:text-4xl lg:text-5xl font-bold text-sky-400 tabular-nums">
                    {checkoutMode === "catalog" ? "26,599 BDT" : "1,200 BDT"}
                  </div>
                  <p className="text-xs text-slate-400 mt-2 font-mono">
                    Uttara Doyel Branch • Lane 01 • Auto-Reconciled
                  </p>
                </div>
              </div>

              {/* 4 Clean Payment Method Pills */}
              <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-white/10">
                <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-2.5">
                  Tender Routing
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2 sm:p-2.5 rounded-xl bg-[#0052FF] text-white font-semibold text-center flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer shadow-md shadow-blue-600/30">
                    <Banknote className="h-3.5 w-3.5" /> Cash
                  </div>
                  <div className="p-2 sm:p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-center flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer transition-colors">
                    <Smartphone className="h-3.5 w-3.5 text-pink-400" /> bKash
                  </div>
                  <div className="p-2 sm:p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-center flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer transition-colors">
                    <Smartphone className="h-3.5 w-3.5 text-orange-400" /> Nagad
                  </div>
                  <div className="p-2 sm:p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-center flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer transition-colors">
                    <CreditCard className="h-3.5 w-3.5 text-sky-400" /> Bank EFT
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 4: Z-PATTERN SECTIONS (STANDALONE ICONS + UTTARA DOYEL BRANCH)
      ═══════════════════════════════════════════════════════════════ */}
      <section className="w-full bg-white">
        <Container className="py-20 sm:py-28 lg:py-36 space-y-24 sm:space-y-32">
          {/* ── Feature 1: Centralized Branch Management ── */}
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-16">
            {/* Text Left (5 Cols) - NO Eyebrow Badge */}
            <div className="lg:col-span-5 space-y-5 sm:space-y-6">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-[#070B28] leading-tight">
                Centralized Branch{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0052FF] to-sky-400">
                  Management.
                </span>
              </h2>

              <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
                Unified control across all SunTech operations anchored at Uttara Doyel Branch. Sync inventory, track cash drawers, and manage staff seamlessly from one master terminal.
              </p>

              {/* Operations Checklist with STANDALONE ICONS (NO BOXES) */}
              <div className="space-y-4 pt-1 sm:pt-2">
                <div className="flex items-start gap-3.5 sm:gap-4">
                  <Building2 className="w-6 h-6 sm:w-7 sm:h-7 text-[#0052FF] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm sm:text-base font-semibold text-[#070B28]">Multi-Outlet Synchronization</p>
                    <p className="text-xs text-slate-500 mt-1 leading-normal">
                      Uttara Doyel Branch reconciled with central inventory ledgers in real time.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 sm:gap-4">
                  <Receipt className="w-6 h-6 sm:w-7 sm:h-7 text-[#0052FF] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm sm:text-base font-semibold text-[#070B28]">Shift Seal &amp; Float Audit Protocols</p>
                    <p className="text-xs text-slate-500 mt-1 leading-normal">
                      Automatic variance tracking against opening cash and mid-shift staff advances.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 sm:gap-4">
                  <Lock className="w-6 h-6 sm:w-7 sm:h-7 text-[#0052FF] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm sm:text-base font-semibold text-[#070B28]">Role-Partitioned Security Access</p>
                    <p className="text-xs text-slate-500 mt-1 leading-normal">
                      Granular permissions distinguishing Cashiers, Branch Managers, and Executive Finance.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Image Right (7 Cols) - Apple Optical Glass Bezel with Floating Overlay */}
            <div className="lg:col-span-7">
              <div className="relative p-2 sm:p-2.5 rounded-[22px] sm:rounded-[24px] bg-gradient-to-b from-white/90 to-white/50 backdrop-blur-2xl border border-slate-200/90 shadow-[0_20px_50px_-12px_rgba(0,82,255,0.12)]">
                <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-slate-900">
                  <Image
                    src="/images/asset-2.jpg"
                    alt="Centralized Branch Management Interface"
                    fill
                    sizes="(max-width: 1400px) 100vw, 58vw"
                    className="object-cover object-center"
                  />
                </div>

                {/* Floating Glassmorphic UI Card (Bottom-Left) */}
                <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 z-10 inline-flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white/95 px-3.5 py-2 font-mono text-[11px] sm:text-xs font-medium text-[#070B28] shadow-lg backdrop-blur-md">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <span>Uttara Doyel Branch • Synced Live</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Feature 2: Real-Time Stock Audits ── */}
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-16">
            {/* Image Left (7 Cols) - Apple Optical Glass Bezel with Floating Overlay */}
            <div className="order-2 lg:order-1 lg:col-span-7">
              <div className="relative p-2 sm:p-2.5 rounded-[22px] sm:rounded-[24px] bg-gradient-to-b from-white/90 to-white/50 backdrop-blur-2xl border border-slate-200/90 shadow-[0_20px_50px_-12px_rgba(0,82,255,0.12)]">
                <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-slate-900">
                  <Image
                    src="/images/asset-3.jpg"
                    alt="Real-Time Stock Audits Engine"
                    fill
                    sizes="(max-width: 1400px) 100vw, 58vw"
                    className="object-cover object-center"
                  />
                </div>

                {/* Floating Glassmorphic UI Card (Bottom-Right) */}
                <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 z-10 inline-flex items-center gap-2 rounded-xl border border-white/15 bg-[#070B28]/95 px-3.5 py-2 font-mono text-[11px] sm:text-xs font-medium text-white shadow-lg backdrop-blur-md">
                  <Boxes className="h-4 w-4 text-sky-400 shrink-0" />
                  <span>
                    Uttara Doyel Branch • SKU: SM-A156B-DS • <span className="text-amber-400 font-semibold">9 pcs</span> •{" "}
                    <span className="text-emerald-400 font-semibold">Margin +11%</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Text Right (5 Cols) - NO Eyebrow Badge */}
            <div className="order-1 lg:order-2 lg:col-span-5 space-y-5 sm:space-y-6">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-[#070B28] leading-tight">
                Real-Time Stock{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0052FF] to-sky-400">
                  Audits.
                </span>
              </h2>

              <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
                Instant visibility into warehouse and storefront inventory. Never lose track of high-value electronics and accessories at Uttara Doyel Branch.
              </p>

              {/* Operations Checklist with STANDALONE ICONS (NO BOXES) */}
              <div className="space-y-4 pt-1 sm:pt-2">
                <div className="flex items-start gap-3.5 sm:gap-4">
                  <Boxes className="w-6 h-6 sm:w-7 sm:h-7 text-[#0052FF] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm sm:text-base font-semibold text-[#070B28]">Serial Number Chain of Custody</p>
                    <p className="text-xs text-slate-500 mt-1 leading-normal">
                      Precise tracking for high-value smartphones, flagship components, and chargers.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 sm:gap-4">
                  <Activity className="w-6 h-6 sm:w-7 sm:h-7 text-[#0052FF] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm sm:text-base font-semibold text-[#070B28]">Automated Discrepancy &amp; Shrinkage Logging</p>
                    <p className="text-xs text-slate-500 mt-1 leading-normal">
                      Instant system alerts when physical inventory counts drift from expected balance.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 sm:gap-4">
                  <Coins className="w-6 h-6 sm:w-7 sm:h-7 text-[#0052FF] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm sm:text-base font-semibold text-[#070B28]">Live COGS &amp; Gross Margin Calculation</p>
                    <p className="text-xs text-slate-500 mt-1 leading-normal">
                      Instant wholesale cost attribution directly tied to executive financial reports.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 5: UPGRADED 1400PX BENTO GRID (WHITE MODE EVERYWHERE)
      ═══════════════════════════════════════════════════════════════ */}
      <section className="w-full bg-[#F8FAFC]">
        <Container className="py-20 sm:py-28 lg:py-36">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
            {/* Card 1 (7 Cols, White Card): Offline-First Architecture */}
            <div className="lg:col-span-7 rounded-2xl bg-white border border-slate-200 text-[#070B28] p-6 sm:p-10 shadow-xs flex flex-col justify-between">
              <div>
                {/* Standalone 40px Icon (Zero Background Box) */}
                <svg
                  className="w-10 h-10 text-[#0052FF]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2v4" />
                  <path d="m4.93 4.93 2.83 2.83" />
                  <path d="M2 12h4" />
                  <path d="m4.93 19.07 2.83-2.83" />
                  <path d="M12 22v-4" />
                  <path d="m19.07 19.07-2.83-2.83" />
                  <path d="M22 12h-4" />
                  <path d="m19.07 4.93-2.83 2.83" />
                  <circle cx="12" cy="12" r="3" />
                </svg>

                <h3 className="text-xl sm:text-2xl font-bold mt-6 mb-3 text-[#070B28]">
                  Offline-First Architecture
                </h3>
                <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-lg">
                  Local browser storage queues tickets during connectivity drops. Auto-commits safely with cryptographic idempotency upon reconnection.
                </p>
              </div>

              {/* Clean Connected Pipeline in White/Slate tones */}
              <div className="mt-8 sm:mt-10 pt-6 sm:pt-8 border-t border-slate-100">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 font-mono text-xs">
                  <div className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center text-[#070B28]">
                    IndexedDB Queue
                  </div>
                  <div className="flex items-center gap-1 text-slate-400">
                    <div className="w-6 h-0.5 bg-slate-300" />
                    <span className="text-[11px] text-[#0052FF]">➔</span>
                  </div>
                  <div className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-blue-50/70 border border-blue-200 text-center text-[#0052FF] font-medium">
                    Idempotent Sync
                  </div>
                  <div className="flex items-center gap-1 text-slate-400">
                    <div className="w-6 h-0.5 bg-slate-300" />
                    <span className="text-[11px] text-emerald-600">➔</span>
                  </div>
                  <div className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-center text-emerald-700 font-semibold">
                    Master Ledger
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2 (5 Cols, White Card): Standalone 40px Icon */}
            <div className="lg:col-span-5 rounded-2xl bg-white border border-slate-200 p-6 sm:p-10 flex flex-col justify-between shadow-xs">
              <div>
                {/* Standalone 40px Icon (Zero Background Box) */}
                <svg
                  className="w-10 h-10 text-[#0052FF]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="4" width="18" height="16" rx="2" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                  <line x1="7" y1="15" x2="13" y2="15" />
                  <circle cx="17" cy="15" r="1" />
                </svg>

                <h3 className="text-xl sm:text-2xl font-bold text-[#070B28] mt-6 mb-3">
                  Integrated Staff &amp; Advance Ledger
                </h3>
                <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                  Shift-level drawer balancing and real-time compensation advances with zero mathematical discrepancy.
                </p>
              </div>

              {/* Clean 3-Row Summary */}
              <div className="mt-8 sm:mt-10 p-5 rounded-xl bg-slate-50 border border-slate-200/80 shadow-xs space-y-3 font-mono text-xs sm:text-sm">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Opening Float:</span>
                  <span className="font-semibold text-[#070B28] tabular-nums">10,000 BDT</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Advances Out:</span>
                  <span className="font-semibold text-rose-500 tabular-nums">-1,350 BDT</span>
                </div>
                <div className="pt-2.5 border-t border-slate-200 flex items-center justify-between text-[#070B28]">
                  <span className="font-sans font-medium text-slate-500">Drawer Drift:</span>
                  <span className="font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded tabular-nums">
                    0 BDT
                  </span>
                </div>
              </div>
            </div>

            {/* Card 3 (12 Cols, Full Width White Card): Standalone 40px Icon */}
            <div className="lg:col-span-12 rounded-2xl bg-white border border-slate-200 p-6 sm:p-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 shadow-xs">
              <div className="text-left max-w-xl">
                {/* Standalone 40px Icon (Zero Background Box) */}
                <svg
                  className="w-10 h-10 text-[#0052FF]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>

                <h3 className="text-xl sm:text-2xl font-bold text-[#070B28] mt-6 mb-3">
                  Multi-Tender &amp; Z-Report Audit Compliance
                </h3>
                <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                  Tamper-evident daily reconciliation and split-payment settlement tracking across all authorized retail registers. Generates instantaneous fiscal closing certificates.
                </p>
              </div>

              {/* Settlement Breakdown Card */}
              <div className="w-full lg:w-auto shrink-0 bg-slate-50 border border-slate-200/80 rounded-2xl p-5 sm:p-6 space-y-4 min-w-[320px] sm:min-w-[340px]">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span>Settlement Breakdown</span>
                  <span className="font-mono text-[#0052FF]">62% Cash / 38% Digital</span>
                </div>

                <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden flex">
                  <div className="h-full bg-emerald-500 w-[62%]" title="Cash 62%" />
                  <div className="h-full bg-[#0052FF] w-[38%]" title="Digital 38%" />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="px-3 py-2 rounded-xl bg-white border border-slate-200 flex items-center justify-between shadow-xs">
                    <span className="text-slate-600">Cash COD</span>
                    <span className="text-emerald-600 font-bold">62%</span>
                  </div>
                  <div className="px-3 py-2 rounded-xl bg-white border border-slate-200 flex items-center justify-between shadow-xs">
                    <span className="text-slate-600">bKash</span>
                    <span className="text-[#0052FF] font-bold">24%</span>
                  </div>
                  <div className="px-3 py-2 rounded-xl bg-white border border-slate-200 flex items-center justify-between shadow-xs">
                    <span className="text-slate-600">Nagad</span>
                    <span className="text-amber-600 font-bold">9%</span>
                  </div>
                  <div className="px-3 py-2 rounded-xl bg-white border border-slate-200 flex items-center justify-between shadow-xs">
                    <span className="text-slate-600">Bank EFT</span>
                    <span className="text-purple-600 font-bold">5%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 6: "SUNTECH AUTHORIZED PERSONNEL ONLY" — BLUE GRADIENTS & #070B28
      ═══════════════════════════════════════════════════════════════ */}
      <section className="w-full bg-[#F8FAFC]">
        <Container className="py-20 lg:py-28">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#070B28] via-[#090F38] to-[#0A113D] border border-white/10 px-6 py-16 sm:px-14 sm:py-20 text-center shadow-2xl shadow-blue-950/40">
            {/* Top Radial Blue Glow */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[450px] bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(0,82,255,0.32),transparent)]" />

            <div className="relative z-10 mx-auto max-w-3xl space-y-6">
              {/* Heading (Controlled Size for Mobile/Desktop) */}
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-white leading-tight">
                Sun<span className="text-[#0052FF]">Tech</span> Authorized Personnel Only.
              </h2>

              <p className="mx-auto max-w-xl text-sm sm:text-base text-slate-300 font-normal leading-relaxed">
                Access is restricted to authenticated retail cashiers, inventory auditors, and store administrators at Uttara Doyel Branch. All terminal actions are cryptographically logged.
              </p>

              {/* Action Buttons */}
              <div className="pt-4 flex flex-wrap items-center justify-center gap-3.5 sm:gap-4">
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="w-full sm:w-auto">
                  <Link
                    href="/pos/terminal"
                    className="inline-flex w-full sm:w-auto h-11 sm:h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0052FF] to-blue-600 px-7 sm:px-8 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-blue-500/35 hover:shadow-xl hover:shadow-blue-500/45 transition-shadow cursor-pointer"
                  >
                    <Terminal className="h-4 w-4" />
                    <span>Launch Terminal</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </motion.div>

                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="w-full sm:w-auto">
                  <Link
                    href="/login"
                    className="inline-flex w-full sm:w-auto h-11 sm:h-12 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-7 sm:px-8 text-xs sm:text-sm font-semibold text-white backdrop-blur-md hover:bg-white/10 hover:border-white/30 transition-colors cursor-pointer"
                  >
                    <Lock className="h-4 w-4 text-sky-400" />
                    <span>Admin Sign In</span>
                  </Link>
                </motion.div>
              </div>

              {/* Security Footnotes */}
              <div className="pt-6 sm:pt-8 flex flex-wrap items-center justify-center gap-4 sm:gap-6 font-mono text-xs text-sky-200/80">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  256-bit SSL Gateway
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  Role-Based Token Auth
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  Uttara Doyel Branch Lane 01
                </span>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ── Footer ── */}
      <Footer />
    </div>
  );
}
