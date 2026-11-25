"use client";

import { motion } from "framer-motion";
import { useReducedMotionPreference } from "@/components/motion/use-reduced-motion-preference";
import { ArrowRight, CloudUpload, ReceiptText, Wallet } from "lucide-react";
import { Container } from "@/components/common/container";
import { MotionReveal, StaggerGroup, StaggerItem } from "@/components/motion/motion-reveal";
import { motionTokens } from "@/components/motion/motion-tokens";

const settlements = [
  { method: "Cash", share: 62, color: "bg-[#0052ff]" },
  { method: "bKash", share: 24, color: "bg-[#688fea]" },
  { method: "Nagad", share: 9, color: "bg-[#9fb5dc]" },
  { method: "Bank EFT", share: 5, color: "bg-[#cad4e7]" },
];

export function CapabilityCards() {
  const reduceMotion = useReducedMotionPreference();

  return (
    <section aria-labelledby="capabilities-title" className="bg-slate-50">
      <Container className="py-16 sm:py-24 lg:py-28">
        <MotionReveal distance={30} duration={motionTokens.duration.reveal} className="mb-8">
          <h2 id="capabilities-title" className="landing-heading">Behind the counter.</h2>
          <p className="mt-3 text-sm text-slate-600 sm:text-base">Keep sales, staff advances, and daily settlements in balance.</p>
        </MotionReveal>

        <div className="grid gap-5 lg:grid-cols-12">
          <MotionReveal distance={35} duration={motionTokens.duration.reveal} className="landing-capability lg:col-span-7">
            <CloudUpload size={27} aria-hidden />
            <h3>Offline-first checkout</h3>
            <p>Queue tickets on the device when the connection drops. Each ticket posts once when the register reconnects.</p>
            <StaggerGroup className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-2 pt-6">
              {["Local queue", "Sync", "Master ledger"].map((step, index) => (
                <StaggerItem key={step} yOffset={12} className="flex items-center gap-2">
                  {index > 0 && <ArrowRight size={13} aria-hidden className="text-slate-400" />}
                  <span className="rounded-md border border-blue-100 bg-blue-50 px-2.5 py-1.5 text-xs font-medium text-blue-800">{step}</span>
                </StaggerItem>
              ))}
            </StaggerGroup>
          </MotionReveal>
          <MotionReveal distance={35} delay={.07} duration={motionTokens.duration.reveal} className="landing-capability lg:col-span-5">
            <Wallet size={27} aria-hidden />
            <h3>Staff and advance ledger</h3>
            <p>Reconcile opening cash and staff advances at the end of each shift.</p>
            <dl className="mt-auto space-y-2 pt-6 text-xs">
              {[["Opening float", "10,000 BDT"], ["Advances paid", "−1,350 BDT"], ["Drawer variance", "0 BDT"]].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-3 border-t border-slate-100 pt-2">
                  <dt className="text-slate-600">{label}</dt><dd className="font-mono font-semibold tabular-nums">{value}</dd>
                </div>
              ))}
            </dl>
          </MotionReveal>
          <MotionReveal distance={35} duration={motionTokens.duration.reveal}
            className="landing-capability lg:col-span-12 lg:flex-row! lg:items-center lg:justify-between lg:gap-14">
            <div className="max-w-xl">
              <ReceiptText size={27} aria-hidden className="text-[#0052ff]" />
              <h3>Multi-tender settlement</h3>
              <p>See the cash and digital payments behind each register’s closing Z-report.</p>
            </div>
            <div className="mt-7 w-full max-w-md lg:mt-0">
              <div className="flex items-baseline justify-between gap-3 text-xs">
                <span className="font-semibold">Settlement breakdown</span><span className="text-slate-600">62% cash · 38% digital</span>
              </div>
              <div aria-hidden className="my-4 flex h-2.5 overflow-hidden rounded-full">
                {settlements.map(({ method, share, color }, index) => (
                  <motion.span key={method} style={{ width: `${share}%` }} className={`h-full origin-left ${color}`}
                    initial={{ scaleX: reduceMotion ? 1 : 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }}
                    transition={{ duration: reduceMotion ? 0 : .8, delay: reduceMotion ? 0 : index * .09, ease: motionTokens.easeOut }} />
                ))}
              </div>
              <dl className="grid grid-cols-2 gap-x-5 gap-y-2 text-xs">
                {settlements.map(({ method, share, color }) => (
                  <div key={method} className="flex items-center justify-between gap-2">
                    <dt className="flex items-center gap-2 text-slate-600"><span aria-hidden className={`size-2 rounded-sm ${color}`} />{method}</dt>
                    <dd className="font-mono tabular-nums">{share}%</dd>
                  </div>
                ))}
              </dl>
            </div>
          </MotionReveal>
        </div>
      </Container>
    </section>
  );
}
