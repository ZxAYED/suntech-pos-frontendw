import type { Shift } from "@/types/domain";
import { SHIFT_CLEAR, SHIFT_SET_ACTIVE, type ShiftAction } from "@/redux/types";

export function setActiveShift(payload: Shift): ShiftAction {
  return { type: SHIFT_SET_ACTIVE, payload };
}

export function clearActiveShift(): ShiftAction {
  return { type: SHIFT_CLEAR };
}
