"use client";

import { useState } from "react";
import { CheckCircle2, Printer } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function ShiftsPage() {
  const [countedCash, setCountedCash] = useState("5310.00");

  return (
    <div className="space-y-4 max-w-4xl animate-smooth-in">
      {/* Header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center border-b border-border pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-[#070B28]">Shift Reconciliation</h1>
            <Badge variant="default" className="bg-emerald-600 text-white text-xs">
              Drawer Active: 6h 38m
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Audit register drawer float, COD receipts, and balance physical cash tally.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
            <Printer className="h-3.5 w-3.5" />
            <span>Print X-Report</span>
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        <Card className="p-3 border border-border bg-white shadow-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
            Opening Float
          </span>
          <p className="font-mono text-xl font-bold text-[#070B28] mt-1 tabular-nums">$200.00</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Verified at 08:00:15</p>
        </Card>

        <Card className="p-3 border border-border bg-white shadow-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
            Cash Sales (COD)
          </span>
          <p className="font-mono text-xl font-bold text-emerald-600 mt-1 tabular-nums">+$5,110.00</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">98 Cash tickets</p>
        </Card>

        <Card className="p-3 border border-border bg-white shadow-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
            Cash Paid Out
          </span>
          <p className="font-mono text-xl font-bold text-slate-500 mt-1 tabular-nums">-$0.00</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">0 Drawer drop vouchers</p>
        </Card>

        <Card className="p-3 border border-border bg-white shadow-sm bg-blue-50/20">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#0052FF] block">
            Expected In Drawer
          </span>
          <p className="font-mono text-xl font-bold text-[#0052FF] mt-1 tabular-nums">$5,310.00</p>
          <p className="text-[10px] text-slate-600 mt-0.5">Float + Settled COD</p>
        </Card>
      </div>

      {/* Cash Drawer Count Form */}
      <Card className="border border-border bg-white shadow-sm">
        <CardHeader className="p-4 border-b border-border">
          <CardTitle className="text-sm font-bold text-[#070B28]">End of Shift Cash Declaration</CardTitle>
          <p className="text-xs text-muted-foreground">
            Physically count all paper bills and coins before closing register lane.
          </p>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Declared Counted Cash ($ USD)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-slate-400">$</span>
                <Input
                  value={countedCash}
                  onChange={(e) => setCountedCash(e.target.value)}
                  className="pl-7 font-mono text-base font-bold tabular-nums text-[#070B28] h-10"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Reconciliation Balance Status
              </label>
              <div className="flex h-10 items-center justify-between rounded-md border border-emerald-200 bg-emerald-50/60 px-3">
                <span className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Drawer Perfectly Balanced</span>
                </span>
                <span className="font-mono text-xs font-bold text-emerald-700 tabular-nums">$0.00 Variance</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              className="bg-[#070B28] hover:bg-[#111747] text-white h-9 px-4 text-xs font-semibold"
              onClick={() => toast.success("Shift closed and Z-Report dispatched to store admin")}
            >
              Close Shift & Lock Drawer
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
