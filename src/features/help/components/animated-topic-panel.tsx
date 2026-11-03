"use client";

import type { ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { motionTokens } from "@/components/motion/motion-tokens";

interface AnimatedTopicPanelProps {
  topicKey: string;
  children: ReactNode;
  className?: string;
}

export function AnimatedTopicPanel({
  topicKey,
  children,
  className,
}: AnimatedTopicPanelProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={topicKey}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{
          duration: 0.26,
          ease: motionTokens.easeOut,
        }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

