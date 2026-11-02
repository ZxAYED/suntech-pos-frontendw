"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface FormFieldProps {
  label: string;
  children: React.ReactNode;
  id?: string;
  className?: string;
  error?: string;
  hint?: string;
  action?: React.ReactNode;
}

export function FormField({
  label,
  children,
  id,
  className,
  error,
  hint,
  action,
}: FormFieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between">
        <label
          htmlFor={id}
          className="text-xs font-medium text-slate-600 select-none"
        >
          {label}
        </label>
        {action}
      </div>
      {children}
      {hint && !error && (
        <p className="text-[11px] text-slate-400">{hint}</p>
      )}
      {error && (
        <p className="text-[11px] font-medium text-rose-500">{error}</p>
      )}
    </div>
  );
}

// Convenient alias for components expecting <Field>
export const Field = FormField;
