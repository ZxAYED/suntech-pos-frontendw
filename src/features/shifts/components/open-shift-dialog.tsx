"use client";

import { useState } from "react";
import { useDispatch } from "react-redux";
import { toast } from "sonner";
import { CurrencyInput } from "@/components/common/currency-input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { setActiveShift } from "@/redux/actions/shiftActions";
import { useOpenShiftMutation } from "@/redux/api/shiftsApi";

export function OpenShiftDialog({ open }: { open: boolean }) {
  const dispatch = useDispatch();
  const [startingAmount, setStartingAmount] = useState(0);
  const openShift = useOpenShiftMutation();

  return (
    <Dialog open={open}>
      <DialogContent hideClose onPointerDownOutside={(event) => event.preventDefault()} onEscapeKeyDown={(event) => event.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Open shift</DialogTitle>
          <DialogDescription>
            Enter the starting float in the drawer before ringing sales.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <CurrencyInput value={startingAmount} onChange={setStartingAmount} />
          <Button
            className="w-full"
            loading={openShift.isPending}
            onClick={async () => {
              try {
                const shift = await openShift.mutateAsync({ startingAmount });
                dispatch(setActiveShift(shift));
                toast.success("Shift opened");
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Unable to open shift");
              }
            }}
          >
            Start register
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
