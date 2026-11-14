"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Clock, Loader2, Minus, Pause, Play, Plus, Search, ShoppingBag, Store, Trash2, User, UserPlus, X } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { DataState, TenantRequiredState } from "@/components/common/data-state";
import { VariantImageCarousel } from "@/components/common/variant-image-carousel";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCatalogCheckout, useRegisterCatalog } from "@/features/pos/api/use-pos";
import { ReceiptDialog } from "@/features/pos/components/receipt-dialog";
import { selectOrderSaleTime, type CartLine, type ReceiptViewModel, type SavedDraft } from "@/features/pos/view-models";
import { mapVariantToRegisterItem, type RegisterCatalogItem } from "@/features/catalog/view-models";
import { useActiveShift } from "@/features/shifts/api/use-shifts";
import { useTenantScope, type RoleType } from "@/features/tenant/hooks/use-tenant-scope";
import { useBarcodeScanner } from "@/hooks/use-barcode-scanner";
import { apiClient } from "@/lib/api-client";
import { financialOperations } from "@/lib/financial-operation";
import { registerGuard } from "@/lib/register-guard";
import { PAYMENT_METHOD_OPTIONS } from "@/lib/payment-methods";
import { cn, formatBDT } from "@/lib/utils";
import { formatBusinessTime } from "@/lib/business-time";
import { catalogCheckoutSchema } from "@/lib/validations";
import { removeDraft, saveDraft } from "@/redux/actions/draftsActions";
import type { AppDispatch } from "@/redux/store";
import type { RootState } from "@/redux/types";
import { ApiClientError } from "@/types/api";
import type { PaymentMethod, Variant } from "@/types/domain";

export interface TerminalWorkspaceProps {
  role?: RoleType;
}

