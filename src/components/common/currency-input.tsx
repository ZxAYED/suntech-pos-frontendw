"use client";

import { cn, parseBDT } from "@/lib/utils";
import { Input } from "@/components/ui/input";

interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  prefix?: string;
  className?: string;
  id?: string;
  disabled?: boolean;
}

export function CurrencyInput({
  value,
  onChange,
  prefix = "BDT",
  className,
  id,
  disabled,
}: CurrencyInputProps) {
  return (
    <div className={cn("relative", className)}>
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
        {prefix}
      </span>
      <Input
        id={id}
        inputMode="numeric"
        disabled={disabled}
        className="pl-12 font-mono tabular-nums"
        value={Number.isFinite(value) ? String(value) : ""}
        onChange={(event) => onChange(parseBDT(event.target.value))}
      />
    </div>
  );
}
