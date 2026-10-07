import { cn } from "@/lib/utils";

export function BrandLogo({ className }: { className?: string }) {
  return (
    <div className={cn("flex aspect-[4/1] items-center gap-2", className)}>
      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-secondary text-sm font-bold text-primary-foreground">
        S
      </span>
      <div className="leading-tight">
        <p className="text-base font-bold tracking-tight text-secondary">
          Sun<span className="text-primary">Tech</span>
        </p>
        <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Point of Sale
        </p>
      </div>
    </div>
  );
}
