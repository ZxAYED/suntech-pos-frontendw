import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md text-xs font-medium transition-all duration-150 ease-out active:scale-[0.98] cursor-pointer select-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0052FF] disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        default: "bg-[#0052FF] text-white hover:bg-[#0047E0] hover:shadow-sm shadow-sm border border-transparent",
        navy: "bg-[#070B28] text-white hover:bg-[#111747] hover:shadow-sm shadow-sm border border-transparent",
        outline: "border border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50/80 shadow-sm",
        ghost: "text-slate-700 hover:bg-slate-100 hover:text-slate-900",
        destructive: "bg-rose-600 text-white hover:bg-rose-700 shadow-sm border border-transparent",
      },
      size: {
        default: "h-9 px-3.5 py-1.5 text-xs font-semibold",
        sm: "h-8 rounded-md px-2.5 text-xs font-medium",
        lg: "h-10 rounded-md px-5 text-sm font-semibold",
        icon: "h-8 w-8 rounded-md",
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
  ({ className, variant, size, asChild = false, loading = false, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
        {children}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
