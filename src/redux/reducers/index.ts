import { combineReducers } from "redux";
import { authReducer } from "@/redux/reducers/authReducer";
import { cartReducer } from "@/redux/reducers/cartReducer";
import { shiftReducer } from "@/redux/reducers/shiftReducer";
import { tenantReducer } from "@/redux/reducers/tenantReducer";
import type { AppAction, RootState } from "@/redux/types";

export const rootReducer = combineReducers({
  auth: authReducer,
  cart: cartReducer,
  shift: shiftReducer,
  tenant: tenantReducer,
});

export type CombinedReducer = (
  state: RootState | undefined,
  action: AppAction,
) => RootState;
