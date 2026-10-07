import {
  SHIFT_CLEAR,
  SHIFT_SET_ACTIVE,
  type ShiftAction,
  type ShiftState,
} from "@/redux/types";

export const shiftInitialState: ShiftState = {
  active: null,
};

export function shiftReducer(
  state: ShiftState = shiftInitialState,
  action: ShiftAction,
): ShiftState {
  switch (action.type) {
    case SHIFT_SET_ACTIVE:
      return { active: action.payload };
    case SHIFT_CLEAR:
      return shiftInitialState;
    default:
      return state;
  }
}
