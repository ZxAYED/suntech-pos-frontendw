"use client";

import React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlowingButtonProps {
  href?: string;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary" | "dark";
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
}

export function GlowingButton({
  href,
  onClick,
  children,
  className,
  size = "md",
  variant = "primary",
  type = "button",
  disabled = false,
}: GlowingButtonProps) {
  const reduceMotion = useReducedMotion();

  const sizeStyles = {
    sm: "h-9 sm:h-10 px-4 text-xs font-medium rounded-lg gap-1.5",
    md: "h-11 sm:h-12 px-6 text-sm font-medium rounded-xl gap-2",
    lg: "h-12 sm:h-14 px-7 sm:px-8 text-sm sm:text-base font-medium rounded-xl gap-2.5",
  }[size];

  const variantStyles = {
    primary:
      "bg-[#0052FF] text-white border border-blue-500/40 shadow-sm hover:shadow-md hover:shadow-blue-600/20 hover:bg-[#0047E0]",
    secondary:
      "bg-white text-[#0A1138] border border-slate-200/90 shadow-xs hover:bg-slate-50 hover:border-slate-300",
    dark:
      "bg-white/10 text-white border border-white/20 backdrop-blur-md hover:bg-white/15 hover:border-white/30 shadow-sm",
  }[variant];

  const content = (
    <motion.span
      whileHover={reduceMotion ? {} : { scale: 1.02 }}
      whileTap={reduceMotion ? {} : { scale: 0.98 }}
      className="relative inline-flex items-center justify-center group"
    >
      <span
        className={cn(
          "relative z-10 inline-flex items-center justify-center whitespace-nowrap transition-all duration-200 cursor-pointer select-none",
          sizeStyles,
          variantStyles,
          disabled && "opacity-50 pointer-events-none",
          className
        )}
      >
        {children}
      </span>
    </motion.span>
  );

  if (href) {
    return (
      <Link href={href} className="inline-block">
        {content}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} className="inline-block">
      {content}
    </button>
  );
}
