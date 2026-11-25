import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OfflineDatabase } from "@/features/offline/db/offline-db";
import { readActiveCart } from "@/features/offline/core/cart";
import { OfflineError } from "@/features/offline/core/scope";
import { DurableRegisterSession, emptyRegister } from "../utils/durable-register-session";
import { localCommitStatus } from "../utils/local-commit-status";

const scope = { userId: "operator", businessId: "business", locationId: "branch", deviceId: "device" };
const filled = () => ({ ...emptyRegister(), lines: [{ variantId: "variant", name: "Shirt", sku: "S1", quantity: 1, unitPrice: 500, stock: -2 }], customerName: "Customer", paymentMethod: "BKASH" as const });

describe("The production register session coordinates the real IndexedDB draft", () => {
  let db: OfflineDatabase;
  let session: DurableRegisterSession;
  beforeEach(async () => {
    db = new OfflineDatabase(`register-test-${crypto.randomUUID()}`);
    await db.open();
    session = new DurableRegisterSession(db, scope);
    await session.initialize({ held: [] });
  });
  afterEach(async () => { vi.restoreAllMocks(); await db.delete(); });

  it("queues rapid edits in order and takes a snapshot before awaiting storage", async () => {
    const first = filled();
    const write1 = session.save(first);
    first.lines[0].quantity = 99;
    const second = { ...filled(), customerName: "Final customer" };
    const write2 = session.save(second);
    await Promise.all([write1, write2]);
    const persisted = await session.flush();
    expect(persisted.revision).toBe(2);
    expect(persisted.data.lines).toMatchObject([{ quantity: 1, stock: -2 }]);
    expect(persisted.data.customerName).toBe("Final customer");
  });

  it("detects a second tab changing the cart and never overwrites its edit", async () => {
    await session.save(filled());
    const otherTab = new DurableRegisterSession(db, scope);
    await otherTab.initialize({ held: [] });
    await session.save({ ...filled(), customerName: "Saved by tab A" });
    await expect(otherTab.save({ ...filled(), customerName: "Stale tab B" })).rejects.toMatchObject({ code: "CART_CHANGED" });
    expect((await readActiveCart(db, scope, "CATALOG"))?.data.customerName).toBe("Saved by tab A");
  });

  it("keeps the last durable cart when storage fails and stops the write queue", async () => {
    await session.save(filled());
    const original = await session.flush();
    const write = vi.spyOn(db.drafts, "put").mockRejectedValueOnce(new DOMException("Storage full", "QuotaExceededError"));
    await expect(session.save({ ...filled(), customerName: "Unsaved edit" })).rejects.toThrow("Storage full");
    await expect(session.save({ ...filled(), customerName: "Later edit" })).rejects.toThrow("Storage full");
    expect(write).toHaveBeenCalledTimes(1);
    expect(await readActiveCart(db, scope, "CATALOG")).toEqual(original);
  });

  it("holds then resumes customer, payment, quantity and negative stock exactly", async () => {
    const data = { ...filled(), tendered: "1000", showCustomerInput: true };
    await session.save(data);
    expect((await session.hold("Waiting customer")).lines).toHaveLength(0);
    const held = await session.held();
    expect(held).toHaveLength(1);
    expect(held[0]).toMatchObject({ customerName: data.customerName, paymentMethod: "BKASH", tendered: "1000" });
    expect(await session.resume(held[0].id)).toEqual(data);
    expect(await session.held()).toHaveLength(0);
  });

  it("refuses resume into an occupied cart without dropping either ticket", async () => {
    await session.save(filled());
    await session.hold("Original held ticket");
    const [held] = await session.held();
    await session.save({ ...filled(), customerName: "New active ticket" });
    await expect(session.resume(held.id)).rejects.toMatchObject({ code: "CART_OCCUPIED" });
    expect(await session.held()).toHaveLength(1);
    expect((await readActiveCart(db, scope, "CATALOG"))?.data.customerName).toBe("New active ticket");
  });

  it("clears the imported cart after confirmed legacy replay without creating a V2 sale", async () => {
    await session.save(filled());
    const cleared = await session.confirmLegacyCheckout("11111111-1111-4111-8111-111111111111");
    expect(cleared.lines).toHaveLength(0);
    expect(await db.localSales.count()).toBe(0);
    expect(await db.outbox.count()).toBe(0);
    const stored = await readActiveCart(db, scope, "CATALOG");
    expect(stored?.state).toBe("COMPLETED");
    const name = db.name;
    db.close();
    db = new OfflineDatabase(name);
    const reopened = new DurableRegisterSession(db, scope);
    // The unchanged old source is kept as evidence; the import marker stops
    // it resurrecting a cart which was already completed.
    expect((await reopened.initialize({ active: filled(), held: [] })).lines).toHaveLength(0);
    await reopened.save({ ...filled(), customerName: "Next purchase" });
    expect((await reopened.flush()).revision).toBe(stored!.revision + 1);
  });

  it("custom and catalog sessions keep separate cart kinds and migration markers", async () => {
    await session.save(filled());
    type CustomData = { lines: Array<{ productName: string; quantity: number; unitPrice: number }>; customer: { customerName: string } };
    const empty = (): CustomData => ({ lines: [], customer: { customerName: "" } });
    const custom = new DurableRegisterSession<CustomData>(db, scope, "CUSTOM", { empty, decode: raw => raw as CustomData });
    await custom.initialize({ held: [] });
    const customData = { lines: [{ productName: "Tailoring", quantity: 2, unitPrice: 200 }], customer: { customerName: "Custom customer" } };
    await custom.save(customData);
    expect((await custom.flush()).kind).toBe("CUSTOM");
    expect((await readActiveCart(db, scope, "CATALOG"))?.data.lines).toEqual(filled().lines);
  });

  it("does not clear an identity just because local evidence is unreadable", async () => {
    expect(await localCommitStatus(db, "new-id")).toBe("NOT_SAVED");
    expect(await localCommitStatus(db, "new-id", new OfflineError("RECEIPT_MISSING", "Needs recovery"))).toBe("UNKNOWN");
    vi.spyOn(db.localSales, "get").mockRejectedValueOnce(new Error("Database unavailable"));
    expect(await localCommitStatus(db, "new-id")).toBe("UNKNOWN");
  });
});
