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

import { createIdempotencyKey } from "@/lib/idempotency";

export type OperationType =
  | "catalog_sale"
  | "custom_sale"
  | "refund"
  | "expense_create"
  | "payroll_process"
  | "payroll_disburse"
  | "advance_create"
  | "shift_open"
  | "shift_close";

export type OperationOutcome = "pending" | "unknown" | "success" | "failed";
export type FinancialDeliveryProtocol = "LEGACY_HTTP" | "LOCAL_FIRST_V2";

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
  /** Missing on older records. Missing ALWAYS means the original HTTP route. */
  deliveryProtocol?: FinancialDeliveryProtocol;
}

export interface ArchivedFinancialOperation<T = unknown> extends ScopedFinancialOperation<T> {
  resolution: string;
  archivedAt: number;
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

function getArchiveKey(params: OperationScopeParams, key: string): string {
  const op = params.operationType;
  const u = params.userId || "anon";
  const b = params.businessId || "all";
  const l = params.locationId || "all";
  const e = params.scopeExtra || "root";
  return `stpos:finop:archived:${op}:${u}:${b}:${l}:${e}:${key}`;
}

function getStorageOrThrow(): Storage {
  if (typeof window === "undefined") {
    throw new Error("Financial operations cannot be initiated outside browser context.");
  }
  try {
    const s = window.sessionStorage;
    if (!s) {
      throw new Error("Browser storage is unavailable. Cannot safely initiate financial operations.");
    }
    return s;
  } catch (err) {
    if (err instanceof Error && err.message.includes("Browser storage is unavailable")) {
      throw err;
    }
    throw new Error("Storage access is denied. Financial operations cannot be safely initiated.");
  }
}

function safeGetStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage || null;
  } catch {
    return null;
  }
}

