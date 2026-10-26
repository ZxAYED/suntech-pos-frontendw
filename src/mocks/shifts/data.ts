import type { Shift } from "@/types/domain";

export const mockShifts: Shift[] = [
  { id: "sh-001", status: "OPEN", locationId: "loc-doyel", cashierId: "cashier-101", cashierName: "Alex Rivera", openingFloat: 10000, openedAt: "2026-10-26T08:30:00+06:00", expectedCash: 34820, closingCash: null, variance: null },
  { id: "sh-002", status: "CLOSED", locationId: "loc-doyel", cashierId: "cashier-102", cashierName: "Tariqul Islam", openingFloat: 10000, openedAt: "2026-10-25T09:00:00+06:00", closedAt: "2026-10-25T18:00:00+06:00", expectedCash: 28450, closingCash: 28450, variance: 0 },
  { id: "sh-003", status: "CLOSED", locationId: "loc-bashundhara", cashierId: "cashier-103", cashierName: "Sumaiya Akhter", openingFloat: 10000, openedAt: "2026-10-24T08:45:00+06:00", closedAt: "2026-10-24T17:45:00+06:00", expectedCash: 41200, closingCash: 41150, variance: -50 },
];
