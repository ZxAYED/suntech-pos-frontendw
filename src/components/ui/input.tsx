import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-[#070B28] placeholder:text-slate-400 shadow-sm transition-all duration-150 file:border-0 file:bg-transparent file:text-xs file:font-medium hover:border-slate-300 focus-visible:outline-none focus-visible:border-[#0052FF] focus-visible:ring-1 focus-visible:ring-[#0052FF] disabled:cursor-not-allowed disabled:opacity-50",
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
