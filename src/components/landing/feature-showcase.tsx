"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import {
  Building2,
  Receipt,
  Lock,
  Boxes,
  Activity,
  Coins,
} from "lucide-react";
import { Container } from "@/components/common/container";
import { motionTokens } from "@/components/motion/motion-tokens";

export function FeatureShowcase() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="w-full bg-white overflow-hidden">
      <Container className="py-20 sm:py-28 lg:py-36 space-y-24 sm:space-y-32">
        {/* ── Feature 1: Centralized Branch Management (Featuring Image 1: asset-1.jpg) ── */}
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-16">
          {/* Text Left (5 Cols) */}
          <motion.div
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: motionTokens.duration.standard, ease: motionTokens.easeOut }}
            className="lg:col-span-5 space-y-5 sm:space-y-6"
          >
            <div className="inline-flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#0052FF]" />
              <span className="text-xs font-semibold tracking-wider uppercase text-[#0052FF]">
                Multi-Branch Hierarchy
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-[#070B28] leading-tight">
              Centralized Branch{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0052FF] to-sky-400">
                Management.
              </span>
            </h2>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
              Unified control across all SunTech operations anchored at Uttara Doyel Branch. Sync inventory, track cash drawers, and manage staff seamlessly from one master terminal.
            </p>

            {/* Operations Checklist with STANDALONE ICONS */}
            <div className="space-y-4 pt-1 sm:pt-2">
              {[
                {
                  title: "Multi-Outlet Synchronization",
                  desc: "Uttara Doyel Branch reconciled with central inventory ledgers in real time.",
                  icon: Building2,
                },
                {
                  title: "Shift Seal & Float Audit Protocols",
                  desc: "Automatic variance tracking against opening cash and mid-shift staff advances.",
                  icon: Receipt,
                },
                {
                  title: "Role-Partitioned Security Access",
                  desc: "Granular permissions distinguishing Cashiers, Branch Managers, and Executive Finance.",
                  icon: Lock,
                },
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={idx}
                    initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{
                      duration: motionTokens.duration.fast,
                      delay: reduceMotion ? 0 : idx * 0.08,
                    }}
                    className="flex items-start gap-3.5 sm:gap-4 group"
                  >
                    <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-[#0052FF] shrink-0 mt-0.5 transition-transform duration-200 group-hover:scale-110" />
                    <div>
                      <p className="text-sm sm:text-base font-semibold text-[#070B28]">
                        {item.title}
                      </p>
                      <p className="text-xs text-slate-500 mt-1 leading-normal">
                        {item.desc}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Image Right (7 Cols) - Apple Optical Glass Bezel featuring Image 1 (asset-1.jpg) */}
          <motion.div
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: motionTokens.duration.reveal, ease: motionTokens.easeOut }}
            className="lg:col-span-7"
          >
            <div className="relative p-2 sm:p-2.5 rounded-[22px] sm:rounded-[24px] bg-gradient-to-b from-white/90 to-white/50 backdrop-blur-2xl border border-slate-200/90 shadow-[0_20px_50px_-12px_rgba(0,82,255,0.12)] group">
              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-slate-900">
                <Image
                  src="/images/asset-1.jpg"
                  alt="Centralized Storefront Operations at Uttara Doyel Branch"
                  fill
                  sizes="(max-width: 1400px) 100vw, 58vw"
                  className="object-cover object-top transition-transform duration-700 group-hover:scale-[1.03]"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#070B28]/60 via-transparent to-transparent" />
              </div>

              {/* Floating Glassmorphic UI Card (Bottom-Left) */}
              <motion.div
                initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 z-10 inline-flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white/95 px-3.5 py-2 font-mono text-[11px] sm:text-xs font-medium text-[#070B28] shadow-lg backdrop-blur-md"
              >
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span>Uttara Doyel Branch • Physical Counter 01 Synced Live</span>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* ── Feature 2: Real-Time Stock Audits (Featuring Image 3: asset-3.jpg) ── */}
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-16">
          {/* Image Left (7 Cols) */}
          <motion.div
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: motionTokens.duration.reveal, ease: motionTokens.easeOut }}
            className="order-2 lg:order-1 lg:col-span-7"
          >
            <div className="relative p-2 sm:p-2.5 rounded-[22px] sm:rounded-[24px] bg-gradient-to-b from-white/90 to-white/50 backdrop-blur-2xl border border-slate-200/90 shadow-[0_20px_50px_-12px_rgba(0,82,255,0.12)] group">
              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-slate-900">
                <Image
                  src="/images/asset-3.jpg"
                  alt="Real-Time Stock Audits Engine"
                  fill
                  sizes="(max-width: 1400px) 100vw, 58vw"
                  className="object-cover object-center transition-transform duration-700 group-hover:scale-[1.03]"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#070B28]/60 via-transparent to-transparent" />
              </div>

              {/* Floating Glassmorphic UI Card (Bottom-Right) */}
              <motion.div
                initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 z-10 inline-flex items-center gap-2 rounded-xl border border-white/15 bg-[#070B28]/95 px-3.5 py-2 font-mono text-[11px] sm:text-xs font-medium text-white shadow-lg backdrop-blur-md"
              >
                <Boxes className="h-4 w-4 text-sky-400 shrink-0" />
                <span>
                  Uttara Doyel Branch • SKU: SM-A156B-DS • <span className="text-amber-400 font-semibold">9 pcs</span> •{" "}
                  <span className="text-emerald-400 font-semibold">Margin +11%</span>
                </span>
              </motion.div>
            </div>
          </motion.div>

          {/* Text Right (5 Cols) */}
          <motion.div
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, x: 16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: motionTokens.duration.standard, ease: motionTokens.easeOut }}
            className="order-1 lg:order-2 lg:col-span-5 space-y-5 sm:space-y-6"
          >
            <div className="inline-flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#0052FF]" />
              <span className="text-xs font-semibold tracking-wider uppercase text-[#0052FF]">
                Real-Time Audits
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-[#070B28] leading-tight">
              Real-Time Stock{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0052FF] to-sky-400">
                Audits.
              </span>
            </h2>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
              Instant visibility into warehouse and storefront inventory. Never lose track of high-value electronics and accessories at Uttara Doyel Branch.
            </p>

            {/* Operations Checklist with STANDALONE ICONS */}
            <div className="space-y-4 pt-1 sm:pt-2">
              {[
                {
                  title: "Serial Number Chain of Custody",
                  desc: "Precise tracking for high-value smartphones, flagship components, and chargers.",
                  icon: Boxes,
                },
                {
                  title: "Automated Discrepancy & Shrinkage Logging",
                  desc: "Instant system alerts when physical inventory counts drift from expected balance.",
                  icon: Activity,
                },
                {
                  title: "Live COGS & Gross Margin Calculation",
                  desc: "Instant wholesale cost attribution directly tied to executive financial reports.",
                  icon: Coins,
                },
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={idx}
                    initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{
                      duration: motionTokens.duration.fast,
                      delay: reduceMotion ? 0 : idx * 0.08,
                    }}
                    className="flex items-start gap-3.5 sm:gap-4 group"
                  >
                    <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-[#0052FF] shrink-0 mt-0.5 transition-transform duration-200 group-hover:scale-110" />
                    <div>
                      <p className="text-sm sm:text-base font-semibold text-[#070B28]">
                        {item.title}
                      </p>
                      <p className="text-xs text-slate-500 mt-1 leading-normal">
                        {item.desc}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
