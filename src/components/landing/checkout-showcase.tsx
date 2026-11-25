"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useReducedMotionPreference } from "@/components/motion/use-reduced-motion-preference";
import { Banknote, Barcode, Check, CreditCard, Headphones, Plug, Receipt, ShieldCheck, ShoppingCart, Smartphone, Wrench, Zap } from "lucide-react";
import { Container } from "@/components/common/container";
import { AnimatedCounter } from "@/components/motion/animated-counter";
import { MotionReveal } from "@/components/motion/motion-reveal";
import { motionTokens } from "@/components/motion/motion-tokens";
import { formatBDT } from "./demo-data";

const catalog = [
  { sku: "INF-45W-CHG", name: "Infinix 45W Fast Charger", stock: 42, price: 1450, icon: Zap },
  { sku: "ANK-R50I-BLK", name: "Anker R50i True Wireless", stock: 18, price: 2150, icon: Headphones },
  { sku: "BAS-GAN5-65W", name: "Baseus 65W GaN5 Pro Charger", stock: 14, price: 2999, icon: Plug },
  { sku: "SM-A156B-DS", name: "Samsung A15 5G (8GB/128GB)", stock: 9, price: 20000, icon: Smartphone },
];
const catalogTotal = catalog.reduce((sum, item) => sum + item.price, 0);
const customSteps = [
  { title: "Describe the item or service", detail: "Enter parts or technician labor directly at the counter.", icon: Wrench },
  { title: "Set a price in BDT", detail: "Attach the warranty and serial number to the sale.", icon: Banknote },
  { title: "Record the sale", detail: "Post it to the ledger and keep catalog stock intact.", icon: ShieldCheck },
  { title: "Print the receipt", detail: "Include the serial number and cashier signature line.", icon: Receipt },
];
const modes = [
  { id: "catalog", label: "Catalog sale", icon: ShoppingCart },
  { id: "custom", label: "Custom sale", icon: Wrench },
] as const;
const tenders = [
  { label: "Cash (COD)", icon: Banknote }, { label: "bKash", icon: Smartphone },
  { label: "Nagad", icon: Smartphone }, { label: "Bank EFT", icon: CreditCard },
];

export function CheckoutShowcase() {
  const [mode, setMode] = useState<"catalog" | "custom">("catalog");
  const [tender, setTender] = useState("Cash (COD)");
  const reduceMotion = useReducedMotionPreference();
  const isCatalog = mode === "catalog";
  const rows = isCatalog
    ? catalog.map((item) => ({ title: item.name, detail: `${item.sku} · ${item.stock} in stock`, icon: item.icon, amount: formatBDT(item.price) }))
    : customSteps.map((step) => ({ ...step, amount: null }));

  return (
    <section id="workspace-preview" aria-labelledby="checkout-title" className="scroll-mt-16 bg-slate-50">
      <Container className="py-16 sm:py-24 lg:py-28">
        <MotionReveal distance={30} duration={motionTokens.duration.reveal}
          className="mb-8 flex flex-wrap items-end justify-between gap-6">
          <div>
            <h2 id="checkout-title" className="landing-heading">Two ways to check out.</h2>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-slate-600 sm:text-base">Ring up a catalog item or price a repair at the counter.</p>
          </div>
          <div role="group" aria-label="Checkout modes" className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-1">
            {modes.map(({ id, label, icon: Icon }) => (
              <button key={id} type="button" aria-pressed={id === mode} onClick={() => setMode(id)}
                className="relative flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium text-slate-600 aria-pressed:text-[#0052ff] sm:px-5">
                {id === mode && <motion.span layoutId="checkout-mode" transition={reduceMotion ? { duration: 0 } : { type: "spring", ...motionTokens.spring }}
                  className="absolute inset-0 rounded-lg bg-white shadow-sm" />}
                <Icon size={16} aria-hidden className="relative" /><span className="relative">{label}</span>
              </button>
            ))}
          </div>
        </MotionReveal>

        <div className="grid items-stretch gap-5 lg:grid-cols-[1.35fr_1fr] lg:gap-7">
          <MotionReveal distance={32} duration={motionTokens.duration.reveal}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white px-4 sm:px-7">
            <div className="flex items-center justify-between border-b border-slate-200 py-4 text-xs font-semibold text-slate-600">
              <span>{isCatalog ? "Items in ticket" : "Custom sale workflow"}</span>
              <span className="font-mono text-[11px] font-normal">{isCatalog ? "Qty 01 each" : "Service counter"}</span>
            </div>
            <AnimatePresence mode="wait" initial={false}>
              <motion.ul key={mode} initial="hidden" animate="shown" exit="leaving"
                variants={{
                  hidden: {}, shown: { transition: { staggerChildren: reduceMotion ? 0 : .045 } },
                  leaving: { opacity: reduceMotion ? 1 : 0, transition: { duration: reduceMotion ? 0 : .1 } },
                }}
                className="divide-y divide-slate-100">
                {rows.map(({ title, detail, icon: Icon, amount }) => (
                  <motion.li key={title} variants={{
                    hidden: { opacity: reduceMotion ? 1 : 0, x: reduceMotion ? 0 : -14 },
                    shown: { opacity: 1, x: 0, transition: { duration: reduceMotion ? 0 : .38, ease: motionTokens.easeOut } },
                  }} className="flex min-h-[4.75rem] items-center gap-3 py-3 sm:gap-4">
                    <Icon aria-hidden size={21} strokeWidth={1.7} className="shrink-0 text-[#0052ff]" />
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold text-[#0a1138]">{title}</h3>
                      <p className="mt-1 text-xs text-slate-600">{detail}</p>
                    </div>
                    {amount && <span className="shrink-0 font-mono text-sm font-medium tabular-nums text-[#0a1138]">{amount}</span>}
                  </motion.li>
                ))}
              </motion.ul>
            </AnimatePresence>
          </MotionReveal>
          <MotionReveal distance={38} delay={.08} duration={motionTokens.duration.cinematic}
            className="flex min-w-0 flex-col justify-between rounded-2xl bg-[#111d3d] p-5 text-white sm:p-8">
            <div>
              <div className="flex items-center justify-between border-b border-dashed border-white/25 pb-4">
                <span className="flex items-center gap-2 text-sm font-medium"><Receipt size={16} aria-hidden /> Register ticket</span>
                <span className="font-mono text-xs text-blue-200">#TCK-9904</span>
              </div>
              <p className="mt-6 text-xs text-slate-300">Settlement due</p>
              <div className="my-1 font-mono text-3xl font-semibold tracking-tight tabular-nums sm:text-4xl">
                <AnimatedCounter value={isCatalog ? catalogTotal : 1200} suffix=" BDT" duration={.6} />
              </div>
              <p className="flex items-center gap-2 text-xs text-blue-200"><Barcode size={14} aria-hidden /> Uttara Doyel · Lane 01</p>
            </div>
            <div role="group" aria-label="Checkout tender" className="mt-8 grid grid-cols-2 gap-2">
              {tenders.map(({ label, icon: Icon }) => (
                <button key={label} type="button" aria-pressed={label === tender} onClick={() => setTender(label)}
                  className="flex min-h-10 items-center gap-2 rounded-lg border border-white/20 px-3 text-xs text-slate-200 transition-colors hover:bg-white/10 aria-pressed:border-[#417fff] aria-pressed:bg-[#0052ff] aria-pressed:text-white">
                  <Icon size={14} aria-hidden />{label}{label === tender && <Check size={13} aria-hidden className="ml-auto" />}
                </button>
              ))}
            </div>
          </MotionReveal>
        </div>
      </Container>
    </section>
  );
}
