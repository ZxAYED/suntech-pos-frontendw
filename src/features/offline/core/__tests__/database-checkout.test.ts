import "fake-indexeddb/auto";
import Dexie from "dexie";
import { afterEach, describe, expect, it } from "vitest";
import { checkoutInput, createSale, databases, newDb, scope, setup } from "./fixtures";
import { commitLocalSale, setNewIntakeDisabled } from "../checkout";
import { readCatalog } from "../bootstrap";
import { OfflineDatabase } from "../../db/offline-db";
import { activeCartKey } from "../cart";

afterEach(async () => { const rows=databases.splice(0); rows.forEach(db=>db.close()); for(const name of new Set(rows.map(db=>db.name))) await Dexie.delete(name); });
describe("real IndexedDB transactions", () => {
  it("upgrades the existing v1 category database without deleting prior rows", async () => {
    const name = `migration-${crypto.randomUUID()}`;
    const old = new Dexie(name); old.version(1).stores({ categorySnapshots: "key" });
    await old.table("categorySnapshots").put({ key: "old-scope", categories: [{ id: "legacy" }] }); old.close();
    const db = newDb(name);
    expect(await db.categorySnapshots.get("old-scope")).toEqual({ key: "old-scope", categories: [{ id: "legacy" }] });
    expect(await db.localSales.count()).toBe(0);
  });
  it("atomically saves the sale, receipt, outbox, negative stock delta and cart completion, surviving reopen", async () => {
    const { db, provision } = await setup(); const { sale } = await createSale(db, provision);
    expect(await db.receipts.count()).toBe(1); expect(await db.outbox.count()).toBe(1);
    expect((await db.drafts.get(activeCartKey(scope,"CATALOG")))?.finalizedBy).toBe(sale.clientOrderId);
    expect((await readCatalog(db,scope)).variants[0].stock).toBe(-1);
    db.close(); const reopened = new OfflineDatabase(db.name); databases.push(reopened);
    expect((await reopened.localSales.get(sale.clientOrderId))?.wire.shiftId).toBeNull();
    expect((await reopened.outbox.get(sale.clientOrderId))?.state).toBe("PENDING");
  });
  it("rolls back every financial write on quota failure and keeps the active cart", async () => {
    const { db, provision } = await setup(); const input = await checkoutInput(db, provision);
    db.receipts.hook("creating", () => { throw new DOMException("Disk full", "QuotaExceededError"); });
    await expect(commitLocalSale(db,input)).rejects.toMatchObject({ name: "QuotaExceededError" });
    expect(await db.localSales.count()).toBe(0); expect(await db.outbox.count()).toBe(0); expect(await db.stockOverlays.count()).toBe(0);
    expect((await db.drafts.get(input.cartKey))?.state).toBe("ACTIVE");
  });
  it("allows exactly one of two tabs to complete the same cart", async () => {
    const { db, provision } = await setup(); const input = await checkoutInput(db, provision);
    const second = new OfflineDatabase(db.name); databases.push(second);
    const results = await Promise.allSettled([commitLocalSale(db,input), commitLocalSale(second,{ ...input, clientOrderId:crypto.randomUUID() })]);
    expect(results.filter(r=>r.status==="fulfilled")).toHaveLength(1);
    expect(await db.localSales.count()).toBe(1); expect(await db.outbox.count()).toBe(1);
  });
  it("reuses a matching original ID but rejects changed content under that ID", async () => {
    const { db, provision } = await setup(); const input = await checkoutInput(db, provision);
    await commitLocalSale(db,input); await commitLocalSale(db,input);
    expect(await db.localSales.count()).toBe(1); expect(await db.stockOverlays.count()).toBe(1);
    await expect(commitLocalSale(db,{...input,tenderedAmount:2000})).rejects.toMatchObject({code:"SALE_ID_CONFLICT"});
  });
  it("refuses a payload that does not match the cart being finalized",async()=>{
    const{db,provision}=await setup();const input=await checkoutInput(db,provision);
    await expect(commitLocalSale(db,{...input,lines:[{...input.lines[0],quantity:3}]})).rejects.toMatchObject({code:"CART_CONTENT_MISMATCH"});
    expect(await db.localSales.count()).toBe(0);expect((await db.drafts.get(input.cartKey))?.state).toBe("ACTIVE");
  });
  it("has no 100-sale cap and never bypasses local storage for online sales", async () => {
    const { db, provision } = await setup();
    for(let index=0;index<101;index++) await createSale(db,provision);
    expect(await db.localSales.count()).toBe(101); expect(await db.outbox.count()).toBe(101); expect(await db.receipts.count()).toBe(101);
  },30000);
  it("stops new intake without deleting an already saved queue", async () => {
    const { db, provision } = await setup(); await createSale(db,provision); const next=await checkoutInput(db,provision);
    await setNewIntakeDisabled(db,true);
    await expect(commitLocalSale(db,next)).rejects.toMatchObject({code:"INTAKE_DISABLED"});
    expect(await db.outbox.count()).toBe(1); expect((await db.drafts.get(next.cartKey))?.state).toBe("ACTIVE");
  });
  it("rejects overflow and invalid tender before making any financial writes", async()=>{
    const {db,provision}=await setup(); const input=await checkoutInput(db,provision);
    await expect(commitLocalSale(db,{...input,tenderedAmount:2_147_483_648})).rejects.toMatchObject({code:"INVALID_MONEY"});
    await expect(commitLocalSale(db,{...input,tenderedAmount:1})).rejects.toMatchObject({code:"INSUFFICIENT_TENDER"});
    expect(await db.localSales.count()).toBe(0);
  });
});
