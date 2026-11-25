"use client";

import { useEffect, useMemo, useRef } from "react";
import { animate, motion, useInView, useMotionValue, useTransform } from "framer-motion";
import { useReducedMotionPreference } from "./use-reduced-motion-preference";
import { motionTokens } from "./motion-tokens";

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
  const reduceMotion = useReducedMotionPreference();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const started = useRef(false);
  const number = useMotionValue(value);
  const formatter = useMemo(() => new Intl.NumberFormat("en-BD", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }), [decimals]);
  const display = useTransform(() => `${prefix}${formatter.format(number.get())}${suffix}`);

  useEffect(() => {
    if (reduceMotion || !inView) {
      number.jump(value);
      return;
    }
    if (!started.current) {
      started.current = true;
      number.set(0);
    }
    const animation = animate(number, value, { duration, ease: motionTokens.easeOut });
    return () => animation.stop();
  }, [duration, inView, number, reduceMotion, value]);

  return <motion.span ref={ref} className={className}>{display}</motion.span>;
}
