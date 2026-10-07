import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  HardDrive,
  Laptop,
  ShieldCheck,
  Smartphone,
  Sparkles,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-700 font-sans selection:bg-[#0052FF] selection:text-white">
      {/* Top Utility Bar */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#0052FF] text-sm font-bold text-white shadow-sm">
              S
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight text-[#070B28]">
                SunTech <span className="text-[#0052FF]">POS</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                Retail Terminal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/admin/dashboard"
              className="text-xs font-semibold text-slate-700 hover:text-[#070B28] px-3 py-1.5 transition-colors"
            >
              Admin Cockpit
            </Link>
            <Link
              href="/pos/terminal"
              className="inline-flex items-center gap-1.5 rounded-md bg-[#0052FF] px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#0047E0] active:scale-[0.98] transition-all"
            >
              <span>Launch Terminal</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Banner Section */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden">
        {/* Background Image with fill */}
        <Image
          src="/images/asset-1.jpg"
          alt="SunTech Retail Gadget Store Setup"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />

        {/* Dark Navy Overlay */}
        <div className="absolute inset-0 bg-[#070B28]/80 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#070B28] via-[#070B28]/90 to-transparent" />

        {/* Content Container */}
        <div className="relative z-10 mx-auto w-full max-w-6xl px-4 sm:px-6 py-16 lg:py-24">
          <div className="max-w-2xl text-left">
            {/* Retail Badge */}
            <div className="inline-flex items-center gap-2 rounded-md border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur-md mb-6 shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-[#0052FF]" />
              <span>Built for Mobile & Gadget Retail</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.15]">
              Unbreakable Retail <span className="text-[#0052FF]">Operations</span>
            </h1>

            {/* Subtitle */}
            <p className="mt-4 text-sm sm:text-base text-slate-200 leading-relaxed max-w-xl">
              High-speed checkout, barcode scanning, and multi-location inventory for modern shops across Bangladesh.
            </p>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/pos/terminal"
                className="inline-flex items-center gap-2 rounded-md bg-[#0052FF] px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-[#0047E0] active:scale-[0.98] transition-all"
              >
                <span>Open Terminal</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center gap-2 rounded-md border border-white/30 bg-white/10 px-5 py-2.5 text-xs sm:text-sm font-medium text-white backdrop-blur-md hover:bg-white/20 active:scale-[0.98] transition-all"
              >
                <span>Explore Features</span>
              </a>
            </div>

            {/* Fast Stats Row */}
            <div className="mt-10 grid grid-cols-3 gap-4 border-t border-white/15 pt-6 max-w-lg">
              <div>
                <p className="font-mono text-xl sm:text-2xl font-bold text-white tabular-nums">0.3s</p>
                <p className="text-[11px] text-slate-300 font-medium">Barcode Scan Speed</p>
              </div>
              <div>
                <p className="font-mono text-xl sm:text-2xl font-bold text-white tabular-nums">100%</p>
                <p className="text-[11px] text-slate-300 font-medium">Offline Resilience</p>
              </div>
              <div>
                <p className="font-mono text-xl sm:text-2xl font-bold text-white tabular-nums">0%</p>
                <p className="text-[11px] text-slate-300 font-medium">Float Drift</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Row */}
      <section className="border-y border-slate-200 bg-white py-5 px-4">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
          <p className="text-xs sm:text-sm font-medium text-slate-500">
            Powering electronics and accessory stores across Bangladesh
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-semibold text-slate-700">
            <span className="rounded bg-slate-100 px-2.5 py-1 border border-slate-200/60">Jamuna Future Park</span>
            <span className="rounded bg-slate-100 px-2.5 py-1 border border-slate-200/60">Bashundhara City</span>
            <span className="rounded bg-slate-100 px-2.5 py-1 border border-slate-200/60">Chittagong Hub</span>
            <span className="rounded bg-slate-100 px-2.5 py-1 border border-slate-200/60">Sylhet Central</span>
          </div>
        </div>
      </section>

      {/* Feature Bento Grid */}
      <section id="features" className="mx-auto max-w-6xl py-16 px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#0052FF] bg-blue-50 px-2.5 py-1 rounded border border-blue-100">
            Enterprise Architecture
          </span>
          <h2 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-[#070B28]">
            Engineered for High-Velocity Electronics Retail
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-700">
            Designed for chaotic shop floors where cashiers need instant tactile responses and 100% operational uptime.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Cell 1 (Span 2): Dark Navy Offline-First Card */}
          <div className="md:col-span-2 rounded-lg border border-slate-800 bg-[#070B28] p-6 text-white shadow-sm flex flex-col justify-between relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#0052FF] text-white shadow-sm">
                  <HardDrive className="h-5 w-5" />
                </div>
                {/* Live Syncing Chip */}
                <div className="inline-flex items-center gap-2 rounded-md bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 text-xs font-medium text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Local Queue: 0 Pending, Sync Engine Active</span>
                </div>
              </div>
              <h3 className="text-lg font-bold text-white">Offline-First Engine</h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
                Zero register downtime during broadband disconnects. Local hardware registers queue ticket items, calculate VAT, and synchronize automatically upon cloud reconnect.
              </p>
            </div>

            {/* Miniature Mock Terminal Telemetry */}
            <div className="mt-6 rounded-md border border-white/10 bg-white/5 p-3 font-mono text-xs tabular-nums text-slate-300">
              <div className="flex justify-between items-center text-[11px] text-slate-400 border-b border-white/10 pb-1.5 mb-2">
                <span>DRAWER STATE: BALANCED</span>
                <span className="text-emerald-400">HEARTBEAT: 22ms</span>
              </div>
              <div className="flex justify-between">
                <span>Total Shift Cash: 10,000 BDT Float</span>
                <span className="text-white font-bold">COD Settled: 14,820 BDT</span>
              </div>
            </div>
          </div>

          {/* Cell 2 (Span 1): Laptop & Desktop Ready (Asset 2) */}
          <div className="relative min-h-[280px] rounded-lg border border-slate-200 overflow-hidden shadow-sm group">
            <Image
              src="/images/asset-2.jpg"
              alt="Laptop Register Setup"
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover object-center transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#070B28] via-[#070B28]/60 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5 text-white">
              <div className="flex h-7 w-7 items-center justify-center rounded bg-white/20 backdrop-blur-sm text-white mb-2">
                <Laptop className="h-4 w-4" />
              </div>
              <h3 className="text-base font-bold text-white">Laptop & Desktop Ready</h3>
              <p className="mt-1 text-xs text-slate-200">
                Optimized for standard keyboard shortcuts (F2 search, F4 scan) and external POS displays.
              </p>
            </div>
          </div>

          {/* Cell 3 (Span 1): Real-Time Stock Audits (Asset 3) */}
          <div className="relative min-h-[280px] rounded-lg border border-slate-200 overflow-hidden shadow-sm group">
            <Image
              src="/images/asset-3.jpg"
              alt="Inventory Auditing Tablet"
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover object-center transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#070B28] via-[#070B28]/60 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5 text-white">
              <div className="flex h-7 w-7 items-center justify-center rounded bg-white/20 backdrop-blur-sm text-white mb-2">
                <Smartphone className="h-4 w-4" />
              </div>
              <h3 className="text-base font-bold text-white">Real-Time Stock Audits</h3>
              <p className="mt-1 text-xs text-slate-200">
                Instant SKU variance checks and multi-outlet inventory transfers from handheld tablets.
              </p>
            </div>
          </div>

          {/* Cell 4 (Span 2): Clean Financial Calculations White Card */}
          <div className="md:col-span-2 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-50 text-[#0052FF]">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <h3 className="text-base font-bold text-[#070B28]">Clean Financial Calculations</h3>
              </div>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                Strict Integer Math
              </span>
            </div>
            <p className="text-xs text-slate-700 mb-4">
              All line item calculations, subtotal discounts, and VAT assessments are computed as exact integer units, eliminating rounding drift during live shift balancing.
            </p>

            {/* Mockup Ledger Table */}
            <div className="rounded-md border border-slate-200 overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px] font-semibold">
                  <tr>
                    <th className="py-2 px-3 text-left">Invoice / Ticket</th>
                    <th className="py-2 px-3 text-left">Item Summary</th>
                    <th className="py-2 px-3 text-left">Tender</th>
                    <th className="py-2 px-3 text-right">VAT (5%)</th>
                    <th className="py-2 px-3 text-right">Total (BDT)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2 px-3 font-mono font-bold text-[#070B28] tabular-nums">#INV-2026-901</td>
                    <td className="py-2 px-3 text-slate-700">Infinix 45W Fast Charger (x1)</td>
                    <td className="py-2 px-3 text-slate-700 font-medium">Cash (COD)</td>
                    <td className="py-2 px-3 font-mono text-slate-500 text-right tabular-nums">72.50</td>
                    <td className="py-2 px-3 font-mono font-bold text-[#070B28] text-right tabular-nums">1,522.50 BDT</td>
                  </tr>
                  <tr className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2 px-3 font-mono font-bold text-[#070B28] tabular-nums">#INV-2026-902</td>
                    <td className="py-2 px-3 text-slate-700">Baseus Type-C Cable + Soundcore R50i</td>
                    <td className="py-2 px-3 text-slate-700 font-medium">bKash Merchant</td>
                    <td className="py-2 px-3 font-mono text-slate-500 text-right tabular-nums">127.00</td>
                    <td className="py-2 px-3 font-mono font-bold text-[#070B28] text-right tabular-nums">2,667.00 BDT</td>
                  </tr>
                  <tr className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2 px-3 font-mono font-bold text-[#070B28] tabular-nums">#INV-2026-903</td>
                    <td className="py-2 px-3 text-slate-700">Privacy Glass Protector (iPhone 15)</td>
                    <td className="py-2 px-3 text-slate-700 font-medium">Cash (COD)</td>
                    <td className="py-2 px-3 font-mono text-slate-500 text-right tabular-nums">12.50</td>
                    <td className="py-2 px-3 font-mono font-bold text-[#070B28] text-right tabular-nums">262.50 BDT</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA Strip */}
      <section className="border-t border-slate-200 bg-white py-12 px-4">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-[#070B28]">
            Equip Your Store With SunTech POS Today
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-700">
            Open the live register terminal immediately or audit sales in the admin operations dashboard.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              href="/pos/terminal"
              className="rounded-md bg-[#0052FF] px-6 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-[#0047E0] active:scale-[0.98] transition-all"
            >
              Open POS Terminal
            </Link>
            <Link
              href="/admin/dashboard"
              className="rounded-md border border-slate-200 bg-white px-6 py-2.5 text-xs sm:text-sm font-semibold text-[#070B28] shadow-sm hover:bg-slate-50 active:scale-[0.98] transition-all"
            >
              View Admin Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-[#070B28] py-8 px-4 text-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
          <div>
            <p className="text-sm font-bold text-white">SunTech Point of Sale</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Multi-tenant retail terminal infrastructure for electronics shops in Bangladesh.
            </p>
          </div>
          <div className="flex gap-4 text-xs text-slate-300">
            <Link href="/pos/terminal" className="hover:text-white transition-colors">Terminal</Link>
            <Link href="/admin/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
            <Link href="/admin/catalog" className="hover:text-white transition-colors">Catalog</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
