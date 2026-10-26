import type { Advance, PayrollRecord } from "@/types/domain";

export const mockPayrollRecords: PayrollRecord[] = [
  { id: "pay-01", cashierId: "cashier-101", cashierName: "Alex Rivera", cashierPublicId: "ST-EMP-101", month: 9, year: 2026, baseSalary: 35000, advancesTotal: 0, netPayable: 35000, processed: true, disbursedAt: "2026-10-01T09:00:00+06:00" },
  { id: "pay-02", cashierId: "cashier-102", cashierName: "Tariqul Islam", cashierPublicId: "ST-EMP-102", month: 9, year: 2026, baseSalary: 24000, advancesTotal: 2500, netPayable: 21500, processed: true, disbursedAt: "2026-10-01T09:05:00+06:00" },
  { id: "pay-03", cashierId: "cashier-103", cashierName: "Sumaiya Akhter", cashierPublicId: "ST-EMP-103", month: 9, year: 2026, baseSalary: 28000, advancesTotal: 2000, netPayable: 26000, processed: true, disbursedAt: "2026-10-01T09:10:00+06:00" },
  { id: "pay-04", cashierId: "cashier-104", cashierName: "Zubair Rahman", cashierPublicId: "ST-EMP-104", month: 10, year: 2026, baseSalary: 55000, advancesTotal: 0, netPayable: 55000, processed: false },
];

export const mockAdvances: Advance[] = [
  { id: "adv-01", cashierId: "cashier-102", cashierName: "Tariqul Islam", amount: 10000, note: "Emergency family medical", createdAt: "2026-09-15T10:00:00+06:00", status: "ACTIVE" },
  { id: "adv-02", cashierId: "cashier-103", cashierName: "Sumaiya Akhter", amount: 8000, note: "House relocation deposit", createdAt: "2026-09-22T12:00:00+06:00", status: "ACTIVE" },
  { id: "adv-03", cashierId: "cashier-101", cashierName: "Alex Rivera", amount: 15000, note: "Motorcycle maintenance", createdAt: "2026-10-02T11:30:00+06:00", status: "ACTIVE" },
];
