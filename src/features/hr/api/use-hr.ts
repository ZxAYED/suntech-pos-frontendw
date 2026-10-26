"use client";

import { useMemo } from "react";
import { mockCashiers } from "@/mocks/staff/data";
import { mockAdvances, mockPayrollRecords } from "@/mocks/payroll/data";
import { useMockQuery } from "@/mocks/query";
import {
  mapAdvanceToAdvanceRow,
  mapCashierToStaffRow,
  mapPayrollToPayrollRow,
} from "@/features/hr/view-models";

export function useMockStaff(search = "") {
  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return mockCashiers
      .map(mapCashierToStaffRow)
      .filter(
        (row) =>
          !term ||
          row.fullName.toLowerCase().includes(term) ||
          row.publicId.toLowerCase().includes(term) ||
          row.locationName?.toLowerCase().includes(term),
      );
  }, [search]);
  return useMockQuery(rows);
}

export function useMockPayroll() {
  return useMockQuery(mockPayrollRecords.map(mapPayrollToPayrollRow));
}

export function useMockAdvances() {
  return useMockQuery(mockAdvances.map(mapAdvanceToAdvanceRow));
}
