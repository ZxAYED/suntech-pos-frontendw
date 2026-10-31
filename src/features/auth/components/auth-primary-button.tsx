"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { HTMLMotionProps } from "framer-motion";
import { ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AuthPrimaryButtonProps
  extends Omit<HTMLMotionProps<"button">, "children"> {
  loading?: boolean;
  children: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}

export function AuthPrimaryButton({
  loading = false,
  children,
  icon: Icon = ArrowRight,
  className,
  disabled,
  ...props
}: AuthPrimaryButtonProps) {
  const reduceMotion = useReducedMotion();
  const isDisabled = disabled || loading;

  return (
    <motion.button
      whileHover={isDisabled || reduceMotion ? {} : { scale: 1.01 }}
      whileTap={isDisabled || reduceMotion ? {} : { scale: 0.99 }}
      transition={{ duration: 0.15 }}
      disabled={isDisabled}
      className={cn(
        "relative flex h-11 sm:h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0052FF] px-6 text-xs sm:text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-[#0047E0] hover:shadow-md hover:shadow-blue-600/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0052FF] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer select-none",
        className
      )}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden="true" />
          <span>Authenticating...</span>
        </>
      ) : (
        <>
          <span>{children}</span>
          {Icon && <Icon className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" />}
        </>
      )}
    </motion.button>
  );
}
