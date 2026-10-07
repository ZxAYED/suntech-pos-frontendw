"use client";

import { useState } from "react";
import { useDispatch } from "react-redux";
import { v4 as uuidv4 } from "uuid";
import { CurrencyInput } from "@/components/common/currency-input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { addCartItem } from "@/redux/actions/cartActions";

export function CustomItemDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const dispatch = useDispatch();
  const [name, setName] = useState("");
  const [price, setPrice] = useState(0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Custom line item</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input placeholder="Item name" value={name} onChange={(event) => setName(event.target.value)} />
          <CurrencyInput value={price} onChange={setPrice} />
          <Button
            className="w-full"
            disabled={!name || price <= 0}
            onClick={() => {
              dispatch(
                addCartItem({
                  id: uuidv4(),
                  name,
                  unitPrice: price,
                  quantity: 1,
                  custom: true,
                }),
              );
              setName("");
              setPrice(0);
              onOpenChange(false);
            }}
          >
            Add to cart
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
