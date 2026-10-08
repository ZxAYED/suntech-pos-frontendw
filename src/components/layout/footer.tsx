"use client";

import Link from "next/link";
import { BrandLogo } from "@/components/common/brand-logo";

export function Footer() {
  return (
    <footer className="w-full bg-[#070B28] border-t border-slate-800 pt-20 pb-10 px-6 lg:px-12 mt-auto">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
        {/* Brand Column with Reusable BrandLogo */}
        <div className="col-span-1 md:col-span-1">
          <div className="mb-6">
            <BrandLogo size="md" inverse href="/" />
          </div>
          <p className="text-slate-400 text-sm leading-relaxed">
            High-performance retail Point of Sale and inventory telemetry designed for modern electronics and gadget shops.
          </p>
          <div className="mt-6 flex items-center gap-2 text-emerald-400 text-xs font-mono bg-emerald-400/10 w-fit px-3 py-1.5 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Offline Engine Active
          </div>
        </div>

        {/* Links Columns */}
        <div>
          <h4 className="text-white font-semibold mb-6 text-sm tracking-wide uppercase">
            Register Suite
          </h4>
          <ul className="space-y-4 text-sm text-slate-400">
            <li>
              <Link href="/pos/terminal" className="hover:text-white transition-colors">
                Cashier Terminal
              </Link>
            </li>
            <li>
              <Link href="/pos/shifts" className="hover:text-white transition-colors">
                Shift Balancing
              </Link>
            </li>
            <li>
              <Link href="/pos/orders" className="hover:text-white transition-colors">
                Order Ledger
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-6 text-sm tracking-wide uppercase">
            Administration
          </h4>
          <ul className="space-y-4 text-sm text-slate-400">
            <li>
              <Link href="/admin/dashboard" className="hover:text-white transition-colors">
                Executive Cockpit
              </Link>
            </li>
            <li>
              <Link href="/admin/catalog" className="hover:text-white transition-colors">
                Catalog Registry
              </Link>
            </li>
            <li>
              <Link href="/admin/payroll" className="hover:text-white transition-colors">
                Payroll Ledger
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-6 text-sm tracking-wide uppercase">
            System
          </h4>
          <ul className="space-y-4 text-sm text-slate-400">
            <li>
              <Link href="/login" className="hover:text-white transition-colors">
                Admin Sign In
              </Link>
            </li>
            <li>
              <Link href="#" className="hover:text-white transition-colors">
                Support Helpdesk
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
        <p>© 2026 SunTech POS. All rights reserved.</p>
        <div className="flex gap-6">
          <Link href="#" className="hover:text-white transition-colors">
            Privacy Policy
          </Link>
          <Link href="#" className="hover:text-white transition-colors">
            Terms of Service
          </Link>
        </div>
      </div>
    </footer>
  );
}
