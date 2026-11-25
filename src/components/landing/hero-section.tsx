"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowRight, MapPin } from "lucide-react";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { useReducedMotionPreference } from "@/components/motion/use-reduced-motion-preference";
import { OperationsPreview } from "./operations-preview";


export function HeroSection() {
  const ref = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotionPreference();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const photoOffset = useTransform(scrollYProgress, [0, 1], [0, 30]);
  const photoY = useSpring(photoOffset, { stiffness: 130, damping: 30 });

  return (
    <section ref={ref} aria-labelledby="landing-title" className="landing-hero">
      <div className="landing-layout">
        <div className="landing-copy">
          <p className="landing-eyebrow">Retail point of sale</p>
          <h1 id="landing-title" className="landing-title">
            <span><span>Every branch</span></span>{" "}
            <span><span>in focus.</span></span>
          </h1>
          <p className="landing-description">
            Run checkout, track stock, and balance each shift across your stores from one SunTech workspace.
          </p>
          <div className="landing-actions">
            <Link href="/pos/terminal" className="landing-primary">
              Launch POS <ArrowRight aria-hidden size={17} />
            </Link>
            <a href="#workspace-preview" className="landing-secondary">
              Explore the product <ArrowDown aria-hidden size={15} />
            </a>
          </div>
        </div>

        <div className="landing-stage">
          <figure className="landing-photo">
            <motion.div className="landing-photo-inner" style={reduceMotion ? undefined : { y: photoY }}>
              <Image src="/images/asset-2.jpg" alt="A laptop on an electronics store counter" fill
                preload sizes="(min-width: 1440px) 650px, (min-width: 1024px) 48vw, (min-width: 768px) 680px, 92vw"
                className="object-cover object-[50%_54%]" />
            </motion.div>
            <figcaption><MapPin size={13} aria-hidden /> Uttara Doyel branch</figcaption>
          </figure>
          <div className="landing-register"><OperationsPreview /></div>
        </div>
      </div>
    </section>
  );
}
