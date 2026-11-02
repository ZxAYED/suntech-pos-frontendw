/**
 * Scoped Financial Operation Idempotency Management (F06)
 *
 * Binds financial operation idempotency retry keys to immutable scope and payload:
 * { operationType, userId, businessId, locationId, scopeExtra, payloadHash, key, createdAt, outcome }
 *
 * Guarantees:
 * - Retries of the exact same operation with the same payload reuse the original key.
 * - Modifications to the payload or scope immediately generate a fresh key (or block retry if an outcome is uncertain).
 * - Uncertain outcomes (HTTP 0, 408, 5xx) persist in sessionStorage across page refreshes so
 *   the user can safely retry without generating duplicate financial records.
 * - User must explicitly reconcile with order/financial history before initiating a different operation if outcome was unknown.
 */

export type OperationType =
  | "catalog_sale"
  | "custom_sale"
  | "refund"
  | "payroll_process"
  | "payroll_disburse"
  | "advance_create"
  | "shift_open"
  | "shift_close";

export type OperationOutcome = "pending" | "unknown" | "success" | "failed";

export interface ScopedFinancialOperation<T = unknown> {
  operationType: OperationType;
  userId?: string | null;
  businessId?: string | null;
  locationId?: string | null;
  scopeExtra?: string | null;
  payloadHash: string;
  payloadSnapshot?: T;
  key: string;
  createdAt: number;
  outcome: OperationOutcome;
}

export interface OperationScopeParams {
  operationType: OperationType;
  userId?: string | null;
  businessId?: string | null;
  locationId?: string | null;
  scopeExtra?: string | null;
}

function stableStringify(obj: unknown): string {
  if (obj === undefined) {
    return "";
  }
  if (obj === null || typeof obj !== "object") {
    return JSON.stringify(obj) ?? "";
  }
  if (Array.isArray(obj)) {
    return "[" + obj.map(stableStringify).join(",") + "]";
  }
  const keys = Object.keys(obj as Record<string, unknown>).sort();
  return (
    "{" +
    keys
      .map(
        (k) =>
          `${JSON.stringify(k)}:${stableStringify(
            (obj as Record<string, unknown>)[k],
          )}`,
      )
      .join(",") +
    "}"
  );
}

export function computePayloadHash(payload: unknown): string {
  const str = stableStringify(payload) || "";
  let hash1 = 5381;
  let hash2 = 2166136261;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash1 = ((hash1 << 5) + hash1) ^ char;
    hash2 = (hash2 ^ char) * 16777619;
  }
  return `${(hash1 >>> 0).toString(36)}-${(hash2 >>> 0).toString(36)}-${str.length}`;
}

function getStorageKey(params: OperationScopeParams): string {
  const op = params.operationType;
  const u = params.userId || "anon";
  const b = params.businessId || "all";
  const l = params.locationId || "all";
  const e = params.scopeExtra || "root";
  return `stpos:finop:${op}:${u}:${b}:${l}:${e}`;
}

function safeGetItem(key: string): string | null {
  if (typeof window === "undefined" || !window.sessionStorage) return null;
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: string): void {
  if (typeof window === "undefined" || !window.sessionStorage) return;
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    // Ignore sessionStorage quota / privacy errors
  }
}

function safeRemoveItem(key: string): void {
  if (typeof window === "undefined" || !window.sessionStorage) return;
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    // Ignore sessionStorage errors
  }
}

