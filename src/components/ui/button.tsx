"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { motion, type HTMLMotionProps } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md cursor-pointer select-none transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0052FF] disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed font-medium",
  {
    variants: {
      variant: {
        default:
          "bg-[#0052FF] text-white hover:bg-[#0047E0] hover:shadow-sm shadow-xs border border-transparent",
        secondary:
          "bg-[#070B28] text-white hover:bg-[#111747] hover:shadow-sm shadow-xs border border-transparent",
        navy:
          "bg-[#070B28] text-white hover:bg-[#111747] hover:shadow-sm shadow-xs border border-transparent",
        outline:
          "border border-slate-200 bg-white text-[#070B28] hover:border-[#070B28]/30 hover:bg-slate-50 shadow-xs",
        ghost:
          "text-[#070B28] hover:bg-[#070B28]/5 hover:text-[#070B28]",
        destructive:
          "bg-rose-600 text-white hover:bg-rose-700 shadow-xs border border-transparent",
      },
      size: {
        default: "min-h-11 h-11 px-5 py-2.5 text-sm font-medium",
        sm: "min-h-9 h-9 rounded-md px-3.5 py-1.5 text-xs font-medium",
        lg: "min-h-12 h-12 rounded-md px-8 py-3 text-lg font-medium",
        xl: "min-h-14 h-14 rounded-md px-8 py-3.5 text-lg font-medium",
        icon: "min-h-10 h-10 w-10 rounded-md",
        "icon-lg": "min-h-12 h-12 w-12 rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    if (asChild) {
      return (
        <Slot
          className={cn(buttonVariants({ variant, size, className }), "cursor-pointer")}
          ref={ref}
          {...props}
        >
          {children}
        </Slot>
      );
    }

    const isDisabled = disabled || loading;

    return (
      <motion.button
        ref={ref}
        disabled={isDisabled}
        whileHover={isDisabled ? undefined : { scale: 1.03 }}
        whileTap={isDisabled ? undefined : { scale: 0.8 }}
        transition={{ type: "spring", stiffness: 450, damping: 20 }}
        className={cn(buttonVariants({ variant, size, className }), "cursor-pointer")}
        {...(props as HTMLMotionProps<"button">)}
      >
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
        {children}
      </motion.button>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
