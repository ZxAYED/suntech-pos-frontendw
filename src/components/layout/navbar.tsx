"use client";

import Link from "next/link";
import { LogOut, MapPin, ShieldCheck, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-white px-4">
      <div className="flex items-center gap-2.5">
        <Badge variant="outline" className="gap-1 border-slate-200 bg-slate-50 text-xs font-medium text-slate-700">
          <MapPin className="h-3 w-3 text-primary" />
          <span>Main Store (Lane 01)</span>
        </Badge>
        <Badge variant="default" className="gap-1.5 bg-emerald-600 text-xs text-white hover:bg-emerald-600">
          <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
          <span>Shift Active: 4h 15m</span>
          <span className="text-emerald-200">|</span>
          <span className="font-mono tabular-nums font-semibold">Float $200.00</span>
        </Badge>
        <div className="hidden items-center gap-1.5 text-xs text-muted-foreground md:flex">
          <Zap className="h-3 w-3 text-amber-500" />
          <span>Offline Sync Ready</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-xs font-semibold text-secondary">Alex Rivera</p>
          <p className="text-[11px] text-muted-foreground flex items-center justify-end gap-1">
            <ShieldCheck className="h-3 w-3 text-primary" />
            <span>Store Admin</span>
          </p>
        </div>
        <Link href="/login">
          <Button variant="outline" size="sm" className="h-8 gap-1.5 border-slate-200 text-xs">
            <LogOut className="h-3.5 w-3.5 text-slate-500" />
            <span>Exit</span>
          </Button>
        </Link>
      </div>
    </header>
  );
}
