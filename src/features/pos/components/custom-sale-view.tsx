"use client";

import { useEffect, useMemo, useRef, useState, type SetStateAction } from "react";
import Link from "next/link";
import { Minus, Plus, ReceiptText, Store, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { TenantRequiredState } from "@/components/common/data-state";
import { FormField as Field } from "@/components/common/form-field";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateCustomOrder } from "@/features/pos/api/use-pos";
import { fallbackReceiptAmounts } from "@/features/pos/utils/fallback-receipt-amounts";
import { ReceiptDialog } from "@/features/pos/components/receipt-dialog";
import { mapOrderToReceipt, type CustomSaleLineForm, type ReceiptViewModel } from "@/features/pos/view-models";
import { useActiveShift } from "@/features/shifts/api/use-shifts";
import { useTenantScope, type RoleType } from "@/features/tenant/hooks/use-tenant-scope";
import { prepareFinancialOperation } from "@/lib/prepare-financial-operation";
import { financialFailureOutcome } from "@/lib/financial-failure";
import { financialOperations, type ScopedFinancialOperation } from "@/lib/financial-operation";
import { PAYMENT_METHOD_OPTIONS } from "@/lib/payment-methods";
import { formatBDT } from "@/lib/utils";
import { customOrderSchema } from "@/lib/validations";
import type { PaymentMethod } from "@/types/domain";
import { useOffline } from "@/features/offline/ui/offline-provider";
import { useDurableCustomSale } from "@/features/pos/hooks/use-durable-custom-sale";
import { localCommitStatus } from "@/features/pos/utils/local-commit-status";
import { offlineDb } from "@/features/offline/db/offline-db";
import { readSaleReceipt } from "@/features/offline/core/checkout";
import { readLegacyCheckoutStatus } from "@/features/offline/services/legacy-status";

function newLine(): CustomSaleLineForm {
  return { id: globalThis.crypto.randomUUID(), productName: "", quantity: 1, unitPrice: "" };
}

interface CustomSaleSnapshot {
  businessId?: string;
  locationId?: string;
  shiftId?: string | null;
  customerName?: string;
  customerPhone?: string;
  paymentMethod?: PaymentMethod;
  tenderedAmount?: number;
  lines?: Array<{ productName: string; variantName?: string; quantity: number; unitPrice: number }>;
}

