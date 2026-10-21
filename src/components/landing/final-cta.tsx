"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Terminal, Lock, CheckCircle2, ArrowRight } from "lucide-react";
import { Container } from "@/components/common/container";
import { GlowingButton } from "@/components/common/glowing-button";
import { motionTokens } from "@/components/motion/motion-tokens";

export function FinalCta() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="w-full bg-[#F8FAFC]">
      <Container className="py-20 lg:py-28">
        <motion.div
          initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: motionTokens.duration.reveal, ease: motionTokens.easeOut }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#070B28] via-[#090F38] to-[#0A113D] border border-white/10 px-6 py-16 sm:px-14 sm:py-20 text-center shadow-2xl shadow-blue-950/40"
        >
          {/* Top Radial Blue Glow */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[450px] bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(0,82,255,0.32),transparent)]" />

          <div className="relative z-10 mx-auto max-w-3xl space-y-6">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs text-sky-300 font-mono">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Production Terminal Access</span>
            </div>

            {/* Heading */}
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-white leading-tight">
              Sun<span className="text-[#0052FF]">Tech</span> Authorized Personnel Only.
            </h2>

            <p className="mx-auto max-w-xl text-sm sm:text-base text-slate-300 font-normal leading-relaxed">
              Access is restricted to authenticated retail cashiers, inventory auditors, and store administrators at Uttara Doyel Branch. All terminal actions are cryptographically logged.
            </p>

            {/* Glowing Action Buttons */}
            <div className="pt-4 flex flex-wrap items-center justify-center gap-3.5 sm:gap-4">
              <GlowingButton href="/pos/terminal" variant="primary" size="lg">
                <Terminal className="h-4 w-4 mr-1" />
                <span>Launch Terminal</span>
                <ArrowRight className="h-4 w-4 ml-1" />
              </GlowingButton>

              <GlowingButton href="/login" variant="dark" size="lg">
                <Lock className="h-4 w-4 text-sky-400 mr-1" />
                <span>Admin Sign In</span>
              </GlowingButton>
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
        </motion.div>
      </Container>
    </section>
  );
}
