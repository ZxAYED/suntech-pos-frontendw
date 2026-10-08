"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
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
} from "lucide-react";
import { HeadroomNavbar } from "@/components/layout/headroom-navbar";
import { Footer } from "@/components/layout/footer";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-slate-50 flex flex-col font-sans overflow-x-hidden selection:bg-[#0052FF] selection:text-white">
      {/* ── Ambient Hero Glow ── */}
      <div className="absolute top-0 inset-x-0 h-[800px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#0052FF]/10 via-slate-50/20 to-transparent -z-10 pointer-events-none" />

      {/* ── Section B: The Premium Navbar (Fixed/Sticky at Top) ── */}
      <HeadroomNavbar />

      {/* ═══════════════════════════════════════════════════════════════
          SECTION C: THE HERO SECTION (GRADIENT ENHANCED, NO EYEBROWS)
      ═══════════════════════════════════════════════════════════════ */}
      <section className="relative w-full pt-28 pb-16 md:pt-32 md:pb-20 px-6 text-center flex flex-col items-center justify-center">
        <h1 className="text-5xl md:text-7xl font-bold text-[#070B28] tracking-tight mb-6 max-w-4xl leading-[1.08]">
          Suntech Retail <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0052FF] to-sky-400 drop-shadow-sm">
            Operations Core.
          </span>
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mb-10 leading-relaxed font-normal">
          The proprietary point-of-sale, real-time inventory, and payroll engine
          powering Suntech&apos;s digital and physical storefronts.
        </p>

        {/* Action Buttons with Snappy Default Spring Physics */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/pos/terminal">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full sm:w-auto bg-[#0052FF] text-white px-8 py-4 rounded-md font-medium shadow-[0_10px_20px_-10px_rgba(0,82,255,0.5)] cursor-pointer"
            >
              Launch Terminal &rarr;
            </motion.button>
          </Link>
          <Link href="/admin/dashboard">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full sm:w-auto bg-white text-[#070B28] border border-slate-200 px-8 py-4 rounded-md font-medium shadow-sm cursor-pointer"
            >
              Admin Dashboard
            </motion.button>
          </Link>
        </div>

        {/* ── Hero Mockup Window (Static, No Hover Zoom/Float) ── */}
        <div className="relative mx-auto mt-14 sm:mt-16 w-full max-w-5xl px-4 sm:px-0">
          <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xl shadow-blue-900/15">
            {/* Mission Control Window Bar */}
            <div className="flex h-11 items-center justify-between border-b border-slate-200 bg-[#070B28] px-4 text-white select-none">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-rose-500" />
                <span className="h-3 w-3 rounded-full bg-amber-500" />
                <span className="h-3 w-3 rounded-full bg-emerald-500" />
                <span className="ml-3 font-mono text-[11px] text-sky-200 hidden sm:inline-block">
                  suntech-os://terminal-lane-01 [UTTARA-HUB-ACTIVE]
                </span>
              </div>
              <div className="flex items-center gap-2.5 font-mono text-[11px]">
                <span className="inline-flex items-center gap-1.5 rounded bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  ENCRYPTED NODE
                </span>
              </div>
            </div>

            {/* Graphic Content with Floating Telemetry Pills */}
            <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-950">
              <Image
                src="/images/asset-1.jpg"
                alt="Suntech Internal Terminal Interface"
                fill
                priority
                sizes="(max-width: 1200px) 100vw, 1200px"
                className="object-cover object-top"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#070B28]/60 via-transparent to-transparent" />

              {/* Floating Node Telemetry Chips */}
              <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 flex flex-wrap items-center gap-2.5">
                <div className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-[#070B28]/85 px-3.5 py-2 font-mono text-xs font-medium text-white shadow-xl backdrop-blur-md">
                  <Activity className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Real-Time Sync · Latency 12ms</span>
                </div>
                <div className="hidden sm:inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/90 px-3.5 py-2 font-mono text-xs font-medium text-[#070B28] shadow-xl backdrop-blur-md">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#0052FF]" />
                  <span>Uttara Hub · Lane 01 Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION: SYSTEM STATUS STRIP (NO LINE WRAPPING, CRISP TEXT)
      ═══════════════════════════════════════════════════════════════ */}
      <section className="w-full bg-[#070B28] text-white py-3 overflow-hidden border-y border-slate-800 select-none">
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-12 whitespace-nowrap text-sm font-mono">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="font-semibold text-emerald-400 tracking-wide">
              System Online
            </span>
          </div>

          <span className="hidden md:inline text-slate-700">|</span>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Latency:</span>
            <span className="text-sky-300 font-semibold tabular-nums">12ms</span>
          </div>

          <span className="hidden md:inline text-slate-700">|</span>

          <div className="flex items-center gap-1.5">
            <Database className="h-3.5 w-3.5 text-[#0052FF]" />
            <span className="text-slate-400">Database:</span>
            <span className="text-sky-300 font-semibold">Connected</span>
          </div>

          <span className="hidden md:inline text-slate-700">|</span>

          <div className="flex items-center gap-1.5">
            <Terminal className="h-3.5 w-3.5 text-[#0052FF]" />
            <span className="text-slate-400">Active Terminals:</span>
            <span className="text-white font-semibold tabular-nums">8 Nodes Online</span>
          </div>

          <span className="hidden md:inline text-slate-700">|</span>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Node Hub:</span>
            <span className="text-sky-300 font-semibold">Uttara (Dhaka)</span>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION E: Z-PATTERN ENTERPRISE FEATURES (GRADIENT HIGHLIGHTS)
      ═══════════════════════════════════════════════════════════════ */}
      <div className="relative space-y-16 sm:space-y-24 py-16 sm:py-24">
        {/* ── Feature A: Centralized Branch Management ── */}
        <section className="px-6">
          <div className="mx-auto max-w-7xl">
            <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
              {/* Text Left (5 Cols) */}
              <div className="lg:col-span-5 space-y-4">
                <h2 className="text-3xl md:text-4xl font-bold text-[#070B28] mb-4">
                  Centralized Branch{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0052FF] to-sky-400">
                    Management.
                  </span>
                </h2>

                <p className="text-base text-slate-600 leading-relaxed font-normal">
                  Unified control across all Suntech locations. Sync inventory,
                  track cash drawers, and manage staff seamlessly from one
                  master terminal.
                </p>

                {/* Operations Checklist */}
                <div className="space-y-3.5 pt-2">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[#0052FF]">
                      <CheckCircle2 className="h-4 w-4 text-[#0052FF]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#070B28]">
                        Multi-Outlet Synchronization
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Uttara Hub, Bashundhara, and Dhanmondi outlets reconciled in real time.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[#0052FF]">
                      <CheckCircle2 className="h-4 w-4 text-[#0052FF]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#070B28]">
                        Shift Seal &amp; Float Audit Protocols
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Automatic variance tracking against opening cash and mid-shift staff advances.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[#0052FF]">
                      <CheckCircle2 className="h-4 w-4 text-[#0052FF]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#070B28]">
                        Role-Partitioned Security Access
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Granular permissions distinguishing Cashiers, Branch Managers, and Executive Finance.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Image Right (7 Cols) - Static, No Zoom */}
              <div className="lg:col-span-7">
                <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-2.5 shadow-[0_20px_50px_-12px_rgba(0,82,255,0.15)]">
                  <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-slate-900">
                    <Image
                      src="/images/asset-2.jpg"
                      alt="Centralized Branch Management Interface"
                      fill
                      sizes="(max-width: 1024px) 100vw, 58vw"
                      className="object-cover object-center"
                    />
                  </div>
                  <div className="absolute bottom-6 left-6 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white/95 px-3.5 py-2 font-mono text-xs font-medium text-[#070B28] shadow-lg backdrop-blur-md">
                    <Building2 className="h-4 w-4 text-[#0052FF]" />
                    <span>Uttara Hub Telemetry Active</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Feature B: Real-Time Stock Audits ── */}
        <section className="px-6 py-20 bg-slate-100/60 border-y border-slate-200/80">
          <div className="mx-auto max-w-7xl">
            <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
              {/* Image Left (7 Cols) - Static, No Zoom */}
              <div className="order-2 lg:order-1 lg:col-span-7">
                <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-2.5 shadow-[0_20px_50px_-12px_rgba(0,82,255,0.15)]">
                  <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-slate-900">
                    <Image
                      src="/images/asset-3.jpg"
                      alt="Real-Time Stock Audits Engine"
                      fill
                      sizes="(max-width: 1024px) 100vw, 58vw"
                      className="object-cover object-center"
                    />
                  </div>
                  <div className="absolute bottom-6 right-6 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white/95 px-3.5 py-2 font-mono text-xs font-medium text-[#070B28] shadow-lg backdrop-blur-md">
                    <Boxes className="h-4 w-4 text-[#0052FF]" />
                    <span>Warehouse SKU &amp; IMEI Ledger</span>
                  </div>
                </div>
              </div>

              {/* Text Right (5 Cols) */}
              <div className="order-1 lg:order-2 lg:col-span-5 space-y-4">
                <h2 className="text-3xl md:text-4xl font-bold text-[#070B28] mb-4">
                  Real-Time Stock{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0052FF] to-sky-400">
                    Audits.
                  </span>
                </h2>

                <p className="text-base text-slate-600 leading-relaxed font-normal">
                  Instant visibility into warehouse and storefront inventory.
                  Never lose track of high-value electronics and accessories.
                </p>

                {/* Operations Checklist */}
                <div className="space-y-3.5 pt-2">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[#0052FF]">
                      <CheckCircle2 className="h-4 w-4 text-[#0052FF]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#070B28]">
                        Barcode &amp; Serial Number Chain of Custody
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Precise tracking for high-value smartphones, flagship components, and chargers.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[#0052FF]">
                      <CheckCircle2 className="h-4 w-4 text-[#0052FF]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#070B28]">
                        Automated Discrepancy &amp; Shrinkage Logging
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Instant system alerts when physical inventory counts drift from expected balance.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[#0052FF]">
                      <CheckCircle2 className="h-4 w-4 text-[#0052FF]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#070B28]">
                        Live COGS &amp; Gross Margin Calculation
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Instant wholesale cost attribution directly tied to executive financial reports.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION D: THE 3-COLUMN FEATURE CARDS (MAX-W-7XL, CENTRALIZED ICONS,
                       DEFAULT TOP GRADIENT BORDER, SNAPPY SPRING HOVER/TAP)
        ═══════════════════════════════════════════════════════════════ */}
        <section className="w-full max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <motion.div
            whileHover={{ y: -4, scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm relative overflow-hidden text-center flex flex-col items-center cursor-pointer"
          >
            {/* Default Top Gradient Border */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#0052FF] to-sky-400" />
            
            {/* Centralized Icon */}
            <div className="w-12 h-12 rounded-xl bg-blue-50/50 border border-blue-100 flex items-center justify-center mb-6">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#0052FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 12L11 15L16 9" stroke="#0052FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 6V8" stroke="#070B28" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/>
                <path d="M12 16V18" stroke="#070B28" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/>
                <path d="M6 12H8" stroke="#070B28" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/>
                <path d="M16 12H18" stroke="#070B28" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/>
              </svg>
            </div>
            <h3 className="text-[#070B28] font-bold text-lg mb-2">Offline First Architecture</h3>
            <p className="text-slate-600 text-sm leading-relaxed">Local browser storage queues tickets during connectivity drops. Auto-commits safely upon reconnection.</p>
          </motion.div>

          {/* Card 2 */}
          <motion.div
            whileHover={{ y: -4, scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm relative overflow-hidden text-center flex flex-col items-center cursor-pointer"
          >
            {/* Default Top Gradient Border */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#0052FF] to-sky-400" />
            
            {/* Centralized Icon */}
            <div className="w-12 h-12 rounded-xl bg-blue-50/50 border border-blue-100 flex items-center justify-center mb-6">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="4" y="4" width="16" height="16" rx="2" stroke="#0052FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M4 10H20" stroke="#0052FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 14H12" stroke="#070B28" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/>
                <path d="M8 17H16" stroke="#070B28" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/>
                <path d="M16 14H16.01" stroke="#0052FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="text-[#070B28] font-bold text-lg mb-2">Integrated Staff Payroll</h3>
            <p className="text-slate-600 text-sm leading-relaxed">Real-time attendance telemetry tied to monthly compensation, with automatic ledger management.</p>
          </motion.div>

          {/* Card 3 */}
          <motion.div
            whileHover={{ y: -4, scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm relative overflow-hidden text-center flex flex-col items-center cursor-pointer"
          >
            {/* Default Top Gradient Border */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#0052FF] to-sky-400" />
            
            {/* Centralized Icon */}
            <div className="w-12 h-12 rounded-xl bg-blue-50/50 border border-blue-100 flex items-center justify-center mb-6">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 11L12 14L22 4" stroke="#0052FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M20 12V18C20 19.1046 19.1046 20 18 20H6C4.89543 20 4 19.1046 4 18V6C4 4.89543 4.89543 4 6 4H14" stroke="#070B28" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 10H10" stroke="#070B28" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/>
                <path d="M8 14H14" stroke="#070B28" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/>
              </svg>
            </div>
            <h3 className="text-[#070B28] font-bold text-lg mb-2">Audit Compliance</h3>
            <p className="text-slate-600 text-sm leading-relaxed">Tamper-evident daily Z-reports and multi-tender settlement tracking across all authorized branches.</p>
          </motion.div>
        </section>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION: THE BOTTOM ACCESS PORTAL (AUTHENTICATED GATEWAY CARD)
      ═══════════════════════════════════════════════════════════════ */}
      <section className="px-6 py-20 sm:py-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl bg-gradient-to-br from-[#070B28] via-[#090f38] to-[#0a113d] p-10 sm:p-14 md:p-16 text-center shadow-2xl shadow-blue-950/40 border border-slate-800"
        >
          {/* Subtle Ambient Mesh Glow */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(0,82,255,0.25),transparent_65%)]" />

          <div className="relative z-10 mx-auto max-w-2xl space-y-5">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl leading-tight">
              Suntech Authorized Personnel Only.
            </h2>

            <p className="mx-auto max-w-xl text-base text-slate-300 font-normal leading-relaxed">
              Access is restricted to authenticated retail cashiers, inventory
              auditors, and store administrators. All terminal actions are
              cryptographically logged.
            </p>

            {/* Action Buttons: Snappy Spring Physics */}
            <div className="pt-4 flex flex-wrap items-center justify-center gap-3.5">
              <Link href="/login">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex h-12 items-center gap-2 rounded-xl bg-[#0052FF] px-8 text-sm font-medium text-white shadow-lg shadow-blue-500/35 hover:bg-[#0047E0] transition-colors cursor-pointer"
                >
                  <Lock className="h-4 w-4" />
                  <span>Authenticate &amp; Enter</span>
                  <ArrowRight className="h-4 w-4" />
                </motion.button>
              </Link>

              <Link href="/pos/terminal">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 text-sm font-medium text-white backdrop-blur-md hover:bg-white/10 hover:border-white/30 transition-colors cursor-pointer"
                >
                  <Terminal className="h-4 w-4 text-sky-400" />
                  <span>Terminal Direct Link</span>
                </motion.button>
              </Link>
            </div>

            {/* Security Audit Footnotes */}
            <div className="pt-6 flex flex-wrap items-center justify-center gap-6 font-mono text-xs text-sky-200/80">
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
                Uttara Node ap-south-1
              </span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── Section F: Dark Mode Footer Anchoring Page ── */}
      <Footer />
    </div>
  );
}
