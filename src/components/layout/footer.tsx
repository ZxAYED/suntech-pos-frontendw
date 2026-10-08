"use client";

import Link from "next/link";
import { BrandLogo } from "@/components/common/brand-logo";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-[#F8FAFC] font-sans select-none">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand Info */}
          <div className="space-y-3">
            <BrandLogo size="md" href="/" />
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs">
              High-performance retail Point of Sale and inventory telemetry designed for modern electronics and gadget shops.
            </p>
            <div className="inline-flex items-center gap-2 rounded border border-slate-200 bg-white px-2 py-1 text-[11px] font-mono text-slate-700 tabular-nums">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Offline Engine Active</span>
            </div>
          </div>

          {/* POS Suite */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#070B28]">
              Register Suite
            </h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li>
                <Link href="/pos/terminal" className="hover:text-[#0052FF] transition-colors cursor-pointer">
                  Cashier Terminal
                </Link>
              </li>
              <li>
                <Link href="/pos/shifts" className="hover:text-[#0052FF] transition-colors cursor-pointer">
                  Shift Balancing & Float
                </Link>
              </li>
              <li>
                <Link href="/pos/orders" className="hover:text-[#0052FF] transition-colors cursor-pointer">
                  Order & Ticket History
                </Link>
              </li>
            </ul>
          </div>

          {/* Administration */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#070B28]">
              Administration
            </h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li>
                <Link href="/admin/dashboard" className="hover:text-[#0052FF] transition-colors cursor-pointer">
                  Executive Cockpit
                </Link>
              </li>
              <li>
                <Link href="/admin/catalog" className="hover:text-[#0052FF] transition-colors cursor-pointer">
                  SKU & Catalog Registry
                </Link>
              </li>
              <li>
                <Link href="/admin/staff" className="hover:text-[#0052FF] transition-colors cursor-pointer">
                  Staff & Attendance
                </Link>
              </li>
              <li>
                <Link href="/admin/payroll" className="hover:text-[#0052FF] transition-colors cursor-pointer">
                  Payroll Ledger
                </Link>
              </li>
              <li>
                <Link href="/admin/reports" className="hover:text-[#0052FF] transition-colors cursor-pointer">
                  Financial Analytics
                </Link>
              </li>
            </ul>
          </div>

          {/* Outlet Access */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#070B28]">
              Outlet Access
            </h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li>
                <Link href="/login" className="hover:text-[#0052FF] transition-colors cursor-pointer">
                  Cashier & Admin Sign In
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-[#0052FF] transition-colors cursor-pointer">
                  Register New Store
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Strip */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-6 sm:flex-row text-xs text-slate-500 font-mono tabular-nums">
          <div>© 2026 SunTech POS. All rights reserved.</div>
          <div className="flex items-center gap-4">
            <span>Jamuna Hub: Lane 01</span>
            <span>Float: 10,000 BDT</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
