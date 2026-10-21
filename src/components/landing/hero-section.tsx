"use client";

import Link from "next/link";
import { ArrowRight, ArrowDown, CheckCircle2 } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { Container } from "@/components/common/container";
import { OperationsPreview } from "./operations-preview";

export function HeroSection() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="suntech-hero relative isolate overflow-hidden bg-[#F7F9FC] border-b border-slate-200/60">
      {/* Ambient Radial Gradient Mesh */}
      <div className="pointer-events-none absolute top-0 inset-x-0 h-[650px] bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,rgba(0,82,255,0.08),rgba(56,189,248,0.03),transparent)] -z-10" />

      <Container className="relative grid min-h-[calc(100svh-5rem)] grid-cols-1 items-center gap-10 pt-24 pb-14 sm:pt-28 sm:pb-16 lg:grid-cols-[minmax(0,0.45fr)_minmax(0,0.55fr)] lg:gap-12 lg:pt-28 lg:pb-20">
        {/* Left Column: Editorial Value Proposition & Actions */}
        <motion.div
          initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.35, ease: "easeOut" }}
          className="relative z-10 flex flex-col justify-center max-w-xl lg:max-w-none"
        >
          {/* Eyebrow */}
          <div className="mb-4 inline-flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#0052FF]" />
            <p className="text-xs font-semibold tracking-[0.14em] uppercase text-[#0052FF]">
              SunTech / Retail Operations
            </p>
          </div>

          {/* Heading: Left-aligned editorial focal point */}
          <h1 className="text-[clamp(2.4rem,4.5vw,4.25rem)] font-bold leading-[1.08] tracking-[-0.04em] text-[#070B28]">
            Every branch in focus.{" "}
            <span className="text-[#0052FF]">Every decision in reach.</span>
          </h1>

          {/* Body Copy */}
          <p className="mt-5 text-base sm:text-lg leading-relaxed text-[#58647A] max-w-xl">
            Choose your business, step into a branch, and run checkout, inventory,
            and transaction tracking from one focused workspace.
          </p>

          {/* Dual Action CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 sm:gap-4">
            <Link
              href="/pos/terminal"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#0052FF] px-6 text-sm font-medium text-white shadow-sm hover:bg-[#0047E0] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0052FF] cursor-pointer"
            >
              <span>Launch POS</span>
              <ArrowRight aria-hidden className="size-4 shrink-0" />
            </Link>

            <Link
              href="#workspace-preview"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200/90 bg-white px-6 text-sm font-medium text-[#070B28] shadow-xs hover:bg-slate-50 hover:border-slate-300 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0052FF] cursor-pointer"
            >
              <span>Explore the product</span>
              <ArrowDown aria-hidden className="size-4 text-slate-500 shrink-0" />
            </Link>
          </div>

          {/* Trust Reassurance Footnote */}
          <div className="mt-8 pt-6 border-t border-slate-200/70 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              Built for real counters and growing retail operations
            </span>
            <span className="hidden sm:inline text-slate-300">•</span>
            <span className="text-slate-600 font-medium">Lane 01 Multi-Branch Ready</span>
          </div>
        </motion.div>

        {/* Right Column: Live Software Operations Preview */}
        <motion.div
          initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.42, delay: reduceMotion ? 0 : 0.1, ease: "easeOut" }}
          className="min-w-0 w-full"
        >
          <OperationsPreview />
        </motion.div>
      </Container>
    </section>
  );
}
