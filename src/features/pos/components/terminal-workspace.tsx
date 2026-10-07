"use client";

import { AlertCircle, Minus, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useBarcodeScanner } from "@/hooks/use-barcode-scanner";
import { useDebounce } from "@/hooks/use-debounce";
import { formatCentsToCurrency } from "@/lib/utils";
import { addCartItem, removeCartItem, updateCartQty } from "@/redux/actions/cartActions";
import { useCategoriesQuery, useSearchVariantsQuery } from "@/redux/api/catalogApi";
import { CheckoutDialog } from "@/features/pos/components/checkout-dialog";
import { CustomItemDialog } from "@/features/pos/components/custom-item-dialog";
import { OpenShiftDialog } from "@/features/shifts/components/open-shift-dialog";
import type { RootState } from "@/redux/types";

export function TerminalWorkspace() {
  const dispatch = useDispatch();
  const cart = useSelector((state: RootState) => state.cart);
  const shift = useSelector((state: RootState) => state.shift.active);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [customOpen, setCustomOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const debouncedSearch = useDebounce(search, 250);

  const categories = useCategoriesQuery();
  const variants = useSearchVariantsQuery({
    search: debouncedSearch || undefined,
    categoryId,
  });

  const catalog = useMemo(() => variants.data ?? [], [variants.data]);

  useBarcodeScanner((code) => {
    const match = catalog.find((item) => item.barcode === code);
    if (match) {
      dispatch(
        addCartItem({
          id: uuidv4(),
          name: match.productName ? `${match.productName} · ${match.name}` : match.name,
          unitPrice: match.price,
          variantId: match.id,
        }),
      );
      toast.success(`Scanned ${match.barcode}`);
      return;
    }
    toast.error(`No variant for barcode ${code}`);
  }, Boolean(shift));

  return (
    <div className="flex h-full min-h-[calc(100vh-7rem)] gap-4">
      <OpenShiftDialog open={!shift} />
      <section className="w-[60%] space-y-3">
        <PageHeader title="Register" accent="terminal" description="Search, scan, or tap to add items." />
        <Input
          placeholder="Search products, SKU, or barcode"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <div className="flex flex-wrap gap-1.5">
          <Badge
            variant={!categoryId ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setCategoryId(undefined)}
          >
            All
          </Badge>
          {(categories.data ?? []).map((category) => (
            <Badge
              key={category.id}
              variant={categoryId === category.id ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setCategoryId(category.id)}
            >
              {category.name}
            </Badge>
          ))}
        </div>

        {variants.isError ? (
          <div className="rounded-md border border-destructive/20 bg-destructive/5 p-6 text-center">
            <AlertCircle className="mx-auto mb-2 h-7 w-7 text-destructive" />
            <p className="text-sm font-semibold text-secondary">Failed to load product catalog</p>
            <p className="mt-1 text-xs text-muted-foreground">{variants.error?.message || "Unable to retrieve inventory."}</p>
            <Button size="sm" variant="outline" className="mt-3" onClick={() => variants.refetch()}>
              Retry catalog
            </Button>
          </div>
        ) : variants.isLoading ? (
          <div className="grid grid-cols-2 gap-2.5 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-md border border-border bg-white p-3 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="mt-2 h-6 w-20" />
              </div>
            ))}
          </div>
        ) : catalog.length === 0 ? (
          <EmptyState title="No variants match this search" description="Try a different barcode, SKU, or name." />
        ) : (
          <div className="grid grid-cols-2 gap-2.5 xl:grid-cols-3">
            {catalog.map((variant) => (
              <button
                key={variant.id}
                className="rounded-md border border-border bg-white p-3 text-left shadow-sm transition-all hover:border-primary/50 hover:bg-accent/40 active:scale-[0.98]"
                onClick={() =>
                  dispatch(
                    addCartItem({
                      id: uuidv4(),
                      name: variant.productName ? `${variant.productName} · ${variant.name}` : variant.name,
                      unitPrice: variant.price,
                      variantId: variant.id,
                    }),
                  )
                }
                type="button"
              >
                <p className="font-semibold text-secondary line-clamp-1 text-sm">{variant.name}</p>
                <p className="text-xs text-muted-foreground">{variant.sku}</p>
                <p className="mt-2 font-mono text-base font-bold tabular-nums text-primary">
                  {formatCentsToCurrency(variant.price)}
                </p>
              </button>
            ))}
          </div>
        )}
      </section>
      <aside className="sticky top-0 w-[40%]">
        <Card className="flex h-full flex-col">
          <CardContent className="flex h-full flex-col p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-secondary">Active cart</h2>
              <Button size="sm" variant="outline" onClick={() => setCustomOpen(true)}>
                Custom item
              </Button>
            </div>
            <div className="flex-1 space-y-3 overflow-auto">
              {cart.items.length === 0 ? (
                <EmptyState title="Cart is empty" description="Scan or tap a variant to begin." />
              ) : (
                cart.items.map((item) => (
                  <div className="flex items-center justify-between rounded-md border border-border p-3" key={item.id}>
                    <div>
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="font-mono text-xs tabular-nums text-muted-foreground">
                        {formatCentsToCurrency(item.unitPrice)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="icon" variant="outline" onClick={() => dispatch(updateCartQty(item.id, item.quantity - 1))}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-6 text-center font-mono tabular-nums">{item.quantity}</span>
                      <Button size="icon" variant="outline" onClick={() => dispatch(updateCartQty(item.id, item.quantity + 1))}>
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => dispatch(removeCartItem(item.id))}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="mt-4 border-t border-border pt-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="font-mono text-2xl font-bold tabular-nums text-secondary">
                  {formatCentsToCurrency(cart.subtotal)}
                </span>
              </div>
              <Button className="w-full" disabled={!shift || cart.items.length === 0} onClick={() => setCheckoutOpen(true)}>
                Charge COD
              </Button>
            </div>
          </CardContent>
        </Card>
      </aside>
      <CustomItemDialog open={customOpen} onOpenChange={setCustomOpen} />
      <CheckoutDialog open={checkoutOpen} onOpenChange={setCheckoutOpen} />
    </div>
  );
}
