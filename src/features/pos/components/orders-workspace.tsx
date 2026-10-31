"use client";

import { useMemo, useRef, useState } from "react";
import { Eye, MoreHorizontal, Printer, RotateCcw, Search, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { DataPagination } from "@/components/common/data-pagination";
import { DataState, TenantRequiredState } from "@/components/common/data-state";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useOrders, useRefundOrder } from "@/features/pos/api/use-pos";
import { ReceiptDialog } from "@/features/pos/components/receipt-dialog";
import { mapOrderToReceipt, type OrderRowViewModel, type ReceiptViewModel } from "@/features/pos/view-models";
import { useTenantScope } from "@/features/tenant/hooks/use-tenant-scope";
import { useDebounce } from "@/hooks/use-debounce";
import { PAYMENT_METHOD_OPTIONS } from "@/lib/payment-methods";
import { formatBDT } from "@/lib/utils";
import { createRefundSchema } from "@/lib/validations";
import { ApiClientError } from "@/types/api";
import type { PaymentMethod } from "@/types/domain";

interface Filters {
  search: string;
  status: string;
  paymentMethod: string;
  orderType: string;
  range: string;
  page: number;
  limit: number;
}

interface OrdersWorkspaceProps {
  role?: "admin" | "cashier";
}

export function OrdersWorkspace({ role = "cashier" }: OrdersWorkspaceProps) {
  const tenant = useTenantScope(role);
  const isAdmin = tenant.isAdmin || role === "admin";

  const [filters, setFilters] = useState<Filters>({
    search: "",
    status: "ALL",
    paymentMethod: "ALL",
    orderType: "ALL",
    range: "all",
    page: 1,
    limit: 10,
  });

  const search = useDebounce(filters.search, 250);

  // Admin sends businessId, locationId, scope: "all", ownOrders: false
  // Cashier sends scope: "my", ownOrders: true
  const query = useOrders(
    {
      search: search.trim() || undefined,
      status: filters.status === "ALL" ? undefined : filters.status,
      paymentMethod: filters.paymentMethod === "ALL" ? undefined : (filters.paymentMethod as PaymentMethod),
      orderType: filters.orderType === "ALL" ? undefined : filters.orderType,
      range: filters.range === "all" ? undefined : filters.range,
      page: filters.page,
      limit: filters.limit,
      businessId: isAdmin ? tenant.businessId : undefined,
      locationId: isAdmin ? tenant.locationId : undefined,
      scope: isAdmin ? "all" : "my",
      ownOrders: !isAdmin,
    },
    isAdmin ? tenant.isTenantReady : true,
  );

  const refundMutation = useRefundOrder();
  const [selected, setSelected] = useState<OrderRowViewModel | null>(null);
  const [refundOrder, setRefundOrder] = useState<OrderRowViewModel | null>(null);
  const [printingReceipt, setPrintingReceipt] = useState<ReceiptViewModel | null>(null);
  const [refundReason, setRefundReason] = useState("");
  const [refundQty, setRefundQty] = useState<Record<string, number>>({});
  const refundOperationKeyRef = useRef<string | null>(null);

  const refundTotal = useMemo(
    () =>
      refundOrder?.order.lines.reduce((sum, line) => {
        const maxRefundable = line.refundableQuantity ?? Math.max(0, line.quantity - (line.refundedQuantity ?? 0));
        const selectedQty = Math.min(refundQty[line.id] ?? 0, maxRefundable);
        return sum + selectedQty * line.unitPrice;
      }, 0) ?? 0,
    [refundOrder, refundQty],
  );

  if (isAdmin && !tenant.isTenantReady) return <TenantRequiredState />;

  const setFilter = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    setFilters((current) => ({ ...current, [key]: value, ...(key !== "page" ? { page: 1 } : {}) }));

  const openRefund = (row: OrderRowViewModel) => {
    setRefundOrder(row);
    setRefundReason("");
    setRefundQty({});
    refundOperationKeyRef.current = null;
  };

  const confirmRefund = async () => {
    if (!refundOrder) return;
    const items = Object.entries(refundQty)
      .filter(([, quantity]) => quantity > 0)
      .map(([orderItemId, quantity]) => ({ orderItemId, quantity: Math.floor(quantity) }));

    const validation = createRefundSchema.safeParse({
      items,
      reason: refundReason.trim() || undefined,
      idempotencyKey: refundOperationKeyRef.current || globalThis.crypto.randomUUID(),
    });

    if (!validation.success) {
      toast.error(validation.error.issues[0]?.message || "Select at least one refundable item quantity.");
      return;
    }

    refundOperationKeyRef.current = validation.data.idempotencyKey;
    try {
      await refundMutation.mutateAsync({
        orderId: refundOrder.id,
        items: validation.data.items,
        reason: validation.data.reason,
        idempotencyKey: refundOperationKeyRef.current ?? undefined,
      });
      toast.success(`Refund processed for ${formatBDT(refundTotal)}.`);
      refundOperationKeyRef.current = null;
      setRefundOrder(null);
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 409) {
        toast.error("Refund conflict: The requested quantity exceeds the remaining refundable amount. Refreshing orders...");
        refundOperationKeyRef.current = null;
        void query.refetch();
      } else if (error instanceof ApiClientError && (error.status === 0 || error.status === 408 || error.status >= 500)) {
        toast.error("The refund result is uncertain. Click confirm again to retry with the same idempotency key.");
      } else {
        refundOperationKeyRef.current = null;
        toast.error(error instanceof Error ? error.message : "Refund failed");
      }
    }
  };

  const rows = query.data?.rows ?? [];
  const totalPages = query.data?.totalPages ?? 1;
  const totalItems = query.data?.total ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title={isAdmin ? "Store Orders & Sales" : "Register Tickets & Order History"}
        description={
          isAdmin
            ? "Complete register of all store customer transactions, cashier sales, refunds, and ticket receipts."
            : "Track your customer sales receipts, search invoices, process returns, and reprint tickets."
        }
      />

      <Card className="border-slate-200 p-4 shadow-xs">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <div className="relative xl:col-span-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={filters.search}
              onChange={(event) => setFilter("search", event.target.value)}
              placeholder="Search by invoice, customer, or item"
              className="pl-9"
            />
          </div>
          <FilterSelect
            value={filters.status}
            onChange={(value) => setFilter("status", value)}
            options={[
              { value: "ALL", label: "All statuses" },
              { value: "PAID", label: "Paid" },
              { value: "REFUNDED", label: "Refunded" },
            ]}
          />
          <FilterSelect
            value={filters.paymentMethod}
            onChange={(value) => setFilter("paymentMethod", value)}
            options={[{ value: "ALL", label: "All payments" }, ...PAYMENT_METHOD_OPTIONS]}
          />
          <FilterSelect
            value={filters.orderType}
            onChange={(value) => setFilter("orderType", value)}
            options={[
              { value: "ALL", label: "All order types" },
              { value: "CATALOG", label: "Catalog sales" },
              { value: "CUSTOM", label: "Custom quick sales" },
            ]}
          />
        </div>
      </Card>

      <DataState
        data={rows}
        isLoading={query.isLoading}
        isError={query.isError}
        resource="orders"
        emptyTitle={isAdmin ? "No store orders found for this branch." : "No orders found for your register."}
        emptyDescription="Try changing the current search or filters, or record a sale."
        onRetry={() => void query.refetch()}
      >
        {(orderRows) => (
          <Card className="overflow-hidden border-slate-200 shadow-xs">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead>Customer &amp; items</TableHead>
                    {isAdmin ? <TableHead>Cashier</TableHead> : null}
                    <TableHead>Payment</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orderRows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <p className="font-medium text-[#070B28]">{row.customerName || "Walk-in customer"}</p>
                        <p className="text-xs text-slate-600">{row.summary}</p>
                        <p className="mt-1 font-mono text-[11px] text-slate-400">
                          #{row.invoiceNumber} · {new Date(row.createdAt).toLocaleString("en-BD")}
                        </p>
                      </TableCell>
                      {isAdmin ? (
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-xs text-slate-700">
                            <UserIcon className="h-3.5 w-3.5 text-slate-400" />
                            <span>{row.cashierName || "Staff"}</span>
                          </div>
                        </TableCell>
                      ) : null}
                      <TableCell>
                        <span className="text-xs font-medium text-slate-700">{row.paymentLabel}</span>
                        <span className="ml-2 text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                          {row.order.type}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold text-[#070B28]">
                        {formatBDT(row.totalAmount)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            row.status === "PAID"
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-rose-200 bg-rose-50 text-rose-700"
                          }
                        >
                          {row.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label={`Actions for ${row.invoiceNumber}`}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSelected(row)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                setPrintingReceipt(
                                  mapOrderToReceipt(
                                    row.order,
                                    tenant.activeBusiness?.name,
                                    row.locationName || tenant.activeBranch?.name,
                                  ),
                                )
                              }
                            >
                              <Printer className="mr-2 h-4 w-4" />
                              Print receipt
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={row.status === "REFUNDED"}
                              onClick={() => openRefund(row)}
                              className="text-rose-600"
                            >
                              <RotateCcw className="mr-2 h-4 w-4" />
                              Refund
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="border-t border-slate-200 px-4">
              <DataPagination
                currentPage={filters.page}
                totalPages={totalPages}
                totalItems={totalItems}
                pageSize={filters.limit}
                onPageChange={(page) => setFilter("page", page)}
                onPageSizeChange={(limit) => setFilters((current) => ({ ...current, page: 1, limit }))}
                itemLabel="orders"
              />
            </div>
          </Card>
        )}
      </DataState>

      {/* Details Dialog */}
      <Dialog open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order {selected?.invoiceNumber}</DialogTitle>
          </DialogHeader>
          {selected ? (
            <div className="space-y-4">
              <div className="grid gap-3 rounded-lg bg-slate-50 p-4 text-sm sm:grid-cols-2">
                <Detail label="Status" value={selected.status} />
                <Detail label="Customer" value={selected.customerName || "Walk-in customer"} />
                <Detail label="Date" value={new Date(selected.createdAt).toLocaleString("en-BD")} />
                <Detail label="Cashier" value={selected.cashierName || "Not recorded"} />
                <Detail label="Location" value={selected.locationName || tenant.activeBranch?.name || "Main Branch"} />
                <Detail label="Payment" value={selected.paymentLabel} />
              </div>
              <div className="divide-y rounded-lg border border-slate-200">
                {selected.order.lines.map((line) => (
                  <div key={line.id} className="flex justify-between p-3 text-sm">
                    <span>
                      {line.productName}
                      {line.variantName ? ` · ${line.variantName}` : ""} × {line.quantity}
                    </span>
                    <span className="font-mono">{formatBDT(line.subtotal)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span className="font-mono">{formatBDT(selected.totalAmount)}</span>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPrintingReceipt(
                      mapOrderToReceipt(
                        selected.order,
                        tenant.activeBusiness?.name,
                        selected.locationName || tenant.activeBranch?.name,
                      ),
                    )
                  }
                >
                  <Printer className="mr-1.5 h-3.5 w-3.5" />
                  Print receipt
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Refund Dialog */}
      <Dialog open={refundOrder !== null} onOpenChange={(open) => !open && setRefundOrder(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Prepare refund · {refundOrder?.invoiceNumber}</DialogTitle>
          </DialogHeader>
          {refundOrder ? (
            <div className="space-y-4">
              <div className="divide-y rounded-lg border border-slate-200">
                {refundOrder.order.lines.map((line) => {
                  const maxRefundable = line.refundableQuantity ?? Math.max(0, line.quantity - (line.refundedQuantity ?? 0));
                  const isFullyRefunded = maxRefundable <= 0;
                  return (
                    <div key={line.id} className="grid grid-cols-[1fr_90px] items-center gap-3 p-3">
                      <div>
                        <p className="text-sm font-medium">{line.productName}</p>
                        <p className="text-xs text-slate-500">
                          {isFullyRefunded ? (
                            <span className="font-semibold text-rose-600">Fully refunded</span>
                          ) : (
                            <>
                              Refundable: <strong className="text-[#070B28]">{maxRefundable}</strong> of {line.quantity} · {formatBDT(line.unitPrice)} each
                              {(line.refundedQuantity ?? 0) > 0 ? (
                                <span className="ml-1 text-slate-400">({line.refundedQuantity} refunded)</span>
                              ) : null}
                            </>
                          )}
                        </p>
                      </div>
                      <Input
                        type="number"
                        min="0"
                        max={maxRefundable}
                        step="1"
                        disabled={isFullyRefunded}
                        value={refundQty[line.id] ?? 0}
                        onChange={(event) => {
                          const val = Number.parseInt(event.target.value, 10);
                          const safeVal = Number.isFinite(val) ? Math.min(maxRefundable, Math.max(0, val)) : 0;
                          setRefundQty((current) => ({
                            ...current,
                            [line.id]: safeVal,
                          }));
                        }}
                      />
                    </div>
                  );
                })}
              </div>
              <div>
                <label htmlFor="refund-reason" className="text-xs font-medium">
                  Reason (optional)
                </label>
                <Input
                  id="refund-reason"
                  value={refundReason}
                  onChange={(event) => setRefundReason(event.target.value)}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg bg-rose-50 p-3">
                <span className="text-sm font-medium text-rose-800">Refund total</span>
                <span className="font-mono font-bold text-rose-700">{formatBDT(refundTotal)}</span>
              </div>
              <Button
                className="w-full bg-rose-600 text-white hover:bg-rose-700"
                loading={refundMutation.isPending}
                onClick={confirmRefund}
              >
                Confirm refund
              </Button>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <ReceiptDialog
        receipt={printingReceipt}
        open={printingReceipt !== null}
        onOpenChange={(open) => !open && setPrintingReceipt(null)}
      />
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="font-medium text-[#070B28]">{value}</p>
    </div>
  );
}
