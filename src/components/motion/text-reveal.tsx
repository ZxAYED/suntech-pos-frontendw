"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { motionTokens } from "./motion-tokens";
import { cn } from "@/lib/utils";

interface TextRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "span" | "div";
  mode?: "scroll" | "mount";
}

export function TextReveal({
  children,
  className,
  delay = 0,
  duration = motionTokens.duration.standard,
  as = "div",
  mode = "scroll",
}: TextRevealProps) {
  const reduceMotion = useReducedMotion();
  const Component = as;

  if (reduceMotion) {
    return <Component className={className}>{children}</Component>;
  }

  return (
    <Component className={cn("overflow-hidden", className)}>
      <motion.div
        initial={{ y: "100%", opacity: 0 }}
        {...(mode === "mount"
          ? { animate: { y: 0, opacity: 1 } }
          : { whileInView: { y: 0, opacity: 1 }, viewport: { once: true, amount: 0.2 } })}
        transition={{
          duration,
          delay,
          ease: motionTokens.easeOut,
        }}
      >
        {children}
      </motion.div>
    </Component>
  );
}
