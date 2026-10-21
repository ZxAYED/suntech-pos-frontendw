"use client";

import { useEffect, useRef } from "react";
import { useMotionValue, useSpring, useTransform, motion, useReducedMotion } from "framer-motion";

interface AnimatedCounterProps {
  value: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  duration?: number;
  decimals?: number;
}

export function AnimatedCounter({
  value,
  prefix = "",
  suffix = "",
  className = "",
  decimals = 0,
}: AnimatedCounterProps) {
  const reduceMotion = useReducedMotion();
  const motionVal = useMotionValue(0);
  const springVal = useSpring(motionVal, {
    stiffness: 140,
    damping: 24,
    mass: 0.8,
  });

  const displayVal = useTransform(springVal, (current) => {
    const formatted = new Intl.NumberFormat("en-BD", {
      maximumFractionDigits: decimals,
      minimumFractionDigits: decimals,
    }).format(Math.round(current));
    return `${prefix}${formatted}${suffix}`;
  });

  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (reduceMotion) {
      if (ref.current) {
        const formatted = new Intl.NumberFormat("en-BD", {
          maximumFractionDigits: decimals,
          minimumFractionDigits: decimals,
        }).format(value);
        ref.current.textContent = `${prefix}${formatted}${suffix}`;
      }
      return;
    }

    motionVal.set(value);
  }, [value, motionVal, prefix, suffix, decimals, reduceMotion]);

  if (reduceMotion) {
    const formatted = new Intl.NumberFormat("en-BD", {
      maximumFractionDigits: decimals,
      minimumFractionDigits: decimals,
    }).format(value);
    return <span className={className}>{`${prefix}${formatted}${suffix}`}</span>;
  }

  return (
    <motion.span ref={ref} className={className}>
      {displayVal}
    </motion.span>
  );
}
