"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, FileText, MoreHorizontal, TrendingUp, Wallet } from "lucide-react";
import { toast } from "sonner";
import { DataPagination } from "@/components/common/data-pagination";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { demoSalesSummary } from "@/demo/reports";

export function ReportsDashboard() {
  const [reportRange, setReportRange] = useState("Monthly");

  // Category Table Pagination
  const categoriesList = demoSalesSummary.topCategories;
  const [categoryPage, setCategoryPage] = useState(1);
  const [categoryPageSize, setCategoryPageSize] = useState(5);
  const totalCategoryPages = Math.ceil(categoriesList.length / categoryPageSize) || 1;
  const paginatedCategories = categoriesList.slice(
    (categoryPage - 1) * categoryPageSize,
    categoryPage * categoryPageSize,
  );

  const ranges = ["Daily", "Weekly", "Monthly", "Quarterly"];

  return (
    <div className="space-y-6 font-sans select-none">
      {/* ═══ Row 1: The Main Header (Title + Actions ONLY) ═══ */}
      <PageHeader
        title="Executive Financial & Retail Analytics"
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => toast.info("Exporting Excel workbook (.xlsx)...")}
              className="min-h-11 h-11 px-5 border-slate-200 text-sm font-medium text-[#070B28] bg-white hover:bg-slate-50 cursor-pointer shadow-xs gap-2"
            >
              <FileSpreadsheet className="h-4 w-4 text-slate-500" />
              <span>Excel (.xlsx)</span>
            </Button>

            <Button
              size="lg"
              onClick={() => toast.success("Generating formal auditor signed PDF report...")}
              className="min-h-12 h-12 px-8 bg-[#0052FF] hover:bg-[#0047E0] text-white text-base font-medium cursor-pointer shadow-xs gap-2"
            >
              <FileText className="h-5 w-5" />
              <span>Audit PDF</span>
            </Button>
          </>
        }
      />


      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
          {ranges.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setReportRange(r)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer transition-colors ${
                reportRange === r
                  ? "bg-white text-[#070B28] shadow-xs"
                  : "text-slate-600 hover:text-[#070B28]"
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
            Period:
          </span>
          <Badge
            variant="outline"
            className="border-slate-200 font-mono text-xs font-medium tabular-nums text-slate-600 px-2.5 py-0.5 bg-white"
          >
            Audit Period: Q4 2026
          </Badge>
        </div>
      </div>

      {/* Metric Cards: Pure bg-white, 1px border-slate-200, rounded-lg, shadow-sm, p-5 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-slate-500 font-medium block">
              Gross Period Revenue
            </span>
            <Wallet className="h-4 w-4 text-[#0052FF]" />
          </div>
          <p className="mt-2 font-mono text-3xl font-bold text-[#070B28] tabular-nums">
            {demoSalesSummary.todayRevenue.toLocaleString("en-BD")}{" "}
            <span className="text-sm font-normal text-slate-500">BDT</span>
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Average ticket: {demoSalesSummary.averageTicketValue.toLocaleString("en-BD")} BDT
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-slate-500 font-medium block">
              Average Gross Margin
            </span>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 font-mono text-3xl font-bold text-[#070B28] tabular-nums">
            +{demoSalesSummary.grossMarginPercent}%
          </p>
          <p className="mt-1 text-xs text-emerald-600 font-medium">Net profit after wholesale cost</p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-slate-500 font-medium block">
              Payment Breakdown
            </span>
            <span className="h-2 w-2 rounded-full bg-blue-500" />
          </div>
          <p className="mt-2 font-mono text-3xl font-bold text-[#070B28] tabular-nums">
            {demoSalesSummary.cashPercentage}% <span className="text-xl font-normal text-slate-500">Cash</span> /{" "}
            {demoSalesSummary.digitalPercentage}% <span className="text-xl font-normal text-slate-500">Digital</span>
          </p>
          <p className="mt-1 text-xs text-slate-500">bKash, Nagad, and Cash COD</p>
        </div>
      </div>

      {/* High-Density Category Sales Distribution Table: Edge-to-edge inside white card container */}
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="w-full text-sm">
            <TableHeader className="bg-slate-50/80 border-b border-slate-200">
              <TableRow className="hover:bg-transparent">
                <TableHead className="py-4 px-4 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                  Category
                </TableHead>
                <TableHead className="py-4 px-4 text-right text-xs font-medium uppercase tracking-wider text-slate-400">
                  Revenue (BDT)
                </TableHead>
                <TableHead className="py-4 px-4 text-right text-xs font-medium uppercase tracking-wider text-slate-400">
                  Volume Share
                </TableHead>
                <TableHead className="py-4 px-4 text-right text-xs font-medium uppercase tracking-wider text-slate-400 w-56">
                  Progress
                </TableHead>
                <TableHead className="py-4 px-4 text-right text-xs font-medium uppercase tracking-wider text-slate-400 w-16">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100">
              {paginatedCategories.map((c) => (
                <TableRow key={c.name} className="h-16 hover:bg-slate-50/70 transition-colors">
                  {/* Category Name */}
                  <TableCell className="py-4 px-4 text-left font-medium text-sm text-[#070B28]">
                    {c.name}
                  </TableCell>

                  {/* Revenue (BDT) (RIGHT) */}
                  <TableCell className="py-4 px-4 text-right">
                    <span className="font-mono tabular-nums text-sm font-medium text-[#070B28]">
                      {c.revenue.toLocaleString("en-BD")} BDT
                    </span>
                  </TableCell>

                  {/* Volume Share (RIGHT) */}
                  <TableCell className="py-4 px-4 text-right">
                    <span className="font-mono tabular-nums text-sm font-medium text-slate-600">
                      {c.percentage}%
                    </span>
                  </TableCell>

                  {/* Progress Bar (RIGHT) */}
                  <TableCell className="py-4 px-4 text-right">
                    <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#0052FF] rounded-full transition-all"
                        style={{ width: `${c.percentage}%` }}
                      />
                    </div>
                  </TableCell>

                  {/* Actions Dropdown */}
                  <TableCell className="py-4 px-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:text-[#070B28] hover:bg-slate-100 cursor-pointer transition-colors"
                          title="Category actions"
                          aria-label="Category actions"
                        >
                          <MoreHorizontal className="h-5 w-5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 bg-white border-slate-200 shadow-xl rounded-lg p-1.5 z-50">
                        <DropdownMenuItem
                          onClick={() => toast.info(`Viewing granular breakdown for ${c.name}`)}
                          className="flex items-center gap-2.5 py-2 px-3 text-xs font-medium text-[#070B28] hover:bg-slate-50 cursor-pointer rounded-md transition-colors"
                        >
                          <FileText className="h-4 w-4 text-slate-500" />
                          <span>Category Breakdown</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => toast.success(`Exporting SKU sales data for ${c.name}...`)}
                          className="flex items-center gap-2.5 py-2 px-3 text-xs font-medium text-[#070B28] hover:bg-slate-50 cursor-pointer rounded-md transition-colors"
                        >
                          <Download className="h-4 w-4 text-[#0052FF]" />
                          <span>Export Sales CSV</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* ═══ Reusable DataPagination ═══ */}
        <div className="border-t border-slate-200 bg-white px-4 py-1">
          <DataPagination
            currentPage={categoryPage}
            totalPages={totalCategoryPages}
            totalItems={categoriesList.length}
            pageSize={categoryPageSize}
            onPageChange={setCategoryPage}
            onPageSizeChange={(newSize) => {
              setCategoryPageSize(newSize);
              setCategoryPage(1);
            }}
            pageSizeOptions={[3, 5, 10]}
            itemLabel="categories"
          />
        </div>
      </div>
    </div>
  );
}
