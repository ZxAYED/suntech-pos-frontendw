"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SavedDraft } from "../view-models";
import { belongsToRegister } from "../view-models";
import { DurableRegisterSession, emptyRegister, type RegisterData } from "../utils/durable-register-session";
import type { OfflineScope } from "@/features/offline/core/types";
import { OfflineError, scopeKey } from "@/features/offline/core/scope";
import { offlineDb } from "@/features/offline/db/offline-db";
import { registerGuard } from "@/lib/register-guard";
import { DRAFTS_STORAGE_KEY } from "@/redux/storage";
import { registerDraftFlusher } from "@/features/offline/services/draft-flush";
import { prepareLegacyRecovery } from "@/features/offline/services/legacy-recovery";
import { legacyCatalogCart } from "../utils/legacy-catalog-cart";

function legacyRegister(scope: OfflineScope, hasRecoveryIdentity: boolean): { active?: Record<string, unknown>; held: SavedDraft[] } {
  const read = registerGuard.readDraft(scope.userId, scope.businessId, scope.locationId);
  if (read.status === "corrupt" || read.status === "unavailable") throw new OfflineError("LEGACY_RECOVERY_REQUIRED", "Existing register storage needs recovery. No old cart has been removed.");
  if (read.draft?.outcomeUnknown && !hasRecoveryIdentity) throw new OfflineError("LEGACY_IDENTITY_MISSING", "An old checkout is marked uncertain but its original identity is missing. Administrator recovery is required before new sales.");
  let globalDrafts: unknown;
  try {
    const raw = window.localStorage.getItem(DRAFTS_STORAGE_KEY);
    globalDrafts = raw === null ? [] : JSON.parse(raw);
  } catch { throw new OfflineError("LEGACY_RECOVERY_REQUIRED", "Saved draft storage cannot be read. Keep this register open for recovery."); }
  if (!Array.isArray(globalDrafts)) throw new OfflineError("LEGACY_RECOVERY_REQUIRED", "Saved drafts are unreadable; the original storage has been kept.");
  const held = globalDrafts.filter(draft => draft && typeof draft === "object" && belongsToRegister(draft as SavedDraft, scope)) as SavedDraft[];
  // Older versions kept a scoped copy of held tickets as well as the global list.
  for (const draft of read.draft?.heldTickets ?? []) {
    if (!held.some(existing => existing.id === draft.id)) held.push({ ...draft, userId: scope.userId, businessId: scope.businessId, locationId: scope.locationId });
  }
  return { active: read.draft ? read.draft as unknown as Record<string, unknown> : undefined, held };
}

export function useDurableRegister(scope: OfflineScope | null) {
  const key = scope ? scopeKey(scope) : null;
  const [data, setData] = useState<RegisterData>(emptyRegister);
  const [held, setHeld] = useState<SavedDraft[]>([]);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resultKey, setResultKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [legacyPending, setLegacyPending] = useState(false);
  const busyRef = useRef(false);
  const sessionRef = useRef<DurableRegisterSession | null>(null);
  const dataRef = useRef(data);
  const projection = useCallback((next: RegisterData) => { dataRef.current = next; setData(next); }, []);

  useEffect(() => {
    let cancelled = false;
    const session = scope ? new DurableRegisterSession(offlineDb, scope) : null;
    sessionRef.current = session;
    busyRef.current = false;
    if (!session) return;
    const unregister = registerDraftFlusher(() => session.settle());
    void (async () => {
      const legacy = await prepareLegacyRecovery(offlineDb, session.scope, "catalog_sale");
      // Once imported, the unchanged legacy keys remain evidence, not a source
      // to re-import after a completed sale or an intentional held-cart discard.
      const marker = await offlineDb.metadata.get(`legacy-cart-import:${scopeKey(session.scope)}:CATALOG`);
      const oldDrafts = marker ? { held: [] } : legacyRegister(session.scope, Boolean(legacy));
      let next = await session.initialize(!marker && legacy && !("active" in oldDrafts && oldDrafts.active)
        ? { ...oldDrafts, active: legacyCatalogCart(legacy) } : oldDrafts);
      // A copied recovery backup can have the old migration marker but no active
      // cart. Restore only a genuinely absent cart, with CAS; keep existing work.
      if (legacy && !session.current) {
        await session.save(legacyCatalogCart(legacy));
        next = session.projection();
      }
      const drafts = await session.held();
      if (cancelled) return;
      projection(next);
      setHeld(drafts);
      setLoadedKey(key);
      setResultKey(key);
      setError(null);
      setBusy(false);
      setLegacyPending(Boolean(legacy));
    })().catch(reason => {
      if (!cancelled) {
        setResultKey(key);
        setLoadedKey(null);
        setBusy(false);
        setError(reason instanceof Error ? reason.message : "Register storage is unavailable.");
      }
    });
    return () => { cancelled = true; unregister(); };
  }, [key, scope, projection]);

  const update = (change: (current: RegisterData) => RegisterData) => {
    const session = sessionRef.current;
    if (!session || scopeKey(session.scope) !== key || loadedKey !== key || error || busyRef.current) return;
    const next = change(dataRef.current);
    projection(next);
    void session.save(next).catch(reason => {
      if (sessionRef.current === session) setError(reason instanceof Error ? reason.message : "Draft could not be saved. Keep this page open.");
    });
  };

  const run = async (action: (session: DurableRegisterSession) => Promise<RegisterData | void>) => {
    const session = sessionRef.current;
    if (!session || scopeKey(session.scope) !== key || loadedKey !== key || error || busyRef.current) throw new OfflineError("REGISTER_NOT_READY", error ?? "Wait for register recovery to finish.");
    busyRef.current = true;
    setBusy(true);
    try {
      const next = await action(session);
      const drafts = await session.held();
      if (sessionRef.current === session) {
        if (next) projection(next);
        setHeld(drafts);
      }
    } catch (reason) {
      if (sessionRef.current === session && !(reason instanceof OfflineError && ["CART_OCCUPIED", "HELD_CART_LIMIT", "CART_EMPTY"].includes(reason.code))) {
        setError(reason instanceof Error ? reason.message : "Register could not be saved. Keep this page open.");
      }
      throw reason;
    } finally { if (sessionRef.current === session) { busyRef.current = false; setBusy(false); } }
  };

  return {
    data: loadedKey === key ? data : emptyRegister(), held: loadedKey === key ? held : [], update,
    busy: loadedKey === key && busy, error: resultKey === key ? error : null,
    legacyPending: loadedKey === key && legacyPending,
    ready: Boolean(key && loadedKey === key && !error),
    flush: () => {
      const session = sessionRef.current;
      if (!session || scopeKey(session.scope) !== key || loadedKey !== key || error) return Promise.reject(new OfflineError("REGISTER_NOT_READY", error ?? "The saved cart is still loading."));
      return session.flush();
    },
    hold: (label: string) => run(session => session.hold(label)),
    resume: (id: string) => run(session => session.resume(id)),
    discard: (id: string) => run(session => session.discard(id)),
    refreshAfterCheckout: () => run(session => session.refreshAfterCheckout()),
    confirmLegacyCheckout: async (id: string) => {
      const originalSession = sessionRef.current;
      await run(session => session.confirmLegacyCheckout(id));
      if (sessionRef.current === originalSession) setLegacyPending(false);
    },
  };
}
