"use client";

import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { CurrencyInput } from "@/components/common/currency-input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatCentsToCurrency } from "@/lib/utils";
import { clearCart } from "@/redux/actions/cartActions";
import { useCreateOrderMutation } from "@/redux/api/ordersApi";
import type { RootState } from "@/redux/types";
import type { Order } from "@/types/domain";

export function CheckoutDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const dispatch = useDispatch();
  const cart = useSelector((state: RootState) => state.cart);
  const shift = useSelector((state: RootState) => state.shift.active);
  const [tendered, setTendered] = useState(0);
  const [receipt, setReceipt] = useState<Order | null>(null);
  const createOrder = useCreateOrderMutation();
  const changeDue = Math.max(0, tendered - cart.subtotal);

  const lines = useMemo(
    () =>
      cart.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        variantId: item.variantId,
        custom: item.custom,
      })),
    [cart.items],
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setReceipt(null);
          setTendered(0);
        }
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{receipt ? "Receipt" : "Charge COD"}</DialogTitle>
        </DialogHeader>
        {receipt ? (
          <div className="space-y-3 font-mono text-sm tabular-nums">
            {receipt.lines.map((line) => (
              <div className="flex justify-between" key={line.id}>
                <span>
                  {line.name} × {line.quantity}
                </span>
                <span>{formatCentsToCurrency(line.subtotal)}</span>
              </div>
            ))}
            <div className="flex justify-between border-t border-border pt-2 font-bold">
              <span>Total</span>
              <span>{formatCentsToCurrency(receipt.totalAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tendered</span>
              <span>{formatCentsToCurrency(receipt.tenderedAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span>Change</span>
              <span>{formatCentsToCurrency(receipt.changeDue)}</span>
            </div>
            <Button className="w-full" onClick={() => onOpenChange(false)}>
              Done
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="font-mono text-2xl font-bold tabular-nums text-secondary">
              {formatCentsToCurrency(cart.subtotal)}
            </p>
            <CurrencyInput value={tendered} onChange={setTendered} />
            <p className="text-sm text-muted-foreground">
              Change due: <span className="font-mono tabular-nums text-secondary">{formatCentsToCurrency(changeDue)}</span>
            </p>
            <Button
              className="w-full"
              disabled={!shift || cart.items.length === 0 || tendered < cart.subtotal}
              loading={createOrder.isPending}
              onClick={async () => {
                if (!shift) return;
                try {
                  const order = await createOrder.mutateAsync({
                    shiftId: shift.id,
                    tenderedAmount: tendered,
                    lines,
                  });
                  dispatch(clearCart());
                  setReceipt(order);
                  toast.success("Sale recorded");
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Checkout failed");
                }
              }}
            >
              Complete sale
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
