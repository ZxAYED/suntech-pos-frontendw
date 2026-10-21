"use client";

import { useState } from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion";
import {
  Smartphone,
  Cpu,
  Coins,
  Plus,
  Wrench,
  Banknote,
  ShieldCheck,
  Receipt,
  CreditCard,
  ShoppingCart,
} from "lucide-react";
import { Container } from "@/components/common/container";
import { AnimatedCounter } from "@/components/motion/animated-counter";
import { motionTokens } from "@/components/motion/motion-tokens";

export function CheckoutShowcase() {
  const [checkoutMode, setCheckoutMode] = useState<"catalog" | "custom">("catalog");
  const [activeTender, setActiveTender] = useState<"cash" | "bkash" | "nagad" | "bank">("cash");
  const reduceMotion = useReducedMotion();

  const catalogItems = [
    {
      id: "chg-45w",
      name: "Infinix 45W Fast Charger",
      sku: "INF-45W-CHG",
      stock: 42,
      price: 1450,
      icon: Smartphone,
    },
    {
      id: "anker-r50i",
      name: "Anker R50i True Wireless",
      sku: "ANK-R50I-BLK",
      stock: 18,
      price: 2150,
      icon: Cpu,
    },
    {
      id: "baseus-65w",
      name: "Baseus 65W GaN5 Pro Charger",
      sku: "BAS-GAN5-65W",
      stock: 14,
      price: 2999,
      icon: Coins,
    },
    {
      id: "samsung-a15",
      name: "Samsung A15 5G (8GB/128GB)",
      sku: "SM-A156B-DS",
      stock: 9,
      price: 20000,
      icon: Smartphone,
    },
  ];

  const customSteps = [
    {
      step: "1. Enter Custom Item or Service",
      desc: "Instant manual description input for uncataloged repairs, technician labor, or client hardware parts.",
      icon: Wrench,
    },
    {
      step: "2. Instant BDT Pricing",
      desc: "Direct tariff entry with customer warranty and IMEI/SN audit attachment without catalog restrictions.",
      icon: Banknote,
    },
    {
      step: "3. Zero Stock Decrement",
      desc: "Immediate ledger credit without altering warehouse or shelf SKU inventory counts.",
      icon: ShieldCheck,
    },
    {
      step: "4. Instant Thermal Slip & Audit Hash",
      desc: "Prints customized thermal ticket with IMEI/SN note and cashier signature line at Uttara Doyel Branch.",
      icon: Receipt,
    },
  ];

  return (
    <section id="workspace-preview" className="w-full bg-slate-50/60 scroll-mt-20">
      <Container className="py-20 sm:py-28 lg:py-36 text-center">
        {/* Header with Dual Gradients */}
        <motion.div
          initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: motionTokens.duration.standard, ease: motionTokens.easeOut }}
        >
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight mb-3">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0A1138] via-[#101B54] to-[#1E3A8A]">
              One Engine.{" "}
            </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0052FF] via-[#1D63FF] to-[#38BDF8]">
              Two Checkout Modes.
            </span>
          </h2>
          <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto mb-8 leading-relaxed font-normal">
            Seamlessly switch between high-speed catalog product sales and rapid custom repair workbenches.
          </p>
        </motion.div>

        {/* Interactive Mode Switcher Tabs with Framer Motion */}
        <motion.div
          initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: motionTokens.duration.fast, ease: motionTokens.easeOut }}
          className="mt-8 mb-12 flex justify-center"
        >
          <div className="inline-flex items-center rounded-xl bg-[#0A1138] p-1.5 shadow-md border border-white/10 max-w-full overflow-x-auto">
            {(
              [
                { id: "catalog", label: "01. Catalog SKU Register", icon: ShoppingCart },
                { id: "custom", label: "02. Direct Custom Sale", icon: Wrench },
              ] as const
            ).map((tab) => {
              const active = checkoutMode === tab.id;
              const TabIcon = tab.icon;
              return (
                <motion.button
                  key={tab.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setCheckoutMode(tab.id)}
                  whileHover={reduceMotion ? {} : { scale: 1.02 }}
                  whileTap={reduceMotion ? {} : { scale: 0.98 }}
                  className={`relative flex items-center gap-2 rounded-lg px-4 sm:px-6 py-2.5 text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0052FF] ${
                    active ? "text-[#0A1138]" : "text-slate-300 hover:text-white"
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId="checkoutModeTab"
                      transition={
                        reduceMotion
                          ? { duration: 0 }
                          : { type: "spring", stiffness: 450, damping: 32 }
                      }
                      className="absolute inset-0 rounded-lg bg-white shadow-xs"
                    />
                  )}
                  <TabIcon
                    className={`relative z-10 h-3.5 w-3.5 sm:h-4 sm:w-4 transition-colors ${
                      active ? "text-[#0052FF]" : "text-slate-400"
                    }`}
                  />
                  <span className="relative z-10">{tab.label}</span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Stage Layout: 12-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-stretch text-left">
          {/* Left 7 Columns: Mode-specific content */}
          <div className="lg:col-span-7 flex flex-col justify-between">
            <AnimatePresence mode="wait">
              {checkoutMode === "catalog" ? (
                <motion.div
                  key="mode-catalog"
                  initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -10 }}
                  transition={{ duration: reduceMotion ? 0 : 0.22 }}
                  className="space-y-3.5"
                >
                  {catalogItems.map((item, idx) => {
                    const IconComponent = item.icon;
                    return (
                      <motion.div
                        key={item.id}
                        initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={reduceMotion ? {} : { y: -2, scale: 1.005 }}
                        transition={{
                          duration: reduceMotion ? 0 : 0.25,
                          delay: reduceMotion ? 0 : idx * 0.04,
                        }}
                        className="p-4 sm:p-5 rounded-xl border border-slate-200 bg-white hover:border-[#0052FF]/60 hover:shadow-sm transition-all duration-150 flex items-center justify-between gap-3 shadow-xs group cursor-pointer"
                      >
                        <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                          <IconComponent className="w-6 h-6 sm:w-7 sm:h-7 text-[#0052FF] shrink-0 transition-transform duration-200 group-hover:scale-105" />
                          <div className="min-w-0">
                            <div className="text-sm sm:text-base font-medium text-[#0A1138] truncate">
                              {item.name}
                            </div>
                            <div className="font-mono text-xs text-slate-400 mt-0.5">
                              SKU: {item.sku} • Stock: {item.stock} pcs
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-mono text-sm sm:text-base font-semibold text-[#0052FF] tabular-nums whitespace-nowrap">
                            {item.price.toLocaleString("en-BD")} BDT
                          </div>
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                            <Plus className="h-3 w-3" /> In Ticket
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              ) : (
                <motion.div
                  key="mode-custom"
                  initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -10 }}
                  transition={{ duration: reduceMotion ? 0 : 0.22 }}
                  className="space-y-3.5"
                >
                  {customSteps.map((step, idx) => {
                    const StepIcon = step.icon;
                    return (
                      <motion.div
                        key={idx}
                        initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={reduceMotion ? {} : { y: -2, scale: 1.005 }}
                        transition={{
                          duration: reduceMotion ? 0 : 0.25,
                          delay: reduceMotion ? 0 : idx * 0.04,
                        }}
                        className="p-4 sm:p-5 rounded-xl border border-slate-200 bg-white hover:border-[#0052FF]/60 hover:shadow-sm transition-all duration-150 flex items-center gap-4 shadow-xs cursor-pointer"
                      >
                        <StepIcon className="w-6 h-6 sm:w-7 sm:h-7 text-[#0052FF] shrink-0" />
                        <div>
                          <div className="text-sm sm:text-base font-medium text-[#0A1138]">
                            {step.step}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5 leading-normal">
                            {step.desc}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right 5 Columns: Sleek Live Ticket HUD */}
          <motion.div
            whileHover={reduceMotion ? {} : { y: -2 }}
            transition={{ duration: 0.2 }}
            className="lg:col-span-5 rounded-2xl bg-[#070B28] p-6 sm:p-8 lg:p-10 text-white flex flex-col justify-between shadow-xl border border-slate-800"
          >
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
                  <AnimatedCounter
                    value={checkoutMode === "catalog" ? 26599 : 1200}
                    suffix=" BDT"
                  />
                </div>
                <p className="text-xs text-slate-400 mt-2 font-mono">
                  Uttara Doyel Branch • Lane 01 • Auto-Reconciled
                </p>
              </div>
            </div>

            {/* Interactive Tender Routing with Animated Selector */}
            <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-white/10">
              <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-2.5 flex items-center justify-between">
                <span>Tender Routing</span>
                <span className="text-sky-400 font-mono text-[10px]">Instant Reconciliation</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                {(
                  [
                    { id: "cash", label: "Cash (COD)", icon: Banknote, color: "text-emerald-400" },
                    { id: "bkash", label: "bKash", icon: Smartphone, color: "text-pink-400" },
                    { id: "nagad", label: "Nagad", icon: Smartphone, color: "text-orange-400" },
                    { id: "bank", label: "Bank EFT", icon: CreditCard, color: "text-sky-400" },
                  ] as const
                ).map((t) => {
                  const Icon = t.icon;
                  const isSelected = activeTender === t.id;
                  return (
                    <motion.button
                      key={t.id}
                      type="button"
                      whileHover={reduceMotion ? {} : { scale: 1.02 }}
                      whileTap={reduceMotion ? {} : { scale: 0.98 }}
                      onClick={() => setActiveTender(t.id)}
                      className={`relative p-2 sm:p-2.5 rounded-xl border text-center flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0052FF] ${
                        isSelected
                          ? "bg-[#0052FF] border-blue-400/40 text-white font-semibold shadow-md shadow-blue-600/30"
                          : "bg-white/5 hover:bg-white/10 border-white/10 text-slate-200"
                      }`}
                    >
                      <Icon className={`h-3.5 w-3.5 ${isSelected ? "text-white" : t.color}`} />
                      <span>{t.label}</span>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
