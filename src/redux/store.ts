import {
  combineReducers,
  legacy_createStore as createStore,
  type Store,
  type UnknownAction,
} from "redux";
import { authReducer } from "@/redux/reducers/authReducer";
import { cartReducer } from "@/redux/reducers/cartReducer";
import { shiftReducer } from "@/redux/reducers/shiftReducer";
import type { RootState } from "@/redux/types";

export const rootReducer = combineReducers({
  auth: authReducer,
  cart: cartReducer,
  shift: shiftReducer,
});

export function createAppStore() {
  return createStore(rootReducer) as Store<RootState, UnknownAction>;
}

export type AppStore = ReturnType<typeof createAppStore>;
export type AppDispatch = AppStore["dispatch"];

let clientStore: AppStore | undefined;

export function getClientStore() {
  if (typeof window === "undefined") {
    return createAppStore();
  }
  if (!clientStore) {
    clientStore = createAppStore();
  }
  return clientStore;
}
