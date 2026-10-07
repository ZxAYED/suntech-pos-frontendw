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
    <div className="space-y-3">
      {onSearchChange ? (
        <Input
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={searchPlaceholder}
          className="max-w-sm"
        />
      ) : null}
      <div className="rounded-md border border-border bg-white shadow-sm">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="cursor-pointer"
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
          <TableBody>
            {error ? (
              <TableRow>
                <TableCell colSpan={columns.length}>
                  <div className="flex flex-col items-center justify-center p-8 text-center">
                    <AlertCircle className="mb-2 h-8 w-8 text-destructive" />
                    <p className="text-sm font-semibold text-secondary">Unable to load records</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {error.message || "An error occurred while fetching data."}
                    </p>
                    {onRetry ? (
                      <Button size="sm" variant="outline" className="mt-3" onClick={onRetry}>
                        Retry query
                      </Button>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            ) : loading ? (
              Array.from({ length: 5 }).map((_, rowIndex) => (
                <TableRow key={rowIndex}>
                  {columns.map((_, colIndex) => (
                    <TableCell key={colIndex}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="font-mono tabular-nums">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length}>
                  <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
