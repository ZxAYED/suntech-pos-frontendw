"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { DurableRegisterSession } from "../utils/durable-register-session";
import { offlineDb } from "@/features/offline/db/offline-db";
import { OfflineError, scopeKey } from "@/features/offline/core/scope";
import type { OfflineScope } from "@/features/offline/core/types";
import type { CustomSaleLineForm } from "../view-models";
import type { PaymentMethod } from "@/types/domain";
import { registerDraftFlusher } from "@/features/offline/services/draft-flush";
import { financialOperations } from "@/lib/financial-operation";
import { prepareLegacyRecovery } from "@/features/offline/services/legacy-recovery";

export interface CustomDraft extends Record<string, unknown> {
  lines: CustomSaleLineForm[]; customer: { customerName: string; customerPhone: string };
  paymentMethod: PaymentMethod; tendered: string;
}
export const emptyCustomDraft = (): CustomDraft => ({ lines: [{ id: crypto.randomUUID(), productName: "", quantity: 1, unitPrice: "" }], customer: { customerName: "", customerPhone: "" }, paymentMethod: "COD", tendered: "" });
export function decodeCustomDraft(raw: Record<string, unknown>): CustomDraft {
  if (!Array.isArray(raw.lines) || raw.lines.some(line => !line || typeof line.id !== "string" || typeof line.productName !== "string" || !Number.isSafeInteger(line.quantity) || line.quantity < 1 || !(line.unitPrice === "" || (typeof line.unitPrice === "number" && Number.isFinite(line.unitPrice))))) throw new OfflineError("CART_CORRUPT", "The saved custom cart cannot be read safely. Its original record has been kept.");
  const customer = raw.customer as CustomDraft["customer"] | undefined;
  if (!customer || typeof customer.customerName !== "string" || typeof customer.customerPhone !== "string" || typeof raw.tendered !== "string" || !["COD", "BKASH", "NAGAD", "BANK"].includes(String(raw.paymentMethod))) throw new OfflineError("CART_CORRUPT", "Saved custom payment or customer details need recovery.");
  return structuredClone(raw) as CustomDraft;
}

export function useDurableCustomSale(scope: OfflineScope | null) {
  const key = scope ? scopeKey(scope) : null;
  const [data, setData] = useState<CustomDraft>(emptyCustomDraft);
  const [loaded, setLoaded] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [legacyPending, setLegacyPending] = useState(false);
  const [legacySnapshot, setLegacySnapshot] = useState(false);
  const emptyForScope = useMemo(() => { void key; return emptyCustomDraft(); }, [key]);
  const sessionRef = useRef<DurableRegisterSession<CustomDraft> | null>(null);
  const dataRef = useRef(data);
  useEffect(() => {
    let cancelled = false;
    const session = scope ? new DurableRegisterSession(offlineDb, scope, "CUSTOM", { empty: emptyCustomDraft, decode: decodeCustomDraft }) : null;
    sessionRef.current = session;
    if (!session) return;
    const unregister = registerDraftFlusher(() => session.settle());
    void (async () => {
      const recovered = await prepareLegacyRecovery(offlineDb, session.scope, "custom_sale");
      const marker = await offlineDb.metadata.get(`legacy-cart-import:${scopeKey(session.scope)}:CUSTOM`);
      let legacy: CustomDraft | undefined;
      if (!marker || recovered) {
        const op = financialOperations.getPendingOperation<{ lines?: Array<{ productName: string; variantName?: string; quantity: number; unitPrice: number }>; customerName?: string; customerPhone?: string; paymentMethod?: PaymentMethod; tenderedAmount?: number }>({ ...session.scope, operationType: "custom_sale" });
        if (op && ["unknown", "pending"].includes(op.outcome) && op.payloadSnapshot?.lines?.length) {
          const payload = op.payloadSnapshot;
          legacy = { lines: payload.lines!.map(line => ({ ...line, id: crypto.randomUUID() })), customer: { customerName: payload.customerName || "", customerPhone: payload.customerPhone || "" }, paymentMethod: payload.paymentMethod || "COD", tendered: String(payload.tenderedAmount ?? "") };
        }
      }
      let next = await session.initialize({ active: marker ? undefined : legacy, held: [] });
      // Restored legacy evidence can carry its migration marker without an
      // active cart. Recover that original snapshot only if no cart exists.
      if (recovered && legacy && !session.current) {
        await session.save(legacy);
        next = session.projection();
      }
      if (cancelled) return;
      dataRef.current = next; setData(next); setLoaded(key); setError(null); setErrorKey(key);
      setLegacyPending(Boolean(recovered));
      setLegacySnapshot(Boolean((recovered?.payloadSnapshot as { lines?: unknown[] } | undefined)?.lines?.length));
    })().catch(cause => { if (!cancelled) { setErrorKey(key); setError(cause instanceof Error ? cause.message : "Custom cart storage unavailable."); } });
    return () => { cancelled = true; unregister(); };
  }, [scope, key]);
  const update = (change: (current: CustomDraft) => CustomDraft) => {
    const session = sessionRef.current;
    if (!session || scopeKey(session.scope) !== key || loaded !== key || (errorKey === key && error)) return;
    const next = change(dataRef.current); dataRef.current = next; setData(next);
    void session.save(next).catch(cause => { if (sessionRef.current === session) { setErrorKey(key); setError(cause instanceof Error ? cause.message : "Could not save this custom cart."); } });
  };
  const afterCheckout = async (legacyId?: string) => {
    const session = sessionRef.current;
    if (!session || scopeKey(session.scope) !== key) throw new OfflineError("SCOPE_CHANGED", "The operator or branch changed. Recover the receipt in its original register.");
    const next = legacyId ? await session.confirmLegacyCheckout(legacyId) : await session.refreshAfterCheckout();
    if (sessionRef.current === session) { dataRef.current = next; setData(next); setLegacyPending(false); setLegacySnapshot(false); }
  };
  const currentError = errorKey === key ? error : null;
  return { data: loaded === key ? data : emptyForScope, update, error: currentError, ready: !!key && loaded === key && !currentError,
    legacyPending: loaded === key && legacyPending, legacySnapshot: loaded === key && legacySnapshot,
    flush: async () => {
      const session = sessionRef.current;
      if (!session || !key || scopeKey(session.scope) !== key || loaded !== key || currentError) throw new OfflineError("REGISTER_NOT_READY", currentError || "Wait for the custom cart to finish loading.");
      if (!session.current) await session.save(dataRef.current);
      return session.flush();
    }, afterCheckout,
  };
}
