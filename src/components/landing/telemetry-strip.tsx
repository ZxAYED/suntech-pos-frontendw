"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Activity, Database, ShieldCheck, Cpu } from "lucide-react";
import { Container } from "@/components/common/container";
import { motionTokens } from "@/components/motion/motion-tokens";

export function TelemetryStrip() {
  const reduceMotion = useReducedMotion();

  const items = [
    {
      id: "status",
      content: (
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="font-bold text-white tracking-wide">System Online</span>
        </div>
      ),
    },
    {
      id: "latency",
      content: (
        <div className="flex items-center gap-1.5">
          <Cpu className="h-3.5 w-3.5 text-emerald-400" />
          <span className="text-slate-400">Response Speed:</span>
          <span className="text-emerald-400 font-bold">&lt; 10ms</span>
        </div>
      ),
    },
    {
      id: "database",
      content: (
        <div className="flex items-center gap-1.5">
          <Database className="h-3.5 w-3.5 text-sky-400" />
          <span className="text-slate-400">Database Engine:</span>
          <span className="text-white font-bold">Multi-Tenant SQL</span>
        </div>
      ),
    },
    {
      id: "node",
      content: (
        <div className="flex items-center gap-1.5">
          <Activity className="h-3.5 w-3.5 text-sky-400" />
          <span className="text-slate-400">Active Node:</span>
          <span className="text-white font-bold truncate">Uttara Doyel Branch (Lane 01)</span>
        </div>
      ),
    },
    {
      id: "sync",
      content: (
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          <span className="text-slate-400">Sync Status:</span>
          <span className="text-sky-400 font-bold">Real-Time Reconciled</span>
        </div>
      ),
    },
  ];

  return (
    <section className="w-full bg-[#070B28] border-y border-slate-800 py-4 select-none relative overflow-hidden">
      {/* Subtle track gradient glow */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/5 to-transparent" />

      <Container className="relative">
        <motion.div
          initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-20px" }}
          transition={{ duration: motionTokens.duration.fast, ease: motionTokens.easeOut }}
          className="flex flex-wrap items-center justify-between gap-6 text-xs sm:text-sm font-mono text-slate-300"
        >
          {items.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={reduceMotion ? { opacity: 1 } : { opacity: 0, x: -8 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: motionTokens.duration.fast,
                delay: reduceMotion ? 0 : idx * 0.06,
                ease: motionTokens.easeOut,
              }}
              className="flex items-center"
            >
              {item.content}
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </section>
  );
}
