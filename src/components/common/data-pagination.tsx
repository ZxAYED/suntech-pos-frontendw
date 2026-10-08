"use client";

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface DataPaginationProps {
  currentPage: number; // 1-based index
  totalPages: number;
  totalItems?: number;
  totalCount?: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  itemLabel?: string;
  className?: string;
}

export function DataPagination({
  currentPage,
  totalPages,
  totalItems,
  totalCount,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20, 50],
  itemLabel = "records",
  className,
}: DataPaginationProps) {
  const safeTotalItems = totalItems ?? totalCount ?? 0;
  const safeTotalPages = Math.max(1, totalPages);
  const safeCurrentPage = Math.min(Math.max(1, currentPage), safeTotalPages);

  const startItem = safeTotalItems === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const endItem = Math.min(safeCurrentPage * pageSize, safeTotalItems);

  // Generate page numbers with smart ellipsis windowing
  const getPageNumbers = () => {
    if (safeTotalPages <= 7) {
      return Array.from({ length: safeTotalPages }, (_, i) => i + 1);
    }

    const pages: (number | "...")[] = [];
    if (safeCurrentPage <= 4) {
      pages.push(1, 2, 3, 4, 5, "...", safeTotalPages);
    } else if (safeCurrentPage >= safeTotalPages - 3) {
      pages.push(1, "...", safeTotalPages - 4, safeTotalPages - 3, safeTotalPages - 2, safeTotalPages - 1, safeTotalPages);
    } else {
      pages.push(1, "...", safeCurrentPage - 1, safeCurrentPage, safeCurrentPage + 1, "...", safeTotalPages);
    }
    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-1 py-3 text-sm select-none",
        className,
      )}
    >
      {/* ── Left: Range & Summary Telemetry ── */}
      <div className="flex flex-wrap items-center gap-3 text-slate-500">
        <div>
          Showing{" "}
          <span className="font-mono font-semibold text-[#070B28] tabular-nums">
            {startItem}
          </span>{" "}
          to{" "}
          <span className="font-mono font-semibold text-[#070B28] tabular-nums">
            {endItem}
          </span>{" "}
          of{" "}
          <span className="font-mono font-bold text-[#070B28] tabular-nums">
            {totalItems}
          </span>{" "}
          {itemLabel}
        </div>

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
            <span className="text-xs text-slate-400">Rows:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs font-semibold text-[#070B28] shadow-2xs outline-none cursor-pointer hover:border-slate-300 focus:border-[#0052FF]"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ── Right: Page Navigation Buttons ── */}
      <div className="flex items-center gap-1">
        {/* First Page (<<) */}
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => onPageChange(1)}
          disabled={safeCurrentPage <= 1}
          className="h-9 w-9 border-slate-200 bg-white text-slate-600 hover:text-[#070B28] hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
          title="First page"
          aria-label="First page"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>

        {/* Previous Page (<) */}
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => onPageChange(safeCurrentPage - 1)}
          disabled={safeCurrentPage <= 1}
          className="h-9 w-9 border-slate-200 bg-white text-slate-600 hover:text-[#070B28] hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
          title="Previous page"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Numbered Page Buttons */}
        <div className="flex items-center gap-1">
          {pages.map((p, idx) =>
            p === "..." ? (
              <span
                key={`ellipsis-${idx}`}
                className="flex h-9 w-7 items-center justify-center text-xs font-bold text-slate-400"
              >
                …
              </span>
            ) : (
              <Button
                key={`page-${p}`}
                type="button"
                variant={safeCurrentPage === p ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(p)}
                className={cn(
                  "min-h-9 h-9 min-w-9 px-2.5 font-mono text-xs font-semibold tabular-nums shadow-2xs transition-colors",
                  safeCurrentPage === p
                    ? "bg-[#0052FF] text-white hover:bg-[#0047E0] border-[#0052FF]"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-[#070B28]",
                )}
              >
                {p}
              </Button>
            ),
          )}
        </div>

        {/* Next Page (>) */}
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => onPageChange(safeCurrentPage + 1)}
          disabled={safeCurrentPage >= safeTotalPages}
          className="h-9 w-9 border-slate-200 bg-white text-slate-600 hover:text-[#070B28] hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
          title="Next page"
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        {/* Last Page (>>) */}
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => onPageChange(safeTotalPages)}
          disabled={safeCurrentPage >= safeTotalPages}
          className="h-9 w-9 border-slate-200 bg-white text-slate-600 hover:text-[#070B28] hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
          title="Last page"
          aria-label="Last page"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
