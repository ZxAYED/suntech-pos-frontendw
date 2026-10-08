"use client";

import { useState } from "react";
import {
  Copy,
  Download,
  Eye,
  MoreHorizontal,
  Printer,
  RotateCcw,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { DataPagination } from "@/components/common/data-pagination";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { demoOrders, type DemoOrder } from "@/demo/orders";

function parseFirstItem(summary: string, count: number) {
  const parts = summary.split(/\s*\+\s*|\s*,\s*/);
  const firstItem = parts[0]?.trim() || summary;
  const hasMore = parts.length > 1 || count > 1;
  return { firstItem, hasMore };
}

export default function PosOrdersPage() {
  const [orders, setOrders] = useState<DemoOrder[]>(demoOrders);
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  const filteredOrders = orders.filter(
    (o) =>
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.customerName && o.customerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      o.itemsSummary.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const totalPages = Math.ceil(filteredOrders.length / pageSize) || 1;
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const handlePrintSlip = (ord: DemoOrder) => {
    toast.success(`Printing thermal slip for ticket #${ord.orderNumber}...`);
  };

  const handleViewDetails = (ord: DemoOrder) => {
    toast.info(`Ticket #${ord.orderNumber}: ${ord.itemsSummary} · Total: ${ord.total} BDT`);
  };

  const handleCopyOrderNo = (ord: DemoOrder) => {
    navigator.clipboard?.writeText(ord.orderNumber);
    toast.success(`Copied ticket #${ord.orderNumber} to clipboard!`);
  };

  const handleVoidOrder = (ord: DemoOrder) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === ord.id ? { ...o, status: "REFUNDED" as const } : o)),
    );
    toast.warning(`Ticket #${ord.orderNumber} marked as REFUNDED.`);
  };

  return (
    <div className="space-y-6 font-sans select-none">
      {/* ═══ Row 1: The Main Header (Title + Actions ONLY) ═══ */}
      <PageHeader
        title="Register Tickets & Order History"
        actions={
          <Button
            variant="outline"
            size="default"
            onClick={() => toast.info("Exporting ticket records to CSV...")}
            className="min-h-11 h-11 px-5 gap-2 border-slate-200 text-sm font-medium text-[#070B28] bg-white hover:bg-slate-50 cursor-pointer shadow-xs"
          >
            <Download className="h-4 w-4 text-slate-500" />
            <span>Export CSV</span>
          </Button>
        }
      />

      {/* ═══ Row 2: The Toolbar / Sub-navigation (mb-6) ═══ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search customer name or item..."
            className="min-h-11 h-11 pl-11 pr-4 text-sm font-medium border-slate-200 bg-white text-[#070B28] placeholder:text-slate-400 focus-visible:border-[#0052FF] focus-visible:ring-2 focus-visible:ring-[#0052FF]/20 shadow-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="border-slate-200 text-xs font-medium tabular-nums text-slate-600 px-3 py-1 bg-white"
          >
            {filteredOrders.length} Orders
          </Badge>
        </div>
      </div>

      {/* Orders Table */}
      <Card className="border border-slate-200 bg-white shadow-xs overflow-hidden rounded-xl">
        <div className="overflow-x-auto">
          <Table className="w-full text-sm">
            <TableHeader className="bg-slate-50/80 border-b border-slate-200">
              <TableRow className="hover:bg-transparent">
                <TableHead className="py-3.5 px-4 text-left text-slate-400 font-medium uppercase tracking-wider text-xs">
                  Customer & Purchased Items
                </TableHead>
                <TableHead className="py-3.5 px-4 text-left text-slate-400 font-medium uppercase tracking-wider text-xs">
                  Tender Type
                </TableHead>
                <TableHead className="py-3.5 px-4 text-right text-slate-400 font-medium uppercase tracking-wider text-xs">
                  Total Amount (BDT)
                </TableHead>
                <TableHead className="py-3.5 px-4 text-center text-slate-400 font-medium uppercase tracking-wider text-xs">
                  Status
                </TableHead>
                <TableHead className="py-3.5 px-4 text-right text-slate-400 font-medium uppercase tracking-wider text-xs w-20">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100">
              {paginatedOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-40 text-center text-slate-400 text-sm">
                    No orders found matching your search.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedOrders.map((ord) => {
                  const { firstItem, hasMore } = parseFirstItem(ord.itemsSummary, ord.itemsCount);
                  return (
                    <TableRow key={ord.id} className="h-16 hover:bg-slate-50/70 transition-colors">
                      {/* Customer & Items Summary */}
                      <TableCell className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm sm:text-[15px] text-[#070B28] leading-tight">
                            {ord.customerName ? ord.customerName : "Walk-in Customer"}
                          </p>
                          {ord.customerPhone && (
                            <span className="text-xs text-slate-400 font-mono">
                              · {ord.customerPhone}
                            </span>
                          )}
                        </div>
                        <div className="text-xs sm:text-sm text-slate-600 line-clamp-1 mt-0.5">
                          <span>{firstItem}</span>
                          {hasMore && (
                            <span className="font-medium text-slate-400 ml-1.5">(+many more)</span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                          #{ord.orderNumber} · {ord.timestamp} · {ord.terminal}
                        </p>
                      </TableCell>

                      {/* Tender Type */}
                      <TableCell className="py-3.5 px-4">
                        <span className="inline-block rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                          {ord.paymentMethod}
                        </span>
                      </TableCell>

                      {/* Total */}
                      <TableCell className="py-3.5 px-4 text-right font-mono font-medium text-sm sm:text-base text-[#070B28] tabular-nums">
                        {ord.total.toLocaleString("en-BD")}{" "}
                        <span className="text-xs text-slate-400 font-normal font-sans">BDT</span>
                      </TableCell>

                      {/* Status */}
                      <TableCell className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block text-xs font-medium px-2.5 py-0.5 rounded border ${
                            ord.status === "SETTLED"
                              ? "text-emerald-700 bg-emerald-50 border-emerald-200/70"
                              : ord.status === "HELD"
                                ? "text-amber-700 bg-amber-50 border-amber-200/70"
                                : "text-rose-700 bg-rose-50 border-rose-200/70"
                          }`}
                        >
                          {ord.status}
                        </span>
                      </TableCell>

                      {/* Actions Dropdown Menu */}
                      <TableCell className="py-3.5 px-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:text-[#070B28] hover:bg-slate-100 cursor-pointer transition-colors"
                              title="Order actions"
                              aria-label="Order actions"
                            >
                              <MoreHorizontal className="h-5 w-5" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 bg-white border-slate-200 shadow-xl rounded-lg p-1.5 z-50">
                            <DropdownMenuItem
                              onClick={() => handlePrintSlip(ord)}
                              className="flex items-center gap-2.5 py-2 px-3 text-xs font-medium text-[#070B28] hover:bg-slate-50 cursor-pointer rounded-md transition-colors"
                            >
                              <Printer className="h-4 w-4 text-[#0052FF]" />
                              <span>Reprint Slip</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleViewDetails(ord)}
                              className="flex items-center gap-2.5 py-2 px-3 text-xs font-medium text-[#070B28] hover:bg-slate-50 cursor-pointer rounded-md transition-colors"
                            >
                              <Eye className="h-4 w-4 text-slate-500" />
                              <span>View Items</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleCopyOrderNo(ord)}
                              className="flex items-center gap-2.5 py-2 px-3 text-xs font-medium text-[#070B28] hover:bg-slate-50 cursor-pointer rounded-md transition-colors"
                            >
                              <Copy className="h-4 w-4 text-slate-500" />
                              <span>Copy Invoice #</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="my-1 bg-slate-100" />
                            <DropdownMenuItem
                              onClick={() => handleVoidOrder(ord)}
                              disabled={ord.status === "REFUNDED"}
                              className="flex items-center gap-2.5 py-2 px-3 text-xs font-medium text-rose-600 hover:bg-rose-50 cursor-pointer rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <RotateCcw className="h-4 w-4 text-rose-500" />
                              <span>Void / Refund</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* ═══ Reusable DataPagination ═══ */}
        <div className="border-t border-slate-200 bg-white px-4 py-1">
          <DataPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredOrders.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setCurrentPage(1);
            }}
            pageSizeOptions={[5, 8, 15, 30]}
            itemLabel="orders"
          />
        </div>
      </Card>
    </div>
  );
}
