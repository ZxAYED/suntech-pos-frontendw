"use client";

import { flexRender } from "@tanstack/react-table";
import type { RowData } from "@tanstack/table-core";
import {
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useLegacyTable,
  type LegacyColumnDef,
} from "@tanstack/react-table/legacy";
import { AlertCircle } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/common/empty-state";
import { DataPagination } from "@/components/common/data-pagination";

interface DataTableProps<TData extends RowData> {
  columns: LegacyColumnDef<TData, unknown>[];
  data: TData[];
  loading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
}

export function DataTable<TData extends RowData>({
  columns,
  data,
  loading,
  error,
  onRetry,
  searchPlaceholder = "Search",
  searchValue,
  onSearchChange,
  emptyTitle = "No records found",
  emptyDescription,
  emptyAction,
}: DataTableProps<TData>) {
  const table = useLegacyTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageIndex: 0, pageSize: 8 },
    },
  });

  return (
    <div className="space-y-4">
      {onSearchChange ? (
        <Input
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={searchPlaceholder}
          className="max-w-sm min-h-11 h-11 border-slate-200 text-sm text-[#070B28] placeholder:text-slate-400"
        />
      ) : null}
      <div className="rounded-lg border border-slate-200 bg-white shadow-xs overflow-hidden">
        <Table className="w-full text-base">
          <TableHeader className="bg-slate-50/80 border-b border-slate-200">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="cursor-pointer py-4 px-4 text-xs sm:text-sm font-medium uppercase tracking-wider text-slate-500"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody className="divide-y divide-slate-100">
            {error ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="p-8">
                  <div className="flex flex-col items-center justify-center text-center">
                    <AlertCircle className="mb-2 h-8 w-8 text-rose-500" />
                    <p className="text-base font-medium text-[#070B28]">Unable to load records</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {error.message || "An error occurred while fetching data."}
                    </p>
                    {onRetry ? (
                      <Button size="sm" variant="outline" className="mt-3 min-h-11 h-11 px-5 text-sm font-medium border-slate-200 text-[#070B28]" onClick={onRetry}>
                        Retry query
                      </Button>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            ) : loading ? (
              Array.from({ length: 5 }).map((_, rowIndex) => (
                <TableRow key={rowIndex} className="h-16">
                  {columns.map((_, colIndex) => (
                    <TableCell key={colIndex} className="py-4 px-4">
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="h-16 hover:bg-slate-50/70 transition-colors">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-4 px-4 text-base font-medium text-[#070B28]">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="p-8">
                  <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataPagination
        currentPage={table.getState().pagination.pageIndex + 1}
        totalPages={table.getPageCount()}
        totalItems={data.length}
        pageSize={table.getState().pagination.pageSize}
        onPageChange={(page) => table.setPageIndex(page - 1)}
        onPageSizeChange={(size) => table.setPageSize(size)}
      />
    </div>
  );
}
