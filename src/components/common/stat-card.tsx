import { TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn, formatCentsToCurrency } from "@/lib/utils";

interface StatCardProps {
  label: string;
  valueCents?: number;
  value?: string;
  trend?: number;
}

export function StatCard({ label, valueCents, value, trend }: StatCardProps) {
  const display = value ?? (typeof valueCents === "number" ? formatCentsToCurrency(valueCents) : "-");
  const positive = (trend ?? 0) >= 0;

  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-secondary">{display}</p>
        {typeof trend === "number" ? (
          <p className={cn("mt-2 flex items-center gap-1 text-xs font-medium", positive ? "text-emerald-600" : "text-red-600")}>
            {positive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
            {Math.abs(trend).toFixed(1)}%
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
