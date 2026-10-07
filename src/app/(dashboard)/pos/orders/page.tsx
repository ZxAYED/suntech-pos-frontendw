"use client";

import { useState } from "react";
import { Download, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface MockOrder {
  id: string;
  orderNumber: string;
  time: string;
  cashier: string;
  lane: string;
  itemsCount: number;
  paymentMethod: string;
  status: "PAID" | "PENDING" | "REFUNDED";
  total: string;
}

const mockOrdersList: MockOrder[] = [
  {
    id: "ord-1",
    orderNumber: "TKT-8821",
    time: "14:38:12",
    cashier: "Alex Rivera",
    lane: "Lane 01",
    itemsCount: 3,
    paymentMethod: "COD / Cash",
    status: "PAID",
    total: "$313.36",
  },
  {
    id: "ord-2",
    orderNumber: "TKT-8820",
    time: "14:34:50",
    cashier: "Sarah Chen",
    lane: "Lane 02",
    itemsCount: 1,
    paymentMethod: "Credit Card",
    status: "PAID",
    total: "$89.50",
  },
  {
    id: "ord-3",
    orderNumber: "TKT-8819",
    time: "14:29:15",
    cashier: "Alex Rivera",
    lane: "Lane 01",
    itemsCount: 4,
    paymentMethod: "Debit Card",
    status: "PAID",
    total: "$447.99",
  },
  {
    id: "ord-4",
    orderNumber: "TKT-8818",
    time: "14:21:04",
    cashier: "Marcus Vance",
    lane: "Lane 03",
    itemsCount: 2,
    paymentMethod: "COD / Cash",
    status: "PAID",
    total: "$59.98",
  },
  {
    id: "ord-5",
    orderNumber: "TKT-8817",
    time: "14:15:33",
    cashier: "Sarah Chen",
    lane: "Lane 02",
    itemsCount: 1,
    paymentMethod: "Credit Card",
    status: "PAID",
    total: "$129.99",
  },
  {
    id: "ord-6",
    orderNumber: "TKT-8816",
    time: "13:58:20",
    cashier: "Alex Rivera",
    lane: "Lane 01",
    itemsCount: 1,
    paymentMethod: "Cash Return",
    status: "REFUNDED",
    total: "-$49.99",
  },
];

export default function OrdersPage() {
  const [search, setSearch] = useState("");

  const filtered = mockOrdersList.filter(
    (o) =>
      search === "" ||
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.cashier.toLowerCase().includes(search.toLowerCase()) ||
      o.lane.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-4 animate-smooth-in">
      {/* Header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center border-b border-border pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-[#070B28]">Register Ticket Ledger</h1>
            <Badge variant="outline" className="border-slate-200 text-xs font-semibold">
              Lane 01 Feed
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Audit settled register tickets, COD receipts, and terminal transaction histories.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
            <Download className="h-3.5 w-3.5" />
            <span>Export Journal</span>
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative w-72">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ticket #, cashier, or lane..."
            className="h-8 pl-8 text-xs"
          />
        </div>
      </div>

      {/* Orders Table */}
      <Card className="border border-border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/70 border-b border-border">
              <TableHead className="text-xs">Ticket #</TableHead>
              <TableHead className="text-xs">Time</TableHead>
              <TableHead className="text-xs">Lane Station</TableHead>
              <TableHead className="text-xs">Cashier</TableHead>
              <TableHead className="text-xs">Items</TableHead>
              <TableHead className="text-xs">Tender Method</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-right text-xs">Total Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((order) => (
              <TableRow key={order.id} className="border-b border-slate-100 hover:bg-slate-50/70">
                <TableCell className="font-mono text-xs font-bold text-[#0052FF] tabular-nums">
                  {order.orderNumber}
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground tabular-nums">
                  {order.time}
                </TableCell>
                <TableCell className="text-xs font-medium text-[#070B28]">
                  {order.lane}
                </TableCell>
                <TableCell className="text-xs text-slate-600">
                  {order.cashier}
                </TableCell>
                <TableCell className="font-mono text-xs tabular-nums">
                  {order.itemsCount} items
                </TableCell>
                <TableCell className="text-xs">
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-700">
                    {order.paymentMethod}
                  </span>
                </TableCell>
                <TableCell className="text-xs">
                  <span
                    className={`inline-flex items-center rounded px-2 py-0.5 text-[11px] font-semibold ${
                      order.status === "PAID"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-rose-50 text-rose-700"
                    }`}
                  >
                    {order.status}
                  </span>
                </TableCell>
                <TableCell
                  className={`font-mono text-xs font-bold text-right tabular-nums ${
                    order.status === "REFUNDED" ? "text-rose-600" : "text-[#070B28]"
                  }`}
                >
                  {order.total}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
