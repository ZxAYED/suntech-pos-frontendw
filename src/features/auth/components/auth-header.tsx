"use client";

import React from "react";
import { BrandLogo } from "@/components/common/brand-logo";
import { cn } from "@/lib/utils";

interface AuthHeaderProps {
  badge?: string;
  badgeVariant?: "blue" | "emerald" | "amber";
  title: React.ReactNode;
  subtitle: string;
  className?: string;
}

export function AuthHeader({
  badge,
  badgeVariant = "blue",
  title,
  subtitle,
  className,
}: AuthHeaderProps) {
  const badgeColors = {
    blue: "bg-blue-50 text-[#0052FF] border-blue-100/70",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100/70",
    amber: "bg-amber-50 text-amber-800 border-amber-200/70",
  }[badgeVariant];

  return (
    <div className={cn("space-y-4 pb-6 border-b border-slate-100", className)}>
      <div className="flex items-center justify-between">
        <BrandLogo size="md" href="/" />
        {badge && (
          <span
            className={cn(
              "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide",
              badgeColors
            )}
          >
            {badge}
          </span>
        )}
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