export function TerminalWorkspace({ role = "cashier" }: TerminalWorkspaceProps) {
  const tenant = useTenantScope(role);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryId, setCategoryId] = useState("ALL");
  const [cart, setCart] = useState<CartLine[]>(() => {
    const draft = registerGuard.getDraft(tenant.userId, tenant.businessId, tenant.locationId);
    return draft?.cart || [];
  });
  const [customerName, setCustomerName] = useState(() => {
    const draft = registerGuard.getDraft(tenant.userId, tenant.businessId, tenant.locationId);
    return draft?.customerName ?? "";
  });
  const [customerPhone, setCustomerPhone] = useState(() => {
    const draft = registerGuard.getDraft(tenant.userId, tenant.businessId, tenant.locationId);
    return draft?.customerPhone ?? "";
  });
  const [showCustomerInput, setShowCustomerInput] = useState(() => {
    const draft = registerGuard.getDraft(tenant.userId, tenant.businessId, tenant.locationId);
    return Boolean(draft?.showCustomerInput);
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(() => {
    const draft = registerGuard.getDraft(tenant.userId, tenant.businessId, tenant.locationId);
    return draft?.paymentMethod ?? "COD";
  });
  const [tendered, setTendered] = useState(() => {
    const draft = registerGuard.getDraft(tenant.userId, tenant.businessId, tenant.locationId);
    return draft?.tendered ?? "";
  });
  const dispatch = useDispatch<AppDispatch>();
  const reduxDrafts = useSelector((state: RootState) => state.drafts?.drafts ?? []);
  const [activeRightTab, setActiveRightTab] = useState<"cart" | "drafts">("cart");

  const currentDrafts = useMemo(() => {
    return reduxDrafts.filter((d) => {
      if (!tenant.businessId) return true;
      return !d.businessId || d.businessId === tenant.businessId;
    });
  }, [reduxDrafts, tenant.businessId]);

  const [receipt, setReceipt] = useState<ReceiptViewModel | null>(null);
  const [outcomeUnknown, setOutcomeUnknown] = useState(() => {
    const draft = registerGuard.getDraft(tenant.userId, tenant.businessId, tenant.locationId);
    const pendingOp = financialOperations.getPendingOperation({
      operationType: "catalog_sale",
      userId: tenant.userId,
      businessId: tenant.businessId,
      locationId: tenant.locationId,
    });
    return Boolean(draft?.outcomeUnknown || (pendingOp && pendingOp.outcome === "unknown"));
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);

  const scopeKey = `${tenant.userId}:${tenant.businessId}:${tenant.locationId}`;
  const [prevScopeKey, setPrevScopeKey] = useState(scopeKey);

  if (prevScopeKey !== scopeKey) {
    setPrevScopeKey(scopeKey);
    const draft = registerGuard.getDraft(tenant.userId, tenant.businessId, tenant.locationId);
    setCart(draft?.cart || []);
    setCustomerName(draft?.customerName ?? "");
    setCustomerPhone(draft?.customerPhone ?? "");
    setShowCustomerInput(Boolean(draft?.showCustomerInput));
    if (draft?.paymentMethod) setPaymentMethod(draft.paymentMethod);
    setTendered(draft?.tendered ?? "");
    const pendingOp = financialOperations.getPendingOperation({
      operationType: "catalog_sale",
      userId: tenant.userId,
      businessId: tenant.businessId,
      locationId: tenant.locationId,
    });
    setOutcomeUnknown(Boolean(draft?.outcomeUnknown || (pendingOp && pendingOp.outcome === "unknown")));
  }

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Persist draft to scoped storage on changes
  useEffect(() => {
    registerGuard.saveDraft(tenant.userId, tenant.businessId, tenant.locationId, {
      cart,
      heldTickets: currentDrafts,
      customerName,
      customerPhone,
      showCustomerInput,
      paymentMethod,
      tendered,
      outcomeUnknown,
    });
  }, [tenant.userId, tenant.businessId, tenant.locationId, cart, currentDrafts, customerName, customerPhone, showCustomerInput, paymentMethod, tendered, outcomeUnknown]);

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
    if (outcomeUnknown || isSubmitting) return;
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
    if (outcomeUnknown || isSubmitting) return;
    const scanned = barcode.trim().toLowerCase();
    let match = catalog.variants.find(
      (v) => (v.barcode && v.barcode.toLowerCase() === scanned) || v.sku.toLowerCase() === scanned,
    );

    if (!match) {
      try {
        const res = await apiClient.get<Variant[]>("/catalog/variants", {
          params: { ...tenant.tenantParams, search: scanned, limit: 5 },
        });
        const found = (res.data ?? []).find(
          (v) => (v.barcode && v.barcode.toLowerCase() === scanned) || v.sku.toLowerCase() === scanned,
        );
        if (found) {
          match = mapVariantToRegisterItem(found, [], catalog.categories);
        }
      } catch {
        // Fall through to error toast
      }
    }

    if (match) {
      addVariantToCart(match);
      toast.success(`Scanned: ${match.name}`);
      return;
    }
    toast.error(`No item found for barcode: ${barcode}`);
  }, !outcomeUnknown);

  if (tenant.isAdmin && !tenant.isTenantReady) {
    return (
      <div className="p-6">
        <TenantRequiredState />
      </div>
    );
  }

  const updateQuantity = (variantId: string, quantity: number) => {
    if (outcomeUnknown || isSubmitting) return;
    setCart((current) =>
      quantity <= 0
        ? current.filter((line) => line.variantId !== variantId)
        : current.map((line) =>
            line.variantId === variantId ? { ...line, quantity } : line,
          ),
    );
  };

  const holdDraft = () => {
    if (!cart.length || outcomeUnknown || isSubmitting) return;
    if (currentDrafts.length >= 5) {
      toast.error("Draft limit reached (5/5). Please continue or discard an existing draft first.");
      return;
    }

    const draftNumber = currentDrafts.length + 1;
    const label = customerName.trim()
      ? `Draft #${draftNumber} · ${customerName.trim()}`
      : `Draft #${draftNumber}`;

    const newDraft: SavedDraft = {
      id: globalThis.crypto.randomUUID(),
      label,
      lines: [...cart],
      customerName: customerName.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
      paymentMethod,
      subtotal,
      itemCount: cartItemCount,
      createdAt: new Date().toISOString(),
      businessId: tenant.businessId,
      locationId: tenant.locationId,
      userId: tenant.userId,
    };

    dispatch(saveDraft(newDraft));
    setCart([]);
    setCustomerName("");
    setCustomerPhone("");
    financialOperations.clearOperation({
      operationType: "catalog_sale",
      userId: tenant.userId,
      businessId: tenant.businessId,
      locationId: tenant.locationId,
    });
    toast.success(`Draft #${draftNumber} saved (${currentDrafts.length + 1}/5).`);
  };

  const continueDraft = (draft: SavedDraft) => {
    if (outcomeUnknown || isSubmitting) return;
    setCart(draft.lines);
    setCustomerName(draft.customerName ?? "");
    setCustomerPhone(draft.customerPhone ?? "");
    if (draft.paymentMethod) setPaymentMethod(draft.paymentMethod);
    dispatch(removeDraft(draft.id));
    setActiveRightTab("cart");
    toast.success(`Resumed ${draft.label}. Ready to complete sale!`);
  };

  const discardDraft = (draftId: string, label: string) => {
    if (outcomeUnknown || isSubmitting) return;
    dispatch(removeDraft(draftId));
    toast.info(`${label} discarded.`);
  };

  const handleResetUnknownTicket = () => {
    const confirmed = window.confirm(
      "CONFIRM ORDER HISTORY RECONCILIATION:\n\n" +
      "Have you checked the Orders page to verify whether this sale was recorded on the server?\n\n" +
      "• If the order was recorded: Do not reset; the sale is already complete.\n" +
      "• If the order was NOT recorded: Click OK to clear the lock and safely create a new sale.\n\n" +
      "Proceed to clear the lock?",
    );
    if (!confirmed) return;

    financialOperations.clearOperation({
      operationType: "catalog_sale",
      userId: tenant.userId,
      businessId: tenant.businessId,
      locationId: tenant.locationId,
    });
    setOutcomeUnknown(false);
    toast.info("Uncertain transaction lock cleared after order-history reconciliation.");
  };

  const completeSale = async () => {
    if (isSubmittingRef.current || checkout.isPending) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);

    const operationScope = {
      operationType: "catalog_sale" as const,
      userId: tenant.userId,
      businessId: tenant.businessId,
      locationId: tenant.locationId,
    };

    const pendingOp = financialOperations.getPendingOperation<{
      businessId?: string;
      locationId?: string;
      shiftId?: string;
      tenderedAmount: number;
      paymentMethod: PaymentMethod;
      customerName: string;
      customerPhone?: string;
      lines: Array<{
        variantId: string;
        quantity: number;
        unitPrice: number;
      }>;
    }>(operationScope);

    let payloadToHash: {
      businessId?: string;
      locationId?: string;
      shiftId?: string;
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

    if (outcomeUnknown) {
      const snapshot = pendingOp?.payloadSnapshot;
      if (!snapshot?.lines?.length) {
        toast.error("Original catalog sale draft unavailable. Please reconcile with order history and clear lock.");
        return;
      }
      if (!snapshot.paymentMethod) {
        toast.error("Original payment method is missing. Verify order history before clearing this lock.");
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
        shiftId: activeShift.data?.id,
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

    let scopedKey: string;
    try {
      const keyInfo = financialOperations.getOrCreateKey(operationScope, payloadToHash);
      scopedKey = keyInfo.key;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Uncertain transaction pending.");
      return;
    }

    const validation = catalogCheckoutSchema.safeParse({
      ...payloadToHash,
      idempotencyKey: scopedKey,
    });

    if (!validation.success) {
      toast.error(validation.error.issues[0]?.message ?? "Checkout form invalid");
      return;
    }

    const effectivePaymentMethod = validation.data.paymentMethod;
    if (!effectivePaymentMethod) {
      toast.error("Valid payment method required.");
      return;
    }

    try {
      const order = await checkout.mutateAsync({
        businessId: tenant.isAdmin ? tenant.businessId : undefined,
        locationId: tenant.isAdmin ? tenant.locationId : undefined,
        shiftId: validation.data.shiftId,
        tenderedAmount: validation.data.tenderedAmount,
        paymentMethod: effectivePaymentMethod,
        customerName: validation.data.customerName,
        customerPhone: validation.data.customerPhone,
        lines: validation.data.lines,
        idempotencyKey: validation.data.idempotencyKey,
      });
      const timeInfo = selectOrderSaleTime({
        occurredAt: order.occurredAt,
        createdAt: order.createdAt,
      });
      const nextReceipt: ReceiptViewModel = {
        orderId: order.id,
        invoiceNumber: order.receiptNumber ?? order.invoiceNumber,
        customerName: order.customerName || payloadToHash.customerName,
        customerPhone: order.customerPhone || payloadToHash.customerPhone,
        cashierName: order.cashier?.fullName,
        tenderedAmount: order.tenderedAmount,
        changeDue: order.changeDue,
        status: order.status,
        items: order.lines.map((line) => ({
          id: line.id,
          name: `${line.productName}${line.variantName ? ` · ${line.variantName}` : ""}`,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          subtotal: line.subtotal,
        })),
        subtotal: order.subtotal,
        totalAmount: order.totalAmount,
        paymentMethod: order.paymentMethod,
        occurredAt: order.occurredAt ?? null,
        createdAt: order.createdAt,
        saleAt: timeInfo.saleAt,
        timeSource: timeInfo.source,
        businessName: order.businessName || tenant.activeBusiness?.name,
        locationName: order.locationName || order.branchName || tenant.activeBranch?.name,
      };
      setReceipt(nextReceipt);
      setCart([]);
      setTendered("");
      setCustomerName("");
      setCustomerPhone("");
      setShowCustomerInput(false);
      setOutcomeUnknown(false);
      financialOperations.recordOutcome(operationScope, "success");
      registerGuard.clearDraft(tenant.userId, tenant.businessId, tenant.locationId);
      toast.success("Catalog sale confirmed by the server.");
    } catch (error) {
      if (
        error instanceof ApiClientError &&
        error.status === 409 &&
        (error.code === "PRICE_CHANGED" || (error.data as Record<string, unknown> | undefined)?.code === "PRICE_CHANGED")
      ) {
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
      } else if (error instanceof ApiClientError && (error.status === 0 || error.status === 408 || error.status >= 500)) {
        setOutcomeUnknown(true);
        financialOperations.recordOutcome(operationScope, "unknown");
        toast.error("The server result is unknown. Keep this ticket unchanged and retry with the same operation key.");
      } else {
        financialOperations.recordOutcome(operationScope, "failed");
        toast.error(error instanceof Error ? error.message : "Checkout failed. The ticket was preserved.");
      }
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-white lg:flex-row">
      <section className="flex min-h-0 flex-1 flex-col border-r border-slate-200">
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
                            disabled={outcomeUnknown}
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
      <aside className="flex max-h-[52vh] w-full flex-col bg-slate-50 lg:max-h-none lg:w-[410px]">
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
                disabled={!cart.length || outcomeUnknown || isSubmitting || currentDrafts.length >= 5}
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
                disabled={!cart.length || outcomeUnknown || isSubmitting}
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
              onClick={() => setActiveRightTab("cart")}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-md py-1 font-semibold transition-all cursor-pointer",
                activeRightTab === "cart"
                  ? "bg-white text-[#070B28] shadow-2xs"
                  : "text-slate-500 hover:text-slate-900",
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
              onClick={() => setActiveRightTab("drafts")}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-md py-1 font-semibold transition-all cursor-pointer",
                activeRightTab === "drafts"
                  ? "bg-white text-[#070B28] shadow-2xs"
                  : "text-slate-500 hover:text-slate-900",
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
              <span>before clearing.</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => void completeSale()}
                className="rounded bg-amber-600 px-2 py-0.5 text-xs font-semibold text-white hover:bg-amber-700 cursor-pointer"
              >
                Retry exact draft
              </button>
              <button
                type="button"
                onClick={handleResetUnknownTicket}
                className="rounded border border-amber-300 bg-white px-2 py-0.5 text-xs font-semibold text-amber-900 hover:bg-amber-100 cursor-pointer"
              >
                Reconciled (Clear)
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
                      disabled={outcomeUnknown || isSubmitting}
                    >
                      <Play className="mr-1.5 h-3.5 w-3.5 fill-current" />
                      Continue
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 cursor-pointer"
                      onClick={() => discardDraft(draft.id, draft.label)}
                      disabled={outcomeUnknown || isSubmitting}
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
                          disabled={outcomeUnknown}
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
                            disabled={outcomeUnknown}
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
                            disabled={outcomeUnknown}
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
                        onClick={() => {
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
                      onClick={() => setShowCustomerInput(true)}
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
                      onClick={() => setShowCustomerInput(false)}
                      className="rounded px-1.5 py-0.5 text-[11px] font-medium text-[#0052FF] hover:bg-blue-100 cursor-pointer"
                    >
                      Done
                    </button>
                  </div>
                  <Input
                    id="customer-name"
                    disabled={outcomeUnknown}
                    placeholder="Customer full name (leave blank for Walk-in Customer)"
                    value={customerName}
                    onChange={(event) => {
                      setCustomerName(event.target.value);
                    }}
                    className="h-7 bg-white text-xs"
                  />
                  <Input
                    id="customer-phone"
                    type="tel"
                    disabled={outcomeUnknown}
                    placeholder="Phone: 01XXXXXXXXX (optional)"
                    value={customerPhone}
                    onChange={(event) => {
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
                      disabled={outcomeUnknown}
                      onClick={() => {
                        setPaymentMethod(option.value);
                      }}
                      className={cn(
                        "flex h-7 items-center justify-center rounded-md border text-[11px] font-medium transition-colors cursor-pointer",
                        isSelected
                          ? "border-[#0052FF] bg-blue-50 font-semibold text-[#0052FF] shadow-2xs"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
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
                  {activeShift.data?.openedAt
                    ? "Active Register Shift"
                    : "No shift open"}
                </span>
              </div>

              <Button
                className="w-full bg-[#0052FF] hover:bg-[#0047E0] text-white shadow-xs font-semibold h-9 text-xs cursor-pointer"
                disabled={isSubmitting || checkout.isPending || (outcomeUnknown ? false : !cart.length)}
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
