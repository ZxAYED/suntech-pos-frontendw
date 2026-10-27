export interface ShiftApiRecord {
  id: string;
  businessId: string;
  locationId: string;
  cashierId: string;
  startingAmount: number;
  closingAmount?: number | null;
  expectedAmount?: number | null;
  variance?: number | null;
  cashSales?: number | null;
  advancesOut?: number | null;
  notes?: string | null;
  status: "OPEN" | "CLOSED";
  openedAt: string;
  closedAt?: string | null;
  openingFloat?: number;
  expectedCash?: number;
  cashier?: { id: string; fullName: string; publicId?: string | null };
  location?: { id: string; name: string };
  autoClosedPreviousShiftId?: string;
}

export interface ShiftViewModel {
  id: string;
  status: "OPEN" | "CLOSED";
  locationId: string;
  locationName?: string;
  cashierId: string;
  cashierName?: string;
  openingFloat: number;
  openedAt: string;
  closedAt?: string;
  expectedCash?: number;
  cashSales?: number;
  advancesOut?: number;
  closingCash?: number;
  variance?: number;
  notes?: string;
}

export function mapShiftToViewModel(shift: ShiftApiRecord): ShiftViewModel {
  return {
    id: shift.id,
    status: shift.status,
    locationId: shift.locationId,
    locationName: shift.location?.name,
    cashierId: shift.cashierId,
    cashierName: shift.cashier?.fullName,
    openingFloat: shift.openingFloat ?? shift.startingAmount,
    openedAt: shift.openedAt,
    closedAt: shift.closedAt ?? undefined,
    expectedCash: shift.expectedCash ?? shift.expectedAmount ?? undefined,
    cashSales: shift.cashSales ?? undefined,
    advancesOut: shift.advancesOut ?? undefined,
    closingCash: shift.closingAmount ?? undefined,
    variance: shift.variance ?? undefined,
    notes: shift.notes ?? undefined,
  };
}
