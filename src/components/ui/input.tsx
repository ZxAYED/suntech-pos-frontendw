import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex min-h-11 h-11 w-full rounded-md border border-slate-200 bg-white px-3.5 py-2 text-sm text-[#070B28] placeholder:text-slate-400 shadow-xs transition-all duration-150 file:border-0 file:bg-transparent file:text-sm file:font-medium hover:border-[#0052FF]/50 focus-visible:outline-none focus-visible:border-[#0052FF] focus-visible:ring-2 focus-visible:ring-[#0052FF]/20 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
