"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Minus, Pause, Plus, Search, ShoppingBag, Store, Trash2, User, UserPlus, X } from "lucide-react";
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
import type { CartLine, ReceiptViewModel } from "@/features/pos/view-models";
import type { RegisterCatalogItem } from "@/features/catalog/view-models";
import { useActiveShift } from "@/features/shifts/api/use-shifts";
import { useTenantScope, type RoleType } from "@/features/tenant/hooks/use-tenant-scope";
import { useBarcodeScanner } from "@/hooks/use-barcode-scanner";
import { PAYMENT_METHOD_OPTIONS } from "@/lib/payment-methods";
import { cn, formatBDT } from "@/lib/utils";
import { catalogCheckoutSchema } from "@/lib/validations";
import { ApiClientError } from "@/types/api";
import type { PaymentMethod } from "@/types/domain";

interface HeldTicket {
  id: string;
  label: string;
  lines: CartLine[];
  createdAt: string;
}

export interface TerminalWorkspaceProps {
  role?: RoleType;
}

export function TerminalWorkspace({ role = "cashier" }: TerminalWorkspaceProps) {
  const tenant = useTenantScope(role);
  const catalog = useRegisterCatalog(tenant.tenantParams, tenant.isTenantReady);
  const activeShift = useActiveShift(tenant.locationId, tenant.isTenantReady);
  const checkout = useCatalogCheckout();

  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("ALL");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [showCustomerInput, setShowCustomerInput] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("COD");
  const [tendered, setTendered] = useState("");
  const [heldTickets, setHeldTickets] = useState<HeldTicket[]>([]);
  const [receipt, setReceipt] = useState<ReceiptViewModel | null>(null);
  const [outcomeUnknown, setOutcomeUnknown] = useState(false);
  const operationKeyRef = useRef<string | null>(null);

  const selectedCategory = useMemo(() => {
    if (categoryId === "ALL") return null;
    return catalog.categories.find((c) => c.id === categoryId) ?? null;
  }, [catalog.categories, categoryId]);

  // Filter variants directly by dynamic category and search
  const filteredVariants = useMemo(() => {
    const term = search.trim().toLowerCase();
    return catalog.variants.filter((variant) => {
      const matchesCategory =
        categoryId === "ALL" ||
        variant.categoryId === categoryId ||
        (selectedCategory && variant.categoryName?.trim().toLowerCase() === selectedCategory.name.trim().toLowerCase());
      const matchesSearch =
        !term ||
        variant.name.toLowerCase().includes(term) ||
        (variant.variantName && variant.variantName.toLowerCase().includes(term)) ||
        variant.sku.toLowerCase().includes(term) ||
        (variant.barcode && variant.barcode.toLowerCase().includes(term)) ||
        variant.categoryName.toLowerCase().includes(term);
      return matchesCategory && matchesSearch;
    });
  }, [catalog.variants, categoryId, search, selectedCategory]);

  const subtotal = cart.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
  const tenderedAmount =
    paymentMethod === "COD"
      ? tendered.trim() !== "" && !Number.isNaN(Number(tendered))
        ? Number(tendered)
        : subtotal
      : subtotal;
  const changeDue = Number.isFinite(tenderedAmount) ? Math.max(0, tenderedAmount - subtotal) : 0;

  const markDraftChanged = () => {
    if (!outcomeUnknown) operationKeyRef.current = null;
  };

  const addVariantToCart = (item: RegisterCatalogItem) => {
    if (outcomeUnknown) return;
    if ((item.stock ?? 0) <= 0) {
      toast.error(`"${item.name} (${item.variantName || item.sku})" is out of stock.`);
      return;
    }
    markDraftChanged();
    setCart((current) => {
      const existing = current.find((l) => l.variantId === item.variantId);
      if (existing) {
        if (existing.quantity >= (item.stock ?? 0)) {
          toast.warning(`Maximum available stock (${item.stock}) reached for this item.`);
          return current;
        }
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

  // Hardware Barcode Scanner integration
  useBarcodeScanner((barcode) => {
    if (outcomeUnknown) return;
    const scanned = barcode.trim().toLowerCase();
    const match = catalog.variants.find(
      (v) => (v.barcode && v.barcode.toLowerCase() === scanned) || v.sku.toLowerCase() === scanned,
    );
    if (match) {
      if ((match.stock ?? 0) <= 0) {
        toast.error(`"${match.name || match.variantName}" is out of stock.`);
        return;
      }
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
    if (outcomeUnknown) return;
    markDraftChanged();
    setCart((current) =>
      quantity <= 0
        ? current.filter((line) => line.variantId !== variantId)
        : current.map((line) =>
            line.variantId === variantId ? { ...line, quantity: Math.min(quantity, line.stock) } : line,
          ),
    );
  };

  const holdTicket = () => {
    if (!cart.length || outcomeUnknown) return;
    setHeldTickets((current) => [
      ...current,
      {
        id: globalThis.crypto.randomUUID(),
        label: `Held ticket ${current.length + 1}`,
        lines: cart,
        createdAt: new Date().toISOString(),
      },
    ]);
    setCart([]);
    operationKeyRef.current = null;
    toast.success("Ticket held in this tab only.");
  };

  const completeSale = async () => {
    if (!cart.length) return;
    const finalTenderedAmount =
      paymentMethod === "COD"
        ? tendered.trim() !== "" && !Number.isNaN(Number(tendered))
          ? Number(tendered)
          : subtotal
        : subtotal;
    if (!Number.isInteger(finalTenderedAmount) || finalTenderedAmount < subtotal) {
      toast.error("Paid cash amount must be at least equal to the total.");
      return;
    }
    if (!outcomeUnknown) {
      const refreshed = await catalog.refetchVariants();
      if (!refreshed.data) {
        toast.error("Could not refresh price and stock. The ticket was preserved.");
        return;
      }
      const latest = new Map(refreshed.data.map((variant) => [variant.id, variant]));
      const changed = cart.some((line) => {
        const variant = latest.get(line.variantId);
        return (
          !variant ||
          variant.isActive === false ||
          variant.sellingPrice !== line.unitPrice ||
          variant.stock < line.quantity
        );
      });
      if (changed) {
        setCart((current) =>
          current
            .map((line) => {
              const variant = latest.get(line.variantId);
              return variant
                ? {
                    ...line,
                    unitPrice: variant.sellingPrice,
                    stock: variant.stock,
                    quantity: Math.min(line.quantity, Math.max(0, variant.stock)),
                  }
                : line;
            })
            .filter((line) => line.quantity > 0),
        );
        operationKeyRef.current = null;
        toast.error("Price, availability, or stock changed. Review the updated ticket before checkout.");
        return;
      }
    }
    operationKeyRef.current ??= globalThis.crypto.randomUUID();

    const validation = catalogCheckoutSchema.safeParse({
      ...tenant.tenantParams,
      shiftId: activeShift.data?.id,
      tenderedAmount: Math.floor(finalTenderedAmount),
      paymentMethod,
      customerName: customerName.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
      lines: cart.map((line) => ({
        variantId: line.variantId,
        quantity: Math.floor(line.quantity),
        unitPrice: Math.floor(line.unitPrice),
      })),
      idempotencyKey: operationKeyRef.current,
    });

    if (!validation.success) {
      toast.error(validation.error.issues[0]?.message ?? "Checkout form invalid");
      return;
    }

    try {
      const order = await checkout.mutateAsync({
        ...tenant.tenantParams,
        shiftId: validation.data.shiftId,
        tenderedAmount: validation.data.tenderedAmount,
        paymentMethod: validation.data.paymentMethod,
        customerName: validation.data.customerName,
        customerPhone: validation.data.customerPhone,
        lines: validation.data.lines,
        idempotencyKey: validation.data.idempotencyKey,
      });
      const nextReceipt: ReceiptViewModel = {
        orderId: order.id,
        invoiceNumber: order.receiptNumber ?? order.invoiceNumber,
        customerName: order.customerName ?? customerName.trim() ?? undefined,
        customerPhone: order.customerPhone ?? customerPhone.trim() ?? undefined,
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
        createdAt: order.occurredAt ?? order.createdAt,
        businessName: tenant.activeBusiness?.name,
        locationName: tenant.activeBranch?.name,
      };
      setReceipt(nextReceipt);
      setCart([]);
      setTendered("");
      setCustomerName("");
      setCustomerPhone("");
      setOutcomeUnknown(false);
      operationKeyRef.current = null;
      toast.success("Catalog sale confirmed by the server.");
    } catch (error) {
      if (error instanceof ApiClientError && (error.status === 0 || error.status === 408 || error.status >= 500)) {
        setOutcomeUnknown(true);
        toast.error("The server result is unknown. Keep this ticket unchanged and retry with the same operation key.");
      } else {
        operationKeyRef.current = null;
        toast.error(error instanceof Error ? error.message : "Checkout failed. The ticket was preserved.");
      }
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
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <DataState
            data={filteredVariants}
            isLoading={catalog.isLoading}
            isError={catalog.isError}
            resource="register catalog"
            emptyTitle="No variants match these filters."
            emptyDescription="Try choosing another category or clearing your search filter."
            onRetry={() => void catalog.refetch()}
          >
            {(data) => (
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
                            {(variant.stock ?? 0) <= 0 ? (
                              <Badge variant="destructive" className="text-[10px] py-0 px-1.5 h-4">
                                Out of stock
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
                          disabled={(variant.stock ?? 0) <= 0 || outcomeUnknown}
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
            )}
          </DataState>
        </div>
      </section>

      {/* Right Aside: Current Ticket and Checkout */}
      <aside className="flex max-h-[48vh] w-full flex-col bg-slate-50 lg:max-h-none lg:w-[390px]">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div>
            <h2 className="font-semibold text-[#070B28]">Current ticket</h2>
            <p className="text-xs text-slate-500">
              {cart.reduce((sum, line) => sum + line.quantity, 0)} items
            </p>
          </div>
          <div className="flex gap-1">
            <Button
              size="icon"
              variant="ghost"
              onClick={holdTicket}
              disabled={!cart.length || outcomeUnknown}
              aria-label="Hold ticket"
            >
              <Pause className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                setCart([]);
                operationKeyRef.current = null;
              }}
              disabled={!cart.length || outcomeUnknown}
              aria-label="Clear cart"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {outcomeUnknown ? (
          <p role="alert" className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800">
            Checkout result unknown. Ticket editing is locked; retry sends the same operation key.
          </p>
        ) : null}

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
                        disabled={outcomeUnknown || line.quantity >= line.stock}
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

          {heldTickets.length ? (
            <div className="mt-3 border-t border-slate-200 pt-2">
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Held in this tab
              </p>
              {heldTickets.map((ticket) => (
                <button
                  key={ticket.id}
                  disabled={outcomeUnknown}
                  onClick={() => {
                    setCart(ticket.lines);
                    setHeldTickets((current) => current.filter((item) => item.id !== ticket.id));
                    operationKeyRef.current = null;
                  }}
                  className="mb-1.5 flex w-full justify-between rounded-md border border-dashed border-slate-300 bg-white px-2.5 py-1.5 text-xs disabled:opacity-50 cursor-pointer"
                >
                  <span>{ticket.label}</span>
                  <span>{ticket.lines.length} lines</span>
                </button>
              ))}
            </div>
          ) : null}
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
                  <p className="truncate text-xs font-medium text-slate-800">
                    {customerName.trim() ? customerName : "Walk-in Customer"}
                  </p>
                  {customerPhone.trim() ? (
                    <p className="font-mono text-[10px] text-slate-500">{customerPhone}</p>
                  ) : null}
                </div>
              </div>
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
          ) : (
            <div className="mb-2 space-y-1.5 rounded-lg border border-blue-200 bg-blue-50/40 p-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-700">
                  <UserPlus className="h-3 w-3 text-[#0052FF]" /> Customer Info
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
                placeholder="Walk-in / Customer name (optional)"
                value={customerName}
                onChange={(event) => {
                  setCustomerName(event.target.value);
                  markDraftChanged();
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
                  markDraftChanged();
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
                    markDraftChanged();
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

          {paymentMethod === "COD" ? (
            <div className="mb-2 flex items-center justify-between gap-2 rounded-md border border-slate-200/80 bg-slate-50/50 px-2 py-1">
              <label htmlFor="tendered-amount" className="text-[11px] font-medium text-slate-600 shrink-0">
                Cash Given
              </label>
              <div className="flex items-center gap-1.5">
                <Input
                  id="tendered-amount"
                  type="number"
                  min={subtotal}
                  step="1"
                  disabled={outcomeUnknown}
                  placeholder={String(subtotal)}
                  value={tendered}
                  onChange={(event) => setTendered(event.target.value)}
                  className="h-6 w-28 bg-white font-mono text-xs text-right"
                />
                {tendered.trim() !== "" && Number(tendered) !== subtotal ? (
                  <button
                    type="button"
                    onClick={() => setTendered("")}
                    className="text-[10px] text-blue-600 hover:underline cursor-pointer"
                  >
                    Exact
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="mb-2.5 flex items-center justify-between text-[11px] text-slate-500">
            <span>
              Change: <strong className="font-mono text-slate-800">{formatBDT(changeDue)}</strong>
            </span>
            <span className="truncate text-[10px] text-slate-400">
              {activeShift.data?.openedAt
                ? "Active Register Shift"
                : "No shift open"}
            </span>
          </div>

          <Button
            className="w-full bg-[#0052FF] hover:bg-[#0047E0] text-white shadow-xs font-semibold h-9 text-xs"
            disabled={!cart.length || checkout.isPending || (paymentMethod === "COD" && tenderedAmount < subtotal)}
            loading={checkout.isPending}
            onClick={() => void completeSale()}
          >
            {outcomeUnknown ? "Retry completion" : `Complete sale · ${formatBDT(subtotal)}`}
          </Button>
        </div>
      </aside>

      <ReceiptDialog
        receipt={receipt}
        open={Boolean(receipt)}
        onOpenChange={(open) => !open && setReceipt(null)}
      />
    </div>
  );
}
