"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AuthShellProps {
  children: React.ReactNode;
  className?: string;
  cardMaxWidth?: "sm" | "md" | "lg";
}

export function AuthShell({
  children,
  className,
  cardMaxWidth = "md",
}: AuthShellProps) {
  const reduceMotion = useReducedMotion();

  const maxWidthClass = {
    sm: "max-w-md",
    md: "max-w-[480px]",
    lg: "max-w-xl",
  }[cardMaxWidth];

  return (
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-[#F7F9FC] p-4 sm:p-6 lg:p-10 selection:bg-[#0052FF] selection:text-white">
      {/* Subtle ambient radial gradient mesh matching landing hero */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(0,82,255,0.07),rgba(56,189,248,0.03),transparent)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 left-1/2 -z-10 h-72 w-96 -translate-x-1/2 rounded-full bg-blue-100/40 blur-3xl"
      />

      {/* Main Responsive Container */}
      <motion.div
        initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 14, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className={cn("w-full relative z-10", maxWidthClass, className)}
      >
        {children}
      </motion.div>
    </main>
  );
}
