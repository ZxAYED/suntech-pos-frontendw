import type { OfflineDatabase } from "../db/offline-db";
import type { OfflineScope } from "../core/types";
import { canonicalJson, OfflineError, scopeKey } from "../core/scope";
import { advancedEntityKey, hasUnresolvedAdvancedCommand } from "../core/advanced-commands";
import { financialOperations, type ScopedFinancialOperation } from "@/lib/financial-operation";

export interface LegacyRefundPayload { orderId: string; items: Array<{orderItemId:string;quantity:number}>; reason?:string; payoutShiftId?:string|null; businessId?:string }
export interface LegacyRefundEvidence { scope:OfflineScope; operation:ScopedFinancialOperation<LegacyRefundPayload>; state:"PENDING"|"RESOLVED"|"RESTORED_REVIEW" }
export const legacyRefundKey=(scope:OfflineScope,orderId:string)=>`legacy-refund:${advancedEntityKey("REFUND_PAYOUT_EVIDENCE",scope,orderId)}`;
const params=(scope:OfflineScope,orderId:string)=>({operationType:"refund" as const,userId:scope.userId,businessId:scope.businessId,locationId:scope.locationId,scopeExtra:orderId});
export async function recoverLegacyRefund(db:OfflineDatabase,scope:OfflineScope,orderId:string) {
  const current=financialOperations.getPendingOperation<LegacyRefundPayload>(params(scope,orderId));
  const stored=(await db.metadata.get(legacyRefundKey(scope,orderId)))?.value as LegacyRefundEvidence|undefined;
  if (stored && stored.state!=="RESOLVED") {
    if (scopeKey(stored.scope)!==scopeKey(scope) || stored.operation?.payloadSnapshot?.orderId!==orderId || stored.state==="RESTORED_REVIEW") throw new OfflineError("LEGACY_REFUND_REVIEW", "An original refund from another or restored register needs reconciliation. Do not pay again.");
    return financialOperations.restoreLegacyOperation(params(scope,orderId),stored.operation);
  }
  if (current && ["pending","unknown"].includes(current.outcome)) {
    if (stored?.state==="RESOLVED" && stored.operation.key===current.key) { financialOperations.recordOutcome(params(scope,orderId),"success");return null; }
    await reserveLegacyRefund(db,scope,orderId,current);
  }
  return current && ["pending","unknown"].includes(current.outcome) ? current : null;
}
/** Local transaction excludes concurrent offline payout evidence for the same order. */
export async function reserveLegacyRefund(db:OfflineDatabase,scope:OfflineScope,orderId:string,operation:ScopedFinancialOperation<LegacyRefundPayload>) {
  if (operation.operationType!=="refund" || operation.payloadSnapshot?.orderId!==orderId || operation.scopeExtra!==orderId || operation.userId!==scope.userId || operation.businessId!==scope.businessId || operation.locationId!==scope.locationId) throw new OfflineError("LEGACY_REFUND_SCOPE", "The original refund request does not match this register.");
  await db.transaction("rw",[db.metadata,db.advancedCommands],async()=>{
    if(await hasUnresolvedAdvancedCommand(db,"REFUND_PAYOUT_EVIDENCE",scope,orderId))throw new OfflineError("OFFLINE_PAYOUT_WAITING","This order already has saved offline payout evidence. Reconcile it before another refund.");
    const key=legacyRefundKey(scope,orderId);
    const saved=(await db.metadata.get(key))?.value as LegacyRefundEvidence|undefined;
    if(saved && saved.state!=="RESOLVED"){
      if(saved.state==="RESTORED_REVIEW" || scopeKey(saved.scope)!==scopeKey(scope) || saved.operation.key!==operation.key || saved.operation.payloadHash!==operation.payloadHash || canonicalJson(saved.operation.payloadSnapshot)!==canonicalJson(operation.payloadSnapshot))throw new OfflineError("LEGACY_REFUND_CONFLICT","Another original refund is pending. Keep its identity; do not pay again.");
      return;
    }
    await db.metadata.put({key,value:{scope:{...scope},operation:structuredClone(operation),state:"PENDING"} satisfies LegacyRefundEvidence});
  });
}
export async function resolveLegacyRefund(db:OfflineDatabase,scope:OfflineScope,orderId:string,originalKey:string) {
  await db.transaction("rw",db.metadata,async()=>{
    const key=legacyRefundKey(scope,orderId);
    const saved=(await db.metadata.get(key))?.value as LegacyRefundEvidence|undefined;
    if(!saved || scopeKey(saved.scope)!==scopeKey(scope) || saved.operation.key!==originalKey || saved.state==="RESTORED_REVIEW")throw new OfflineError("LEGACY_REFUND_CONFLICT","Original refund confirmation needs recovery. Do not pay again.");
    await db.metadata.put({key,value:{...saved,state:"RESOLVED"}});
  });
}
