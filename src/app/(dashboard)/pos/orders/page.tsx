"use client";

import type { LegacyColumnDef } from "@tanstack/react-table/legacy";
import { DataTable } from "@/components/common/data-table";
import { PageHeader } from "@/components/common/page-header";
import { Badge } from "@/components/ui/badge";
import { formatCentsToCurrency } from "@/lib/utils";
import { useOrdersQuery } from "@/redux/api/ordersApi";
import type { Order } from "@/types/domain";

const columns: LegacyColumnDef<Order, unknown>[] = [
  { accessorKey: "id", header: "Order" },
  {
    accessorKey: "createdAt",
    header: "Time",
    cell: ({ row }) => new Date(row.original.createdAt).toLocaleString(),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={row.original.status === "PAID" ? "paid" : row.original.status === "PENDING" ? "pending" : "destructive"}>
        {row.original.status}
      </Badge>
    ),
  },
  {
    accessorKey: "totalAmount",
    header: "Total",
    cell: ({ row }) => formatCentsToCurrency(row.original.totalAmount),
  },
];

export default function OrdersPage() {
  const orders = useOrdersQuery();
  return (
    <div>
      <PageHeader title="Orders" accent="ledger" description="Recent register tickets." />
      <DataTable columns={columns} data={orders.data ?? []} loading={orders.isLoading} />
    </div>
  );
}
