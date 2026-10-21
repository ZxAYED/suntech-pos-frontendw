"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Copy,
  Download,
  Eye,
  MoreHorizontal,
  Printer,
  Receipt,
  RefreshCw,
  RotateCcw,
  ShoppingBag,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { DataPagination } from "@/components/common/data-pagination";
import { MetricCard } from "@/components/common/metric-card";
import { SegmentedTabs } from "@/components/common/segmented-tabs";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { demoOrders, demoSalesSummary, type DemoOrder } from "@/demo";

export default function AdminDashboardPage() {
  const [selectedRange, setSelectedRange] = useState("Today");
  const [orders, setOrders] = useState<DemoOrder[]>(demoOrders);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(4);

  const totalPages = Math.ceil(orders.length / pageSize) || 1;
  const paginatedOrders = orders.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const ranges = ["Today", "Yesterday", "Last 7 Days", "This Month"];

  return (
    <div className="space-y-6 font-sans">
      {/* ═══ Row 1: The Main Header (Title + Actions ONLY) ═══ */}
      <PageHeader
        title="Executive Store Cockpit"
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => toast.info("Syncing telemetry across retail registers...")}
              className="min-h-11 h-11 px-5 border-slate-200 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 cursor-pointer shadow-xs gap-2"
            >
              <RefreshCw className="h-4 w-4 text-slate-500" />
              <span>Sync</span>
            </Button>

            <Button
              onClick={() => toast.success("Generating Daily Settlement Audit Report (PDF)...")}
              className="min-h-11 h-11 px-6 bg-[#0052FF] hover:bg-[#0047E0] text-white text-sm font-medium cursor-pointer shadow-xs gap-2"
            >
              <Download className="h-4 w-4" />
              <span>Audit PDF</span>
            </Button>
          </>
        }
      />

      {/* ═══ Row 2: The Toolbar / Sub-navigation (mb-6) ═══ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <SegmentedTabs
          tabs={ranges.map((r) => ({ id: r, label: r }))}
          activeTab={selectedRange}
          onChange={(r) => setSelectedRange(r)}
        />

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-slate-200 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-0.5">
            Live Registers: 2 Active
          </Badge>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Today Gross Sales"
          value={demoSalesSummary.todayRevenue.toLocaleString("en-BD")}
          suffix="BDT"
          icon={Wallet}
          trend={{ value: "+14.8%", positive: true }}
          subtext="94 checkout tickets settled"
        />
        <MetricCard
          label="Avg Ticket Basket"
          value={demoSalesSummary.averageTicketValue.toLocaleString("en-BD")}
          suffix="BDT"
          icon={ShoppingBag}
          trend={{ value: "+4.2%", positive: true }}
          subtext="2.4 items per ticket on average"
        />
        <MetricCard
          label="Cash (COD) Drawer"
          value="62%"
          suffix="Cash / COD"
          icon={Receipt}
          trend={{ value: "38% Digital", neutral: true }}
          subtext="Float balanced: 10,000 BDT baseline"
        />
        <MetricCard
          label="Gross Margin"
          value={`+${demoSalesSummary.grossMarginPercent}%`}
          icon={TrendingUp}
          trend={{ value: "On Target", positive: true }}
          subtext="Calculated after wholesale COGS"
        />
      </div>

      {/* Middle Section: Recent Orders Ledger & Top Category Breakdown */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Left 2 Cols: Live Orders Table */}
        <div className="lg:col-span-2">
          <Card className="border border-slate-200 bg-white shadow-xs overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-200 py-4 px-5">
              <div>
                <CardTitle className="text-base font-bold uppercase tracking-wider text-[#070B28]">
                  Recent Terminal Tickets
                </CardTitle>
              </div>
              <Link
                href="/pos/orders"
                className="text-sm font-medium text-[#0052FF] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View All Tickets</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table className="w-full text-sm">
                  <TableHeader className="bg-slate-50/80 border-b border-slate-200">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="py-3.5 px-4 text-slate-400 font-medium uppercase tracking-wider text-xs">
                        Invoice / Ticket
                      </TableHead>
                      <TableHead className="py-3.5 px-4 text-slate-400 font-medium uppercase tracking-wider text-xs">
                        Customer & Summary
                      </TableHead>
                      <TableHead className="py-3.5 px-4 text-slate-400 font-medium uppercase tracking-wider text-xs">
                        Tender
                      </TableHead>
                      <TableHead className="py-3.5 px-4 text-right text-slate-400 font-medium uppercase tracking-wider text-xs">
                        Total (BDT)
                      </TableHead>
                      <TableHead className="py-3.5 px-4 text-center text-slate-400 font-medium uppercase tracking-wider text-xs">
                        Status
                      </TableHead>
                      <TableHead className="py-3.5 px-4 text-right text-slate-400 font-medium uppercase tracking-wider text-xs w-16">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-slate-100">
                    {paginatedOrders.map((ord) => (
                      <TableRow key={ord.id} className="h-16 hover:bg-slate-50/70 transition-colors">
                        <TableCell className="py-3.5 px-4 font-mono font-medium text-[#070B28] tabular-nums">
                          <div className="text-sm sm:text-[15px]">#{ord.orderNumber}</div>
                          <div className="text-xs text-slate-500 font-normal font-mono mt-0.5">{ord.timestamp}</div>
                        </TableCell>
                        <TableCell className="py-3.5 px-4">
                          <p className="font-medium text-[#070B28] leading-tight line-clamp-1 text-sm sm:text-[15px]">
                            {ord.customerName}
                          </p>
                          <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{ord.itemsSummary}</p>
                        </TableCell>
                        <TableCell className="py-3.5 px-4 text-slate-700 font-medium text-xs sm:text-sm">
                          {ord.paymentMethod}
                        </TableCell>
                        <TableCell className="py-3.5 px-4 text-right font-mono font-medium text-[#070B28] tabular-nums text-sm sm:text-base">
                          {ord.total.toLocaleString("en-BD")}{" "}
                          <span className="text-xs font-normal text-slate-400 font-sans">BDT</span>
                        </TableCell>
                        <TableCell className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-block text-xs font-medium px-2.5 py-0.5 rounded border ${
                              ord.status === "SETTLED"
                                ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                                : ord.status === "HELD"
                                  ? "text-amber-700 bg-amber-50 border-amber-200"
                                  : "text-rose-700 bg-rose-50 border-rose-200"
                            }`}
                          >
                            {ord.status}
                          </span>
                        </TableCell>
                        <TableCell className="py-3.5 px-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:text-[#070B28] hover:bg-slate-100 cursor-pointer transition-colors"
                                title="Ticket actions"
                                aria-label="Ticket actions"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 bg-white border-slate-200 shadow-xl rounded-lg p-1.5 z-50">
                              <DropdownMenuItem
                                onClick={() => toast.info(`Viewing items for #${ord.orderNumber}: ${ord.itemsSummary}`)}
                                className="flex items-center gap-2 py-2 px-3 text-xs font-medium text-[#070B28] hover:bg-slate-50 cursor-pointer rounded-md transition-colors"
                              >
                                <Eye className="h-4 w-4 text-slate-500" />
                                <span>View Details</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => toast.success(`Reprinting 80mm slip for ${ord.orderNumber}...`)}
                                className="flex items-center gap-2 py-2 px-3 text-xs font-medium text-[#070B28] hover:bg-slate-50 cursor-pointer rounded-md transition-colors"
                              >
                                <Printer className="h-4 w-4 text-slate-500" />
                                <span>Reprint Slip</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  navigator.clipboard?.writeText(ord.orderNumber);
                                  toast.success(`Copied #${ord.orderNumber} to clipboard!`);
                                }}
                                className="flex items-center gap-2 py-2 px-3 text-xs font-medium text-[#070B28] hover:bg-slate-50 cursor-pointer rounded-md transition-colors"
                              >
                                <Copy className="h-4 w-4 text-slate-500" />
                                <span>Copy Ticket #</span>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="my-1 bg-slate-100" />
                              <DropdownMenuItem
                                onClick={() => {
                                  setOrders((prev) =>
                                    prev.map((o) => (o.id === ord.id ? { ...o, status: "REFUNDED" } : o)),
                                  );
                                  toast.error(`Refund processed for ${ord.orderNumber}`);
                                }}
                                className="flex items-center gap-2 py-2 px-3 text-xs font-medium text-rose-600 hover:bg-rose-50 cursor-pointer rounded-md transition-colors"
                              >
                                <RotateCcw className="h-4 w-4 text-rose-500" />
                                <span>Void / Refund</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="border-t border-slate-100 px-4 py-3">
                <DataPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalCount={orders.length}
                  pageSize={pageSize}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={(newSize) => {
                    setPageSize(newSize);
                    setCurrentPage(1);
                  }}
                  pageSizeOptions={[4, 8, 12]}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Col: Category Sales Breakdown & Active Shift Chip */}
        <div className="space-y-4">
          {/* Active Shift Telemetry Card */}
          <Card className="border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-sm font-medium text-[#070B28] uppercase tracking-wider">
                Active Shift Telemetry
              </span>
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            <div className="mt-3.5 space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Lead Cashier:</span>
                <span className="font-medium text-[#070B28]">Alex Rivera</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Opening Float:</span>
                <span className="font-mono font-medium text-[#070B28] tabular-nums">10,000 BDT</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Cash Drawer Expected:</span>
                <span className="font-mono font-medium text-[#0052FF] tabular-nums">34,820 BDT</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Float Drift / Variance:</span>
                <span className="font-mono font-medium text-emerald-600 tabular-nums">0 BDT (Balanced)</span>
              </div>
            </div>

            <Link
              href="/pos/shifts"
              className="mt-4 flex items-center justify-center min-h-11 h-11 rounded-md border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-[#070B28] hover:bg-slate-100 cursor-pointer transition-colors shadow-xs"
            >
              Audit Shift Registers
            </Link>
          </Card>

          {/* Top Selling Categories */}
          <Card className="border border-slate-200 bg-white p-5 shadow-xs">
            <span className="text-sm font-medium text-[#070B28] uppercase tracking-wider block border-b border-slate-100 pb-3">
              Category Sales Volume
            </span>

            <div className="mt-3.5 space-y-3">
              {demoSalesSummary.topCategories.map((cat) => (
                <div key={cat.name} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-700 font-medium">{cat.name}</span>
                    <span className="font-mono font-medium text-[#070B28] tabular-nums">
                      {cat.revenue.toLocaleString("en-BD")} BDT
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#0052FF] rounded-full"
                      style={{ width: `${cat.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
