import type { CartLine, SavedDraft } from "../view-models";
import type { PaymentMethod } from "@/types/domain";
import type { OfflineDatabase } from "@/features/offline/db/offline-db";
import type { CartRecord, OfflineScope, SaleType } from "@/features/offline/core/types";
import { completeLegacyCart, discardHeldCart, holdActiveCart, importLegacyCarts, listHeldCarts, readActiveCart, resumeHeldCart, saveActiveCart } from "@/features/offline/core/cart";
import { OfflineError } from "@/features/offline/core/scope";

export interface RegisterData extends Record<string, unknown> {
  lines: CartLine[];
  customerName: string;
  customerPhone: string;
  showCustomerInput: boolean;
  paymentMethod: PaymentMethod;
  tendered: string;
}
export function emptyRegister(): RegisterData {
  return { lines: [], customerName: "", customerPhone: "", showCustomerInput: false, paymentMethod: "COD", tendered: "" };
}
export function registerData(raw: Record<string, unknown>): RegisterData {
  const lines = raw.lines ?? raw.cart ?? [];
  if (!Array.isArray(lines) || lines.some(line => !line || typeof line.variantId !== "string" ||
      typeof line.name !== "string" || typeof line.sku !== "string" ||
      !Number.isInteger(line.quantity) || line.quantity < 1 ||
      !Number.isInteger(line.unitPrice) || line.unitPrice < 0)) {
    throw new OfflineError("CART_CORRUPT", "The saved cart cannot be read safely. Its original data has been kept.");
  }
  const stringField = (key: string) => {
    if (raw[key] !== undefined && typeof raw[key] !== "string") throw new OfflineError("CART_CORRUPT", `Saved ${key} needs recovery.`);
    return (raw[key] as string | undefined) ?? "";
  };
  const paymentMethod = raw.paymentMethod ?? "COD";
  if (!["COD", "BKASH", "NAGAD", "BANK"].includes(String(paymentMethod))) throw new OfflineError("CART_CORRUPT", "The saved payment method needs recovery.");
  return {
    lines: structuredClone(lines), customerName: stringField("customerName"), customerPhone: stringField("customerPhone"),
    showCustomerInput: Boolean(raw.showCustomerInput), paymentMethod: paymentMethod as PaymentMethod, tendered: stringField("tendered"),
  };
}

/** Serializes draft writes within a tab; IndexedDB revision checks arbitrate other tabs. */
export class DurableRegisterSession<T extends Record<string, unknown> = RegisterData> {
  current: CartRecord | undefined;
  private pending: Promise<void> = Promise.resolve();
  private readonly decode: (raw: Record<string, unknown>) => T;
  private readonly empty: () => T;
  constructor(readonly db: OfflineDatabase, readonly scope: OfflineScope, readonly kind: SaleType = "CATALOG", projection?: { empty: () => T; decode: (raw: Record<string, unknown>) => T }) {
    this.decode = projection?.decode ?? (registerData as unknown as (raw: Record<string, unknown>) => T);
    this.empty = projection?.empty ?? (emptyRegister as unknown as () => T);
  }

  async initialize(legacy: { active?: Record<string, unknown>; held: SavedDraft[] }) {
    await importLegacyCarts(this.db, this.scope, {
      kind: this.kind,
      active: legacy.active ? { kind: this.kind, data: this.decode(legacy.active) } : undefined,
      held: legacy.held.map(draft => ({ id: draft.id, kind: this.kind, label: draft.label, data: { ...this.decode(draft as unknown as Record<string, unknown>), createdAt: draft.createdAt } })),
    });
    this.current = await readActiveCart(this.db, this.scope, this.kind);
    return this.projection();
  }

  projection(): T {
    return this.current?.state === "ACTIVE" ? this.decode(this.current.data) : this.empty();
  }

  save(data: T): Promise<void> {
    const snapshot = structuredClone(data);
    const next = this.pending.then(async () => {
      this.current = await saveActiveCart(this.db, this.scope, this.kind, snapshot, this.current?.revision ?? null);
    });
    this.pending = next;
    // Keep failure in the chain so later edits cannot silently proceed after a
    // CAS or disk failure. Callers display the failure and keep visible work.
    return next;
  }

  async flush(): Promise<CartRecord> {
    await this.pending;
    if (!this.current) throw new OfflineError("CART_EMPTY", "Save a cart before continuing.");
    return this.current;
  }
  settle(): Promise<void> { return this.pending; }

  async held(): Promise<SavedDraft[]> {
    return (await listHeldCarts(this.db, this.scope)).filter(cart => cart.kind === this.kind).map(cart => {
      const data = registerData(cart.data);
      return {
        id: cart.key, ...this.scope, label: cart.label ?? "Held draft", lines: data.lines,
        customerName: data.customerName, customerPhone: data.customerPhone, paymentMethod: data.paymentMethod,
        tendered: data.tendered, showCustomerInput: data.showCustomerInput,
        subtotal: data.lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0),
        itemCount: data.lines.reduce((sum, line) => sum + line.quantity, 0),
        createdAt: typeof cart.data.createdAt === "string" ? cart.data.createdAt : cart.updatedAt,
      };
    });
  }

  async hold(label: string) {
    const current = await this.flush();
    const result = await holdActiveCart(this.db, this.scope, this.kind, current.revision, label);
    this.current = result.active;
    return this.projection();
  }
  async resume(key: string) {
    await this.pending;
    this.current = await resumeHeldCart(this.db, this.scope, this.kind, key, this.current?.revision ?? null);
    return this.projection();
  }
  async discard(key: string) {
    await this.pending;
    const held = await this.db.drafts.get(key);
    await discardHeldCart(this.db, this.scope, this.kind, key, held?.revision);
  }
  async refreshAfterCheckout() {
    await this.pending;
    this.current = await readActiveCart(this.db, this.scope, this.kind);
    return this.projection();
  }
  async confirmLegacyCheckout(key: string) {
    const current = await this.flush();
    this.current = await completeLegacyCart(this.db, this.scope, this.kind, current.revision, key);
    return this.projection();
  }
}
