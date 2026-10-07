"use client";

import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { CurrencyInput } from "@/components/common/currency-input";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCentsToCurrency } from "@/lib/utils";
import { clearActiveShift } from "@/redux/actions/shiftActions";
import { useCloseShiftMutation } from "@/redux/api/shiftsApi";
import { OpenShiftDialog } from "@/features/shifts/components/open-shift-dialog";
import type { RootState } from "@/redux/types";

export default function ShiftsPage() {
  const dispatch = useDispatch();
  const shift = useSelector((state: RootState) => state.shift.active);
  const [closingAmount, setClosingAmount] = useState(0);
  const closeShift = useCloseShiftMutation();

  return (
    <div>
      <OpenShiftDialog open={!shift} />
      <PageHeader title="Shift" accent="control" description="Track float and close the drawer." />
      <Card className="max-w-lg">
        <CardContent className="space-y-4 p-6">
          {shift ? (
            <>
              <p className="text-sm text-muted-foreground">
                Opened {new Date(shift.openedAt).toLocaleString()} with{" "}
                <span className="font-mono tabular-nums">{formatCentsToCurrency(shift.startingAmount)}</span>
              </p>
              <CurrencyInput value={closingAmount} onChange={setClosingAmount} />
              <Button
                variant="navy"
                loading={closeShift.isPending}
                onClick={async () => {
                  try {
                    await closeShift.mutateAsync({ closingAmount });
                    dispatch(clearActiveShift());
                    toast.success("Shift closed");
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : "Unable to close shift");
                  }
                }}
              >
                Close shift
              </Button>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Open a shift to continue selling.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
