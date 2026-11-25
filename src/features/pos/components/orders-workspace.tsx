"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import { useActiveShift } from "@/features/shifts/api/use-shifts";
import { useTenantScope } from "@/features/tenant/hooks/use-tenant-scope";
import { useDebounce } from "@/hooks/use-debounce";
import { prepareFinancialOperation } from "@/lib/prepare-financial-operation";
import { financialFailureOutcome } from "@/lib/financial-failure";
import { financialOperations, type ScopedFinancialOperation } from "@/lib/financial-operation";
import { ALL_PAYMENT_METHOD_OPTIONS } from "@/lib/payment-methods";
import { formatBDT } from "@/lib/utils";
import { formatBusinessDateTime } from "@/lib/business-time";
import { createRefundSchema } from "@/lib/validations";
import { ApiClientError } from "@/types/api";
import { useOffline } from "@/features/offline/ui/offline-provider";
import { offlineDb } from "@/features/offline/db/offline-db";
import { advancedIntakeEnabled, hasUnresolvedAdvancedCommand, recordRefundPayout } from "@/features/offline/core/advanced-commands";
import { recoverLegacyRefund, reserveLegacyRefund, resolveLegacyRefund, type LegacyRefundPayload } from "@/features/offline/services/refund-recovery";
import { readSavedActiveShift } from "@/features/offline/services/active-shift";
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
  const offline = useOffline();
  const offlineRefundEnabled = offline.mode === "OFFLINE" && advancedIntakeEnabled() && offline.claims?.permissions.includes("REFUND_PAYOUT_EVIDENCE");
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

  const activeShift = useActiveShift(
    { locationId: tenant.locationId ?? undefined, businessId: tenant.businessId ?? undefined },
    tenant.isTenantReady,
  );
  const refundMutation = useRefundOrder();
  const [selected, setSelected] = useState<OrderRowViewModel | null>(null);
  const [refundOrder, setRefundOrder] = useState<OrderRowViewModel | null>(null);
  const [printingReceipt, setPrintingReceipt] = useState<ReceiptViewModel | null>(null);
  const [refundReason, setRefundReason] = useState("");
  const [payoutReported, setPayoutReported] = useState(false);
  const openingRefund = useRef(false);
  const [refundDelivery, setRefundDelivery] = useState<"LEGACY_HTTP" | "OFFLINE_EVIDENCE">("LEGACY_HTTP");
  const dialogScope = useRef("");
  const currentDialogScope = JSON.stringify([tenant.userId,tenant.businessId,tenant.locationId,offline.scope?.deviceId]);
  const currentDialogScopeRef = useRef(currentDialogScope);
  useEffect(() => {
    currentDialogScopeRef.current = currentDialogScope;
  }, [currentDialogScope]);
  const [refundQty, setRefundQty] = useState<Record<string, number>>({});
  const [refundOutcomeUnknown, setRefundOutcomeUnknown] = useState(false);
  const [hasRefundSnapshot, setHasRefundSnapshot] = useState(false);
  const [isRefunding, setIsRefunding] = useState(false);
  const isRefundingRef = useRef(false);
  const refundOperationKeyRef = useRef<string | null>(null);

  const refundTotal = useMemo(
    () =>
      refundOrder?.order.lines.reduce((sum, line) => {
        const maxRefundable = line.refundableQuantity ?? Math.max(0, line.quantity - (line.refundedQuantity ?? 0));
        const selectedQty = refundOutcomeUnknown ? (refundQty[line.id] ?? 0) : Math.min(refundQty[line.id] ?? 0, maxRefundable);
        return sum + selectedQty * line.unitPrice;
      }, 0) ?? 0,
    [refundOrder, refundQty, refundOutcomeUnknown],
  );

  if (isAdmin && !tenant.isTenantReady) return <TenantRequiredState />;

  const setFilter = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    setFilters((current) => ({ ...current, [key]: value, ...(key !== "page" ? { page: 1 } : {}) }));

  const openRefund = async (row: OrderRowViewModel) => {
    if (openingRefund.current || isRefundingRef.current) return;
    openingRefund.current = true;
    const originalScope = currentDialogScope;
    try {
    if (row.order.localStatus && row.order.localStatus !== "SYNCED") { toast.warning("Wait for this sale's server confirmation before refunding it."); return; }
    setPayoutReported(false);
    let pending: ScopedFinancialOperation<{
      orderId: string;
      items: Array<{ orderItemId: string; quantity: number }>;
      reason?: string;
      payoutShiftId?: string | null;
      businessId?: string;
    }> | null = null;
    try {
      pending = offline.scope ? await recoverLegacyRefund(offlineDb, offline.scope, row.id) : financialOperations.getPendingOperation({
        operationType: "refund",
        userId: tenant.userId,
        businessId: tenant.businessId,
        locationId: tenant.locationId,
        scopeExtra: row.id,
      });
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Original refund evidence cannot be read. Do not pay again.");
      return;
    }
    const isUnknown = Boolean(pending && (pending.outcome === "unknown" || pending.outcome === "pending"));
    const snapshotAvailable = Boolean(
      pending?.payloadSnapshot?.items &&
      pending.payloadSnapshot.items.length > 0 &&
      pending.payloadSnapshot.orderId === row.id,
    );
    if (!isUnknown && (row.status === "REFUNDED" || row.order.refundStatus === "REFUNDED")) { toast.info("This order is fully refunded."); return; }
    if (currentDialogScopeRef.current !== originalScope) return;
    dialogScope.current = originalScope;
    setRefundDelivery(!isUnknown && offlineRefundEnabled ? "OFFLINE_EVIDENCE" : "LEGACY_HTTP");
    setRefundOrder(row);
    setRefundOutcomeUnknown(isUnknown);
    setHasRefundSnapshot(snapshotAvailable);

    if (isUnknown && snapshotAvailable && pending?.payloadSnapshot) {
      setRefundReason(pending.payloadSnapshot.reason ?? "");
      const restoredQty: Record<string, number> = {};
      for (const it of pending.payloadSnapshot.items) {
        restoredQty[it.orderItemId] = it.quantity;
      }
      setRefundQty(restoredQty);
    } else {
      setRefundReason("");
      setRefundQty({});
    }
    refundOperationKeyRef.current = pending?.key ?? null;
    } finally { openingRefund.current = false; }
  };

  const handleClearRefundLock = () => {
    toast.warning("An order-history list cannot prove that the original request failed. Keep the original key and retry the exact request. If that is not possible, ask an administrator to reconcile it with server records.");
  };

  const confirmRefund = async () => {
    if (isRefundingRef.current || refundMutation.isPending) return;
    if (!refundOrder) return;
    if (dialogScope.current !== currentDialogScopeRef.current) { toast.error("The register changed. Reopen the original order before continuing."); setRefundOrder(null); return; }
    isRefundingRef.current = true;
    setIsRefunding(true);

    try {
      const operationScope = {
        operationType: "refund" as const,
        userId: tenant.userId,
        businessId: tenant.businessId,
        locationId: tenant.locationId,
        scopeExtra: refundOrder.id,
      };

      let items: Array<{ orderItemId: string; quantity: number }>;
      let reason: string | undefined;
      let payoutShiftId: string | null | undefined;
      let businessId: string | undefined;

      if (refundOutcomeUnknown) {
        let pending: ScopedFinancialOperation<{
          orderId: string;
          items: Array<{ orderItemId: string; quantity: number }>;
          reason?: string;
          payoutShiftId?: string | null;
          businessId?: string;
        }> | null = null;
        try {
          pending = financialOperations.getPendingOperation(operationScope);
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Unreadable refund snapshot in storage.");
          return;
        }

        if (!pending?.payloadSnapshot || pending.payloadSnapshot.orderId !== refundOrder.id) {
          toast.error("Refund snapshot unavailable or mismatched. Administrator reconciliation required.");
          return;
        }

        items = pending.payloadSnapshot.items;
        reason = pending.payloadSnapshot.reason;
        payoutShiftId = pending.payloadSnapshot.payoutShiftId;
        businessId = pending.payloadSnapshot.businessId;
      } else {
        items = Object.entries(refundQty)
          .filter(([, quantity]) => quantity > 0)
          .map(([orderItemId, quantity]) => ({ orderItemId, quantity: Math.floor(quantity) }));
        reason = refundReason.trim() || undefined;
        payoutShiftId = activeShift.data?.id ?? null;
        businessId = tenant.isAdmin ? tenant.businessId : undefined;
      }

      if (offline.scope && await hasUnresolvedAdvancedCommand(offlineDb,"REFUND_PAYOUT_EVIDENCE",offline.scope,refundOrder.id)) {
        toast.error("Saved offline payout evidence already exists. Sync or review that original payout; do not pay again."); return;
      }
      if (refundDelivery === "OFFLINE_EVIDENCE") {
        if (refundOutcomeUnknown) { toast.error("This original online refund needs its original connection and key. Do not convert it to offline evidence."); return; }
        if (!advancedIntakeEnabled() || !offline.claims?.permissions.includes("REFUND_PAYOUT_EVIDENCE") || !offline.scope) { toast.error("Refunds need a live server connection. No new refund was queued."); return; }
        // Only an explicitly reported completed payout is recorded. This is not a new payout instruction.
        if (await recoverLegacyRefund(offlineDb,offline.scope,refundOrder.id)) { toast.error("Recover the existing online refund first."); return; }
        const shift = await readSavedActiveShift(offlineDb,offline.scope);
        if (!shift.known) { toast.error("Original shift state is unknown. Keep payout evidence for manager review; do not pay again."); return; }
        if (dialogScope.current !== currentDialogScopeRef.current) return;
        const saved = await recordRefundPayout(offlineDb,offline.scope,refundOrder.order,items,refundReason,shift.shift?.id??null,payoutReported);
        toast.success(`Payout evidence ${saved.clientCommandId.slice(0,8)} saved. Server confirmation pending. Do not pay again.`);
        setRefundOrder(null);return;
      }

      if (offline.mode === "OFFLINE" || (typeof navigator !== "undefined" && !navigator.onLine)) { toast.error("This online refund requires its original connection. Do not convert it or pay again."); return; }
      if (dialogScope.current !== currentDialogScopeRef.current) return;
      const payloadToHash = {
        orderId: refundOrder.id,
        items,
        reason,
        payoutShiftId,
        businessId,
      };

      let prepared;
      try {
        prepared = prepareFinancialOperation(operationScope, payloadToHash, (validationKey) => {
          const validation = createRefundSchema.safeParse({
            items, reason, payoutShiftId, businessId,
            idempotencyKey: validationKey,
          });
          if (!validation.success) {
            throw new Error(validation.error.issues[0]?.message || "Select at least one refundable item quantity.");
          }
          return validation.data;
        });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Uncertain refund pending.");
        return;
      }
      const validated = prepared.data;
      refundOperationKeyRef.current = prepared.key;
      // Durable legacy reservation before the existing HTTP refund is sent.
      if (offline.scope) {
        try {
          const original=financialOperations.getPendingOperation<LegacyRefundPayload>(operationScope);
          if(!original)throw new Error("The original refund identity was not saved.");
          await reserveLegacyRefund(offlineDb,offline.scope,refundOrder.id,original);
        } catch(cause) {
          if(!prepared.isRetry)financialOperations.recordOutcome(operationScope,"failed");
          toast.error(cause instanceof Error?cause.message:"Refund recovery storage failed. No request was sent.");return;
        }
      }

      try {
        await refundMutation.mutateAsync({
          orderId: refundOrder.id,
          items: validated.items,
          reason: validated.reason,
          payoutShiftId: validated.payoutShiftId,
          businessId: validated.businessId,
          idempotencyKey: validated.idempotencyKey,
        });
        if(offline.scope) await resolveLegacyRefund(offlineDb,offline.scope,refundOrder.id,prepared.key);
        toast.success("Refund processed successfully.");
        financialOperations.recordOutcome(operationScope, "success");
        refundOperationKeyRef.current = null;
        setRefundOutcomeUnknown(false);
        setHasRefundSnapshot(false);
        setRefundOrder(null);
      } catch (error) {
        if (error instanceof ApiClientError && error.status === 409) {
          const errorMsg = error.message || "";
          const isQuantityConflict = /exceeds the remaining quantity|over_refund/i.test(errorMsg);
          const isInProgress = /already in progress/i.test(errorMsg);
          const isSerialization = /retry|could not be completed/i.test(errorMsg);
          const isPayloadConflict = /different request body|different request/i.test(errorMsg);

          if (isQuantityConflict && !prepared.isRetry) {
            toast.error("Refund conflict: The requested quantity exceeds the remaining refundable amount. Refreshing orders...");
            if(offline.scope) await resolveLegacyRefund(offlineDb,offline.scope,refundOrder.id,prepared.key);
            financialOperations.recordOutcome(operationScope, "failed");
            refundOperationKeyRef.current = null;
            setRefundOutcomeUnknown(false);
            setHasRefundSnapshot(false);
            void query.refetch();
          } else if (isInProgress) {
            financialOperations.recordOutcome(operationScope, "unknown");
            setRefundOutcomeUnknown(true);
            setHasRefundSnapshot(true);
            toast.error("A refund request with this key is already in progress on the server. Please wait or retry with the same ticket.");
          } else if (isSerialization) {
            financialOperations.recordOutcome(operationScope, "unknown");
            setRefundOutcomeUnknown(true);
            setHasRefundSnapshot(true);
            toast.error("Server conflict occurred while completing refund. Retry with the same ticket.");
          } else if (isPayloadConflict) {
            financialOperations.recordOutcome(operationScope, "unknown");
            setRefundOutcomeUnknown(true);
            setHasRefundSnapshot(true);
            toast.error("Idempotency key was reused with a different refund request. Please reconcile with order history.");
          } else {
            financialOperations.recordOutcome(operationScope, "unknown");
            setRefundOutcomeUnknown(true);
            setHasRefundSnapshot(true);
            toast.error(errorMsg || "Refund conflict on server. Please check order history.");
          }
        } else if (financialFailureOutcome(error, prepared.isRetry) === "unknown") {
          financialOperations.recordOutcome(operationScope, "unknown");
          setRefundOutcomeUnknown(true);
          setHasRefundSnapshot(true);
          toast.error("The refund result is uncertain. Keep this selection unchanged and retry with the same operation key.");
        } else {
          if(offline.scope) await resolveLegacyRefund(offlineDb,offline.scope,refundOrder.id,prepared.key);
          financialOperations.recordOutcome(operationScope, "failed");
          refundOperationKeyRef.current = null;
          setRefundOutcomeUnknown(false);
          setHasRefundSnapshot(false);
          toast.error(error instanceof Error ? error.message : "Refund failed");
        }
      }
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Refund evidence could not be saved. Check the original operation before paying again.");
      if(refundOperationKeyRef.current) { setRefundOutcomeUnknown(true);setHasRefundSnapshot(true); }
    } finally {
      isRefundingRef.current = false;
      setIsRefunding(false);
    }
  };

  const rows = query.data?.rows ?? [];
  const totalPages = query.data?.totalPages ?? 1;
  const totalItems = query.data?.total ?? 0;

  return (
    <div className="space-y-6">
      {query.data?.localOnly ? <p className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Showing sales saved on this device and a limited downloaded history. This is not the complete business history. {offlineRefundEnabled ? "Only approved, already-paid refund evidence can be saved; other tills may have refunded the same item. This is not payout authorization." : "Refunds need a live server connection."}</p> : null}
      {query.data?.pendingRows?.length ? <section className="rounded border border-amber-200 bg-amber-50 p-3 text-sm"><h2 className="font-semibold">Saved on this device — waiting for server confirmation</h2><p className="text-xs">These are separate from server-confirmed totals. Showing up to 20 waiting records.</p>{query.data.pendingRows.map(row => <div key={row.id} className="mt-2 flex flex-wrap items-center justify-between gap-2"><span>{row.invoiceNumber} · {row.customerName} · {formatBDT(row.totalAmount)}</span><button type="button" className="rounded border bg-white px-2 py-1" onClick={() => setPrintingReceipt(mapOrderToReceipt(row.order))}>View saved receipt</button></div>)}</section> : null}
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
              name="orders-search-filter"
              autoComplete="off"
              data-lpignore="true"
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
            options={[{ value: "ALL", label: "All payments" }, ...ALL_PAYMENT_METHOD_OPTIONS]}
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
                          #{row.invoiceNumber} · {formatBusinessDateTime(row.saleAt || row.createdAt)}
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
                        {(() => {
                          const isFullyRefunded = row.status === "REFUNDED" || row.order.refundStatus === "REFUNDED";
                          const isPartiallyRefunded =
                            !isFullyRefunded &&
                            (row.status === "PARTIALLY_REFUNDED" || row.order.refundStatus === "PARTIALLY_REFUNDED");

                          if (isFullyRefunded) {
                            return (
                              <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-700 font-medium">
                                REFUNDED
                              </Badge>
                            );
                          }
                          if (isPartiallyRefunded) {
                            return (
                              <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 font-medium">
                                PARTIALLY REFUNDED
                              </Badge>
                            );
                          }
                          return (
                            <Badge
                              variant="outline"
                              className={
                                row.status === "PAID"
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 font-medium"
                                  : "border-slate-200 bg-slate-50 text-slate-700 font-medium"
                              }
                            >
                              {row.status}
                            </Badge>
                          );
                        })()}
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
                              onClick={() => void openRefund(row)}
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
                <Detail
                  label="Status"
                  value={
                    selected.status === "REFUNDED" || selected.order.refundStatus === "REFUNDED"
                      ? "REFUNDED"
                      : selected.status === "PARTIALLY_REFUNDED" || selected.order.refundStatus === "PARTIALLY_REFUNDED"
                        ? "PARTIALLY REFUNDED"
                        : selected.status
                  }
                />
                <Detail label="Customer" value={selected.customerName || "Walk-in customer"} />
                <Detail
                  label="Sale time (Dhaka)"
                  value={
                    selected.saleAt
                      ? `${formatBusinessDateTime(selected.saleAt)}${selected.timeSource === "legacy-createdAt" ? " (Legacy record time)" : ""}`
                      : "—"
                  }
                />
                <Detail label="Recorded at (Dhaka)" value={formatBusinessDateTime(selected.createdAt)} />
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
      <Dialog open={refundOrder !== null} onOpenChange={(open) => !open && !isRefunding && setRefundOrder(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Prepare refund · {refundOrder?.invoiceNumber}</DialogTitle>
          </DialogHeader>
          {refundOrder ? (
            <div className="space-y-4">
              {refundOutcomeUnknown ? (
                <div role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-semibold">Refund outcome uncertain (timeout/server error).</span>{" "}
                    {hasRefundSnapshot ? (
                      <span>Item quantities restored and locked; retry sends identical idempotency key.</span>
                    ) : (
                      <span className="text-rose-700 font-medium">Previous refund items not restored. Check order lines before proceeding.</span>
                    )}
                  </div>
                  <button
                    type="button"
                    disabled={isRefunding}
                    onClick={handleClearRefundLock}
                    className="rounded border border-amber-300 bg-white px-2 py-0.5 text-xs font-semibold text-amber-900 hover:bg-amber-100 cursor-pointer disabled:opacity-50"
                  >
                    Recovery help
                  </button>
                </div>
              ) : null}
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
                        disabled={isFullyRefunded || refundOutcomeUnknown || isRefunding}
                        value={refundQty[line.id] ?? 0}
                        onChange={(event) => {
                          if (isRefunding || refundOutcomeUnknown) return;
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
                  {refundDelivery === "OFFLINE_EVIDENCE" ? "Reason (required for saved payout evidence)" : "Reason (optional)"}
                </label>
                <Input
                  id="refund-reason"
                  disabled={refundOutcomeUnknown || isRefunding}
                  value={refundReason}
                  onChange={(event) => {
                    if (isRefunding || refundOutcomeUnknown) return;
                    setRefundReason(event.target.value);
                  }}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg bg-rose-50 p-3">
                <span className="text-sm font-medium text-rose-800">Refund total</span>
                <span className="font-mono font-bold text-rose-700">{formatBDT(refundTotal)}</span>
              </div>
              {refundDelivery === "OFFLINE_EVIDENCE" && !refundOutcomeUnknown ? <label className="flex items-start gap-2 rounded border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900"><input type="checkbox" checked={payoutReported} onChange={event=>setPayoutReported(event.target.checked)} disabled={isRefunding} /><span>I am recording the exact amount already paid under the approved shop procedure. This app cannot check refunds made on other disconnected devices. Saving does not authorize or send money.</span></label> : null}
              <Button
                className="w-full bg-rose-600 text-white hover:bg-rose-700"
                disabled={isRefunding || refundMutation.isPending || (!refundOutcomeUnknown && refundTotal <= 0) || (refundOutcomeUnknown && !hasRefundSnapshot) || (refundDelivery === "OFFLINE_EVIDENCE" && !refundOutcomeUnknown && (!payoutReported || !refundReason.trim()))}
                loading={isRefunding || refundMutation.isPending}
                onClick={confirmRefund}
              >
                {refundOutcomeUnknown ? (hasRefundSnapshot ? "Retry uncertain refund" : "Uncertain state — Recovery required") : refundDelivery === "OFFLINE_EVIDENCE" ? "Save reported payout evidence" : "Confirm refund"}
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
