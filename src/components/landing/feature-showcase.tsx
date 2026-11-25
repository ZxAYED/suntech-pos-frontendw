"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { useReducedMotionPreference } from "@/components/motion/use-reduced-motion-preference";
import { Activity, Boxes, Building2, Coins, Lock, MapPin, Receipt } from "lucide-react";
import { Container } from "@/components/common/container";
import { MotionReveal, StaggerGroup, StaggerItem } from "@/components/motion/motion-reveal";
import { motionTokens } from "@/components/motion/motion-tokens";

const features = [
  {
    title: "Centralized branch management.",
    description: "See inventory, staff access, and cash drawers for every outlet from a single workspace.",
    items: [
      { icon: Building2, title: "Multi-outlet synchronization", detail: "Reconcile branch stock with your central inventory ledger." },
      { icon: Receipt, title: "Shift and float audits", detail: "Track opening cash, staff advances, and closing variance." },
      { icon: Lock, title: "Role-based access", detail: "Give cashiers, branch managers, and finance teams their own permissions." },
    ],
    image: "/images/asset-1.jpg",
    alt: "An electronics storefront with a checkout terminal at the counter",
    captionIcon: MapPin,
    caption: "Uttara Doyel branch",
    note: "Counter 01",
  },
  {
    title: "Real-time stock audits.",
    description: "Follow high-value electronics from the warehouse to the counter, down to the individual serial number.",
    items: [
      { icon: Boxes, title: "Serial number tracking", detail: "Trace individual handsets, components, and accessories." },
      { icon: Activity, title: "Discrepancy alerts", detail: "See when a physical count differs from the expected balance." },
      { icon: Coins, title: "Cost and gross margin", detail: "Carry wholesale costs through to your financial reports." },
    ],
    image: "/images/asset-3.jpg",
    alt: "A staff member checking stock on a tablet between warehouse shelves",
    captionIcon: Boxes,
    caption: "Inventory audit",
    note: "SM-A156B-DS · 9 pcs",
  },
];

function Feature({ feature, reverse }: { feature: (typeof features)[number]; reverse: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotionPreference();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-4%", "4%"]);
  const scale = useTransform(scrollYProgress, [0, 1], [1.12, 1.02]);
  const CaptionIcon = feature.captionIcon;

  return (
    <article className="grid items-center gap-8 lg:grid-cols-12 lg:gap-16">
      <div className={`min-w-0 lg:col-span-5 ${reverse ? "lg:order-2" : ""}`}>
        <MotionReveal distance={28} duration={motionTokens.duration.reveal}>
          <h2 className="landing-heading">{feature.title}</h2>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-slate-600 sm:text-base">{feature.description}</p>
        </MotionReveal>
        <StaggerGroup className="mt-7 divide-y divide-slate-200 border-y border-slate-200">
          {feature.items.map(({ icon: Icon, title, detail }) => (
            <StaggerItem key={title} yOffset={18} className="flex items-start gap-4 py-4">
              <Icon size={19} className="mt-0.5 shrink-0 text-[#0052ff]" aria-hidden />
              <div>
                <h3 className="text-sm font-semibold text-[#0a1138]">{title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">{detail}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </div>
      <figure ref={ref} className={`relative isolate aspect-[4/3] overflow-hidden rounded-2xl bg-slate-200 sm:aspect-[16/10] lg:col-span-7 ${reverse ? "lg:order-1" : ""}`}>
        <motion.div className="absolute -inset-y-[5%] inset-x-0" style={reduceMotion ? undefined : { y, scale }}>
          <Image src={feature.image} alt={feature.alt} fill sizes="(max-width: 1023px) 96vw, (max-width: 1440px) 54vw, 730px" className="object-cover" />
        </motion.div>
        <div aria-hidden className="absolute inset-0 bg-linear-to-t from-[#0a1138]/85 via-transparent to-transparent" />
        <figcaption className="absolute inset-x-5 bottom-5 flex flex-wrap items-center justify-between gap-2 text-white sm:inset-x-7 sm:bottom-7">
          <span className="flex items-center gap-2 text-sm font-medium"><CaptionIcon size={16} aria-hidden />{feature.caption}</span>
          <span className="font-mono text-xs">{feature.note}</span>
        </figcaption>
      </figure>
    </article>
  );
}

export function FeatureShowcase() {
  return (
    <section aria-label="Branch and inventory management" className="bg-white">
      <Container className="space-y-16 py-16 sm:space-y-24 sm:py-24 lg:space-y-28 lg:py-28">
        {features.map((feature, index) => <Feature key={feature.title} feature={feature} reverse={index % 2 === 1} />)}
      </Container>
    </section>
  );
}
