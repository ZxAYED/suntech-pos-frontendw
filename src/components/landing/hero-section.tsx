"use client";

import { useRef } from "react";
import { ArrowRight, ArrowDown, CheckCircle2 } from "lucide-react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { Container } from "@/components/common/container";
import { GlowingButton } from "@/components/common/glowing-button";
import { OperationsPreview } from "./operations-preview";
import { motionTokens } from "@/components/motion/motion-tokens";

export function HeroSection() {
  const reduceMotion = useReducedMotion();
  const heroRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  // Bounded desktop-only subtle parallax (max 18px)
  const dashboardY = useTransform(scrollYProgress, [0, 1], [0, 24]);

  return (
    <section
      ref={heroRef}
      className="suntech-hero relative isolate overflow-hidden bg-[#F7F9FC] border-b border-slate-200/60"
    >
      {/* Ambient Radial Gradient Mesh */}
      <div className="pointer-events-none absolute top-0 inset-x-0 h-[650px] bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,rgba(0,82,255,0.08),rgba(56,189,248,0.03),transparent)] -z-10" />

      <Container className="relative grid min-h-[calc(100svh-5rem)] grid-cols-1 items-center gap-10 pt-24 pb-14 sm:pt-28 sm:pb-16 lg:grid-cols-[minmax(0,0.45fr)_minmax(0,0.55fr)] lg:gap-12 lg:pt-28 lg:pb-20">
        {/* Left Column: Editorial Value Proposition & Actions */}
        <div className="relative z-10 flex flex-col justify-center max-w-xl lg:max-w-none">
          {/* Heading: Left-aligned editorial focal point with dual gradients */}
          <h1 className="text-[clamp(2.4rem,4.5vw,4.25rem)] font-bold leading-[1.08] tracking-[-0.04em]">
            <span className="block overflow-hidden pb-1">
              <motion.span
                initial={reduceMotion ? { opacity: 1 } : { y: "100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{
                  duration: reduceMotion ? 0 : motionTokens.duration.standard,
                  delay: reduceMotion ? 0 : 0.22,
                  ease: motionTokens.easeOut,
                }}
                className="block bg-gradient-to-r from-[#0A1138] via-[#101B54] to-[#1E3A8A] bg-clip-text text-transparent"
              >
                Every branch in focus.
              </motion.span>
            </span>
            <span className="block overflow-hidden pb-1">
              <motion.span
                initial={reduceMotion ? { opacity: 1 } : { y: "100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{
                  duration: reduceMotion ? 0 : motionTokens.duration.standard,
                  delay: reduceMotion ? 0 : 0.35,
                  ease: motionTokens.easeOut,
                }}
                className="block bg-gradient-to-r from-[#0052FF] via-[#1D63FF] to-[#38BDF8] bg-clip-text text-transparent"
              >
                Every decision in reach.
              </motion.span>
            </span>
          </h1>

          {/* Body Copy (450ms-950ms) */}
          <motion.p
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: reduceMotion ? 0 : motionTokens.duration.standard,
              delay: reduceMotion ? 0 : 0.45,
              ease: motionTokens.easeOut,
            }}
            className="mt-5 text-base sm:text-lg leading-relaxed text-[#58647A] max-w-xl"
          >
            Choose your business, step into a branch, and run checkout, inventory,
            and transaction tracking from one focused workspace.
          </motion.p>

          {/* Dual Action CTAs featuring Reusable Glowing Buttons */}
          <motion.div
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: reduceMotion ? 0 : motionTokens.duration.standard,
              delay: reduceMotion ? 0 : 0.6,
              ease: motionTokens.easeOut,
            }}
            className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 sm:gap-4"
          >
            <GlowingButton href="/pos/terminal" variant="primary" size="md">
              <span>Launch POS</span>
              <ArrowRight aria-hidden className="size-4 shrink-0 ml-1" />
            </GlowingButton>

            <GlowingButton href="#workspace-preview" variant="secondary" size="md">
              <span>Explore the product</span>
              <ArrowDown aria-hidden className="size-4 text-slate-500 shrink-0 ml-1" />
            </GlowingButton>
          </motion.div>

          {/* Trust Reassurance Footnote */}
          <motion.div
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: reduceMotion ? 0 : motionTokens.duration.fast,
              delay: reduceMotion ? 0 : 0.75,
            }}
            className="mt-8 pt-6 border-t border-slate-200/70 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500"
          >
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              Built for real counters and growing retail operations
            </span>
            <span className="hidden sm:inline text-slate-300">•</span>
            <span className="text-slate-600 font-medium">Lane 01 Multi-Branch Ready</span>
          </motion.div>
        </div>

        {/* Right Column: Live Software Operations Preview with Bounded Depth Parallax */}
        <motion.div
          style={reduceMotion ? {} : { y: dashboardY }}
          initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: reduceMotion ? 0 : motionTokens.duration.reveal,
            delay: reduceMotion ? 0 : 0.35,
            ease: motionTokens.easeOut,
          }}
          className="min-w-0 w-full"
        >
          <OperationsPreview />
        </motion.div>
      </Container>
    </section>
  );
}
