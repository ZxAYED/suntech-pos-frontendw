"use client";

import { useEffect, useRef } from "react";
import { useMotionValue, useTransform, motion, useReducedMotion, animate } from "framer-motion";

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
  duration = 1.1,
  decimals = 0,
}: AnimatedCounterProps) {
  const reduceMotion = useReducedMotion();
  const motionVal = useMotionValue(0);

  const displayVal = useTransform(motionVal, (current) => {
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

    const controls = animate(motionVal, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
    });

    return () => controls.stop();
  }, [value, motionVal, prefix, suffix, decimals, duration, reduceMotion]);

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
