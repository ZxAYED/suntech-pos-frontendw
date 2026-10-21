import React from "react";

export interface MetricCardProps {
  label: string;
  value: string | number;
  suffix?: string;
  icon?: React.ComponentType<{ className?: string }>;
  subtext?: React.ReactNode;
  trend?: {
    value: string;
    positive?: boolean;
    neutral?: boolean;
  };
  iconColor?: string;
  className?: string;
}

export function MetricCard({
  label,
  value,
  suffix,
  icon: Icon,
  subtext,
  trend,
  iconColor = "text-[#0052FF]",
  className = "",
}: MetricCardProps) {
  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white p-5 shadow-2xs flex flex-col justify-between ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {label}
        </span>
        {Icon && <Icon className={`h-4 w-4 shrink-0 ${iconColor}`} />}
      </div>

      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="font-mono text-2xl sm:text-3xl font-bold text-[#070B28] tabular-nums">
          {value}
        </span>
        {suffix && (
          <span className="text-xs font-normal text-slate-400 font-sans">
            {suffix}
          </span>
        )}
      </div>

      {(trend || subtext) && (
        <div className="mt-1.5 text-xs text-slate-500 flex items-center gap-1.5">
          {trend && (
            <span
              className={`font-medium ${
                trend.neutral
                  ? "text-slate-500"
                  : trend.positive
                  ? "text-emerald-600"
                  : "text-rose-500"
              }`}
            >
              {trend.value}
            </span>
          )}
          {subtext && <span>{subtext}</span>}
        </div>
      )}
    </div>
  );
}
