import {
  combineReducers,
  legacy_createStore as createStore,
  type Store,
  type UnknownAction,
} from "redux";
import { authReducer } from "@/redux/reducers/authReducer";
import { cartReducer } from "@/redux/reducers/cartReducer";
import { shiftReducer } from "@/redux/reducers/shiftReducer";
import { tenantReducer } from "@/redux/reducers/tenantReducer";
import { draftsReducer } from "@/redux/reducers/draftsReducer";
import { persistSavedDrafts } from "@/redux/storage";
import type { RootState, SavedDraft } from "@/redux/types";

export const rootReducer = combineReducers({
  auth: authReducer,
  cart: cartReducer,
  shift: shiftReducer,
  tenant: tenantReducer,
  drafts: draftsReducer,
});

export function createAppStore() {
  const store = createStore(rootReducer) as Store<RootState, UnknownAction>;

  // Subscribe client-side store updates for draft persistence
  if (typeof window !== "undefined") {
    let lastDrafts: SavedDraft[] | undefined;
    store.subscribe(() => {
      const state = store.getState();
      if (state.drafts && state.drafts.drafts !== lastDrafts) {
        lastDrafts = state.drafts.drafts;
        persistSavedDrafts(state.drafts.drafts);
      }
    });
  }

  return store;
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
