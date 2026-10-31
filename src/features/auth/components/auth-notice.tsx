"use client";

import React from "react";
import { Info, ShieldAlert, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AuthNoticeProps {
  variant?: "info" | "amber" | "emerald";
  title?: string;
  children: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}

export function AuthNotice({
  variant = "info",
  title,
  children,
  icon,
  className,
}: AuthNoticeProps) {
  const styles = {
    info: {
      container: "bg-blue-50/70 border-blue-200/80 text-blue-900",
      iconColor: "text-[#0052FF]",
      defaultIcon: Info,
    },
    amber: {
      container: "bg-amber-50/70 border-amber-200/80 text-amber-950",
      iconColor: "text-amber-600",
      defaultIcon: ShieldAlert,
    },
    emerald: {
      container: "bg-emerald-50/70 border-emerald-200/80 text-emerald-950",
      iconColor: "text-emerald-600",
      defaultIcon: CheckCircle2,
    },
  }[variant];

  const IconComponent = icon || styles.defaultIcon;

  return (
    <div
      role="note"
      className={cn(
        "rounded-xl border p-3.5 sm:p-4 text-xs flex items-start gap-3 transition-colors",
        styles.container,
        className
      )}
    >
      <IconComponent className={cn("h-4 w-4 shrink-0 mt-0.5", styles.iconColor)} aria-hidden="true" />
      <div className="space-y-0.5 leading-relaxed min-w-0">
        {title && <p className="font-semibold">{title}</p>}
        <div className="opacity-90">{children}</div>
      </div>
    </div>
  );
}
