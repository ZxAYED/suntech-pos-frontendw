"use client";

import { mockShifts } from "@/mocks/shifts/data";
import { useMockQuery } from "@/mocks/query";
import { mapShiftToViewModel } from "@/features/shifts/view-models";

export function useMockShifts() {
  return useMockQuery(mockShifts.map(mapShiftToViewModel));
}

export function useMockActiveShift() {
  return useMockQuery(mockShifts.find((shift) => shift.status === "OPEN") ?? null);
}
