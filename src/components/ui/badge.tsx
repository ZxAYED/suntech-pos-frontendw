import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium transition-colors duration-150 select-none",
  {
    variants: {
      variant: {
        default: "border-transparent bg-[#0052FF] text-white hover:bg-[#0047E0]",
        navy: "border-transparent bg-[#070B28] text-white",
        outline: "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
        paid: "border-emerald-200 bg-emerald-50 text-emerald-700 font-medium",
        pending: "border-amber-200 bg-amber-50 text-amber-700 font-medium",
        destructive: "border-rose-200 bg-rose-50 text-rose-700 font-medium",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export function Badge({
  className,
  variant,
  ...props
}: HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
