"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Diamond, Hexagon, Octagon, Pentagon, Triangle } from "lucide-react";
import { HeadroomNavbar } from "@/components/layout/headroom-navbar";
import { Footer } from "@/components/layout/footer";

const ledgerRows = [
  { ticket: "INV-0901", sku: "INF-CHG-45W", qty: 1, net: 1450, vat: 73, total: 1523 },
  { ticket: "INV-0902", sku: "ANK-R50I-BLK", qty: 1, net: 2150, vat: 108, total: 2258 },
  { ticket: "INV-0903", sku: "CBL-TC-1M", qty: 2, net: 700, vat: 35, total: 735 },
  { ticket: "INV-0904", sku: "SM-A156B-DS", qty: 1, net: 22999, vat: 1150, total: 24149 },
  { ticket: "INV-0905", sku: "PRV-GLS-15P", qty: 3, net: 750, vat: 38, total: 788 },
  { ticket: "INV-0906", sku: "APL-20W-ORIG", qty: 1, net: 2800, vat: 140, total: 2940 },
];

const ledgerTotals = ledgerRows.reduce(
  (acc, r) => ({ net: acc.net + r.net, vat: acc.vat + r.vat, total: acc.total + r.total }),
  { net: 0, vat: 0, total: 0 },
);

const partnerMarks = [Hexagon, Triangle, Octagon, Diamond, Pentagon];

const fmt = (n: number) => n.toLocaleString("en-US");

const tap = { whileHover: { scale: 1.03 }, whileTap: { scale: 0.8 } };

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-700 selection:bg-[#0052FF] selection:text-white">
      {/* Fixed Sticky Headroom Navbar */}
      <HeadroomNavbar />

      {/* Section 1: Cinematic Hero */}
      <section className="relative flex min-h-[85vh] w-full items-end overflow-hidden pb-20 pt-24">
        <Image
          src="/images/asset-1.jpg"
          alt="SunTech POS retail counter"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#070B28] via-[#070B28]/60 to-transparent" />

        <div className="relative z-10 mx-auto w-full max-w-7xl px-6">
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-5xl text-5xl font-bold leading-[0.95] tracking-tighter text-white md:text-7xl lg:text-8xl"
          >
            Unbreakable Retail <span className="text-[#0052FF]">Operations.</span>
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <motion.div {...tap}>
              <Link
                href="/pos/terminal"
                className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-md bg-[#0052FF] px-5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#0047E0]"
              >
                Open Terminal
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </motion.div>
            <motion.div {...tap}>
              <Link
                href="/admin/dashboard"
                className="inline-flex h-10 cursor-pointer items-center rounded-md border border-white/20 bg-white/10 px-5 text-xs font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/20 shadow-xs"
              >
                View Dashboard
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Section 2: Minimalist Logo Strip */}
      <section className="border-t border-slate-200 bg-[#F8FAFC] py-12">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-16 gap-y-8 px-6">
          {partnerMarks.map((Mark, i) => (
            <Mark key={i} className="h-8 w-8 text-slate-400" strokeWidth={1.5} aria-hidden />
          ))}
        </div>
      </section>

      {/* Section 3: Asymmetric Bento */}
      <section className="bg-[#F8FAFC] px-6 py-32">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 md:grid-cols-4">
          {/* Card 1: Strict Financials (2x2) */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col rounded-xl border border-slate-200 bg-white p-6 md:col-span-2 md:row-span-2"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold tracking-tight text-[#070B28]">Strict Financials.</h2>
              <span className="inline-flex items-center gap-1.5 rounded border border-slate-200 px-2 py-1 font-mono text-[11px] tabular-nums text-[#070B28]">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                DRIFT 0
              </span>
            </div>

            <div className="mt-6 flex-1 overflow-hidden rounded-md border border-slate-200">
              <table className="w-full text-xs">
                <thead className="border-b border-slate-200 bg-[#F8FAFC]">
                  <tr className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    <th className="px-3 py-2.5 text-left">Ticket</th>
                    <th className="px-3 py-2.5 text-left">SKU</th>
                    <th className="px-3 py-2.5 text-right">Qty</th>
                    <th className="px-3 py-2.5 text-right">Net</th>
                    <th className="px-3 py-2.5 text-right">VAT</th>
                    <th className="px-3 py-2.5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
                  {ledgerRows.map((r) => (
                    <tr key={r.ticket} className="transition-colors hover:bg-[#F8FAFC]">
                      <td className="px-3 py-3 font-semibold text-[#070B28]">{r.ticket}</td>
                      <td className="px-3 py-3 text-slate-500">{r.sku}</td>
                      <td className="px-3 py-3 text-right text-[#070B28]">{r.qty}</td>
                      <td className="px-3 py-3 text-right text-[#070B28]">{fmt(r.net)}</td>
                      <td className="px-3 py-3 text-right text-slate-500">{fmt(r.vat)}</td>
                      <td className="px-3 py-3 text-right font-semibold text-[#070B28]">{fmt(r.total)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t border-slate-200 bg-[#F8FAFC] font-mono tabular-nums">
                  <tr>
                    <td colSpan={3} className="px-3 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500 font-sans">
                      BDT
                    </td>
                    <td className="px-3 py-3 text-right font-semibold text-[#070B28]">{fmt(ledgerTotals.net)}</td>
                    <td className="px-3 py-3 text-right text-slate-500">{fmt(ledgerTotals.vat)}</td>
                    <td className="px-3 py-3 text-right text-sm font-bold text-[#0052FF]">{fmt(ledgerTotals.total)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </motion.div>

          {/* Card 2: Hardware Agnostic */}
          <ImageCard src="/images/asset-2.jpg" alt="Laptop register setup" title="Hardware Agnostic." delay={0.08} />

          {/* Card 3: Live Stock Audits */}
          <ImageCard src="/images/asset-3.jpg" alt="Tablet stock audit" title="Live Stock Audits." delay={0.16} />
        </div>
      </section>

      {/* Closing CTA */}
      <section className="border-t border-slate-200 bg-white px-6 py-32">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 md:flex-row md:items-end">
          <h2 className="max-w-3xl text-5xl font-bold leading-[0.95] tracking-tighter text-[#070B28] md:text-7xl">
            Open the register.
          </h2>
          <motion.div {...tap}>
            <Link
              href="/pos/terminal"
              className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-md bg-[#0052FF] px-5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#0047E0]"
            >
              Open Terminal
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Comprehensive Footer */}
      <Footer />
    </div>
  );
}

function ImageCard({ src, alt, title, delay }: { src: string; alt: string; title: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ delay, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="group relative h-72 overflow-hidden rounded-xl border border-slate-200 md:col-span-2"
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 768px) 100vw, 50vw"
        className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.04]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#070B28]/90 via-[#070B28]/20 to-transparent" />
      <h3 className="absolute bottom-6 left-6 text-xl font-bold tracking-tight text-white">{title}</h3>
    </motion.div>
  );
}
