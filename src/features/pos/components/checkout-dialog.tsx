"use client";

import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { CurrencyInput } from "@/components/common/currency-input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMockCheckout } from "@/features/pos/api/use-pos";
import type { ReceiptViewModel } from "@/features/pos/view-models";
import { PAYMENT_METHOD_OPTIONS } from "@/lib/payment-methods";
import { formatBDT } from "@/lib/utils";
import { clearCart } from "@/redux/actions/cartActions";
import type { RootState } from "@/redux/types";
import type { PaymentMethod } from "@/types/domain";

export function CheckoutDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const dispatch = useDispatch();
  const cart = useSelector((state: RootState) => state.cart);
  const shift = useSelector((state: RootState) => state.shift.active);
  const tenant = useSelector((state: RootState) => state.tenant);
  const [tendered, setTendered] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("COD");
  const [receipt, setReceipt] = useState<ReceiptViewModel | null>(null);
  const checkout = useMockCheckout();
  const changeDue = paymentMethod === "COD" ? Math.max(0, tendered - cart.subtotal) : 0;
  const receiptLines = useMemo(() => cart.items.map((item) => ({ id: item.id, name: item.name, quantity: item.quantity, unitPrice: item.unitPrice, subtotal: item.subtotal })), [cart.items]);

  const close = (next: boolean) => {
    if (!next) { setReceipt(null); setTendered(0); }
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent>
        <DialogHeader><DialogTitle>{receipt ? "Receipt" : "Complete sale"}</DialogTitle></DialogHeader>
        {receipt ? (
          <div className="space-y-3 font-mono text-sm tabular-nums">
            <p className="text-center text-xs text-slate-500">Invoice #{receipt.invoiceNumber}</p>
            {receipt.items.map((line) => <div className="flex justify-between" key={line.id}><span>{line.name} × {line.quantity}</span><span>{formatBDT(line.subtotal)}</span></div>)}
            <div className="flex justify-between border-t border-slate-200 pt-2 font-bold"><span>Total</span><span>{formatBDT(receipt.totalAmount)}</span></div>
            <Button className="w-full" onClick={() => close(false)}>Done</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {!shift ? <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">No active shift. Checkout remains available and the future order payload will omit shiftId.</p> : null}
            <p className="font-mono text-2xl font-bold tabular-nums text-[#070B28]">{formatBDT(cart.subtotal)}</p>
            <Select value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}><SelectTrigger><SelectValue placeholder="Payment method" /></SelectTrigger><SelectContent>{PAYMENT_METHOD_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select>
            {paymentMethod === "COD" ? <><CurrencyInput value={tendered} onChange={setTendered} /><p className="text-sm text-slate-500">Change due: <span className="font-mono text-[#070B28]">{formatBDT(changeDue)}</span></p></> : null}
            <Button className="w-full" disabled={cart.items.length === 0 || (paymentMethod === "COD" && tendered < cart.subtotal)} loading={checkout.isPending} onClick={async () => {
              const nextReceipt = await checkout.mutateAsync({ items: receiptLines, subtotal: cart.subtotal, totalAmount: cart.subtotal, paymentMethod, businessName: tenant.selectedBusiness?.name, locationName: tenant.selectedBranch?.name });
              dispatch(clearCart()); setReceipt(nextReceipt); toast.success("Mock sale recorded");
            }}>Complete sale</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
