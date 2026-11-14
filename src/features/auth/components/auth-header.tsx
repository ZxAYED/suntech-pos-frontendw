"use client";

import React from "react";
import { motion } from "framer-motion";
import { KeyRound } from "lucide-react";
import { BrandLogo } from "@/components/common/brand-logo";
import { cn } from "@/lib/utils";

interface AuthHeaderProps {
  badge?: React.ReactNode;
  badgeVariant?: "blue" | "emerald" | "amber" | "navy";
  title: React.ReactNode;
  subtitle: string;
  className?: string;
  onBadgeClick?: () => void;
}

export function AuthHeader({
  badge,
  badgeVariant = "navy",
  title,
  subtitle,
  className,
  onBadgeClick,
}: AuthHeaderProps) {
  const badgeColors = {
    navy: "bg-[#0A1138] text-white border-[#0A1138] hover:bg-[#101B54] shadow-xs",
    blue: "bg-blue-50 text-[#0052FF] border-blue-100/70 hover:bg-blue-100/70",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100/70 hover:bg-emerald-100/70",
    amber: "bg-amber-50 text-amber-800 border-amber-200/70 hover:bg-amber-100/70",
  }[badgeVariant];

  return (
    <div className={cn("space-y-4 pb-6 border-b border-slate-100", className)}>
      <div className="flex items-center justify-between">
        <BrandLogo size="md" href="/" />
        {badge &&
          (onBadgeClick ? (
            <motion.button
              type="button"
              onClick={onBadgeClick}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs sm:text-[13px] font-bold tracking-wide cursor-pointer",
                badgeColors,
              )}
              title="Click here for demo login"
            >
              <KeyRound className="h-3.5 w-3.5 shrink-0 text-blue-300" />
              <span>{badge}</span>
            </motion.button>
          ) : (
            <span
              className={cn(
                "inline-flex items-center rounded-full border px-3 py-1 text-xs sm:text-[13px] font-bold tracking-wide",
                badgeColors,
              )}
            >
              {badge}
            </span>
          ))}
      </div>

      <div className="space-y-1 pt-1">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0A1138]">
          {title}
        </h1>
        <p className="text-xs sm:text-sm text-[#58647A] leading-relaxed">
          {subtitle}
        </p>
      </div>
    </div>
  );
}
