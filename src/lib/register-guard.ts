/**
 * Scoped Register & Cart Guard (F07)
 *
 * Consolidates real register draft/held-ticket state in a scoped store keyed by
 * user/business/location:
 * - Prevents silent clearing or dropping of cart and held tickets on tenant/branch switch.
 * - Enforces confirmation warning before switching away from a branch with active cart/held tickets.
 * - Blocks scope/branch switching entirely while an unknown transaction outcome is pending.
 * - Preserves drafts per branch so returning to a branch restores its active register state.
 */

import type { CartLine, HeldTicket } from "@/features/pos/view-models";
import type { PaymentMethod } from "@/types/domain";

export interface RegisterDraftState {
  cart: CartLine[];
  heldTickets: HeldTicket[];
  customerName?: string;
  customerPhone?: string;
  showCustomerInput?: boolean;
  paymentMethod?: PaymentMethod;
  tendered?: string;
  outcomeUnknown?: boolean;
  updatedAt: number;
}

export interface RegisterWorkSummary {
  hasCart: boolean;
  cartCount: number;
  hasHeldTickets: boolean;
  heldCount: number;
  isOutcomeUnknown: boolean;
}

export type RegisterDraftRead =
  | { status: "available"; draft: RegisterDraftState }
  | { status: "empty" | "corrupt" | "unavailable"; draft: null };

export function registerDraftStorageKey(userId?: string | null, businessId?: string | null, locationId?: string | null): string {
  const u = userId || "anon";
  const b = businessId || "all";
  const l = locationId || "all";
  return `stpos:register_draft:${u}:${b}:${l}`;
}

function getStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    if (window.localStorage) return window.localStorage;
  } catch {
    // Falling back here would hide durable work saved in localStorage.
    return null;
  }
  try {
    if (window.sessionStorage) return window.sessionStorage;
  } catch {
    // ignore
  }
  return null;
}

function readStoredDraft(key: string): RegisterDraftRead {
  const storage = getStorage();
  if (!storage) return { status: "unavailable", draft: null };
  let raw: string | null;
  try {
    raw = storage.getItem(key);
  } catch {
    return { status: "unavailable", draft: null };
  }
  if (raw === null) return { status: "empty", draft: null };
  try {
    const draft = JSON.parse(raw) as RegisterDraftState;
    if (!draft || !Array.isArray(draft.cart) || !Array.isArray(draft.heldTickets)) {
      return { status: "corrupt", draft: null };
    }
    return { status: "available", draft };
  } catch {
    return { status: "corrupt", draft: null };
  }
}

function safeSetItem(key: string, value: string): boolean {
  const storage = getStorage();
  if (!storage) return false;
  try {
    const old = storage.getItem(key);
    if (old !== null) {
      const parsed = JSON.parse(old) as RegisterDraftState;
      if (!parsed || !Array.isArray(parsed.cart) || !Array.isArray(parsed.heldTickets)) return false;
    }
    storage.setItem(key, value);
    return storage.getItem(key) === value;
  } catch {
    return false;
  }
}

function safeRemoveItem(key: string, preserveCorrupt = false): boolean {
  const storage = getStorage();
  if (!storage) return false;
  try {
    if (preserveCorrupt) {
      const raw = storage.getItem(key);
      if (raw !== null) {
        const parsed = JSON.parse(raw) as RegisterDraftState;
        if (!parsed || !Array.isArray(parsed.cart) || !Array.isArray(parsed.heldTickets)) return false;
      }
    }
    storage.removeItem(key);
    return storage.getItem(key) === null;
  } catch {
    return false;
  }
}

export const registerGuard = {
  /** Empty storage is different from evidence we cannot currently read. */
  readDraft(userId?: string | null, businessId?: string | null, locationId?: string | null): RegisterDraftRead {
    return readStoredDraft(registerDraftStorageKey(userId, businessId, locationId));
  },
  /**
   * Retrieves the draft register state for the specified scope.
   */
  getDraft(userId?: string | null, businessId?: string | null, locationId?: string | null): RegisterDraftState | null {
    return this.readDraft(userId, businessId, locationId).draft;
  },

  /**
   * Saves or updates the draft register state for the specified scope.
   */
  saveDraft(
    userId: string | null | undefined,
    businessId: string | null | undefined,
    locationId: string | null | undefined,
    draft: Omit<RegisterDraftState, "updatedAt">,
  ): boolean {
    const storageKey = registerDraftStorageKey(userId, businessId, locationId);
    if (!draft.cart.length && !draft.heldTickets.length && !draft.outcomeUnknown) {
      // Do not erase unreadable evidence merely because hydration returned null.
      return safeRemoveItem(storageKey, true);
    }
    const fullDraft: RegisterDraftState = {
      ...draft,
      updatedAt: Date.now(),
    };
    return safeSetItem(storageKey, JSON.stringify(fullDraft));
  },

  /**
   * Checks if active work exists for the specified scope.
   */
  hasActiveRegisterWork(
    userId?: string | null,
    businessId?: string | null,
    locationId?: string | null,
  ): RegisterWorkSummary {
    const read = this.readDraft(userId, businessId, locationId);
    const draft = read.draft;
    if (!draft) {
      return {
        hasCart: false,
        cartCount: 0,
        hasHeldTickets: false,
        heldCount: 0,
        isOutcomeUnknown: read.status === "corrupt" || read.status === "unavailable",
      };
    }
    const cartCount = draft.cart.reduce((sum, line) => sum + line.quantity, 0);
    const heldCount = draft.heldTickets.length;
    return {
      hasCart: cartCount > 0,
      cartCount,
      hasHeldTickets: heldCount > 0,
      heldCount,
      isOutcomeUnknown: Boolean(draft.outcomeUnknown),
    };
  },

  /**
   * Clears the draft register state for the specified scope.
   */
  clearDraft(userId?: string | null, businessId?: string | null, locationId?: string | null): void {
    safeRemoveItem(registerDraftStorageKey(userId, businessId, locationId));
  },
};
