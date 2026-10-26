import type { Shift } from "@/types/domain";

export interface ShiftViewModel {
  id: string;
  status: "OPEN" | "CLOSED";
  locationId: string;
  cashierId: string;
  cashierName?: string;
  openingFloat: number;
  openedAt: string;
  closedAt?: string;
  expectedCash?: number;
  closingCash?: number;
  variance?: number;
}

export function mapShiftToViewModel(shift: Shift): ShiftViewModel {
  return {
    id: shift.id,
    status: shift.status,
    locationId: shift.locationId,
    cashierId: shift.cashierId,
    cashierName: shift.cashierName,
    openingFloat: shift.openingFloat,
    openedAt: shift.openedAt,
    closedAt: shift.closedAt ?? undefined,
    expectedCash: shift.expectedCash ?? undefined,
    closingCash: shift.closingCash ?? undefined,
    variance: shift.variance ?? undefined,
  };
}
