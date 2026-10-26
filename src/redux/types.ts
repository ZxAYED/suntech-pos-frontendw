import type { OperationalStatus, Shift, User } from "@/types/domain";

export const AUTH_SET_CREDENTIALS = "AUTH_SET_CREDENTIALS" as const;
export const AUTH_HYDRATE = "AUTH_HYDRATE" as const;
export const AUTH_LOGOUT = "AUTH_LOGOUT" as const;

export const CART_ADD_ITEM = "CART_ADD_ITEM" as const;
export const CART_REMOVE_ITEM = "CART_REMOVE_ITEM" as const;
export const CART_UPDATE_QTY = "CART_UPDATE_QTY" as const;
export const CART_CLEAR = "CART_CLEAR" as const;

export const SHIFT_SET_ACTIVE = "SHIFT_SET_ACTIVE" as const;
export const SHIFT_CLEAR = "SHIFT_CLEAR" as const;

export const TENANT_SET_BUSINESS = "TENANT_SET_BUSINESS" as const;
export const TENANT_SET_BRANCH = "TENANT_SET_BRANCH" as const;
export const TENANT_SET_SELECTION = "TENANT_SET_SELECTION" as const;
export const TENANT_SET_AVAILABLE_BUSINESSES = "TENANT_SET_AVAILABLE_BUSINESSES" as const;
export const TENANT_HYDRATE = "TENANT_HYDRATE" as const;

export interface BranchItem {
  id: string;
  businessId: string;
  name: string;
  code: string;
  address: string | null;
  laneCount?: number;
  isMain?: boolean;
  status: OperationalStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface BusinessItem {
  id: string;
  name: string;
  code: string;
  logoUrl?: string;
  profileImageUrl?: string | null;
  ownerId?: string;
  createdAt?: string;
  updatedAt?: string;
  status: OperationalStatus;
  plan?: "Enterprise" | "Pro" | "Growth";
  branches: BranchItem[];
}

export interface TenantState {
  selectedBusiness: BusinessItem | null;
  selectedBranch: BranchItem | null;
  availableBusinesses: BusinessItem[];
  hydrated: boolean;
}

export interface AuthState {
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
  tenant: TenantState;
}

export interface SetCredentialsPayload {
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

export type TenantAction =
  | { type: typeof TENANT_SET_BUSINESS; payload: BusinessItem | null }
  | { type: typeof TENANT_SET_BRANCH; payload: BranchItem | null }
  | {
      type: typeof TENANT_SET_SELECTION;
      payload: { business: BusinessItem; branch: BranchItem };
    }
  | {
      type: typeof TENANT_SET_AVAILABLE_BUSINESSES;
      payload: BusinessItem[];
    }
  | {
      type: typeof TENANT_HYDRATE;
      payload: { business: BusinessItem; branch: BranchItem } | null;
    };

export type AppAction = AuthAction | CartAction | ShiftAction | TenantAction;
