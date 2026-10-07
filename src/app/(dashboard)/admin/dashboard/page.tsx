"use client";

import {
  ArrowUpRight,
  CreditCard,
  DollarSign,
  Download,
  Filter,
  RefreshCw,
  ShoppingBag,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface MockTransaction {
  id: string;
  receiptNumber: string;
  register: string;
  cashier: string;
  paymentMethod: string;
  time: string;
  status: "Completed" | "Settled" | "Refunded";
  amount: string;
}

const mockTransactions: MockTransaction[] = [
  {
    id: "tx-1",
    receiptNumber: "RCP-2026-0941",
    register: "Lane 01 (Front Register)",
    cashier: "Alex Rivera",
    paymentMethod: "COD / Cash",
    time: "14:38:12",
    status: "Completed",
    amount: "$313.36",
  },
  {
    id: "tx-2",
    receiptNumber: "RCP-2026-0940",
    register: "Lane 02 (Express Checkout)",
    cashier: "Sarah Chen",
    paymentMethod: "Credit Card (Visa)",
    time: "14:34:50",
    status: "Completed",
    amount: "$89.50",
  },
  {
    id: "tx-3",
    receiptNumber: "RCP-2026-0939",
    register: "Lane 01 (Front Register)",
    cashier: "Alex Rivera",
    paymentMethod: "Debit Card (Mastercard)",
    time: "14:29:15",
    status: "Settled",
    amount: "$447.99",
  },
  {
    id: "tx-4",
    receiptNumber: "RCP-2026-0938",
    register: "Lane 03 (Drive-thru / Pickup)",
    cashier: "Marcus Vance",
    paymentMethod: "COD / Cash",
    time: "14:21:04",
    status: "Completed",
    amount: "$59.98",
  },
  {
    id: "tx-5",
    receiptNumber: "RCP-2026-0937",
    register: "Lane 02 (Express Checkout)",
    cashier: "Sarah Chen",
    paymentMethod: "Credit Card (Amex)",
    time: "14:15:33",
    status: "Settled",
    amount: "$129.99",
  },
  {
    id: "tx-6",
    receiptNumber: "RCP-2026-0936",
    register: "Lane 01 (Front Register)",
    cashier: "Alex Rivera",
    paymentMethod: "Cash Refund",
    time: "13:58:20",
    status: "Refunded",
    amount: "-$49.99",
  },
  {
    id: "tx-7",
    receiptNumber: "RCP-2026-0935",
    register: "Lane 03 (Drive-thru / Pickup)",
    cashier: "Marcus Vance",
    paymentMethod: "Credit Card (Visa)",
    time: "13:45:11",
    status: "Completed",
    amount: "$199.98",
  },
];

export default function AdminDashboardPage() {
  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center border-b border-border pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-[#070B28]">Operations Cockpit</h1>
            <Badge variant="outline" className="border-blue-200 bg-blue-50 text-[#0052FF] text-[11px] font-semibold">
              Live Terminal Feed
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time multi-lane sales telemetry and register reconciliation.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs border-border">
            <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Sync</span>
          </Button>
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs border-border">
            <Download className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Export CSV</span>
          </Button>
          <Button size="sm" className="h-8 gap-1.5 bg-[#0052FF] text-white hover:bg-[#0047E0] text-xs font-semibold">
            <span>New Shift</span>
          </Button>
        </div>
      </div>

      {/* 3 Static Metric Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {/* Metric 1: Daily Revenue */}
        <Card className="border border-border bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3.5 pb-1">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Daily Revenue
            </CardTitle>
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-50 text-[#0052FF]">
              <DollarSign className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-3.5 pt-0">
            <div className="flex items-baseline justify-between mt-1">
              <span className="font-mono text-2xl font-bold text-[#070B28] tabular-nums">
                $14,820.50
              </span>
              <span className="flex items-center text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                <ArrowUpRight className="h-3 w-3 mr-0.5" />
                +12.4%
              </span>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Gross register receipts across 4 active lanes
            </p>
          </CardContent>
        </Card>

        {/* Metric 2: 30-Day Volume */}
        <Card className="border border-border bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3.5 pb-1">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              30-Day Volume
            </CardTitle>
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-50 text-indigo-600">
              <CreditCard className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-3.5 pt-0">
            <div className="flex items-baseline justify-between mt-1">
              <span className="font-mono text-2xl font-bold text-[#070B28] tabular-nums">
                $418,900.00
              </span>
              <span className="flex items-center text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                <ArrowUpRight className="h-3 w-3 mr-0.5" />
                +8.2%
              </span>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Rolling 30-day settled card and cash transactions
            </p>
          </CardContent>
        </Card>

        {/* Metric 3: Orders Today */}
        <Card className="border border-border bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3.5 pb-1">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Orders Today
            </CardTitle>
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-50 text-emerald-600">
              <ShoppingBag className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-3.5 pt-0">
            <div className="flex items-baseline justify-between mt-1">
              <span className="font-mono text-2xl font-bold text-[#070B28] tabular-nums">
                342
              </span>
              <span className="flex items-center text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                <ArrowUpRight className="h-3 w-3 mr-0.5" />
                +5.1%
              </span>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Average ticket value: <span className="font-mono tabular-nums font-medium">$43.33</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Static Recent Transactions Table */}
      <Card className="border border-border bg-white shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between p-4 border-b border-border">
          <div>
            <CardTitle className="text-sm font-bold text-[#070B28]">
              Recent Register Transactions
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Showing latest settled point-of-sale checkout tickets.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs border-border">
              <Filter className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Filter Status</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border bg-slate-50/70 hover:bg-slate-50/70">
                <TableHead className="w-[140px] text-xs">Receipt #</TableHead>
                <TableHead className="text-xs">Register Lane</TableHead>
                <TableHead className="text-xs">Cashier</TableHead>
                <TableHead className="text-xs">Payment Method</TableHead>
                <TableHead className="text-xs">Time</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-right text-xs">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockTransactions.map((tx) => (
                <TableRow key={tx.id} className="border-b border-border hover:bg-slate-50/80">
                  <TableCell className="font-mono font-semibold text-[#0052FF] tabular-nums text-xs">
                    {tx.receiptNumber}
                  </TableCell>
                  <TableCell className="text-xs font-medium text-[#070B28]">
                    {tx.register}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {tx.cashier}
                  </TableCell>
                  <TableCell className="text-xs">
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 font-medium text-slate-700">
                      {tx.paymentMethod}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground tabular-nums">
                    {tx.time}
                  </TableCell>
                  <TableCell className="text-xs">
                    <span
                      className={`inline-flex items-center rounded px-2 py-0.5 text-[11px] font-semibold ${
                        tx.status === "Completed"
                          ? "bg-emerald-50 text-emerald-700"
                          : tx.status === "Settled"
                            ? "bg-blue-50 text-[#0052FF]"
                            : "bg-rose-50 text-rose-700"
                      }`}
                    >
                      {tx.status}
                    </span>
                  </TableCell>
                  <TableCell
                    className={`font-mono text-sm font-bold text-right tabular-nums ${
                      tx.status === "Refunded" ? "text-rose-600" : "text-[#070B28]"
                    }`}
                  >
                    {tx.amount}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
