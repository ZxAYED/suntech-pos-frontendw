import "fake-indexeddb/auto";
import Dexie from "dexie";
import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("../offline-provider",()=>({useOffline:()=>({})}));
vi.mock("../offline-access",()=>({OfflineAccess:()=>null}));
vi.mock("@/features/pos/components/receipt-dialog",()=>({ReceiptDialog:()=>null}));
import { prepareOfflinePassphrase, readSavedRegisterStatuses, readWaitingRegisterPage } from "../offline-status";
import { databases, newDb, provisioning, scope, setup } from "../../core/__tests__/fixtures";
import { scopeKey } from "../../core/scope";
import { setLocalUnlock } from "../../core/grant";
import type { OfflineScope } from "../../core/types";

afterEach(async()=>{const rows=databases.splice(0);rows.forEach(db=>db.close());for(const name of new Set(rows.map(db=>db.name)))await Dexie.delete(name);});
describe("local passphrase setup requires fresh online authority",()=>{
 it("does not replace the local passphrase when fresh provisioning fails",async()=>{
  const{db}=await setup();await setLocalUnlock(db,scope,"original-passphrase");const original=await db.permissions.get(scopeKey(scope));
  await expect(prepareOfflinePassphrase(db,scope,"replacement-passphrase",async()=>{throw{status:503};})).rejects.toMatchObject({status:503});
  expect((await db.permissions.get(scopeKey(scope)))?.unlock).toEqual(original?.unlock);
 });
 it("uses the exact original scope and writes the passphrase only after signed provisioning",async()=>{
  const{db}=await setup();const fresh=await provisioning();
  await prepareOfflinePassphrase(db,scope,"replacement-passphrase",async body=>{expect(body).toEqual({deviceId:scope.deviceId,businessId:scope.businessId,locationId:scope.locationId});return fresh;});
  const stored=await db.permissions.get(scopeKey(scope));expect(stored?.grantToken).toBe(fresh.grantToken);expect(stored?.unlock?.hash).toBeTruthy();
  await expect(prepareOfflinePassphrase(db,scope,"another-passphrase",async()=>{throw{status:403};})).rejects.toMatchObject({status:403});
  expect((await db.permissions.get(scopeKey(scope)))?.rejectedAt).toBeGreaterThan(0);
 });
});
describe("saved register status reads original-device recovery queues",()=>{
 it("shows distinct original devices, correct pending/review totals and excludes another operator",async()=>{
  const db=newDb();const recovered={...scope,deviceId:crypto.randomUUID()};const other={...scope,userId:"other-operator",deviceId:crypto.randomUUID()};
  for(const original of [recovered,other])await db.metadata.put({key:`recovered-scope:${scopeKey(original)}`,value:{scope:original}});
  for(const[target,state,id]of[[scope,"PENDING","one"],[recovered,"BLOCKED_AUTH","two"],[recovered,"NEEDS_REVIEW","three"],[recovered,"SYNCED","four"],[other,"PENDING","private"]]as const){await db.outbox.put({clientOrderId:id,scopeKey:scopeKey(target),state,nextAttemptAt:0,attempts:0,updatedAt:new Date().toISOString()});}
  const result=await readSavedRegisterStatuses(db,scope.userId,scope);
  expect(result).toHaveLength(2);expect(result.map(item=>item.scope.deviceId)).toEqual([scope.deviceId,recovered.deviceId]);
  expect(result[0].counts).toMatchObject({pending:1,review:0,synced:0});expect(result[1].counts).toMatchObject({pending:1,review:1,synced:1});
  expect(result.some(item=>item.scope.userId===other.userId)).toBe(false);
 });
 it("paginates more than twenty recovered waiting records without losing review cases",async()=>{
  const db=newDb();const recovered:OfflineScope={...scope,deviceId:crypto.randomUUID()};
  await db.metadata.put({key:`recovered-scope:${scopeKey(recovered)}`,value:{scope:recovered}});
  for(let index=0;index<25;index++)await db.outbox.put({clientOrderId:`saved-${index}`,scopeKey:scopeKey(recovered),state:index<3?"NEEDS_REVIEW":"PENDING",nextAttemptAt:0,attempts:0,updatedAt:new Date().toISOString()});
  const[status]=await readSavedRegisterStatuses(db,scope.userId,null);
  const first=await readWaitingRegisterPage(db,status,0);const second=await readWaitingRegisterPage(db,status,1);
  expect(first).toHaveLength(20);expect(second).toHaveLength(5);expect(first.slice(0,3).every(row=>row.state==="NEEDS_REVIEW")).toBe(true);
  expect(new Set([...first,...second].map(row=>row.clientOrderId)).size).toBe(25);
 });
});
