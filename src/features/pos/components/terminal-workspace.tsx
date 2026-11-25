"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Clock, Loader2, Minus, Pause, Play, Plus, Search, ShoppingBag, Store, Trash2, User, UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import { DataState, TenantRequiredState } from "@/components/common/data-state";
import { VariantImageCarousel } from "@/components/common/variant-image-carousel";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCatalogCheckout, useRegisterCatalog } from "@/features/pos/api/use-pos";
import { useDurableRegister } from "@/features/pos/hooks/use-durable-register";
import { useOffline } from "@/features/offline/ui/offline-provider";
import { findLocalVariant } from "@/features/offline/services/catalog";
import { offlineDb } from "@/features/offline/db/offline-db";
import { localCommitStatus } from "@/features/pos/utils/local-commit-status";
import { fallbackReceiptAmounts } from "@/features/pos/utils/fallback-receipt-amounts";
import { readLegacyCheckoutStatus } from "@/features/offline/services/legacy-status";
import { readSaleReceipt } from "@/features/offline/core/checkout";
import { ReceiptDialog } from "@/features/pos/components/receipt-dialog";
import { mapOrderToReceipt, selectOrderSaleTime, type CartLine, type ReceiptViewModel, type SavedDraft } from "@/features/pos/view-models";
import { mapVariantToRegisterItem, type RegisterCatalogItem } from "@/features/catalog/view-models";
import { useActiveShift } from "@/features/shifts/api/use-shifts";
import { useTenantScope, type RoleType } from "@/features/tenant/hooks/use-tenant-scope";
import { useBarcodeScanner } from "@/hooks/use-barcode-scanner";
import { apiClient } from "@/lib/api-client";
import { prepareFinancialOperation } from "@/lib/prepare-financial-operation";
import { financialFailureOutcome, isInitialPriceRejection } from "@/lib/financial-failure";
import { financialOperations, type ScopedFinancialOperation } from "@/lib/financial-operation";
import { PAYMENT_METHOD_OPTIONS } from "@/lib/payment-methods";
import { cn, formatBDT } from "@/lib/utils";
import { formatBusinessTime } from "@/lib/business-time";
import { catalogCheckoutSchema } from "@/lib/validations";
import type { PaymentMethod, Variant } from "@/types/domain";

export interface TerminalWorkspaceProps {
  role?: RoleType;
}

function hasUnfinishedCheckout(userId?: string | null, businessId?: string | null, locationId?: string | null) {
  try {
    const pending = financialOperations.getPendingOperation({ operationType: "catalog_sale", userId, businessId, locationId });
    return Boolean(pending && (pending.outcome === "pending" || pending.outcome === "unknown"));
  } catch { return true; }
}

