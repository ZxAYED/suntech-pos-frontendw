import "fake-indexeddb/auto";
import Dexie from "dexie";
import { afterEach, describe, expect, it } from "vitest";
import { accepted, createSale, databases, newDb, scope, setup } from "./fixtures";
import { drainSync, getSyncSummary, MAX_SYNC_REQUEST_BYTES, runSyncPass } from "../sync";
import { exportEncryptedBackup, restoreEncryptedBackup } from "../backup";
import { OfflineDatabase } from "../../db/offline-db";
import { scopeKey } from "../scope";

const options={authenticatedUserId:scope.userId};
afterEach(async()=>{const rows=databases.splice(0); rows.forEach(db=>db.close()); for(const name of new Set(rows.map(db=>db.name))) await Dexie.delete(name);});
describe("durable synchronization",()=>{
  it("replays a lost response with the SAME ID and receives a stable duplicate",async()=>{
    const {db,provision}=await setup();const {sale}=await createSale(db,provision);
    const ledger=new Set<string>();let calls=0;
    const transport=async(envelope: Parameters<Parameters<typeof runSyncPass>[2]>[0])=>{
      calls++; const id=envelope.orders[0].clientOrderId;const duplicate=ledger.has(id);ledger.add(id);
      if(calls===1)throw new Error("response lost after server commit");
      return {results:[await accepted(db,id,duplicate?"DUPLICATE":"ACCEPTED")]};
    };
    await runSyncPass(db,scope,transport,options);
    expect((await db.outbox.get(sale.clientOrderId))?.state).toBe("UNKNOWN");
    await runSyncPass(db,scope,transport,{...options,force:true});
    expect(ledger.size).toBe(1);expect((await db.outbox.get(sale.clientOrderId))?.state).toBe("SYNCED");
    expect((await db.serverMappings.get(sale.clientOrderId))?.orderId).toBe(`official-${sale.clientOrderId}`);
  });
  it("handles partial acceptance, temporary rejection, review and absent results separately",async()=>{
    const {db,provision}=await setup();const sales:Array<Awaited<ReturnType<typeof createSale>>["sale"]>=[];
    for(let i=0;i<4;i++)sales.push((await createSale(db,provision)).sale);
    const result=await runSyncPass(db,scope,async()=>({results:[await accepted(db,sales[0].clientOrderId),{clientOrderId:sales[1].clientOrderId,status:"REJECTED",retryable:true,code:"TEMPORARY_CONFLICT"},{clientOrderId:sales[2].clientOrderId,status:"REJECTED",retryable:false,code:"PRICE_CHANGED"}]}),options);
    expect(result).toMatchObject({synced:1,review:1,retry:2});
    expect((await db.outbox.get(sales[1].clientOrderId))?.state).toBe("RETRY_WAIT");
    expect((await db.outbox.get(sales[2].clientOrderId))?.state).toBe("NEEDS_REVIEW");
    expect((await db.outbox.get(sales[3].clientOrderId))?.state).toBe("UNKNOWN");
    expect(await db.localSales.count()).toBe(4);
  });
  it("retains a queue during login expiry then resumes after same-user authentication",async()=>{
    const{db,provision}=await setup();const{sale}=await createSale(db,provision);
    await runSyncPass(db,scope,async()=>{throw {statusCode:401};},options);
    expect((await db.outbox.get(sale.clientOrderId))?.state).toBe("BLOCKED_AUTH");
    await expect(runSyncPass(db,scope,async()=>({results:[]}),{authenticatedUserId:"someone-else"})).rejects.toMatchObject({code:"UPLOAD_IDENTITY_MISMATCH"});
    await runSyncPass(db,scope,async()=>({results:[await accepted(db,sale.clientOrderId)]}),{...options,resumeAuthenticated:true});
    expect((await db.outbox.get(sale.clientOrderId))?.state).toBe("SYNCED");
  });
  it("gives only one tab the live upload lease",async()=>{
    const{db,provision}=await setup();const{sale}=await createSale(db,provision);
    const second=new OfflineDatabase(db.name);databases.push(second);
    let unblock!:()=>void;let started!:()=>void;
    const gate=new Promise<void>(resolve=>{unblock=resolve;});const began=new Promise<void>(resolve=>{started=resolve;});
    const first=runSyncPass(db,scope,async()=>{started();await gate;return{results:[await accepted(db,sale.clientOrderId)]};},{...options,owner:"tab-a"});
    await began;
    const attempt=await runSyncPass(second,scope,async()=>{throw new Error("must not upload");},{...options,owner:"tab-b"});
    expect(attempt.leaseBusy).toBe(true);unblock();await first;
    expect((await db.outbox.get(sale.clientOrderId))?.attempts).toBe(1);
  });
  it("fences a late old tab after another tab reclaims the expired lease",async()=>{
    const{db,provision}=await setup();const{sale}=await createSale(db,provision);
    let release!:()=>void;let started!:()=>void;const gate=new Promise<void>(r=>{release=r;});const began=new Promise<void>(r=>{started=r;});
    const now=Date.now();
    const stale=runSyncPass(db,scope,async()=>{started();await gate;return{results:[{clientOrderId:sale.clientOrderId,status:"REJECTED",code:"STALE_RESULT",retryable:false}]};},{...options,owner:"old",now:()=>now});
    await began;
    await runSyncPass(db,scope,async()=>({results:[await accepted(db,sale.clientOrderId)]}),{...options,owner:"new",now:()=>now+46_000});
    release();await stale;
    expect((await db.outbox.get(sale.clientOrderId))?.state).toBe("SYNCED");expect(await db.reviews.count()).toBe(0);
  });
  it("rolls back a failed acknowledgment write and replays safely later",async()=>{
    const{db,provision}=await setup();const{sale}=await createSale(db,provision);
    const fail=()=>{throw new DOMException("disk full","QuotaExceededError");};
    db.serverMappings.hook("creating",fail);
    await expect(runSyncPass(db,scope,async()=>({results:[await accepted(db,sale.clientOrderId)]}),options)).rejects.toMatchObject({name:"QuotaExceededError"});
    expect((await db.outbox.get(sale.clientOrderId))?.state).toBe("SENDING");
    expect(await db.serverMappings.count()).toBe(0);db.serverMappings.hook("creating").unsubscribe(fail);
    await runSyncPass(db,scope,async()=>({results:[await accepted(db,sale.clientOrderId,"DUPLICATE")]}),{...options,now:()=>Date.now()+46_000});
    expect((await db.outbox.get(sale.clientOrderId))?.state).toBe("SYNCED");
  });
  it("puts a mismatched official variant into review even when quantity and amount match",async()=>{
    const{db,provision}=await setup();const{sale}=await createSale(db,provision);
    const bad=await accepted(db,sale.clientOrderId);bad.order!.lines[0].variantId="wrong-variant";
    await runSyncPass(db,scope,async()=>({results:[bad]}),options);
    expect((await db.outbox.get(sale.clientOrderId))?.state).toBe("NEEDS_REVIEW");
    expect((await db.reviews.get(sale.clientOrderId))?.code).toBe("INVALID_ACKNOWLEDGMENT");
    expect(await db.serverMappings.count()).toBe(0);expect(await db.localSales.count()).toBe(1);
  });
  it("keeps each serialized request within its byte budget even when fewer than 100 sales fit",async()=>{
    const{db,provision}=await setup();
    const lines=Array.from({length:12000},(_,index)=>({productName:`Service ${index} `.padEnd(120,"x"),quantity:1,unitPrice:1}));
    await createSale(db,provision,{orderType:"CUSTOM",lines,tenderedAmount:12000});
    await createSale(db,provision,{orderType:"CUSTOM",lines,tenderedAmount:12000});
    const sizes:number[]=[];const counts:number[]=[];
    const result=await drainSync(db,scope,async envelope=>{
      sizes.push(new TextEncoder().encode(JSON.stringify(envelope)).byteLength);counts.push(envelope.orders.length);
      return{results:await Promise.all(envelope.orders.map(order=>accepted(db,order.clientOrderId)))};
    },{...options,timeBudgetMs:30000});
    expect(result.synced).toBe(2);expect(counts).toEqual([1,1]);expect(Math.max(...sizes)).toBeLessThanOrEqual(MAX_SYNC_REQUEST_BYTES);
  },30000);
  it("adapts to a stricter server/proxy 413 by shrinking requests with the same immutable IDs",async()=>{
    const{db,provision}=await setup();for(let index=0;index<4;index++)await createSale(db,provision);
    const original=(await db.localSales.toArray()).map(sale=>sale.clientOrderId).sort();const batches:number[]=[];
    const transport=async(envelope:Parameters<Parameters<typeof runSyncPass>[2]>[0])=>{
      batches.push(envelope.orders.length);if(envelope.orders.length>2)throw{status:413,code:"REQUEST_TOO_LARGE"};
      return{results:await Promise.all(envelope.orders.map(order=>accepted(db,order.clientOrderId)))};
    };
    await runSyncPass(db,scope,transport,options);
    expect((await getSyncSummary(db,scope)).counts.RETRY_WAIT).toBe(4);expect(await db.reviews.count()).toBe(0);
    await drainSync(db,scope,transport,{...options,force:true});expect(batches).toEqual([4,2,2]);
    expect((await db.localSales.toArray()).map(sale=>sale.clientOrderId).sort()).toEqual(original);
    expect((await getSyncSummary(db,scope)).synced).toBe(4);
  });
  it("preserves a single event that still exceeds the server limit as a review case",async()=>{
    const{db,provision}=await setup();const{sale}=await createSale(db,provision);
    await runSyncPass(db,scope,async()=>{throw{status:413};},options);
    expect((await db.outbox.get(sale.clientOrderId))?.state).toBe("NEEDS_REVIEW");expect((await db.reviews.get(sale.clientOrderId))?.code).toBe("REQUEST_TOO_LARGE");
    expect((await db.localSales.get(sale.clientOrderId))?.payloadHash).toBe(sale.payloadHash);
  });
  it("does not revoke offline permission when a 401 says the session was successfully renewed",async()=>{
    const{db,provision}=await setup();const{sale}=await createSale(db,provision);
    await runSyncPass(db,scope,async()=>{throw{status:401,code:"SESSION_RENEWED_RETRY_REQUIRED"};},options);
    expect((await db.permissions.get(scopeKey(scope)))?.rejectedAt).toBeUndefined();
    expect((await db.outbox.get(sale.clientOrderId))?.state).toBe("RETRY_WAIT");
    await runSyncPass(db,scope,async()=>({results:[await accepted(db,sale.clientOrderId)]}),{...options,force:true});
    expect((await db.outbox.get(sale.clientOrderId))?.state).toBe("SYNCED");
  });
  it("drains 1,257 sales in batches of at most 100 without a total queue cap",async()=>{
    const{db,provision}=await setup();
    for(let i=0;i<1257;i++)await createSale(db,provision);
    const batches:number[]=[];
    const result=await drainSync(db,scope,async envelope=>{batches.push(envelope.orders.length);return{results:await Promise.all(envelope.orders.map(order=>accepted(db,order.clientOrderId)))};},{...options,timeBudgetMs:30000});
    expect(result.synced).toBe(1257);expect(batches).toHaveLength(13);expect(Math.max(...batches)).toBe(100);expect(batches.at(-1)).toBe(57);
    expect((await getSyncSummary(db,scope)).pending).toBe(0);
  },60000);
});
describe("encrypted independent backup format",()=>{
  it("restores the original identity and blocks new permission; replay returns original official sale",async()=>{
    const{db,provision}=await setup();const{sale}=await createSale(db,provision);
    const text=await exportEncryptedBackup(db,scope,"long-backup-password");
    expect(text).not.toContain(sale.clientOrderId);expect(text).not.toContain(provision.grantToken);
    const clean=newDb();const result=await restoreEncryptedBackup(clean,text,"long-backup-password",scope.userId);
    expect(result.imported).toBe(1);expect(result.scope).toEqual(scope);
    expect((await clean.localSales.get(sale.clientOrderId))?.payloadHash).toBe(sale.payloadHash);
    expect(await clean.permissions.count()).toBe(0);expect(await clean.drafts.count()).toBe(0);
    expect((await clean.outbox.get(sale.clientOrderId))?.state).toBe("BLOCKED_AUTH");
    await runSyncPass(clean,scope,async()=>({results:[await accepted(clean,sale.clientOrderId,"DUPLICATE")]}),{...options,resumeAuthenticated:true});
    expect((await clean.outbox.get(sale.clientOrderId))?.state).toBe("SYNCED");
    const again=await restoreEncryptedBackup(clean,text,"long-backup-password",scope.userId);
    expect(again.alreadyPresent).toBe(1);expect((await clean.outbox.get(sale.clientOrderId))?.state).toBe("SYNCED");
  });
  it("backs up legacy HTTP recovery identity separately and preserves a newer conflicting command",async()=>{
    const{db}=await setup();const originalKey=crypto.randomUUID();const recordKey=`legacy-financial-recovery:${scopeKey(scope)}:catalog_sale`;
    const legacy={scope,operation:{key:originalKey,userId:scope.userId,businessId:scope.businessId,locationId:scope.locationId,operationType:"catalog_sale",deliveryProtocol:"LEGACY_HTTP",payloadHash:"legacy-hash",createdAt:Date.now(),outcome:"unknown"}};
    await db.metadata.put({key:recordKey,value:legacy});const text=await exportEncryptedBackup(db,scope,"long-backup-password");const clean=newDb();
    await restoreEncryptedBackup(clean,text,"long-backup-password",scope.userId);
    expect((await clean.metadata.get(recordKey))?.value).toEqual(legacy);expect(await clean.outbox.count()).toBe(0);
    const newer={...legacy,operation:{...legacy.operation,key:crypto.randomUUID()}};await clean.metadata.put({key:recordKey,value:newer});
    await restoreEncryptedBackup(clean,text,"long-backup-password",scope.userId);
    expect((await clean.metadata.get(recordKey))?.value).toEqual(newer);expect(await clean.metadata.where("key").startsWith("restored-legacy-evidence:").count()).toBe(1);
  });
  it("rejects a wrong password, tampered ciphertext and another operator without importing anything",async()=>{
    const{db,provision}=await setup();await createSale(db,provision);const text=await exportEncryptedBackup(db,scope,"long-backup-password");const clean=newDb();
    await expect(restoreEncryptedBackup(clean,text,"wrong-password",scope.userId)).rejects.toMatchObject({code:"BACKUP_UNREADABLE"});
    const tampered=JSON.parse(text);tampered.ciphertext=(tampered.ciphertext[0]==="A"?"B":"A")+tampered.ciphertext.slice(1);
    await expect(restoreEncryptedBackup(clean,JSON.stringify(tampered),"long-backup-password",scope.userId)).rejects.toMatchObject({code:"BACKUP_UNREADABLE"});
    await expect(restoreEncryptedBackup(clean,text,"long-backup-password","other")).rejects.toMatchObject({code:"BACKUP_SCOPE_MISMATCH"});
    expect(await clean.localSales.count()).toBe(0);
  });
});
