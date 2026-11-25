import "fake-indexeddb/auto";
import Dexie from "dexie";
import { afterEach, describe, expect, it } from "vitest";
import { bootstrapFor, checkoutInput, createSale, databases, provisioning, scope, setup } from "./fixtures";
import { commitLocalSale } from "../checkout";
import { installProvisioning, lockOffline, markOfflinePermissionRejected, setLocalUnlock, unlockOffline, verifySavedPermission } from "../grant";
import { activeCartKey, holdActiveCart, importLegacyCarts, readActiveCart, resumeHeldCart, saveActiveCart } from "../cart";
import { publishBootstrap, readCatalog, readLocalHistory } from "../bootstrap";
import { scopeKey } from "../scope";

afterEach(async()=>{lockOffline();const rows=databases.splice(0);rows.forEach(db=>db.close());for(const name of new Set(rows.map(db=>db.name)))await Dexie.delete(name);});
describe("signed offline authority",()=>{
  it("requires a local unlock and the signed offline policy before a disconnected checkout",async()=>{
    const{db,provision}=await setup();const input=await checkoutInput(db,provision,{mode:"OFFLINE",pricePolicy:"CAPTURED_PRICE"});
    await expect(commitLocalSale(db,input)).rejects.toMatchObject({code:"LOCAL_UNLOCK_REQUIRED"});
    await setLocalUnlock(db,scope,"local-passphrase");lockOffline();await unlockOffline(db,scope,"local-passphrase");
    const sale=await commitLocalSale(db,input);expect(sale.sale.wire.pricePolicy).toBe("CAPTURED_PRICE");
    const signed=await provisioning(scope,{offlineIntakeAllowed:false,capturedPriceAllowed:false});await installProvisioning(db,signed,scope);
    await expect(verifySavedPermission(db,scope,"OFFLINE")).rejects.toMatchObject({code:"OFFLINE_NOT_APPROVED"});
  });
  it("rejects tampered signatures, mismatched scope and expired permission without removing saved sales",async()=>{
    const{db,provision}=await setup();await createSale(db,provision);
    const parts=provision.grantToken.split(".");parts[1]=btoa(JSON.stringify({...provision.claims,locationId:"other"})).replaceAll("=","").replaceAll("+","-").replaceAll("/","_");
    await expect(installProvisioning(db,{...provision,grantToken:parts.join(".")},scope)).rejects.toMatchObject({code:"INVALID_GRANT"});
    await expect(installProvisioning(db,provision,{...scope,locationId:"other"})).rejects.toMatchObject({code:"GRANT_SCOPE_MISMATCH"});
    await expect(verifySavedPermission(db,scope,"ONLINE",provision.claims.exp*1000+1)).rejects.toMatchObject({code:"GRANT_EXPIRED"});
    expect(await db.localSales.count()).toBe(1);
  });
  it("persists known server rejection and does not let an old in-flight provision undo it",async()=>{
    const{db}=await setup();await setLocalUnlock(db,scope,"local-passphrase");const before=Date.now()-1000;
    await markOfflinePermissionRejected(db,scope,"ACCOUNT_INACTIVE");
    await expect(verifySavedPermission(db,scope,"OFFLINE")).rejects.toMatchObject({code:"OFFLINE_AUTHORITY_REJECTED"});
    await expect(unlockOffline(db,scope,"local-passphrase")).rejects.toMatchObject({code:"OFFLINE_AUTHORITY_REJECTED"});
    await expect(unlockOffline(db,scope,"local-passphrase",{recoveryOnly:true})).resolves.toMatchObject({scope});
    const renewed=await provisioning();
    await expect(installProvisioning(db,renewed,scope,{requestStartedAt:before})).rejects.toMatchObject({code:"PROVISIONING_STALE"});
    await installProvisioning(db,renewed,scope,{requestStartedAt:Date.now()+1});
    await expect(verifySavedPermission(db,scope,"ONLINE")).resolves.toHaveProperty("claims");
  });
  it("detects device clock rollback and throttles a wrong offline passphrase",async()=>{
    const{db}=await setup();await setLocalUnlock(db,scope,"local-passphrase");lockOffline();
    await expect(unlockOffline(db,scope,"wrong-passphrase")).rejects.toMatchObject({code:"WRONG_UNLOCK"});
    await expect(unlockOffline(db,scope,"local-passphrase")).rejects.toMatchObject({code:"UNLOCK_WAIT"});
    await db.permissions.update(scopeKey(scope),{lastObservedAt:Date.now()+60000});
    await expect(verifySavedPermission(db,scope,"ONLINE")).rejects.toMatchObject({code:"CLOCK_ROLLBACK"});
  });
});
describe("complete snapshots and scoped carts",()=>{
  it("retains an old complete catalog on partial download and rebases included stock deltas exactly once",async()=>{
    const{db,provision}=await setup();const{sale}=await createSale(db,provision);
    const incomplete=bootstrapFor();incomplete.manifest.counts.variants=2;
    await expect(publishBootstrap(db,scope,incomplete)).rejects.toMatchObject({code:"INCOMPLETE_SNAPSHOT"});
    expect((await readCatalog(db,scope)).variants[0].stock).toBe(-1);
    const fresh=bootstrapFor();fresh.categories[0].products[0].variants[0].stock=-1;fresh.acceptedClientOrderIds=[sale.clientOrderId];
    await publishBootstrap(db,scope,fresh);
    expect((await readCatalog(db,scope)).variants[0].stock).toBe(-1);expect(await db.stockOverlays.count()).toBe(0);
  });
  it("keeps same product IDs isolated by operator, business, branch and device",async()=>{
    const{db}=await setup();await expect(readCatalog(db,{...scope,locationId:"other"})).rejects.toMatchObject({code:"CATALOG_NOT_READY"});
    const cart=await saveActiveCart(db,scope,"CATALOG",{lines:[{variantId:"v1"}]},null);
    expect(await readActiveCart(db,{...scope,userId:"other"},"CATALOG")).toBeUndefined();
    await expect(saveActiveCart(db,scope,"CATALOG",{lines:[]},cart.revision-1)).rejects.toMatchObject({code:"CART_CHANGED"});
  });
  it("moves held carts atomically and refuses to replace an occupied cart",async()=>{
    const{db}=await setup();const cart=await saveActiveCart(db,scope,"CATALOG",{lines:[{variantId:"v1"}],tendered:"1000"},null);
    const held=await holdActiveCart(db,scope,"CATALOG",cart.revision,"Customer A");
    const busy=await saveActiveCart(db,scope,"CATALOG",{lines:[{variantId:"v2"}]},held.active.revision);
    await expect(resumeHeldCart(db,scope,"CATALOG",held.held.key,busy.revision)).rejects.toMatchObject({code:"CART_OCCUPIED"});
    const empty=await saveActiveCart(db,scope,"CATALOG",{},busy.revision);const restored=await resumeHeldCart(db,scope,"CATALOG",held.held.key,empty.revision);
    expect(restored.data.tendered).toBe("1000");expect(await db.drafts.where("[scopeKey+state]").equals([scopeKey(scope),"HELD"]).count()).toBe(0);
  });
  it("preserves the existing five-held-cart rule independently from the unlimited sale queue",async()=>{
    const{db}=await setup();let rev:number|null=null;
    for(let i=0;i<5;i++){const cart=await saveActiveCart(db,scope,"CATALOG",{lines:[{variantId:"v1"}]},rev);rev=(await holdActiveCart(db,scope,"CATALOG",cart.revision,`Cart ${i}`)).active.revision;}
    const sixth=await saveActiveCart(db,scope,"CATALOG",{lines:[{variantId:"v1"}]},rev);
    await expect(holdActiveCart(db,scope,"CATALOG",sixth.revision,"Sixth")).rejects.toMatchObject({code:"HELD_CART_LIMIT"});
    expect((await db.drafts.get(activeCartKey(scope,"CATALOG")))?.data.lines).toHaveLength(1);
  });
  it("migrates catalog and custom legacy carts separately and only once",async()=>{
    const{db}=await setup();
    for(const kind of ["CATALOG","CUSTOM"]as const){expect(await importLegacyCarts(db,scope,{kind,active:{kind,data:{lines:[{name:kind}]}}})).toBe(true);expect(await importLegacyCarts(db,scope,{kind,active:{kind,data:{lines:[]}}})).toBe(false);}
    expect(await db.drafts.count()).toBe(2);
  });
  it("paginates all local history and merges a server-confirmed sale even when its acknowledgment was lost",async()=>{
    const{db,provision}=await setup();const sales:Array<Awaited<ReturnType<typeof createSale>>>=[];for(let i=0;i<25;i++)sales.push(await createSale(db,provision));
    const first=await readLocalHistory(db,scope,{limit:10});expect(first.total).toBe(25);expect(first.orders).toHaveLength(10);
    const last=await readLocalHistory(db,scope,{offset:20,limit:10});expect(last.orders).toHaveLength(5);expect(last.total).toBe(25);
    const fresh=bootstrapFor();fresh.history=[{...sales[0].receipt.order,id:"server-lost-ack",invoiceNumber:"INV-LOST",status:"PAID",clientOrderId:sales[0].sale.clientOrderId} as typeof fresh.history extends Array<infer T>|undefined?T:never];fresh.acceptedClientOrderIds=[sales[0].sale.clientOrderId];
    await publishBootstrap(db,scope,fresh);const merged=await readLocalHistory(db,scope,{limit:100});
    expect(merged.total).toBe(25);expect(merged.orders.some(o=>o.id==="server-lost-ack")).toBe(true);expect(merged.orders.some(o=>o.id===sales[0].sale.clientOrderId)).toBe(false);
  });
});
