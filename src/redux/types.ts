import type { Shift, User } from "@/types/domain";

export const AUTH_SET_CREDENTIALS = "AUTH_SET_CREDENTIALS" as const;
export const AUTH_HYDRATE = "AUTH_HYDRATE" as const;
export const AUTH_LOGOUT = "AUTH_LOGOUT" as const;

export const CART_ADD_ITEM = "CART_ADD_ITEM" as const;
export const CART_REMOVE_ITEM = "CART_REMOVE_ITEM" as const;
export const CART_UPDATE_QTY = "CART_UPDATE_QTY" as const;
export const CART_CLEAR = "CART_CLEAR" as const;

export const SHIFT_SET_ACTIVE = "SHIFT_SET_ACTIVE" as const;
export const SHIFT_CLEAR = "SHIFT_CLEAR" as const;

export interface AuthState {
  accessToken: string | null;
  user: User | null;
  hydrated: boolean;
}

export interface CartItem {
  id: string;
  name: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  variantId?: string;
  custom?: boolean;
}

export interface CartState {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
}

export interface ShiftState {
  active: Shift | null;
}

export interface RootState {
  auth: AuthState;
  cart: CartState;
  shift: ShiftState;
}

export interface SetCredentialsPayload {
  accessToken: string;
  user: User;
}

export interface AddCartItemPayload {
  id: string;
  name: string;
  unitPrice: number;
  quantity?: number;
  variantId?: string;
  custom?: boolean;
}

export type AuthAction =
  | { type: typeof AUTH_SET_CREDENTIALS; payload: SetCredentialsPayload }
  | { type: typeof AUTH_HYDRATE; payload: SetCredentialsPayload | null }
  | { type: typeof AUTH_LOGOUT };

export type CartAction =
  | { type: typeof CART_ADD_ITEM; payload: AddCartItemPayload }
  | { type: typeof CART_REMOVE_ITEM; payload: { id: string } }
  | { type: typeof CART_UPDATE_QTY; payload: { id: string; quantity: number } }
  | { type: typeof CART_CLEAR };

export type ShiftAction =
  | { type: typeof SHIFT_SET_ACTIVE; payload: Shift }
  | { type: typeof SHIFT_CLEAR };

export type AppAction = AuthAction | CartAction | ShiftAction;