export const financialOperations = {
  /** Restore copied legacy evidence after browser restart, never replace a live identity. */
  restoreLegacyOperation<T>(params: OperationScopeParams, record: ScopedFinancialOperation<T>): ScopedFinancialOperation<T> {
    if (!record || getStorageKey(record) !== getStorageKey(params) ||
        (record.deliveryProtocol !== undefined && record.deliveryProtocol !== "LEGACY_HTTP") ||
        typeof record.key !== "string" || !record.key || typeof record.payloadHash !== "string" || !record.payloadHash ||
        !Number.isFinite(record.createdAt) || !["pending", "unknown"].includes(record.outcome)) {
      throw new Error("The original legacy financial record needs recovery; no new identity was created.");
    }
    const existing = this.getPendingOperation<T>(params);
    if (existing) {
      if (existing.key !== record.key || existing.payloadHash !== record.payloadHash ||
          stableStringify(existing.payloadSnapshot) !== stableStringify(record.payloadSnapshot) ||
          (existing.deliveryProtocol ?? "LEGACY_HTTP") !== "LEGACY_HTTP") {
        throw new Error("Two different saved financial operations need reconciliation. Both copies have been kept.");
      }
      return existing;
    }
    const storage = getStorageOrThrow();
    const encoded = JSON.stringify(record);
    storage.setItem(getStorageKey(params), encoded);
    if (storage.getItem(getStorageKey(params)) !== encoded) throw new Error("The legacy recovery identity could not be restored safely.");
    return record;
  },
  /**
   * Retrieves an existing pending or uncertain operation for the given scope, if any.
   * Throws an explicit error if a record exists but is unreadable/corrupted.
   */
  getPendingOperation<T = unknown>(params: OperationScopeParams): ScopedFinancialOperation<T> | null {
    if (typeof window === "undefined") return null;
    const storage = getStorageOrThrow();
    const key = getStorageKey(params);
    let raw: string | null = null;
    try {
      raw = storage.getItem(key);
    } catch {
      throw new Error("Failed to read financial operation from storage.");
    }
    if (raw === null) return null;
    try {
      const parsed = JSON.parse(raw) as ScopedFinancialOperation<T>;
      if (!parsed || typeof parsed !== "object" || typeof parsed.key !== "string" || !parsed.key ||
          typeof parsed.payloadHash !== "string" || !parsed.payloadHash ||
          !Number.isFinite(parsed.createdAt) ||
          !["pending", "unknown", "success", "failed"].includes(parsed.outcome) ||
          (parsed.deliveryProtocol !== undefined && parsed.deliveryProtocol !== "LEGACY_HTTP" && parsed.deliveryProtocol !== "LOCAL_FIRST_V2") ||
          getStorageKey(parsed) !== key) {
        throw new Error("Invalid structure");
      }
      return parsed;
    } catch {
      throw new Error(
        "Unreadable financial operation record in storage. Please reconcile with order history before proceeding.",
      );
    }
  },

  /**
   * Resolves or generates the scoped idempotency key for this operation.
   * - Ensures storage write succeeds before returning any key.
   * - If an operation with identical payload hash is pending or unknown, reuses its key.
   * - If an operation is pending or unknown but payload changed, throws an error requiring reconciliation.
   * - Otherwise, generates a new UUID idempotency key and commits it to storage.
   */
  getOrCreateKey<T = unknown>(
    params: OperationScopeParams,
    payload: T,
    deliveryProtocol: FinancialDeliveryProtocol = "LEGACY_HTTP",
  ): { key: string; isRetry: boolean; isOutcomeUnknown: boolean; deliveryProtocol: FinancialDeliveryProtocol } {
    const storage = getStorageOrThrow();
    const payloadHash = computePayloadHash(payload);
    const existing = this.getPendingOperation<T>(params);

    if (existing) {
      const existingProtocol = existing.deliveryProtocol ?? "LEGACY_HTTP";
      if (existingProtocol !== deliveryProtocol) {
        throw new Error("This saved transaction belongs to a different delivery protocol. Recover it using its original route and identity.");
      }
      // Preserve the historical hash format, but never allow a hash collision
      // to turn a changed saved request into an apparently identical retry.
      const sameSnapshot = existing.payloadSnapshot === undefined ||
        stableStringify(existing.payloadSnapshot) === stableStringify(payload === undefined ? undefined : JSON.parse(JSON.stringify(payload)));
      if (existing.payloadHash === payloadHash && sameSnapshot) {
        // Exact identical request: reuse original key and backfill snapshot if missing
        if (existing.payloadSnapshot === undefined && payload !== undefined) {
          try {
            existing.payloadSnapshot = JSON.parse(JSON.stringify(payload)) as T;
            const encoded = JSON.stringify(existing);
            storage.setItem(getStorageKey(params), encoded);
            if (storage.getItem(getStorageKey(params)) !== encoded) throw new Error("Write verification failed");
          } catch {
            throw new Error(
              "Failed to persist financial operation to storage (storage quota exceeded or storage disabled).",
            );
          }
        }
        return {
          key: existing.key,
          isRetry: true,
          isOutcomeUnknown: existing.outcome === "unknown",
          deliveryProtocol: existingProtocol,
        };
      }

      // Payload differs
      if (existing.outcome === "unknown") {
        throw new Error(
          "A transaction outcome is uncertain for this register. Please reconcile with order history or retry with the exact same ticket before starting a different transaction.",
        );
      }
      if (existing.outcome === "pending") {
        throw new Error(
          "A financial transaction is currently pending for this register. Please wait for completion or retry with the exact same ticket before starting a different transaction.",
        );
      }
    }

    // New operation: generate fresh UUID
    const newKey = createIdempotencyKey();

    let snapshot: T | undefined = undefined;
    if (payload !== undefined) {
      try {
        snapshot = JSON.parse(JSON.stringify(payload)) as T;
      } catch {
        throw new Error("Financial operation payload cannot be saved for exact recovery.");
      }
    }

    const record: ScopedFinancialOperation<T> = {
      ...params,
      payloadHash,
      payloadSnapshot: snapshot,
      key: newKey,
      createdAt: Date.now(),
      outcome: "pending",
      deliveryProtocol,
    };

    const storageKey = getStorageKey(params);
    const serialized = JSON.stringify(record);
    try {
      storage.setItem(storageKey, serialized);
    } catch {
      throw new Error(
        "Failed to persist financial operation to storage (storage quota exceeded or storage disabled).",
      );
    }

    const verified = storage.getItem(storageKey);
    if (verified !== serialized) {
      throw new Error(
        "Failed to verify financial operation persistence in storage.",
      );
    }

    return { key: newKey, isRetry: false, isOutcomeUnknown: false, deliveryProtocol };
  },

  /**
   * Updates the outcome of the scoped operation.
   */
  recordOutcome(params: OperationScopeParams, outcome: OperationOutcome): void {
    const storage = safeGetStorage();
    if (!storage) return;
    const storageKey = getStorageKey(params);
    if (outcome === "success" || outcome === "failed") {
      try {
        storage.removeItem(storageKey);
      } catch {
        // Ignore removal errors
      }
      return;
    }

    try {
      const existing = this.getPendingOperation(params);
      if (existing) {
        existing.outcome = outcome;
        storage.setItem(storageKey, JSON.stringify(existing));
      }
    } catch {
      // Ignore outcome persistence errors to avoid masking upstream error
    }
  },

  /**
   * Reconciles an uncertain or pending operation by moving it into durable archived storage
   * with the resolution reason and timestamp, then clears the active register lock so
   * subsequent sales may proceed without erasing recovery evidence (ST-F06).
   */
  reconcileOperation(params: OperationScopeParams, resolution: string): boolean {
    const storage = safeGetStorage();
    if (!storage) return false;
    try {
      const existing = this.getPendingOperation(params);
      if (!existing) return false;
      const archived: ArchivedFinancialOperation = {
        ...existing,
        resolution,
        archivedAt: Date.now(),
      };
      const archiveKey = getArchiveKey(params, existing.key);
      const legacyArchiveKey = `stpos:finop:archived:${existing.key}`;
      const serialized = JSON.stringify(archived);
      // Keep the active lock until both archive writes can be read back.
      // A partial archive is harmless; a missing active operation is not.
      storage.setItem(archiveKey, serialized);
      storage.setItem(legacyArchiveKey, serialized);
      if (storage.getItem(archiveKey) !== serialized || storage.getItem(legacyArchiveKey) !== serialized) return false;
      storage.removeItem(getStorageKey(params));
      return storage.getItem(getStorageKey(params)) === null;
    } catch {
      return false;
    }
  },

  /**
   * Retrieves an archived financial operation by key to verify historical/recovery evidence.
   */
  getArchivedOperation<T = unknown>(
    params: OperationScopeParams,
    key: string,
  ): ArchivedFinancialOperation<T> | null {
    const storage = safeGetStorage();
    if (!storage) return null;
    const archiveKey = getArchiveKey(params, key);
    let raw: string | null = null;
    try {
      raw = storage.getItem(archiveKey);
      if (!raw) {
        raw = storage.getItem(`stpos:finop:archived:${key}`);
      }
    } catch {
      return null;
    }
    if (!raw) return null;
    try {
      const record = JSON.parse(raw) as ArchivedFinancialOperation<T>;
      return record?.key === key && getArchiveKey(record, key) === archiveKey ? record : null;
    } catch {
      return null;
    }
  },

  /**
   * Explicitly clears the scoped pending operation after archiving evidence (ST-F06).
   */
  clearOperation(params: OperationScopeParams): boolean {
    return this.reconcileOperation(params, "operator_manual_clear");
  },

  /**
   * Checks whether any financial operation for the specified user/business/location has an uncertain outcome ("unknown").
   */
  hasUncertainOperations(
    userId?: string | null,
    businessId?: string | null,
    locationId?: string | null,
  ): boolean {
    const storage = safeGetStorage();
    if (!storage) return typeof window !== "undefined";
    const prefix = "stpos:finop:";
    const u = userId || "anon";
    const b = businessId || "all";
    const l = locationId || "all";
    try {
      for (let i = 0; i < storage.length; i++) {
        const k = storage.key(i);
        if (!k || !k.startsWith(prefix) || k.startsWith(`${prefix}archived:`)) continue;
        const parts = k.split(":");
        // parts: ['stpos', 'finop', op, user, biz, loc, extra]
        if (parts.length >= 7) {
          const keyUser = parts[3];
          const keyBiz = parts[4];
          const keyLoc = parts[5];
          if (
            (keyUser === u || !userId) &&
            (keyBiz === b || !businessId) &&
            (keyLoc === l || !locationId)
          ) {
            const val = storage.getItem(k);
            if (val) {
              try {
                const parsed = JSON.parse(val) as ScopedFinancialOperation;
                if (parsed && (parsed.outcome === "unknown" || parsed.outcome === "pending")) {
                  return true;
                }
              } catch {
                // If corrupted, treat as requiring attention
                return true;
              }
            }
          }
        }
      }
    } catch {
      // Read failure cannot establish that no unfinished financial work exists.
      return true;
    }
    return false;
  },
};
