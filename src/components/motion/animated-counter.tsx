"use client";

import { useEffect, useRef } from "react";
import {
  useMotionValue,
  useTransform,
  motion,
  useReducedMotion,
  animate,
  useInView,
} from "framer-motion";

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
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  const hasAnimatedRef = useRef(false);

  const displayVal = useTransform(motionVal, (current) => {
    const formatted = new Intl.NumberFormat("en-BD", {
      maximumFractionDigits: decimals,
      minimumFractionDigits: decimals,
    }).format(Math.round(current));
    return `${prefix}${formatted}${suffix}`;
  });

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

    // Only start counting once the element is visible in the viewport
    if (!isInView) return;

    // First time in view: count from 0 to value. Subsequent value changes: count from current to value.
    if (!hasAnimatedRef.current) {
      hasAnimatedRef.current = true;
      motionVal.set(0);
    }

    const controls = animate(motionVal, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
    });

    return () => controls.stop();
  }, [value, motionVal, prefix, suffix, decimals, duration, reduceMotion, isInView]);

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
