"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Container } from "@/components/common/container";
import { motionTokens } from "@/components/motion/motion-tokens";

export function CapabilityCards() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="w-full bg-[#F8FAFC]">
      <Container className="py-20 sm:py-28 lg:py-36">
        <motion.div
          initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: motionTokens.duration.standard, ease: motionTokens.easeOut }}
          className="text-center max-w-2xl mx-auto mb-14 sm:mb-16"
        >
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="h-1.5 w-1.5 rounded-full bg-[#0052FF]" />
            <span className="text-xs font-semibold tracking-wider uppercase text-[#0052FF]">
              Core Architecture
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-[#070B28]">
            Engineered for High-Velocity Retail Counters.
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600">
            Battle-tested offline resilience, mathematical drawer accuracy, and fiscal audit compliance.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
          {/* Card 1 (7 Cols, White Card): Offline-First Architecture */}
          <motion.div
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: motionTokens.duration.standard, ease: motionTokens.easeOut }}
            className="lg:col-span-7 rounded-2xl bg-white border border-slate-200 text-[#070B28] p-6 sm:p-10 shadow-xs flex flex-col justify-between hover:border-slate-300 hover:shadow-md transition-all duration-200"
          >
            <div>
              {/* Standalone 40px Icon */}
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
          </motion.div>

          {/* Card 2 (5 Cols, White Card): Integrated Staff & Advance Ledger */}
          <motion.div
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{
              duration: motionTokens.duration.standard,
              delay: 0.1,
              ease: motionTokens.easeOut,
            }}
            className="lg:col-span-5 rounded-2xl bg-white border border-slate-200 p-6 sm:p-10 flex flex-col justify-between shadow-xs hover:border-slate-300 hover:shadow-md transition-all duration-200"
          >
            <div>
              {/* Standalone 40px Icon */}
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
          </motion.div>

          {/* Card 3 (12 Cols, Full Width White Card): Multi-Tender & Z-Report */}
          <motion.div
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{
              duration: motionTokens.duration.standard,
              delay: 0.15,
              ease: motionTokens.easeOut,
            }}
            className="lg:col-span-12 rounded-2xl bg-white border border-slate-200 p-6 sm:p-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 shadow-xs hover:border-slate-300 hover:shadow-md transition-all duration-200"
          >
            <div className="text-left max-w-xl">
              {/* Standalone 40px Icon */}
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

            {/* Settlement Breakdown Card with Animated Bar */}
            <div className="w-full lg:w-auto shrink-0 bg-slate-50 border border-slate-200/80 rounded-2xl p-5 sm:p-6 space-y-4 min-w-[320px] sm:min-w-[340px]">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span>Settlement Breakdown</span>
                <span className="font-mono text-[#0052FF]">62% Cash / 38% Digital</span>
              </div>

              <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden flex">
                <motion.div
                  initial={reduceMotion ? { width: "62%" } : { width: 0 }}
                  whileInView={{ width: "62%" }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, ease: motionTokens.easeOut }}
                  className="h-full bg-emerald-500"
                  title="Cash 62%"
                />
                <motion.div
                  initial={reduceMotion ? { width: "38%" } : { width: 0 }}
                  whileInView={{ width: "38%" }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.2, ease: motionTokens.easeOut }}
                  className="h-full bg-[#0052FF]"
                  title="Digital 38%"
                />
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
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