export function TerminalWorkspace({ role = "cashier" }: TerminalWorkspaceProps) {
  const tenant = useTenantScope(role);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryId, setCategoryId] = useState("ALL");
  const offline = useOffline();
  const localScope = offline.scope && offline.scope.userId === tenant.userId &&
    offline.scope.businessId === tenant.businessId && offline.scope.locationId === tenant.locationId ? offline.scope : null;
  const register = useDurableRegister(localScope);
  const { lines: cart, customerName, customerPhone, showCustomerInput, paymentMethod } = register.data;
  const currentDrafts = register.held;
  const registerRecoveryRequired = Boolean(register.error);
  const setCart = (next: CartLine[] | ((current: CartLine[]) => CartLine[])) => register.update(current => ({
    ...current, lines: typeof next === "function" ? next(current.lines) : next,
  }));
  const setCustomerName = (value: string) => register.update(current => ({ ...current, customerName: value }));
  const setCustomerPhone = (value: string) => register.update(current => ({ ...current, customerPhone: value }));
  const setShowCustomerInput = (value: boolean) => register.update(current => ({ ...current, showCustomerInput: value }));
  const setPaymentMethod = (value: PaymentMethod) => register.update(current => ({ ...current, paymentMethod: value }));
  const [activeRightTab, setActiveRightTab] = useState<"cart" | "drafts">("cart");
  const [receipt, setReceipt] = useState<ReceiptViewModel | null>(null);
  const [reportedOutcomeUnknown, setOutcomeUnknown] = useState(() => hasUnfinishedCheckout(tenant.userId, tenant.businessId, tenant.locationId));
  const outcomeUnknown = reportedOutcomeUnknown || register.legacyPending;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);
  const scopeKey = `${tenant.userId}:${tenant.businessId}:${tenant.locationId}`;
  const currentScopeRef = useRef(scopeKey);
  useLayoutEffect(() => { currentScopeRef.current = scopeKey; }, [scopeKey]);
  const mutationsLocked = outcomeUnknown || isSubmitting || register.busy || !register.ready;
  const [previousScope, setPreviousScope] = useState(scopeKey);
  if (previousScope !== scopeKey) {
    setPreviousScope(scopeKey);
    setReceipt(null);
    setOutcomeUnknown(hasUnfinishedCheckout(tenant.userId, tenant.businessId, tenant.locationId));
  }

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Debounce search input to avoid overwhelming backend while user types
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 250);
    return () => clearTimeout(handler);
  }, [search]);

  // Load 30 variants per batch with server-side infinite scroll pagination
  const catalog = useRegisterCatalog(
    {
      ...tenant.tenantParams,
      search: debouncedSearch,
      categoryId,
      limit: 30,
    },
    tenant.isTenantReady,
  );
  const activeShift = useActiveShift(
    { locationId: tenant.locationId ?? undefined, businessId: tenant.businessId ?? undefined },
    tenant.isTenantReady,
  );
  const checkout = useCatalogCheckout();

  // Scroll to top when switching category or search
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [categoryId, debouncedSearch]);

  const { hasNextPage, isFetchingNextPage, fetchNextPage } = catalog;

  // Infinite scroll observer: trigger fetchNextPage when bottom sentinel enters view
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          if (hasNextPage && !isFetchingNextPage) {
            void fetchNextPage();
          }
        }
      },
      {
        root: scrollContainerRef.current,
        rootMargin: "250px",
        threshold: 0.05,
      },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Instant in-memory filter over loaded items while debounce settles
  const displayedVariants = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return catalog.variants;
    return catalog.variants.filter((variant) => {
      return (
        variant.name.toLowerCase().includes(term) ||
        (variant.variantName && variant.variantName.toLowerCase().includes(term)) ||
        variant.sku.toLowerCase().includes(term) ||
        (variant.barcode && variant.barcode.toLowerCase().includes(term)) ||
        variant.categoryName.toLowerCase().includes(term)
      );
    });
  }, [catalog.variants, search]);

  const subtotal = cart.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
  const cartItemCount = cart.reduce((sum, line) => sum + line.quantity, 0);

  const addVariantToCart = (item: RegisterCatalogItem) => {
    if (mutationsLocked || isSubmittingRef.current) return;
    setCart((current) => {
      const existing = current.find((l) => l.variantId === item.variantId);
      if (existing) {
        return current.map((l) =>
          l.variantId === item.variantId ? { ...l, quantity: l.quantity + 1 } : l,
        );
      }
      return [
        ...current,
        {
          variantId: item.variantId,
          name: `${item.name}${item.variantName ? ` · ${item.variantName}` : ""}`,
          sku: item.sku,
          unitPrice: item.unitPrice,
          quantity: 1,
          stock: item.stock ?? 0,
        },
      ];
    });
  };

  // Hardware Barcode Scanner integration with loaded match and server search fallback
  useBarcodeScanner(async (barcode) => {
    if (mutationsLocked || isSubmittingRef.current) return;
    const scanScope = scopeKey;
    const scanned = barcode.trim().toLowerCase();
    let match = catalog.variants.find(
      (v) => (v.barcode && v.barcode.toLowerCase() === scanned) || v.sku.toLowerCase() === scanned,
    );

    if (!match) {
      try {
        let found = localScope ? await findLocalVariant(localScope, scanned) : undefined;
        if (!found && offline.mode === "ONLINE") {
          const res = await apiClient.get<Variant[]>("/catalog/variants", {
            params: { ...tenant.tenantParams, search: scanned, limit: 5 },
          });
          found = (res.data ?? []).find((v) => (v.barcode && v.barcode.toLowerCase() === scanned) || v.sku.toLowerCase() === scanned);
        }
        if (found) {
          match = mapVariantToRegisterItem(found, [], catalog.categories);
        }
      } catch {
        // Fall through to error toast
      }
    }

    if (currentScopeRef.current !== scanScope || isSubmittingRef.current) return;

    if (match) {
      addVariantToCart(match);
      toast.success(`Scanned: ${match.name}`);
      return;
    }
    toast.error(`No item found for barcode: ${barcode}`);
  }, !mutationsLocked);

  if (tenant.isAdmin && !tenant.isTenantReady) {
    return (
      <div className="p-6">
        <TenantRequiredState />
      </div>
    );
  }

  const updateQuantity = (variantId: string, quantity: number) => {
    if (mutationsLocked || isSubmittingRef.current) return;
    setCart((current) =>
      quantity <= 0
        ? current.filter((line) => line.variantId !== variantId)
        : current.map((line) =>
            line.variantId === variantId ? { ...line, quantity } : line,
          ),
    );
  };

  const holdDraft = async () => {
    if (!cart.length || mutationsLocked || isSubmittingRef.current) return;
    const draftNumber = currentDrafts.length + 1;
    const label = customerName.trim() ? `Draft #${draftNumber} · ${customerName.trim()}` : `Draft #${draftNumber}`;
    try {
      await register.hold(label);
      toast.success(`Draft #${draftNumber} saved (${draftNumber}/5).`);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Draft could not be saved. Your cart has been kept."); }
  };

  const continueDraft = async (draft: SavedDraft) => {
    if (mutationsLocked || isSubmittingRef.current) return;
    try {
      await register.resume(draft.id);
      setActiveRightTab("cart");
      toast.success(`Resumed ${draft.label}. Ready to complete sale!`);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Draft could not be resumed."); }
  };

  const discardDraft = async (draftId: string, label: string) => {
    if (mutationsLocked || isSubmittingRef.current) return;
    try {
      await register.discard(draftId);
      toast.info(`${label} discarded.`);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Draft could not be discarded."); }
  };

  const handleResetUnknownTicket = async () => {
    if (isSubmittingRef.current || register.busy || !localScope) return;
    const checkingScope = scopeKey;
    const operationScope = { operationType: "catalog_sale" as const, userId: tenant.userId, businessId: tenant.businessId, locationId: tenant.locationId };
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    try {
      const operation = financialOperations.getPendingOperation(operationScope);
      if (!operation) throw new Error("The original purchase identity is unavailable. Administrator recovery is required; do not create a replacement sale.");
      let recoveredReceipt: ReceiptViewModel;
      if ((operation.deliveryProtocol ?? "LEGACY_HTTP") === "LOCAL_FIRST_V2") {
        const saved = await readSaleReceipt(offlineDb, localScope, operation.key);
        if (!saved) throw new Error("No readable saved receipt was found. The original purchase identity has been kept for administrator recovery.");
        const outbox = await offlineDb.outbox.get(operation.key);
        recoveredReceipt = mapOrderToReceipt({ ...(saved.mapping?.order ?? saved.receipt.order), clientOrderId: operation.key,
          localStatus: saved.mapping ? "SYNCED" : outbox?.state === "NEEDS_REVIEW" ? "NEEDS_REVIEW" : "PENDING" });
        if (currentScopeRef.current !== checkingScope) return;
        await register.refreshAfterCheckout();
      } else {
        const status = await readLegacyCheckoutStatus(operation);
        if (currentScopeRef.current !== checkingScope) return;
        if (status.status !== "CONFIRMED") {
          toast.warning(status.status === "NOT_FOUND"
            ? "The server has no conclusive record for this key. This does not prove the sale failed. Keep the same identity and ask an administrator to review it."
            : "The server still cannot confirm the original result. Keep the ticket locked and retry only the exact original request.");
          return;
        }
        recoveredReceipt = mapOrderToReceipt(status.order);
        // Persist confirmation before releasing the legacy session key. Failure
        // keeps the identity and cart locked; this action never sends a sale POST.
        await register.confirmLegacyCheckout(operation.key);
      }
      financialOperations.recordOutcome(operationScope, "success");
      if (currentScopeRef.current !== checkingScope) return;
      setReceipt(recoveredReceipt);
      setOutcomeUnknown(false);
      toast.success("Saved receipt recovered. No new sale was submitted.");
    } catch (error) {
      if (currentScopeRef.current === checkingScope) toast.error(error instanceof Error ? error.message : "Recovery could not finish. The original purchase identity has been kept.");
    } finally { isSubmittingRef.current = false; setIsSubmitting(false); }
  };

  const completeSale = async () => {
    if (isSubmittingRef.current || checkout.isPending || register.busy) return;
    if (registerRecoveryRequired) { toast.error("Register storage recovery is required before checkout."); return; }
    const submittingScope = scopeKey;
    isSubmittingRef.current = true;
    setIsSubmitting(true);

    try {
      const operationScope = {
        operationType: "catalog_sale" as const,
        userId: tenant.userId,
        businessId: tenant.businessId,
        locationId: tenant.locationId,
      };

      let pendingOp: ScopedFinancialOperation<{
        businessId?: string;
        locationId?: string;
        shiftId?: string | null;
        tenderedAmount: number;
        paymentMethod: PaymentMethod;
        customerName: string;
        customerPhone?: string;
        lines: Array<{
          variantId: string;
          quantity: number;
          unitPrice: number;
        }>;
      }> | null = null;

      try {
        pendingOp = financialOperations.getPendingOperation(operationScope);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Unreadable financial operation in storage.");
        return;
      }

      const deliveryProtocol = pendingOp ? pendingOp.deliveryProtocol ?? "LEGACY_HTTP" : "LOCAL_FIRST_V2";
      if (!register.ready || (deliveryProtocol === "LOCAL_FIRST_V2" && !offline.ready)) {
        toast.error(register.error ?? offline.error ?? "Preparing the saved register. Wait until setup is complete.");
        return;
      }
      const savedCart = await register.flush();
      if (currentScopeRef.current !== submittingScope) return;

      let payloadToHash: {
        businessId?: string;
        locationId?: string;
        shiftId?: string | null;
        tenderedAmount: number;
        paymentMethod: PaymentMethod;
        customerName: string;
        customerPhone?: string;
        lines: Array<{
          variantId: string;
          quantity: number;
          unitPrice: number;
        }>;
      };

      if (outcomeUnknown || pendingOp?.outcome === "pending" || pendingOp?.outcome === "unknown") {
        const snapshot = pendingOp?.payloadSnapshot;
        if (!snapshot?.lines?.length) {
          toast.error("Original catalog sale draft unavailable. Administrator reconciliation required.");
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
          tenderedAmount: snapshot.tenderedAmount,
          paymentMethod: snapshot.paymentMethod,
          customerName: snapshot.customerName || "Walk-in Customer",
          customerPhone: snapshot.customerPhone,
          lines: snapshot.lines,
        };
      } else {
        if (!cart.length) return;
        const finalTenderedAmount = subtotal;

        if (tenant.isAdmin && (!tenant.businessId || !tenant.locationId)) {
          toast.error("Please select a business and branch location before checkout.");
          return;
        }

        const effectiveCustomerName = customerName.trim() || "Walk-in Customer";
        const effectiveCustomerPhone = customerPhone.trim() || undefined;

        payloadToHash = {
          businessId: tenant.isAdmin ? tenant.businessId : undefined,
          locationId: tenant.isAdmin ? tenant.locationId : undefined,
          shiftId: activeShift.data?.id ?? null,
          tenderedAmount: finalTenderedAmount,
          paymentMethod,
          customerName: effectiveCustomerName,
          customerPhone: effectiveCustomerPhone,
          lines: cart.map((line) => ({
            variantId: line.variantId,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
          })),
        };
      }

      let prepared;
      try {
        prepared = prepareFinancialOperation(operationScope, payloadToHash, (validationKey) => {
          const validation = catalogCheckoutSchema.safeParse({
            ...payloadToHash,
            idempotencyKey: validationKey,
          });
          if (!validation.success) {
            throw new Error(validation.error.issues[0]?.message || "Checkout form invalid");
          }
          if (!validation.data.paymentMethod) throw new Error("Valid payment method required.");
          return { ...validation.data, paymentMethod: validation.data.paymentMethod };
        }, deliveryProtocol);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Uncertain transaction pending.");
        return;
      }
      const validated = prepared.data;
      const effectivePaymentMethod = prepared.data.paymentMethod;

      try {
        const order = await checkout.mutateAsync({
          businessId: validated.businessId,
          locationId: validated.locationId,
          shiftId: validated.shiftId,
          tenderedAmount: validated.tenderedAmount,
          paymentMethod: effectivePaymentMethod,
          customerName: validated.customerName,
          customerPhone: validated.customerPhone,
          lines: validated.lines,
          idempotencyKey: validated.idempotencyKey,
          deliveryProtocol,
          cartKey: savedCart.key,
          cartRevision: savedCart.revision,
        });

        // The local writer has committed the sale and finalized the IDB cart.
        // Legacy retries only close that imported cart after real HTTP success.
        // Receipt printing is a separate operation and cannot post another sale.
        if (deliveryProtocol === "LEGACY_HTTP") {
          await register.confirmLegacyCheckout(validated.idempotencyKey);
        }
        financialOperations.recordOutcome(operationScope, "success");
        if (currentScopeRef.current !== submittingScope) return;
        if (deliveryProtocol === "LOCAL_FIRST_V2") {
          try { await register.refreshAfterCheckout(); }
          catch { toast.warning("The sale is saved. The register view needs recovery before the next sale."); }
        }
        setOutcomeUnknown(false);

        // Safe receipt mapping and rendering: receipt errors must NEVER invalidate sale or trigger repeat POST
        try {
          const timeInfo = selectOrderSaleTime({
            occurredAt: order.occurredAt,
            createdAt: order.createdAt,
          });

          const receiptLines = Array.isArray(order.lines) && order.lines.length > 0
            ? order.lines.map((line) => ({
                id: line.id,
                name: `${line.productName ?? "Item"}${line.variantName ? ` · ${line.variantName}` : ""}`,
                quantity: line.quantity ?? 1,
                unitPrice: line.unitPrice ?? 0,
                subtotal: line.subtotal ?? (line.quantity ?? 1) * (line.unitPrice ?? 0),
              }))
            : (payloadToHash.lines || []).map((line) => ({
                id: line.variantId,
                name: "Item",
                quantity: line.quantity,
                unitPrice: line.unitPrice,
                subtotal: line.quantity * line.unitPrice,
              }));

          const nextReceipt: ReceiptViewModel = {
            orderId: order.id,
            invoiceNumber: order.receiptNumber ?? order.invoiceNumber ?? order.id,
            customerName: order.customerName || payloadToHash.customerName,
            customerPhone: order.customerPhone || payloadToHash.customerPhone,
            cashierName: order.cashier?.fullName,
            tenderedAmount: order.tenderedAmount ?? payloadToHash.tenderedAmount,
            changeDue: order.changeDue ?? 0,
            status: order.status ?? "COMPLETED",
            items: receiptLines,
            subtotal: order.subtotal ?? (order.totalAmount ?? 0),
            totalAmount: order.totalAmount ?? 0,
            paymentMethod: order.paymentMethod ?? payloadToHash.paymentMethod,
            occurredAt: order.occurredAt ?? null,
            createdAt: order.createdAt ?? new Date().toISOString(),
            saleAt: timeInfo.saleAt,
            timeSource: timeInfo.source,
            businessName: order.businessName || tenant.activeBusiness?.name,
            locationName: order.locationName || order.branchName || tenant.activeBranch?.name,
            localStatus: order.localStatus,
            clientOrderId: order.clientOrderId,
          };
          setReceipt(nextReceipt);
          if (order.localStatus === "NEEDS_REVIEW") toast.warning("Sale saved on this device. Server review is required.");
          else toast.success(order.localStatus === "PENDING" ? "Sale saved on this device — waiting to sync." : "Catalog sale confirmed by the server.");
        } catch {
          const fallbackReceipt: ReceiptViewModel = {
            orderId: order?.id,
            invoiceNumber: order?.receiptNumber ?? order?.invoiceNumber ?? order?.id,
            customerName: payloadToHash.customerName,
            customerPhone: payloadToHash.customerPhone,
            items: (payloadToHash.lines || []).map((line) => ({
              id: line.variantId,
              name: "Item",
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
            localStatus: order.localStatus,
            clientOrderId: order.clientOrderId,
          };
          setReceipt(fallbackReceipt);
          toast.warning("The sale is saved. Receipt formatting encountered an issue; reprint the saved receipt from Order History.");
        }
      } catch (error) {
        const locallySaved = deliveryProtocol === "LOCAL_FIRST_V2" ? await localCommitStatus(offlineDb, validated.idempotencyKey, error) : "NOT_SAVED";
        if (locallySaved !== "NOT_SAVED") {
          financialOperations.recordOutcome(operationScope, "unknown");
          if (currentScopeRef.current === submittingScope) {
            setOutcomeUnknown(true);
            toast.error("This sale may already be saved. Keep its original identity and recover the saved receipt; do not enter a replacement sale.");
          }
          return;
        }
        if (currentScopeRef.current !== submittingScope) {
          if (deliveryProtocol === "LEGACY_HTTP") financialOperations.recordOutcome(operationScope, "unknown");
          else financialOperations.recordOutcome(operationScope, "failed");
          return;
        }
        if (isInitialPriceRejection(error, deliveryProtocol === "LEGACY_HTTP" && prepared.isRetry)) {
          financialOperations.recordOutcome(operationScope, "failed");
          const errData = error.data as { variantId?: string; currentPrice?: number; submittedPrice?: number } | undefined;
          const changedVariantId = errData?.variantId;
          const currentPrice = errData?.currentPrice != null ? Number(errData.currentPrice) : undefined;
          if (changedVariantId && currentPrice != null && Number.isFinite(currentPrice)) {
            setCart((current) =>
              current.map((line) =>
                line.variantId === changedVariantId
                  ? { ...line, unitPrice: currentPrice, subtotal: line.quantity * currentPrice }
                  : line,
              ),
            );
            void catalog.refetchVariants();
            toast.error(`Price changed: item updated to ${formatBDT(currentPrice)}. Please review and complete sale.`);
          } else {
            void catalog.refetchVariants();
            toast.error(error.message || "Product price changed. Please refresh your cart.");
          }
        } else if (deliveryProtocol === "LOCAL_FIRST_V2") {
          // The local-first hook returns saved orders even if later sync fails.
          // A thrown error here therefore means the local transaction did not
          // commit; retain the cart and allow correction/retry without a lock.
          financialOperations.recordOutcome(operationScope, "failed");
          setOutcomeUnknown(false);
          toast.error(error instanceof Error ? error.message : "Sale could not be saved. Your cart is still here.");
        } else if (financialFailureOutcome(error, prepared.isRetry) === "unknown") {
          setOutcomeUnknown(true);
          financialOperations.recordOutcome(operationScope, "unknown");
          toast.error("The server result is unknown. Keep this ticket unchanged and retry with the same operation key.");
        } else {
          financialOperations.recordOutcome(operationScope, "failed");
          toast.error(error instanceof Error ? error.message : "Checkout failed. The ticket was preserved.");
        }
      }
    } catch (error) {
      if (currentScopeRef.current === submittingScope) toast.error(error instanceof Error ? error.message : "The register could not save this cart.");
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-x-hidden bg-white lg:flex-row">
      <section className="flex min-h-0 min-w-0 flex-1 flex-col border-b border-slate-200 lg:border-b-0 lg:border-r">
        <PageHeader
          title={tenant.isAdmin ? "Catalog Register (Admin Desk)" : "Catalog Register"}
          className="border-none px-4 pb-2 pt-4"
          actions={
            tenant.isAdmin ? (
              <Link
                href="/admin/select-business"
                className="hidden items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-[#070B28] hover:border-[#0052FF] sm:flex"
              >
                <Store className="h-4 w-4 text-[#0052FF]" />
                {tenant.activeBranch?.name}
                <span className="text-[#0052FF]">Switch</span>
              </Link>
            ) : undefined
          }
        />

        <div className="flex flex-col gap-3 border-b border-slate-200 px-4 pb-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              name="catalog-filter"
              autoComplete="off"
              data-lpignore="true"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search product, variant, SKU, or barcode"
              className="pl-9"
            />
          </div>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger className="w-full sm:w-[220px]">
              <SelectValue placeholder="All categories">
                {categoryId === "ALL"
                  ? "All categories"
                  : (catalog.categories.find((c) => c.id === categoryId)?.name ?? "All categories")}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All categories</SelectItem>
              {catalog.categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Category Pills Filter */}
        <div className="flex gap-2 overflow-x-auto border-b border-slate-100 px-4 py-3">
          {[{ id: "ALL", name: "All" }, ...catalog.categories].map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setCategoryId(category.id)}
              className={cn(
                "min-h-9 whitespace-nowrap rounded-full border px-3 text-xs font-medium transition-colors cursor-pointer",
                categoryId === category.id
                  ? "border-[#0052FF] bg-blue-50 text-[#0052FF]"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
              )}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Variants Quick-Sale Grid */}
        <div
          ref={scrollContainerRef}
          className="min-h-0 flex-1 overflow-y-auto p-4"
        >
          <DataState
            data={displayedVariants}
            isLoading={catalog.isLoading}
            isError={catalog.isError}
            resource="register catalog"
            emptyTitle="No variants match these filters."
            emptyDescription="Try choosing another category or clearing your search filter."
            onRetry={() => void catalog.refetch()}
          >
            {(data) => (
              <>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                  {data.map((variant) => (
                    <article
                      key={variant.variantId}
                      onClick={() => addVariantToCart(variant)}
                      className={cn(
                        "group flex flex-col justify-between overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-xs transition cursor-pointer hover:-translate-y-0.5 hover:border-[#0052FF] hover:shadow-md",
                        (variant.stock ?? 0) <= 0 && "opacity-75 bg-slate-50/60",
                      )}
                    >
                      <div className="relative aspect-[4/3] w-full bg-slate-100 overflow-hidden">
                        <VariantImageCarousel
                          images={variant.images}
                          alt={`${variant.name} - ${variant.variantName || variant.sku}`}
                          size="md"
                          className="h-full w-full"
                          autoPlayInterval={0}
                        />
                        <div className="absolute top-2 left-2 z-10 pointer-events-none">
                          <Badge
                            variant="outline"
                            className="bg-white/95 backdrop-blur-xs text-[10px] shadow-2xs font-normal border-slate-200 text-slate-700"
                          >
                            {variant.categoryName}
                          </Badge>
                        </div>
                      </div>

                      <div className="p-3 flex flex-col flex-1 justify-between gap-2">
                        <div>
                          <p className="line-clamp-1 text-sm font-semibold text-[#070B28]" title={variant.name}>
                            {variant.name}
                          </p>
                          <div className="mt-0.5 flex items-center justify-between text-xs text-slate-500">
                            <span className="font-medium text-slate-700 truncate" title={variant.variantName || variant.sku}>
                              {variant.variantName || "Default"}
                            </span>
                            <span className="font-mono text-[11px] text-slate-400">{variant.sku}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-slate-100 pt-2">
                          <div>
                            <span className="font-mono text-sm font-bold text-[#0052FF]">
                              {formatBDT(variant.unitPrice)}
                            </span>
                            <div className="mt-0.5">
                              {(variant.stock ?? 0) < 0 ? (
                                <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4 border-rose-200 text-rose-700 bg-rose-50 font-mono">
                                  Stock: {variant.stock}
                                </Badge>
                              ) : (variant.stock ?? 0) === 0 ? (
                                <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4 border-amber-200 text-amber-700 bg-amber-50 font-mono">
                                  0 in stock
                                </Badge>
                              ) : (variant.stock ?? 0) <= 5 ? (
                                <Badge variant="pending" className="text-[10px] py-0 px-1.5 h-4">
                                  Low: {variant.stock}
                                </Badge>
                              ) : (
                                <span className="text-[11px] text-slate-400 font-mono">
                                  Stock {variant.stock}
                                </span>
                              )}
                            </div>
                          </div>

                          <Button
                            size="icon"
                            className="h-8 w-8 bg-[#0052FF] hover:bg-[#0047E0] text-white shadow-2xs shrink-0 cursor-pointer"
                            disabled={mutationsLocked}
                            onClick={(e) => {
                              e.stopPropagation();
                              addVariantToCart(variant);
                            }}
                            aria-label={`Add ${variant.name} ${variant.variantName || variant.sku} to cart`}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>

                {/* Infinite Scroll Sentinel & Status */}
                <div ref={sentinelRef} className="py-6 flex flex-col items-center justify-center">
                  {catalog.isFetchingNextPage ? (
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 shadow-2xs rounded-full px-4 py-2">
                      <Loader2 className="h-4 w-4 animate-spin text-[#0052FF]" />
                      <span>Loading more variants...</span>
                    </div>
                  ) : catalog.hasNextPage ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => catalog.fetchNextPage()}
                      className="text-xs text-slate-500 hover:text-[#0052FF] cursor-pointer"
                    >
                      Scroll down to load more
                    </Button>
                  ) : data.length > 0 ? (
                    <div className="text-center py-2">
                      <p className="text-xs text-slate-400 font-medium">
                        All {data.length} {data.length === 1 ? "variant" : "variants"} loaded
                      </p>
                    </div>
                  ) : null}
                </div>
              </>
            )}
          </DataState>
        </div>
      </section>

      {/* Right Aside: Current Draft and Checkout */}
      <aside className="flex max-h-[52vh] min-w-0 w-full shrink-0 flex-col bg-slate-50 lg:max-h-none lg:w-[410px]">
        {/* Top Header with Tab Switcher & Total Drafts Count */}
        <div className="border-b border-slate-200 bg-white px-3.5 py-2.5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-[#070B28] text-sm">
                {activeRightTab === "cart" ? "Current Draft" : "Saved Drafts"}
              </h2>
              {activeRightTab === "cart" ? (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                  {cartItemCount} {cartItemCount === 1 ? "item" : "items"}
                </span>
              ) : (
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-[#0052FF]">
                  {currentDrafts.length}/5 Saved
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={holdDraft}
                disabled={!cart.length || mutationsLocked || currentDrafts.length >= 5}
                aria-label="Hold Draft"
                className="h-7 px-2 text-xs text-slate-600 hover:text-[#0052FF] hover:bg-blue-50 cursor-pointer"
                title={currentDrafts.length >= 5 ? "Draft limit reached (5/5)" : "Hold current draft (Save for later)"}
              >
                <Pause className="mr-1 h-3.5 w-3.5" />
                <span className="hidden sm:inline">Hold</span>
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => {
                  setCart([]);
                  setCustomerName("");
                  setCustomerPhone("");
                }}
                disabled={!cart.length || mutationsLocked}
                aria-label="Clear active draft"
                className="h-7 w-7 text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                title="Clear active draft"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Segmented Control: Active Draft vs Saved Drafts (X/5) */}
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-0.5 text-xs">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => {
                if (isSubmitting) return;
                setActiveRightTab("cart");
              }}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-md py-1 font-semibold transition-all cursor-pointer",
                activeRightTab === "cart"
                  ? "bg-white text-[#070B28] shadow-2xs"
                  : "text-slate-500 hover:text-slate-900",
                isSubmitting && "opacity-50 cursor-not-allowed",
              )}
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              <span>Active Draft</span>
              {cartItemCount > 0 && (
                <span className="ml-0.5 rounded-full bg-blue-600 px-1.5 py-0.2 text-[10px] font-bold text-white leading-none">
                  {cartItemCount}
                </span>
              )}
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => {
                if (isSubmitting) return;
                setActiveRightTab("drafts");
              }}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-md py-1 font-semibold transition-all cursor-pointer",
                activeRightTab === "drafts"
                  ? "bg-white text-[#070B28] shadow-2xs"
                  : "text-slate-500 hover:text-slate-900",
                isSubmitting && "opacity-50 cursor-not-allowed",
              )}
            >
              <Clock className="h-3.5 w-3.5" />
              <span>Saved Drafts</span>
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.2 text-[10px] font-bold leading-none",
                  currentDrafts.length > 0
                    ? "bg-blue-100 text-[#0052FF]"
                    : "bg-slate-200 text-slate-600",
                )}
              >
                {currentDrafts.length}/5
              </span>
            </button>
          </div>
        </div>

        {registerRecoveryRequired ? (
          <div role="alert" className="border-b border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
            {register.error ?? "Register storage recovery required. Keep this page open; checkout and ticket moves are paused."}
          </div>
        ) : null}
        {outcomeUnknown ? (
          <div role="alert" className="border-b border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="font-semibold">Checkout outcome uncertain.</span>{" "}
              <span>Draft is locked; retry sends identical key. Check{" "}</span>
              <a
                href={tenant.isAdmin ? "/admin/orders" : "/pos/orders"}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold underline text-amber-900 hover:text-amber-950"
              >
                Order History
              </a>{" "}
              <span>for reference; keep the original operation until confirmed.</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                disabled={isSubmitting || register.busy}
                onClick={() => void completeSale()}
                className="rounded bg-amber-600 px-2 py-0.5 text-xs font-semibold text-white hover:bg-amber-700 cursor-pointer"
              >
                Retry exact draft
              </button>
              <button
                type="button"
                disabled={isSubmitting || register.busy}
                onClick={() => void handleResetUnknownTicket()}
                className="rounded border border-amber-300 bg-white px-2 py-0.5 text-xs font-semibold text-amber-900 hover:bg-amber-100 cursor-pointer"
              >
                Check saved sale
              </button>
            </div>
          </div>
        ) : null}

        {activeRightTab === "drafts" ? (
          /* SAVED DRAFTS TAB VIEW */
          <div className="min-h-0 flex-1 overflow-y-auto p-3 space-y-2.5 scrollbar-thin">
            {currentDrafts.length ? (
              currentDrafts.map((draft) => (
                <div
                  key={draft.id}
                  className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-2xs transition-all hover:border-blue-300"
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-[#070B28]">
                          {draft.label}
                        </span>
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 font-mono">
                          {formatBusinessTime(draft.createdAt)}
                        </span>
                      </div>
                      {draft.customerName && (
                        <p className="text-[11px] text-slate-500 font-medium">
                          Customer: {draft.customerName}
                        </p>
                      )}
                    </div>
                    <span className="font-mono text-xs font-bold text-[#070B28] bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                      {formatBDT(draft.subtotal ?? 0)}
                    </span>
                  </div>

                  {/* Draft Items Preview */}
                  <div className="my-2 rounded-lg bg-slate-50 p-2 space-y-1">
                    {draft.lines.slice(0, 3).map((l, i) => (
                      <div key={i} className="flex items-center justify-between text-[11px] text-slate-600">
                        <span className="truncate max-w-[200px]">{l.name}</span>
                        <span className="font-mono text-slate-500 shrink-0">x{l.quantity}</span>
                      </div>
                    ))}
                    {draft.lines.length > 3 && (
                      <p className="text-[10px] text-slate-400 font-medium italic">
                        + {draft.lines.length - 3} more items ({draft.itemCount} total)
                      </p>
                    )}
                  </div>

                  {/* Actions: Prominent Continue Button + Discard */}
                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      className="flex-1 bg-[#0052FF] hover:bg-[#0047E0] text-white font-semibold text-xs h-8 cursor-pointer shadow-2xs"
                      onClick={() => continueDraft(draft)}
                      disabled={mutationsLocked}
                    >
                      <Play className="mr-1.5 h-3.5 w-3.5 fill-current" />
                      Continue
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 cursor-pointer"
                      onClick={() => discardDraft(draft.id, draft.label)}
                      disabled={mutationsLocked}
                      title="Discard draft"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex h-full min-h-48 flex-col items-center justify-center text-center text-slate-400 p-4">
                <Clock className="mb-2 h-8 w-8 text-slate-300" />
                <p className="font-medium text-xs text-slate-600">No saved drafts</p>
                <p className="text-[11px] text-slate-400 mt-0.5 max-w-[220px]">
                  Use the Hold button on an active cart to save up to 5 drafts for later.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveRightTab("cart")}
                  className="mt-3 text-xs text-[#0052FF] hover:bg-blue-50 cursor-pointer"
                >
                  Return to Active Draft
                </Button>
              </div>
            )}
          </div>
        ) : (
          /* ACTIVE DRAFT / CART VIEW */
          <>
            {/* Top Prompt Banner if Saved Drafts Exist */}
            {currentDrafts.length > 0 && (
              <div className="flex items-center justify-between border-b border-blue-200/80 bg-blue-50/70 px-3 py-1.5 text-xs text-blue-900">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-[#0052FF]" />
                  <span className="font-medium">
                    {currentDrafts.length} {currentDrafts.length === 1 ? "draft" : "drafts"} saved
                  </span>
                  <span className="text-[11px] text-blue-600 font-mono">({currentDrafts.length}/5)</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveRightTab("drafts")}
                  className="font-bold text-[#0052FF] hover:underline cursor-pointer text-[11px]"
                >
                  View Drafts →
                </button>
              </div>
            )}

            <div className="min-h-0 flex-1 overflow-y-auto p-2.5 space-y-1.5 scrollbar-thin">
              {cart.length ? (
                <div className="space-y-1.5">
                  {cart.map((line) => (
                    <div
                      key={line.variantId}
                      className="rounded-lg border border-slate-200/90 bg-white px-2.5 py-2 shadow-2xs transition-all hover:border-slate-300"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold text-[#070B28]" title={line.name}>
                            {line.name}
                          </p>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                            <span>{line.sku}</span>
                            <span>•</span>
                            <span>{formatBDT(line.unitPrice)}/ea</span>
                          </div>
                        </div>
                        <button
                          disabled={mutationsLocked}
                          onClick={() => updateQuantity(line.variantId, 0)}
                          aria-label={`Remove ${line.name}`}
                          className="text-slate-300 hover:text-rose-500 disabled:opacity-40 cursor-pointer p-0.5 transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="mt-1.5 flex items-center justify-between">
                        <div className="flex items-center rounded-md border border-slate-200 bg-slate-50/50 p-0.5">
                          <button
                            type="button"
                            className="flex h-5 w-5 items-center justify-center rounded text-slate-600 hover:bg-white hover:text-slate-900 disabled:opacity-30 cursor-pointer"
                            disabled={mutationsLocked}
                            onClick={() => updateQuantity(line.variantId, line.quantity - 1)}
                          >
                            <Minus className="h-2.5 w-2.5" />
                          </button>
                          <span className="w-7 text-center font-mono text-xs font-semibold text-slate-800">
                            {line.quantity}
                          </span>
                          <button
                            type="button"
                            className="flex h-5 w-5 items-center justify-center rounded text-slate-600 hover:bg-white hover:text-slate-900 disabled:opacity-30 cursor-pointer"
                            disabled={mutationsLocked}
                            onClick={() => updateQuantity(line.variantId, line.quantity + 1)}
                          >
                            <Plus className="h-2.5 w-2.5" />
                          </button>
                        </div>
                        <span className="font-mono text-xs font-bold text-[#070B28]">
                          {formatBDT(line.unitPrice * line.quantity)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-full min-h-36 flex-col items-center justify-center text-center text-slate-400">
                  <ShoppingBag className="mb-2 h-7 w-7 text-slate-300" />
                  <p className="text-xs">Add a variant to begin.</p>
                </div>
              )}
            </div>

            <div className="border-t border-slate-200 bg-white p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Subtotal</span>
                <strong className="font-mono text-base font-bold text-[#070B28]">{formatBDT(subtotal)}</strong>
              </div>

              {/* Smart Collapsible Customer Bar */}
              {!showCustomerInput ? (
                <div className="mb-2 flex items-center justify-between rounded-lg border border-slate-200/90 bg-slate-50/90 px-2.5 py-1.5 transition-colors">
                  <div className="flex min-w-0 items-center gap-2">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[#0052FF]">
                      <User className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-xs font-semibold text-slate-800">
                          {customerName.trim() ? customerName : "Walk-in Customer"}
                        </p>
                        {!customerName.trim() ? (
                          <span className="rounded bg-slate-200/80 px-1 py-0.5 text-[9px] font-medium text-slate-500 uppercase">
                            Default
                          </span>
                        ) : null}
                      </div>
                      {customerPhone.trim() ? (
                        <p className="font-mono text-[10px] text-slate-500">{customerPhone}</p>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {customerName.trim() || customerPhone.trim() ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={isSubmitting || outcomeUnknown}
                        onClick={() => {
                          if (isSubmitting || outcomeUnknown) return;
                          setCustomerName("");
                          setCustomerPhone("");
                        }}
                        className="h-6 px-1.5 text-[11px] text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        title="Reset to default Walk-in Customer"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={isSubmitting || outcomeUnknown}
                      onClick={() => {
                        if (isSubmitting || outcomeUnknown) return;
                        setShowCustomerInput(true);
                      }}
                      className="h-6 px-2 text-[11px] font-medium text-[#0052FF] hover:bg-blue-100/60 hover:text-[#0047E0]"
                      title="Attach or edit customer info"
                    >
                      <UserPlus className="mr-1 h-3 w-3" />
                      {customerName.trim() || customerPhone.trim() ? "Edit" : "Add Customer"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mb-2 space-y-1.5 rounded-lg border border-blue-200 bg-blue-50/40 p-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-700">
                      <UserPlus className="h-3 w-3 text-[#0052FF]" /> Customer Info
                      <span className="text-[10px] font-normal text-slate-500">(Default: Walk-in Customer)</span>
                    </span>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => {
                        if (isSubmitting) return;
                        setShowCustomerInput(false);
                      }}
                      className="rounded px-1.5 py-0.5 text-[11px] font-medium text-[#0052FF] hover:bg-blue-100 cursor-pointer disabled:opacity-40"
                    >
                      Done
                    </button>
                  </div>
                  <Input
                    id="customer-name"
                    name="ticket-customer-name"
                    autoComplete="off"
                    data-lpignore="true"
                    disabled={mutationsLocked}
                    placeholder="Customer full name (leave blank for Walk-in Customer)"
                    value={customerName}
                    onChange={(event) => {
                      if (mutationsLocked || isSubmittingRef.current) return;
                      setCustomerName(event.target.value);
                    }}
                    className="h-7 bg-white text-xs"
                  />
                  <Input
                    id="customer-phone"
                    name="ticket-customer-phone"
                    type="tel"
                    autoComplete="off"
                    data-lpignore="true"
                    disabled={mutationsLocked}
                    placeholder="Phone: 01XXXXXXXXX (optional)"
                    value={customerPhone}
                    onChange={(event) => {
                      if (mutationsLocked || isSubmittingRef.current) return;
                      setCustomerPhone(event.target.value);
                    }}
                    className="h-7 bg-white text-xs"
                  />
                </div>
              )}

              {/* Payment Method Selector - 1 row 4 pills */}
              <div className="mb-2 grid grid-cols-4 gap-1">
                {PAYMENT_METHOD_OPTIONS.map((option) => {
                  const isSelected = paymentMethod === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      disabled={mutationsLocked}
                      onClick={() => {
                        if (mutationsLocked || isSubmittingRef.current) return;
                        setPaymentMethod(option.value);
                      }}
                      className={cn(
                        "flex h-7 items-center justify-center rounded-md border text-[11px] font-medium transition-colors cursor-pointer",
                        isSelected
                          ? "border-[#0052FF] bg-blue-50 font-semibold text-[#0052FF] shadow-2xs"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                        (outcomeUnknown || isSubmitting) && "opacity-50 cursor-not-allowed",
                      )}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>

              {/* Settlement row without cash given input: 100% complete sale by default */}
              <div className="mb-2.5 flex items-center justify-between text-[11px] text-slate-500">
                <span className="text-slate-600 font-medium">
                  Settlement: <strong className="font-mono text-[#070B28]">Exact ({formatBDT(subtotal)})</strong>
                </span>
                <span className="truncate text-[10px] text-slate-400">
                  {activeShift.lastKnown
                    ? activeShift.data ? "Last known shift (offline)" : activeShift.known ? "No shift at last check" : "No saved shift — optional"
                    : activeShift.data?.openedAt ? "Active Register Shift" : "No shift open"}
                </span>
              </div>

              <Button
                className="w-full bg-[#0052FF] hover:bg-[#0047E0] text-white shadow-xs font-semibold h-9 text-xs cursor-pointer"
                disabled={registerRecoveryRequired || !register.ready || register.busy || isSubmitting || checkout.isPending || (outcomeUnknown ? false : !cart.length || !offline.ready)}
                loading={isSubmitting || checkout.isPending}
                onClick={() => void completeSale()}
              >
                {outcomeUnknown ? "Retry completion" : `Complete sale · ${formatBDT(subtotal)}`}
              </Button>
            </div>
          </>
        )}
      </aside>

      <ReceiptDialog
        receipt={receipt}
        open={Boolean(receipt)}
        onOpenChange={(open) => !open && setReceipt(null)}
      />
    </div>
  );
}
