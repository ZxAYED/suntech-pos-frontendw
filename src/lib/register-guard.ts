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

function getStorageKey(userId?: string | null, businessId?: string | null, locationId?: string | null): string {
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
    // ignore
  }
  try {
    if (window.sessionStorage) return window.sessionStorage;
  } catch {
    // ignore
  }
  return null;
}

function safeGetItem(key: string): string | null {
  const storage = getStorage();
  if (!storage) return null;
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: string): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(key, value);
  } catch {
    // Ignore storage quota / privacy errors
  }
}

function safeRemoveItem(key: string): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.removeItem(key);
  } catch {
    // Ignore storage errors
  }
}

export const registerGuard = {
  /**
   * Retrieves the draft register state for the specified scope.
   */
  getDraft(userId?: string | null, businessId?: string | null, locationId?: string | null): RegisterDraftState | null {
    const raw = safeGetItem(getStorageKey(userId, businessId, locationId));
    if (!raw) return null;
    try {
      return JSON.parse(raw) as RegisterDraftState;
    } catch {
      return null;
    }
  },

  /**
   * Saves or updates the draft register state for the specified scope.
   */
  saveDraft(
    userId: string | null | undefined,
    businessId: string | null | undefined,
    locationId: string | null | undefined,
    draft: Omit<RegisterDraftState, "updatedAt">,
  ): void {
    const storageKey = getStorageKey(userId, businessId, locationId);
    if (!draft.cart.length && !draft.heldTickets.length && !draft.outcomeUnknown) {
      safeRemoveItem(storageKey);
      return;
    }
    const fullDraft: RegisterDraftState = {
      ...draft,
      updatedAt: Date.now(),
    };
    safeSetItem(storageKey, JSON.stringify(fullDraft));
  },

  /**
   * Checks if active work exists for the specified scope.
   */
  hasActiveRegisterWork(
    userId?: string | null,
    businessId?: string | null,
    locationId?: string | null,
  ): RegisterWorkSummary {
    const draft = this.getDraft(userId, businessId, locationId);
    if (!draft) {
      return {
        hasCart: false,
        cartCount: 0,
        hasHeldTickets: false,
        heldCount: 0,
        isOutcomeUnknown: false,
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
    safeRemoveItem(getStorageKey(userId, businessId, locationId));
  },
};