export const financialOperations = {
  /**
   * Retrieves an existing pending or uncertain operation for the given scope, if any.
   */
  getPendingOperation<T = unknown>(params: OperationScopeParams): ScopedFinancialOperation<T> | null {
    const raw = safeGetItem(getStorageKey(params));
    if (!raw) return null;
    try {
      return JSON.parse(raw) as ScopedFinancialOperation<T>;
    } catch {
      return null;
    }
  },

  /**
   * Resolves or generates the scoped idempotency key for this operation.
   * - If an operation with identical payload hash is pending or unknown, reuses its key.
   * - If an operation is unknown but payload changed, throws an error requiring reconciliation.
   * - Otherwise, generates a new UUID idempotency key.
   */
  getOrCreateKey<T = unknown>(
    params: OperationScopeParams,
    payload: T,
  ): { key: string; isRetry: boolean; isOutcomeUnknown: boolean } {
    const payloadHash = computePayloadHash(payload);
    const existing = this.getPendingOperation<T>(params);

    if (existing) {
      if (existing.payloadHash === payloadHash) {
        // Exact identical request: reuse original key and backfill snapshot if missing
        if (existing.payloadSnapshot === undefined && payload !== undefined) {
          try {
            existing.payloadSnapshot = JSON.parse(JSON.stringify(payload)) as T;
            safeSetItem(getStorageKey(params), JSON.stringify(existing));
          } catch {
            // Ignore cloning errors
          }
        }
        return {
          key: existing.key,
          isRetry: true,
          isOutcomeUnknown: existing.outcome === "unknown",
        };
      }

      // Payload differs
      if (existing.outcome === "unknown") {
        throw new Error(
          "A transaction outcome is uncertain for this register. Please reconcile with order history or retry with the exact same ticket before starting a different transaction.",
        );
      }
    }

    // New operation: generate fresh UUID
    const newKey = globalThis.crypto?.randomUUID
      ? globalThis.crypto.randomUUID()
      : `key-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    let snapshot: T | undefined = undefined;
    if (payload !== undefined) {
      try {
        snapshot = JSON.parse(JSON.stringify(payload)) as T;
      } catch {
        snapshot = undefined;
      }
    }

    const record: ScopedFinancialOperation<T> = {
      ...params,
      payloadHash,
      payloadSnapshot: snapshot,
      key: newKey,
      createdAt: Date.now(),
      outcome: "pending",
    };

    safeSetItem(getStorageKey(params), JSON.stringify(record));
    return { key: newKey, isRetry: false, isOutcomeUnknown: false };
  },

  /**
   * Updates the outcome of the scoped operation.
   */
  recordOutcome(params: OperationScopeParams, outcome: OperationOutcome): void {
    const storageKey = getStorageKey(params);
    if (outcome === "success" || outcome === "failed") {
      safeRemoveItem(storageKey);
      return;
    }

    const existing = this.getPendingOperation(params);
    if (existing) {
      existing.outcome = outcome;
      safeSetItem(storageKey, JSON.stringify(existing));
    }
  },

  /**
   * Explicitly clears the scoped pending operation (e.g. after manual reconciliation).
   */
  clearOperation(params: OperationScopeParams): void {
    safeRemoveItem(getStorageKey(params));
  },

  /**
   * Checks whether any financial operation for the specified user/business/location has an uncertain outcome ("unknown").
   */
  hasUncertainOperations(
    userId?: string | null,
    businessId?: string | null,
    locationId?: string | null,
  ): boolean {
    if (typeof window === "undefined" || !window.sessionStorage) return false;
    const prefix = "stpos:finop:";
    const u = userId || "anon";
    const b = businessId || "all";
    const l = locationId || "all";
    try {
      for (let i = 0; i < window.sessionStorage.length; i++) {
        const k = window.sessionStorage.key(i);
        if (!k || !k.startsWith(prefix)) continue;
        const parts = k.split(":");
        // parts: ['stpos', 'finop', op, user, biz, loc, extra]
        if (parts.length >= 7) {
          const keyUser = parts[3];
          const keyBiz = parts[4];
          const keyLoc = parts[5];
          if (
            (keyUser === u || keyUser === "anon" || !userId) &&
            (keyBiz === b || keyBiz === "all" || !businessId) &&
            (keyLoc === l || keyLoc === "all" || !locationId)
          ) {
            const val = safeGetItem(k);
            if (val) {
              const parsed = JSON.parse(val) as ScopedFinancialOperation;
              if (parsed && parsed.outcome === "unknown") {
                return true;
              }
            }
          }
        }
      }
    } catch {
      return false;
    }
    return false;
  },
};