export function CustomSaleView({ role = "cashier" }: { role?: RoleType }) {
  const tenant = useTenantScope(role);
  const activeShift = useActiveShift(
    { locationId: tenant.locationId ?? undefined, businessId: tenant.businessId ?? undefined },
    tenant.isTenantReady,
  );
  const createOrder = useCreateCustomOrder();

  const operationScope = useMemo(() => ({
    operationType: "custom_sale" as const,
    userId: tenant.userId,
    businessId: tenant.businessId,
    locationId: tenant.locationId,
  }), [tenant.userId, tenant.businessId, tenant.locationId]);

  const pendingInitial = useMemo(() => {
    try {
      return financialOperations.getPendingOperation<CustomSaleSnapshot>({
        operationType: "custom_sale",
        userId: tenant.userId,
        businessId: tenant.businessId,
        locationId: tenant.locationId,
      });
    } catch {
      return null;
    }
  }, [tenant.userId, tenant.businessId, tenant.locationId]);

  const offline = useOffline();
  const durable = useDurableCustomSale(offline.scope);
  const { lines, customer, paymentMethod, tendered } = durable.data;
  const setLines = (change: SetStateAction<CustomSaleLineForm[]>) => durable.update(current => ({ ...current, lines: typeof change === "function" ? change(current.lines) : change }));
  const setCustomer = (change: SetStateAction<typeof customer>) => durable.update(current => ({ ...current, customer: typeof change === "function" ? change(current.customer) : change }));
  const setPaymentMethod = (value: PaymentMethod) => durable.update(current => ({ ...current, paymentMethod: value }));
  const setTendered = (value: string) => durable.update(current => ({ ...current, tendered: value }));
  const [receipt, setReceipt] = useState<ReceiptViewModel | null>(null);

  const [outcomeUnknownState, setOutcomeUnknown] = useState(() => {
    return Boolean(pendingInitial && (pendingInitial.outcome === "unknown" || pendingInitial.outcome === "pending"));
  });
  const [hasSnapshotState, setHasSnapshot] = useState(() => {
    return Boolean(pendingInitial?.payloadSnapshot?.lines && pendingInitial.payloadSnapshot.lines.length > 0);
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);
  const outcomeUnknown = outcomeUnknownState || durable.legacyPending;
  const hasSnapshot = hasSnapshotState || durable.legacySnapshot;

  const currentScopeKey = `${tenant.userId}:${tenant.businessId}:${tenant.locationId}`;
  const scopeRef = useRef(currentScopeKey);
  useEffect(() => { scopeRef.current = currentScopeKey; }, [currentScopeKey]);
  const [lastScope, setLastScope] = useState(currentScopeKey);
  if (lastScope !== currentScopeKey) {
    setLastScope(currentScopeKey);
    setReceipt(null);
    setOutcomeUnknown(Boolean(pendingInitial && (pendingInitial.outcome === "pending" || pendingInitial.outcome === "unknown")));
    setHasSnapshot(Boolean(pendingInitial?.payloadSnapshot?.lines?.length));
  }

  const total = useMemo(() => {
    return lines.reduce((sum, line) => {
      const price = typeof line.unitPrice === "number" ? line.unitPrice : Number(line.unitPrice);
      const safePrice = Number.isFinite(price) && price >= 0 ? price : 0;
      return sum + safePrice * Math.max(1, line.quantity);
    }, 0);
  }, [lines]);

  const isCashPayment = paymentMethod === "COD";
  const trimmedTendered = tendered.trim();
  const parsedTendered = trimmedTendered !== "" && /^\d+$/.test(trimmedTendered) ? Number(trimmedTendered) : NaN;
  const isCashValid = !isCashPayment || (Number.isSafeInteger(parsedTendered) && parsedTendered >= total);
  const tenderedAmount = isCashPayment
    ? (Number.isSafeInteger(parsedTendered) ? parsedTendered : 0)
    : total;

  if (tenant.isAdmin && !tenant.isTenantReady) return <TenantRequiredState />;

  const updateLine = (id: string, patch: Partial<CustomSaleLineForm>) => {
    if (outcomeUnknown || isSubmitting) return;
    setLines((current) => current.map((line) => line.id === id ? { ...line, ...patch } : line));
  };

  const handleResetUnknownTicket = async () => {
    if (isSubmittingRef.current || !offline.scope) return;
    const checkingScope = currentScopeKey;
    isSubmittingRef.current = true; setIsSubmitting(true);
    try {
      const operation = financialOperations.getPendingOperation(operationScope);
      if (!operation) throw new Error("The original purchase identity is unavailable. Keep the ticket for administrator recovery; do not create a replacement sale.");
      let recovered: ReceiptViewModel;
      if ((operation.deliveryProtocol ?? "LEGACY_HTTP") === "LOCAL_FIRST_V2") {
        const saved = await readSaleReceipt(offlineDb, offline.scope, operation.key);
        if (!saved) throw new Error("No readable saved receipt was found. Keep the original purchase identity for administrator recovery.");
        const outbox = await offlineDb.outbox.get(operation.key);
        recovered = mapOrderToReceipt({ ...(saved.mapping?.order ?? saved.receipt.order), clientOrderId: operation.key, localStatus: saved.mapping ? "SYNCED" : outbox?.state === "NEEDS_REVIEW" ? "NEEDS_REVIEW" : "PENDING" });
        if (scopeRef.current !== checkingScope) return;
        await durable.afterCheckout();
      } else {
        const result = await readLegacyCheckoutStatus(operation);
        if (scopeRef.current !== checkingScope) return;
        if (result.status !== "CONFIRMED") {
          toast.warning(result.status === "NOT_FOUND" ? "The server has no conclusive record for this key. This does not prove the sale failed. Keep the same identity for administrator review." : "The original result is still uncertain. Keep this ticket and retry only the exact original request."); return;
        }
        recovered = mapOrderToReceipt(result.order);
        await durable.afterCheckout(operation.key);
      }
      financialOperations.recordOutcome(operationScope, "success");
      if (scopeRef.current !== checkingScope) return;
      setReceipt(recovered); setOutcomeUnknown(false); setHasSnapshot(false);
      toast.success("Saved receipt recovered. No new sale was submitted.");
    } catch (cause) {
      if (scopeRef.current === checkingScope) toast.error(cause instanceof Error ? cause.message : "Recovery did not finish. The original identity has been kept.");
    } finally { isSubmittingRef.current = false; setIsSubmitting(false); }
  };

  const submit = async () => {
    if (isSubmittingRef.current || createOrder.isPending) return;
    if (!durable.ready) { toast.error(durable.error || "Wait for the saved custom cart to load."); return; }
    const submittedScope = currentScopeKey;
    isSubmittingRef.current = true;
    setIsSubmitting(true);

    try {
      let pending: ScopedFinancialOperation<CustomSaleSnapshot> | null = null;
      try {
        pending = financialOperations.getPendingOperation<CustomSaleSnapshot>(operationScope);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Unreadable financial operation in storage.");
        return;
      }

      let payloadToHash: {
        businessId?: string;
        locationId?: string;
        shiftId?: string | null;
        customerName: string;
        customerPhone?: string;
        paymentMethod: PaymentMethod;
        tenderedAmount?: number;
        lines: Array<{
          productName: string;
          variantName?: string;
          quantity: number;
          unitPrice: number;
        }>;
      };

      if (outcomeUnknown || pending?.outcome === "pending" || pending?.outcome === "unknown") {
        const snapshot = pending?.payloadSnapshot;
        if (!snapshot?.lines?.length) {
          toast.error("Original custom sale draft unavailable. Administrator reconciliation required.");
          return;
        }
        if (!snapshot.paymentMethod) {
          toast.error("Original payment method is missing. Administrator reconciliation required.");
          return;
        }
        payloadToHash = {
          businessId: snapshot.businessId,
          locationId: snapshot.locationId,
          shiftId: snapshot.shiftId,
          customerName: snapshot.customerName || "Walk-in Customer",
          customerPhone: snapshot.customerPhone,
          paymentMethod: snapshot.paymentMethod,
          tenderedAmount: snapshot.tenderedAmount,
          lines: snapshot.lines,
        };
      } else {
        if (isCashPayment && !isCashValid) {
          toast.error("Paid cash amount must be entered as a whole BDT number at least equal to the total.");
          return;
        }

        const formattedLines = lines.map((line) => {
          const parsedPrice = typeof line.unitPrice === "number" ? line.unitPrice : Number(line.unitPrice);
          return {
            productName: line.productName.trim(),
            variantName: line.variantName?.trim() || undefined,
            quantity: line.quantity,
            unitPrice: Number.isFinite(parsedPrice) ? parsedPrice : -1,
          };
        });

        if (tenant.isAdmin && (!tenant.businessId || !tenant.locationId)) {
          toast.error("Please select a business and branch location before checkout.");
          return;
        }

        const effectiveCustomerName = customer.customerName.trim() || "Walk-in Customer";
        const effectiveCustomerPhone = customer.customerPhone.trim() || undefined;

        payloadToHash = {
          businessId: tenant.isAdmin ? tenant.businessId : undefined,
          locationId: tenant.isAdmin ? tenant.locationId : undefined,
          shiftId: activeShift.data?.id ?? null,
          customerName: effectiveCustomerName,
          customerPhone: effectiveCustomerPhone,
          paymentMethod,
          tenderedAmount,
          lines: formattedLines,
        };
      }

      let prepared;
      try {
        prepared = prepareFinancialOperation(operationScope, payloadToHash, (validationKey) => {
          const validation = customOrderSchema.safeParse({
            ...payloadToHash,
            idempotencyKey: validationKey,
          });
          if (!validation.success) {
            throw new Error(validation.error.issues[0]?.message || "Invalid order inputs. Please check quantities and prices.");
          }
          if (!validation.data.paymentMethod) throw new Error("Valid payment method required.");
          return { ...validation.data, paymentMethod: validation.data.paymentMethod };
        }, pending && (pending.outcome === "pending" || pending.outcome === "unknown") ? pending.deliveryProtocol ?? "LEGACY_HTTP" : "LOCAL_FIRST_V2");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Uncertain transaction pending.");
        return;
      }
      const validated = prepared.data;
      const effectivePaymentMethod = prepared.data.paymentMethod;

      try {
        const cartRecord = await durable.flush();
        const result = await createOrder.mutateAsync({
          deliveryProtocol: prepared.deliveryProtocol,
          cartKey: cartRecord.key,
          cartRevision: cartRecord.revision,
          businessId: validated.businessId,
          locationId: validated.locationId,
          shiftId: validated.shiftId,
          customerName: validated.customerName,
          customerPhone: validated.customerPhone,
          paymentMethod: effectivePaymentMethod,
          tenderedAmount: validated.tenderedAmount,
          lines: validated.lines,
          idempotencyKey: validated.idempotencyKey,
        });

        // Keep the original retry key until the matching cart's durable
        // completion/recovery has succeeded. Printing is a later concern.
        if (scopeRef.current !== submittedScope) return;
        await durable.afterCheckout(prepared.deliveryProtocol === "LEGACY_HTTP" ? validated.idempotencyKey : undefined);
        financialOperations.recordOutcome(operationScope, "success");
        setOutcomeUnknown(false);
        setHasSnapshot(false);

        // Safe receipt mapping and rendering: receipt errors must NEVER invalidate sale or trigger repeat POST
        try {
          const receiptVm = mapOrderToReceipt(result, tenant.activeBusiness?.name, tenant.activeBranch?.name);
          if (!receiptVm.customerName) {
            receiptVm.customerName = payloadToHash.customerName;
          }
          setReceipt(receiptVm);
          toast.success(result.localStatus === "PENDING" ? "Sale saved on this device. Server confirmation is pending." : "Custom sale confirmed by the server.");
        } catch {
          const fallbackReceipt: ReceiptViewModel = {
            orderId: result?.id,
            localStatus: result.localStatus,
            clientOrderId: result.clientOrderId,
            invoiceNumber: result?.receiptNumber ?? result?.invoiceNumber ?? result?.id,
            customerName: payloadToHash.customerName,
            customerPhone: payloadToHash.customerPhone,
            items: (payloadToHash.lines || []).map((line, idx) => ({
              id: `custom-item-${idx}`,
              name: `${line.productName}${line.variantName ? ` · ${line.variantName}` : ""}`,
              quantity: line.quantity,
              unitPrice: line.unitPrice,
              subtotal: line.quantity * line.unitPrice,
            })),
            ...fallbackReceiptAmounts(payloadToHash.lines, payloadToHash.tenderedAmount),
            paymentMethod: payloadToHash.paymentMethod,
            createdAt: new Date().toISOString(),
            saleAt: null,
            timeSource: "unavailable",
            businessName: tenant.activeBusiness?.name,
            locationName: tenant.activeBranch?.name,
          };
          setReceipt(fallbackReceipt);
          toast.warning("Sale saved. Receipt formatting encountered an issue; reprint its saved record from Order History.");
        }
      } catch (error) {
        if (scopeRef.current !== submittedScope) return;
        if (prepared.deliveryProtocol === "LOCAL_FIRST_V2") {
          const saved = await localCommitStatus(offlineDb, validated.idempotencyKey, error);
          if (saved === "NOT_SAVED") {
            financialOperations.recordOutcome(operationScope, "failed");
            setOutcomeUnknown(false);
            toast.error(error instanceof Error ? error.message : "Sale was not saved. The custom cart has been kept.");
          } else {
            setOutcomeUnknown(true); setHasSnapshot(true);
            toast.warning("Keep this original sale ID. Check the saved receipt before collecting payment again.");
          }
          return;
        }
        if (financialFailureOutcome(error, prepared.isRetry) === "unknown") {
          setOutcomeUnknown(true);
          setHasSnapshot(true);
          financialOperations.recordOutcome(operationScope, "unknown");
          toast.error("The server result is unknown. Keep this draft unchanged and retry with the same operation key.");
        } else {
          financialOperations.recordOutcome(operationScope, "failed");
          toast.error(error instanceof Error ? error.message : "Custom sale failed. The draft was preserved.");
        }
      }
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {durable.error ? <p role="alert" className="rounded border border-red-200 bg-red-50 p-3 text-red-800">{durable.error} Keep this page open; checkout is paused.</p> : null}
      <PageHeader title={tenant.isAdmin ? "Direct Custom Sale (Admin Desk)" : "Direct Custom Sale"} actions={tenant.isAdmin ? <Link href="/admin/select-business" className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium"><Store className="h-4 w-4 text-[#0052FF]" />{tenant.activeBranch?.name}<span className="text-[#0052FF]">Switch</span></Link> : undefined} />
      {outcomeUnknown ? (
        <div role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="font-semibold">Sale result unknown (network timeout/server error).</span>{" "}
            {hasSnapshot ? (
              <span>Draft is locked; retry sends identical key. Check{" "}</span>
            ) : (
              <span className="text-rose-700 font-medium">Previous custom sale state not restored. Check{" "}</span>
            )}
            <a
              href={tenant.isAdmin ? "/admin/orders" : "/pos/orders"}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold underline text-amber-900 hover:text-amber-950"
            >
              Order History
            </a>{" "}
            <span>{hasSnapshot ? "for reference; keep the original operation until confirmed." : "for reference; do not start a replacement sale until reconciled."}</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {hasSnapshot ? (
              <button
                type="button"
                onClick={() => void submit()}
                className="rounded bg-amber-600 px-2 py-0.5 text-xs font-semibold text-white hover:bg-amber-700 cursor-pointer"
              >
                Retry exact draft
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => void handleResetUnknownTicket()}
              className="rounded border border-amber-300 bg-white px-2 py-0.5 text-xs font-semibold text-amber-900 hover:bg-amber-100 cursor-pointer"
            >
              Check saved result
            </button>
          </div>
        </div>
      ) : null}
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-4">{lines.map((line, index) => <Card key={line.id} className="border-slate-200 p-4 shadow-xs"><div className="mb-4 flex items-center justify-between"><div><p className="text-sm font-semibold text-[#070B28]">Item {index + 1}</p><p className="text-xs text-slate-500">Free-form line; it does not create a catalog item or change stock.</p></div><Button variant="ghost" size="icon" disabled={!durable.ready || lines.length === 1 || outcomeUnknown || isSubmitting} onClick={() => { if (outcomeUnknown || isSubmitting) return; setLines((current) => current.filter((item) => item.id !== line.id)); }} aria-label={`Remove item ${index + 1}`}><Trash2 className="h-4 w-4 text-rose-500" /></Button></div><div className="grid gap-4 md:grid-cols-2">
          <Field label="Product or service name *"><Input disabled={!durable.ready || outcomeUnknown || isSubmitting} value={line.productName} onChange={(event) => updateLine(line.id, { productName: event.target.value })} /></Field>
          <Field label="Variant or style (optional)"><Input disabled={!durable.ready || outcomeUnknown || isSubmitting} value={line.variantName ?? ""} onChange={(event) => updateLine(line.id, { variantName: event.target.value })} /></Field>
          <Field label="Unit price (BDT) *"><Input disabled={!durable.ready || outcomeUnknown || isSubmitting} type="number" inputMode="numeric" min="0" step="1" value={line.unitPrice} onChange={(event) => updateLine(line.id, { unitPrice: event.target.value === "" ? "" : Number(event.target.value) })} /></Field>
          <Field label="Quantity *"><div className="flex items-center gap-2"><Button type="button" variant="outline" size="icon" disabled={!durable.ready || outcomeUnknown || isSubmitting} onClick={() => updateLine(line.id, { quantity: Math.max(1, line.quantity - 1) })}><Minus className="h-4 w-4" /></Button><Input disabled={!durable.ready || outcomeUnknown || isSubmitting} type="number" min="1" step="1" value={line.quantity} onChange={(event) => updateLine(line.id, { quantity: Math.max(1, Number.parseInt(event.target.value, 10) || 1) })} className="text-center" /><Button type="button" variant="outline" size="icon" disabled={!durable.ready || outcomeUnknown || isSubmitting} onClick={() => updateLine(line.id, { quantity: line.quantity + 1 })}><Plus className="h-4 w-4" /></Button></div></Field>
        </div><div className="mt-4 text-right text-sm text-slate-500">Line total <span className="ml-2 font-mono font-semibold text-[#070B28]">{formatBDT((Number.isFinite(Number(line.unitPrice)) && Number(line.unitPrice) >= 0 ? Number(line.unitPrice) : 0) * line.quantity)}</span></div></Card>)}<Button variant="outline" disabled={!durable.ready || outcomeUnknown || isSubmitting} onClick={() => { if (outcomeUnknown || isSubmitting) return; setLines((current) => [...current, newLine()]); }}><Plus className="mr-2 h-4 w-4" />Add another item</Button></div>

        <Card className="h-fit border-slate-200 p-5 shadow-xs xl:sticky xl:top-0">
          <h2 className="font-semibold text-[#070B28]">Customer & payment</h2>
          <div className="mt-4 space-y-4">
            <Field label="Customer name (optional)">
              <Input
                name="custom-customer-name"
                autoComplete="off"
                data-lpignore="true"
                disabled={!durable.ready || outcomeUnknown || isSubmitting}
                value={customer.customerName}
                onChange={(event) => {
                  if (outcomeUnknown || isSubmitting) return;
                  setCustomer((value) => ({ ...value, customerName: event.target.value }));
                }}
              />
            </Field>
            <Field label="Customer phone (optional)">
              <Input
                name="custom-customer-phone"
                autoComplete="off"
                data-lpignore="true"
                disabled={!durable.ready || outcomeUnknown || isSubmitting}
                type="tel"
                value={customer.customerPhone}
                onChange={(event) => {
                  if (outcomeUnknown || isSubmitting) return;
                  setCustomer((value) => ({ ...value, customerPhone: event.target.value }));
                }}
              />
            </Field>
            <Field label="Payment method">
              <Select
                disabled={!durable.ready || outcomeUnknown || isSubmitting}
                value={paymentMethod}
                onValueChange={(value) => {
                  if (outcomeUnknown || isSubmitting) return;
                  setPaymentMethod(value as PaymentMethod);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHOD_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            {isCashPayment ? (
              <Field label="Paid amount (BDT)">
                <div className="flex gap-2">
                  <Input
                    disabled={!durable.ready || outcomeUnknown || isSubmitting}
                    type="number"
                    min={total}
                    step="1"
                    placeholder={`Min ${total}`}
                    value={tendered}
                    onChange={(event) => {
                      if (outcomeUnknown || isSubmitting) return;
                      setTendered(event.target.value);
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!durable.ready || outcomeUnknown || isSubmitting}
                    onClick={() => {
                      if (outcomeUnknown || isSubmitting) return;
                      setTendered(String(total));
                    }}
                    className="shrink-0 text-xs font-medium text-[#0052FF]"
                  >
                    Exact
                  </Button>
                </div>
              </Field>
            ) : null}
          </div>
          <div className="my-5 flex items-center justify-between border-y border-slate-200 py-4">
            <span className="font-medium text-slate-600">Total</span>
            <span className="font-mono text-xl font-bold text-[#0052FF]">{formatBDT(total)}</span>
          </div>
          <p className="mb-3 text-[11px] text-slate-500">
            {activeShift.lastKnown ? (activeShift.data ? "The last known shift will be attached. Its current server state will be checked during sync." : activeShift.known ? "No shift was open at the last server check. Shift remains optional." : "No saved shift was found. This sale will explicitly have no shift.") : activeShift.data ? "The current active shift will be attached." : "Shift is optional; checkout remains available."}
            {activeShift.cacheError ? <span className="block text-amber-700">{activeShift.cacheError}</span> : null}
          </p>
          <Button
            className="w-full bg-[#0052FF] text-white hover:bg-[#0047E0]"
            disabled={!durable.ready || isSubmitting || createOrder.isPending || (outcomeUnknown ? !hasSnapshot : (!lines.length || (isCashPayment && !isCashValid)))}
            loading={isSubmitting || createOrder.isPending}
            onClick={() => void submit()}
          >
            <ReceiptText className="mr-2 h-4 w-4" />
            {outcomeUnknown ? (hasSnapshot ? "Retry same sale" : "Uncertain state — Recovery required") : "Complete sale"}
          </Button>
        </Card>
      </div>

      <ReceiptDialog receipt={receipt} open={receipt !== null} onOpenChange={(open) => !open && setReceipt(null)} />
    </div>
  );
}

