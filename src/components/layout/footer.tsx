"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BrandLogo } from "@/components/common/brand-logo";
import { Container } from "@/components/common/container";

export function Footer() {
  return (
    <footer className="w-full bg-[#070B28] text-slate-400 border-t border-white/10 mt-auto">
      <Container className="py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          {/* Brand Column with Reusable BrandLogo (Dark Mode Inverse) */}
          <div className="col-span-1 md:col-span-1">
            <div className="mb-6">
              <BrandLogo size="md" inverse href="/" />
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              High-performance retail Point of Sale and inventory telemetry designed for modern electronics and gadget shops.
            </p>
          </div>

          {/* Links Columns with Framer Motion hover 1.02 & whileTap 0.8 */}
          <div>
            <h4 className="text-white font-semibold mb-6 text-sm tracking-wide uppercase">
              Register Suite
            </h4>
            <ul className="space-y-4 text-sm text-slate-400">
              <li>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.8 }} className="inline-block origin-left">
                  <Link href="/pos/terminal" className="hover:text-white transition-colors">
                    Cashier Terminal
                  </Link>
                </motion.div>
              </li>
              <li>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.8 }} className="inline-block origin-left">
                  <Link href="/pos/shifts" className="hover:text-white transition-colors">
                    Shift Balancing
                  </Link>
                </motion.div>
              </li>
              <li>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.8 }} className="inline-block origin-left">
                  <Link href="/pos/orders" className="hover:text-white transition-colors">
                    Order Ledger
                  </Link>
                </motion.div>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-6 text-sm tracking-wide uppercase">
              Administration
            </h4>
            <ul className="space-y-4 text-sm text-slate-400">
              <li>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.8 }} className="inline-block origin-left">
                  <Link href="/admin/dashboard" className="hover:text-white transition-colors">
                    Executive Cockpit
                  </Link>
                </motion.div>
              </li>
              <li>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.8 }} className="inline-block origin-left">
                  <Link href="/admin/catalog" className="hover:text-white transition-colors">
                    Catalog Registry
                  </Link>
                </motion.div>
              </li>
              <li>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.8 }} className="inline-block origin-left">
                  <Link href="/admin/payroll" className="hover:text-white transition-colors">
                    Payroll Ledger
                  </Link>
                </motion.div>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-6 text-sm tracking-wide uppercase">
              System
            </h4>
            <ul className="space-y-4 text-sm text-slate-400">
              <li>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.8 }} className="inline-block origin-left">
                  <Link href="/login" className="hover:text-white transition-colors">
                    Admin Sign In
                  </Link>
                </motion.div>
              </li>
              <li>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.8 }} className="inline-block origin-left">
                  <Link href="#" className="hover:text-white transition-colors">
                    Support Helpdesk
                  </Link>
                </motion.div>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© 2026 SunTech POS. All rights reserved.</p>
          <div className="flex gap-6">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.8 }} className="inline-block">
              <Link href="#" className="hover:text-white transition-colors">
                Privacy Policy
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.8 }} className="inline-block">
              <Link href="#" className="hover:text-white transition-colors">
                Terms of Service
              </Link>
            </motion.div>
          </div>
        </div>
      </Container>
    </footer>
  );
}
