"use client";

import { useState } from "react";
import {
  DollarSign,
  FileSpreadsheet,
  FileText,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface MockStaffStat {
  rank: number;
  name: string;
  lane: string;
  orders: number;
  grossSales: string;
  refunds: string;
  avgTime: string;
}

const mockLeaderboard: MockStaffStat[] = [
  {
    rank: 1,
    name: "Alex Rivera",
    lane: "Lane 01 (Front)",
    orders: 98,
    grossSales: "$4,120.50",
    refunds: "$0.00",
    avgTime: "1m 12s",
  },
  {
    rank: 2,
    name: "Sarah Chen",
    lane: "Lane 02 (Express)",
    orders: 84,
    grossSales: "$3,450.00",
    refunds: "$49.99",
    avgTime: "58s",
  },
  {
    rank: 3,
    name: "Marcus Vance",
    lane: "Lane 03 (Drive-thru)",
    orders: 72,
    grossSales: "$2,890.00",
    refunds: "$0.00",
    avgTime: "1m 35s",
  },
  {
    rank: 4,
    name: "Elena Rostova",
    lane: "Customer Service",
    orders: 22,
    grossSales: "$850.00",
    refunds: "$120.00",
    avgTime: "2m 10s",
  },
];

const hourlySales = [
  { hour: "08:00", amount: "$420", height: "25%" },
  { hour: "09:00", amount: "$890", height: "45%" },
  { hour: "10:00", amount: "$1,250", height: "65%" },
  { hour: "11:00", amount: "$1,820", height: "85%" },
  { hour: "12:00", amount: "$2,450", height: "100%", peak: true },
  { hour: "13:00", amount: "$2,100", height: "90%" },
  { hour: "14:00", amount: "$1,680", height: "75%" },
  { hour: "15:00", amount: "$1,410", height: "68%" },
  { hour: "16:00", amount: "$1,950", height: "88%" },
  { hour: "17:00", amount: "$2,320", height: "95%", peak: true },
  { hour: "18:00", amount: "$1,780", height: "80%" },
  { hour: "19:00", amount: "$980", height: "50%" },
];

export function ReportsDashboard() {
  const [period, setPeriod] = useState("Today");

  return (
    <div className="space-y-4 animate-smooth-in">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center border-b border-border pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-[#070B28]">Analytics & Reports</h1>
            <Badge variant="outline" className="border-slate-200 text-xs">
              Daily Shift Settlement
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Audit register drawer reconciliation, tender method split, and cashier velocity.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-md border border-slate-200 bg-white p-0.5 text-xs">
            {["Today", "7 Days", "30 Days", "Quarter"].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`rounded px-2.5 py-1 font-medium transition-colors ${
                  period === p ? "bg-[#0052FF] text-white" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span>CSV</span>
          </Button>
          <Button size="sm" className="h-8 gap-1.5 bg-[#0052FF] text-white hover:bg-[#0047E0]">
            <FileText className="h-3.5 w-3.5" />
            <span>PDF Export</span>
          </Button>
        </div>
      </div>

      {/* 4 Performance Metric Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="p-3 border border-border shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Total Settled</span>
            <DollarSign className="h-4 w-4 text-[#0052FF]" />
          </div>
          <p className="font-mono text-xl font-bold text-[#070B28] mt-1 tabular-nums">$14,820.50</p>
          <p className="text-[10px] text-emerald-600 mt-0.5">+12.4% vs yesterday</p>
        </Card>

        <Card className="p-3 border border-border shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">COD / Cash Sales</span>
            <Badge variant="outline" className="text-[10px] px-1 py-0">34.5%</Badge>
          </div>
          <p className="font-mono text-xl font-bold text-[#070B28] mt-1 tabular-nums">$5,110.00</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Physical drawer float verified</p>
        </Card>

        <Card className="p-3 border border-border shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Card & Digital</span>
            <Badge variant="outline" className="text-[10px] px-1 py-0 border-blue-200 text-[#0052FF]">65.5%</Badge>
          </div>
          <p className="font-mono text-xl font-bold text-[#070B28] mt-1 tabular-nums">$9,710.50</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Visa, MC, and Amex gateway</p>
        </Card>

        <Card className="p-3 border border-border shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Avg Basket Size</span>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="font-mono text-xl font-bold text-[#070B28] mt-1 tabular-nums">$43.33</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">342 checkout tickets</p>
        </Card>
      </div>

      {/* Hourly Sales Distribution Chart */}
      <Card className="border border-border bg-white shadow-sm p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xs font-bold text-[#070B28] uppercase tracking-wider">
              Hourly Sales Volume Throughput
            </h3>
            <p className="text-[11px] text-muted-foreground">Peak volume periods: 12:00 - 13:00 and 17:00 - 18:00</p>
          </div>
          <Badge variant="outline" className="text-[11px]">4 Active Register Lanes</Badge>
        </div>
        <div className="flex items-end gap-2 h-40 pt-4 border-b border-slate-200">
          {hourlySales.map((item) => (
            <div key={item.hour} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
              <span className="opacity-0 group-hover:opacity-100 transition-opacity font-mono text-[10px] font-bold text-[#0052FF] tabular-nums">
                {item.amount}
              </span>
              <div
                style={{ height: item.height }}
                className={`w-full rounded-t-sm transition-all duration-200 group-hover:brightness-95 ${
                  item.peak ? "bg-[#0052FF]" : "bg-slate-200"
                }`}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between pt-2 text-[10px] text-muted-foreground font-mono tabular-nums">
          {hourlySales.map((item) => (
            <span key={item.hour} className="flex-1 text-center">{item.hour}</span>
          ))}
        </div>
      </Card>

      {/* Staff Throughput Leaderboard */}
      <Card className="border border-border bg-white shadow-sm overflow-hidden">
        <CardHeader className="p-4 border-b border-border flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold text-[#070B28]">Staff Throughput Leaderboard</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Cashier ticket velocity and reconciliation audit.</p>
          </div>
          <Badge variant="outline" className="text-xs font-medium">Ranked by volume</Badge>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/70 border-b border-border">
              <TableHead className="w-12 text-center text-xs">#</TableHead>
              <TableHead className="text-xs">Cashier</TableHead>
              <TableHead className="text-xs">Station</TableHead>
              <TableHead className="text-right text-xs">Tickets</TableHead>
              <TableHead className="text-right text-xs">Gross Sales</TableHead>
              <TableHead className="text-right text-xs">Refunds</TableHead>
              <TableHead className="text-right text-xs">Avg Checkout Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockLeaderboard.map((staff) => (
              <TableRow key={staff.rank} className="border-b border-slate-100 hover:bg-slate-50/70">
                <TableCell className="font-mono text-center font-bold text-xs text-slate-500 tabular-nums">
                  {staff.rank}
                </TableCell>
                <TableCell className="font-medium text-xs text-[#070B28]">
                  {staff.name}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {staff.lane}
                </TableCell>
                <TableCell className="font-mono text-xs text-right tabular-nums font-semibold">
                  {staff.orders}
                </TableCell>
                <TableCell className="font-mono text-xs font-bold text-[#0052FF] text-right tabular-nums">
                  {staff.grossSales}
                </TableCell>
                <TableCell className="font-mono text-xs text-right tabular-nums text-slate-500">
                  {staff.refunds}
                </TableCell>
                <TableCell className="font-mono text-xs text-right tabular-nums text-emerald-600 font-medium">
                  {staff.avgTime}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
