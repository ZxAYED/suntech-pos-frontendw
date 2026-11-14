"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { BrandLogo } from "@/components/common/brand-logo";
import { Container } from "@/components/common/container";
import { motionTokens } from "@/components/motion/motion-tokens";

export function Footer() {
  const reduceMotion = useReducedMotion();

  const linkMotionProps = {
    whileHover: reduceMotion ? {} : { x: 2, scale: 1.01 },
    whileTap: reduceMotion ? {} : { scale: 0.98 },
  };

  return (
    <footer className="w-full bg-[#070B28] text-slate-400 border-t border-white/10 mt-auto">
      <Container className="py-16">
        <motion.div
          initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: motionTokens.duration.standard, ease: motionTokens.easeOut }}
          className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16"
        >
          {/* Brand Column with Reusable BrandLogo (Dark Mode Inverse) */}
          <motion.div
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{
              duration: motionTokens.duration.standard,
              delay: reduceMotion ? 0 : 0,
              ease: motionTokens.easeOut,
            }}
            className="col-span-1 md:col-span-1"
          >
            <div className="mb-6">
              <BrandLogo size="md" inverse href="/" />
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              High-performance retail Point of Sale and inventory telemetry designed for modern electronics and gadget shops.
            </p>
          </motion.div>

          {/* Links Columns with subtle hover & tap */}
          <motion.div
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{
              duration: motionTokens.duration.standard,
              delay: reduceMotion ? 0 : 0.08,
              ease: motionTokens.easeOut,
            }}
          >
            <h4 className="text-white font-semibold mb-6 text-sm tracking-wide uppercase">
              Register Suite
            </h4>
            <ul className="space-y-4 text-sm text-slate-400">
              <li>
                <motion.div {...linkMotionProps} className="inline-block origin-left">
                  <Link href="/pos/terminal" className="hover:text-white transition-colors">
                    Cashier Terminal
                  </Link>
                </motion.div>
              </li>
              <li>
                <motion.div {...linkMotionProps} className="inline-block origin-left">
                  <Link href="/pos/shifts" className="hover:text-white transition-colors">
                    Shift Balancing
                  </Link>
                </motion.div>
              </li>
              <li>
                <motion.div {...linkMotionProps} className="inline-block origin-left">
                  <Link href="/pos/orders" className="hover:text-white transition-colors">
                    Order Ledger
                  </Link>
                </motion.div>
              </li>
            </ul>
          </motion.div>

          <motion.div
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{
              duration: motionTokens.duration.standard,
              delay: reduceMotion ? 0 : 0.16,
              ease: motionTokens.easeOut,
            }}
          >
            <h4 className="text-white font-semibold mb-6 text-sm tracking-wide uppercase">
              Administration
            </h4>
            <ul className="space-y-4 text-sm text-slate-400">
              <li>
                <motion.div {...linkMotionProps} className="inline-block origin-left">
                  <Link href="/admin/dashboard" className="hover:text-white transition-colors">
                    Executive Cockpit
                  </Link>
                </motion.div>
              </li>
              <li>
                <motion.div {...linkMotionProps} className="inline-block origin-left">
                  <Link href="/admin/catalog" className="hover:text-white transition-colors">
                    Catalog Registry
                  </Link>
                </motion.div>
              </li>
              <li>
                <motion.div {...linkMotionProps} className="inline-block origin-left">
                  <Link href="/admin/payroll" className="hover:text-white transition-colors">
                    Payroll Ledger
                  </Link>
                </motion.div>
              </li>
            </ul>
          </motion.div>

          <motion.div
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{
              duration: motionTokens.duration.standard,
              delay: reduceMotion ? 0 : 0.24,
              ease: motionTokens.easeOut,
            }}
          >
            <h4 className="text-white font-semibold mb-6 text-sm tracking-wide uppercase">
              System
            </h4>
            <ul className="space-y-4 text-sm text-slate-400">
              <li>
                <motion.div {...linkMotionProps} className="inline-block origin-left">
                  <Link href="/login" className="hover:text-white transition-colors">
                    Admin Sign In
                  </Link>
                </motion.div>
              </li>
              <li>
                <motion.div {...linkMotionProps} className="inline-block origin-left">
                  <Link href="#" className="hover:text-white transition-colors">
                    Support Helpdesk
                  </Link>
                </motion.div>
              </li>
            </ul>
          </motion.div>
        </motion.div>

        <motion.div
          initial={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: motionTokens.duration.standard, delay: 0.2, ease: motionTokens.easeOut }}
          className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400"
        >
          <p>© 2026 SunTech POS. All rights reserved.</p>
          <div className="flex gap-6">
            <motion.div {...linkMotionProps} className="inline-block">
              <Link href="#" className="hover:text-white transition-colors">
                Privacy Policy
              </Link>
            </motion.div>
            <motion.div {...linkMotionProps} className="inline-block">
              <Link href="#" className="hover:text-white transition-colors">
                Terms of Service
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </Container>
    </footer>
  );
}
