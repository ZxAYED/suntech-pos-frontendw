"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface AuthCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export function AuthCard({ children, className, ...props }: AuthCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 lg:p-9 shadow-[0_20px_50px_-12px_rgba(7,11,40,0.08),0_1px_3px_rgba(7,11,40,0.04)] transition-all",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
