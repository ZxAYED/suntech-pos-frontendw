import "fake-indexeddb/auto";
import Dexie from "dexie";
import { afterEach, describe, expect, it, vi } from "vitest";
import { databases, newDb, provisioning, scope, createSale, accepted } from "./fixtures";
import { installProvisioning, setLocalUnlock } from "../grant";
import { publishBootstrap } from "../bootstrap";
import { recordAdvancedCommand, drainAdvancedCommands, type AdvancedRecord } from "../advanced-commands";
import { scopeKey, sha256 } from "../scope";
import { rememberActiveShift } from "../../services/active-shift";
import { exportEncryptedBackup, restoreEncryptedBackup } from "../backup";
import type { RefundCommand } from "../advanced-wire";

// Real Dexie + fake IndexedDB (not a browser), including actual transaction and index semantics.
// This suite must run on the release machine before advanced intake is enabled.
afterEach(async()=>{ vi.unstubAllEnvs();const rows=databases.splice(0);rows.forEach(db=>db.close());for(const name of new Set(rows.map(db=>db.name)))await Dexie.delete(name); });
async function setupRefund(){
  vi.stubEnv("NEXT_PUBLIC_ADVANCED_OFFLINE_COMMANDS","true");
  vi.stubEnv("NEXT_PUBLIC_OFFLINE_INTAKE","true");
  const db=newDb();
  const response=await provisioning(scope,{permissions:["CATALOG_SALE","CUSTOM_SALE","REFUND_PAYOUT_EVIDENCE"]});
  await installProvisioning(db,response,scope);
  await setLocalUnlock(db,scope,"qualified-test-passphrase");
  const sale=await createSale(db,response);
  const server=await accepted(db,sale.input.clientOrderId);
  const order=server.order!;
  order.lines=order.lines.map(line=>({...line,refundableQuantity:line.quantity}));
  await publishBootstrap(db,scope,{...response.bootstrap,serverTime:new Date().toISOString(),history:[order],acceptedClientOrderIds:[sale.input.clientOrderId]});
  await rememberActiveShift(db,scope,null);
  const command:RefundCommand={version:1,kind:"REFUND_PAYOUT_EVIDENCE",clientCommandId:crypto.randomUUID(),scope:{...scope},occurredAt:new Date().toISOString(),grantToken:response.grantToken,orderId:order.id,items:[{orderItemId:order.lines[0].id,quantity:1,unitPrice:order.lines[0].unitPrice}],totalRefund:order.lines[0].unitPrice,reason:"Original reported test payout",payoutShiftId:null,paymentMethod:"COD",evidence:"REPORTED_ALREADY_PAID"};
  return {db,command};
}
async function ack(command:RefundCommand){return {clientCommandId:command.clientCommandId,kind:command.kind,payloadHash:await sha256(command),status:"ACCEPTED",postedAt:new Date().toISOString(),result:{entityId:command.orderId,refundId:"official-refund",totalRefund:command.totalRefund}};}
describe("advanced commands: real Dexie transactions",()=>{
  it("two distinct command IDs cannot reserve the same original order on two DB connections",async()=>{
    const {db,command}=await setupRefund();const other=newDb(db.name);
    const results=await Promise.allSettled([recordAdvancedCommand(db,command),recordAdvancedCommand(other,{...command,clientCommandId:crypto.randomUUID()})]);
    expect(results.filter(r=>r.status==="fulfilled")).toHaveLength(1);expect(await db.advancedCommands.count()).toBe(1);
  });
  it("same ID persists on reopen and upload acknowledgment validates original evidence",async()=>{
    const {db,command}=await setupRefund();await recordAdvancedCommand(db,command);db.close();await db.open();
    const saved=await db.advancedCommands.get(command.clientCommandId);expect(saved?.command).toEqual(command);
    await drainAdvancedCommands(db,scope,scope.userId,async raw=>ack(raw as RefundCommand));
    expect((await db.advancedCommands.get(command.clientCommandId))?.state).toBe("SYNCED");
  });
  it("advanced records restore with original scope and cannot trust old confirmation",async()=>{
    const {db,command}=await setupRefund();await recordAdvancedCommand(db,command);await drainAdvancedCommands(db,scope,scope.userId,async raw=>ack(raw as RefundCommand));
    const file=await exportEncryptedBackup(db,scope,"independent-test-backup-password");const target=newDb();await restoreEncryptedBackup(target,file,"independent-test-backup-password",scope.userId);
    const restored:AdvancedRecord|undefined=await target.advancedCommands.get(command.clientCommandId);expect(restored?.scopeKey).toBe(scopeKey(scope));expect(restored?.state).toBe("BLOCKED_AUTH");expect(restored?.acknowledgment).toBeUndefined();expect(await target.permissions.count()).toBe(0);
  });
});
