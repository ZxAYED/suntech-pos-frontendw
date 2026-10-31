"use client";

import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface AuthFormFieldProps {
  label: string;
  id: string;
  action?: React.ReactNode;
  error?: string;
  helperText?: string;
  children?: React.ReactNode;
  className?: string;
}

export function AuthFormField({
  label,
  id,
  action,
  error,
  helperText,
  children,
  className,
}: AuthFormFieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between text-xs">
        <label htmlFor={id} className="font-medium text-[#0A1138]">
          {label}
        </label>
        {action}
      </div>

      {children}

      {error ? (
        <p id={`${id}-error`} className="text-[11px] font-medium text-rose-600 animate-smooth-in">
          {error}
        </p>
      ) : helperText ? (
        <p className="text-[11px] text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
}

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, error, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
      <div className="relative">
        <input
          ref={ref}
          type={showPassword ? "text" : "password"}
          className={cn(
            "flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 pr-10 py-2 text-sm text-[#0A1138] placeholder:text-slate-400 shadow-xs transition-all duration-150 hover:border-[#0052FF]/50 focus-visible:outline-none focus-visible:border-[#0052FF] focus-visible:ring-2 focus-visible:ring-[#0052FF]/20 disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-rose-400 focus-visible:border-rose-500 focus-visible:ring-rose-200",
            className
          )}
          {...props}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShowPassword((prev) => !prev)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none p-1 cursor-pointer"
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Eye className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </div>
    );
  }
);
PasswordInput.displayName = "PasswordInput";
