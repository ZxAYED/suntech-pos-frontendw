import type { Advance, Cashier, PayrollRecord } from "@/types/domain";
import { formatSalaryPeriod } from "@/lib/business-time";

export interface StaffRowViewModel {
  id: string;
  fullName: string;
  publicId: string;
  email?: string;
  phoneNumber?: string;
  locationId: string;
  locationName?: string;
  monthlySalary?: number;
  status: Cashier["status"];
  joinedAt?: string;
}

export interface PayrollRowViewModel {
  id: string;
  cashierId: string;
  employeeName: string;
  employeePublicId?: string;
  periodLabel: string;
  baseSalary: number;
  advancesTotal: number;
  netPayable: number;
  processed: boolean;
  disbursedAt?: string;
  paidAt?: string | null;
  status?: string;
}

export interface AdvanceRowViewModel {
  id: string;
  cashierId: string;
  cashierName?: string;
  employeeName?: string;
  employeeCode?: string;
  role?: string;
  locationName?: string;
  amount: number;
  deductedAmount?: number;
  remainingAmount?: number;
  note?: string;
  createdAt: string;
  takenAt?: string;
  deletedAt?: string | null;
  status?: Advance["status"];
}

export function mapCashierToStaffRow(cashier: Cashier): StaffRowViewModel {
  return {
    id: cashier.id,
    fullName: cashier.fullName,
    publicId: cashier.publicId,
    email: cashier.email ?? undefined,
    phoneNumber: cashier.phoneNumber ?? undefined,
    locationId: cashier.locationId,
    locationName: cashier.location?.name ?? cashier.locationName ?? undefined,
    monthlySalary: cashier.monthlySalary ?? undefined,
    status: cashier.status,
    joinedAt: cashier.createdAt,
  };
}

export function mapPayrollToPayrollRow(record: PayrollRecord): PayrollRowViewModel {
  return {
    id: record.id,
    cashierId: record.cashierId,
    employeeName: record.cashierName,
    employeePublicId: record.cashierPublicId ?? undefined,
    periodLabel: formatSalaryPeriod(record.year, record.month),
    baseSalary: record.baseSalary,
    advancesTotal: record.advancesTotal,
    netPayable: record.netPayable,
    processed: record.processed,
    disbursedAt: record.disbursedAt ?? undefined,
    paidAt: record.paidAt ?? record.disbursedAt ?? undefined,
    status: record.processed ? "PAID" : "DUE",
  };
}

export function mapAdvanceToAdvanceRow(advance: Advance & { employeeName?: string; locationName?: string; takenAt?: string }): AdvanceRowViewModel {
  return {
    id: advance.id,
    cashierId: advance.cashierId,
    cashierName: advance.employeeName ?? advance.cashierName ?? undefined,
    employeeName: advance.employeeName ?? advance.cashierName ?? undefined,
    locationName: advance.locationName ?? undefined,
    amount: advance.amount,
    note: advance.note ?? undefined,
    createdAt: advance.createdAt ? String(advance.createdAt) : "",
    takenAt: advance.takenAt ? String(advance.takenAt) : undefined,
    status: advance.status,
  };
}
