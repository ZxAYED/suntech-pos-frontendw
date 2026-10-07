"use client";

import { centsToDollarInput, cn, dollarsToCents } from "@/lib/utils";
import { Input } from "@/components/ui/input";

interface CurrencyInputProps {
  value: number;
  onChange: (cents: number) => void;
  prefix?: string;
  className?: string;
  id?: string;
  disabled?: boolean;
}

export function CurrencyInput({
  value,
  onChange,
  prefix = "$",
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
        inputMode="decimal"
        disabled={disabled}
        className="pl-7 font-mono tabular-nums"
        value={centsToDollarInput(value)}
        onChange={(event) => onChange(dollarsToCents(event.target.value))}
      />
    </div>
  );
}
