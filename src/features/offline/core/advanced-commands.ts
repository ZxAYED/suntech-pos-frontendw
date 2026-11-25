import type { OfflineDatabase } from "../db/offline-db";
import type { OfflineScope, OutboxState } from "./types";
import type { Order, Product } from "@/types/domain";
import { isTrustedWorkspaceActive, matchesOfflineUnlock, verifySavedPermission } from "./grant";
import { OfflineError, scopeKey, sha256 } from "./scope";
import { commandEntity, matchesAdvancedAck, parseAdvancedCommand, type AdvancedAck, type AdvancedCommand, type AdvancedKind, type RefundCommand, type DescriptionCommand } from "./advanced-wire";

export interface AdvancedRecord {
  clientCommandId: string; scopeKey: string; entityKey: string; command: AdvancedCommand; payloadHash: string;
  state: OutboxState; savedAt: string; attempts: number; nextAttemptAt: number; attemptId?: string;
  acknowledgment?: AdvancedAck; lastCode?: string; lastMessage?: string;
}
export const advancedIntakeEnabled = () => process.env.NEXT_PUBLIC_ADVANCED_OFFLINE_COMMANDS === "true";
export function advancedEntityKey(kind: AdvancedKind, scope: Pick<OfflineScope,"businessId"|"locationId">, entityId: string) {
  return JSON.stringify([kind, scope.businessId, kind === "REFUND_PAYOUT_EVIDENCE" ? scope.locationId : null, entityId]);
}
export async function hasUnresolvedAdvancedCommand(db: OfflineDatabase, kind: AdvancedKind, scope: OfflineScope, entityId: string) {
  // Boolean only: no evidence belonging to a different operator is exposed.
  return (await db.advancedCommands.where("entityKey").equals(advancedEntityKey(kind,scope,entityId)).filter(row => row.state !== "SYNCED").count()) > 0;
}

/** Saves evidence, not a permission to pay. No network or WebCrypto inside this local transaction. */
export async function recordAdvancedCommand(db: OfflineDatabase, raw: AdvancedCommand): Promise<AdvancedRecord> {
  const command = parseAdvancedCommand(structuredClone(raw));
  const key = scopeKey(command.scope);
  const hash = await sha256(command);
  const existing = await db.advancedCommands.get(command.clientCommandId);
  if (existing) {
    if (existing.payloadHash !== hash || existing.scopeKey !== key) throw new OfflineError("COMMAND_ID_CONFLICT", "The original command identity has different content.");
    return existing;
  }
  if (!advancedIntakeEnabled()) throw new OfflineError("ADVANCED_INTAKE_DISABLED", "This additional offline operation is not enabled on this release.");
  const { record, claims } = await verifySavedPermission(db, command.scope, "OFFLINE");
  if (record.grantToken !== command.grantToken || !claims.permissions.includes(command.kind) || (command.kind === "PRODUCT_DESCRIPTION_EDIT" && claims.role !== "ADMIN")) throw new OfflineError("COMMAND_NOT_AUTHORIZED", "The current signed permission does not allow this operation.");
  const at = Date.parse(command.occurredAt);
  if (at < claims.iat * 1000 || at >= claims.exp * 1000 || at > Date.now()) throw new OfflineError("COMMAND_TIME_INVALID", "The original action is outside the signed permission period.");
  const entityKey = advancedEntityKey(command.kind, command.scope, commandEntity(command));
  return db.transaction("rw", [db.advancedCommands, db.permissions, db.catalogSnapshots, db.metadata], async () => {
    const duplicate = await db.advancedCommands.get(command.clientCommandId);
    if (duplicate) {
      if (duplicate.payloadHash !== hash || duplicate.scopeKey !== key) throw new OfflineError("COMMAND_ID_CONFLICT", "The original command identity has different content.");
      return duplicate;
    }
    if ((await db.metadata.get("new-intake-disabled"))?.value === true || process.env.NEXT_PUBLIC_OFFLINE_INTAKE === "false") throw new OfflineError("INTAKE_DISABLED", "New local work is paused. Saved evidence remains available.");
    const current = await db.permissions.get(key);
    const trusted = await isTrustedWorkspaceActive(db, command.scope);
    if (!current || current.rejectedAt || current.grantToken !== command.grantToken || (!matchesOfflineUnlock(current) && !trusted) || Date.now() >= claims.exp * 1000 || Date.now() + 1000 < current.lastObservedAt) throw new OfflineError("PERMISSION_CHANGED", "Authority changed while saving. No new command was recorded.");
    const snapshot = await db.catalogSnapshots.get(key);
    if (!snapshot) throw new OfflineError("CATALOG_NOT_READY", "Prepare the complete branch download first.");
    const previous = await db.advancedCommands.where("entityKey").equals(entityKey).toArray();
    if (previous.some(row => row.state !== "SYNCED" || !row.acknowledgment || Date.parse(snapshot.serverTime) <= Date.parse(row.acknowledgment.postedAt))) throw new OfflineError("COMMAND_ALREADY_WAITING", "This order or product already has local evidence. Sync and download fresh server data before another action. Do not pay a customer again.");
    if (command.kind === "REFUND_PAYOUT_EVIDENCE") {
      const legacy = (await db.metadata.get(`legacy-refund:${entityKey}`))?.value as {state?:string}|undefined;
      if (legacy && legacy.state !== "RESOLVED") throw new OfflineError("LEGACY_REFUND_WAITING", "Recover the original online refund before recording any new payout.");
      // Only official downloaded lines; pending-sale refund dependencies are deliberately not enabled.
      const shift = (await db.metadata.get(`active-shift:${key}`))?.value as {scope:OfflineScope;shift:{id:string;locationId:string;status:string}|null;savedAt:string}|undefined;
      if (!shift?.scope || scopeKey(shift.scope)!==key || !Number.isFinite(Date.parse(shift.savedAt)) || (shift.shift?.id??null)!==command.payoutShiftId || (shift.shift && (shift.shift.locationId!==command.scope.locationId || shift.shift.status!=="OPEN"))) throw new OfflineError("SHIFT_STATE_UNKNOWN", "The original payout shift was not verified. Preserve evidence for review.");
      const order = snapshot.history.find(row => row.id === command.orderId);
      if (!order || !Number.isFinite(Date.parse(order.occurredAt??order.createdAt)) || at<Date.parse(order.occurredAt??order.createdAt) || order.businessId !== command.scope.businessId || order.locationId !== command.scope.locationId || !["PAID", "PARTIALLY_REFUNDED"].includes(order.status) || order.paymentMethod !== command.paymentMethod || command.items.some(item => {
        const line = order.lines.find(row => row.id === item.orderItemId);
        return !line || line.unitPrice !== item.unitPrice || !Number.isSafeInteger(line.refundableQuantity) || item.quantity > line.refundableQuantity!;
      })) throw new OfflineError("REFUND_SOURCE_NOT_READY", "The selected official order or remaining quantities cannot be verified from this saved download. Keep payout evidence separately for manager review.");
    } else {
      const product = snapshot.products.find(row => row.id === command.productId && row.isActive !== false);
      if (!product || product.updatedAt !== command.expectedUpdatedAt || (product.description ?? null) !== command.expectedDescription) throw new OfflineError("PRODUCT_VERSION_CONFLICT", "The saved product version changed. Reopen the original product before recording an edit.");
    }
    const next: AdvancedRecord = { clientCommandId: command.clientCommandId, scopeKey: key, entityKey, command, payloadHash: hash, state: "PENDING", savedAt: new Date().toISOString(), attempts: 0, nextAttemptAt: 0 };
    await db.advancedCommands.add(next);
    await db.permissions.update(key, { lastObservedAt: Date.now() });
    return next;
  });
}

export async function recordRefundPayout(db: OfflineDatabase, scope: OfflineScope, order: Order, items: Array<{orderItemId: string; quantity: number}>, reason: string, payoutShiftId: string | null, payoutReported: boolean) {
  if (!payoutReported) throw new OfflineError("PAYOUT_EVIDENCE_REQUIRED", "Confirm that the exact amount was already paid under your store's approved procedure. This action does not authorize a new payment.");
  const {record} = await verifySavedPermission(db, scope, "OFFLINE");
  const lines = items.map(item => {
    const line = order.lines.find(row => row.id === item.orderItemId);
    if (!line) throw new OfflineError("REFUND_SOURCE_NOT_READY", "Original order line is missing.");
    return { ...item, unitPrice: line.unitPrice };
  });
  const command: RefundCommand = { version:1, kind:"REFUND_PAYOUT_EVIDENCE", clientCommandId:crypto.randomUUID(), scope:{...scope}, occurredAt:new Date().toISOString(), grantToken:record.grantToken, orderId:order.id, items:lines, totalRefund:lines.reduce((sum,line)=>sum+line.quantity*line.unitPrice,0), reason:reason.trim(), payoutShiftId, paymentMethod:order.paymentMethod, evidence:"REPORTED_ALREADY_PAID" };
  return recordAdvancedCommand(db, command);
}
export async function recordDescriptionEdit(db: OfflineDatabase, scope: OfflineScope, product: Product, description: string | null) {
  if (!product.updatedAt) throw new OfflineError("PRODUCT_VERSION_REQUIRED", "Download this product's current server version before editing offline.");
  const {record} = await verifySavedPermission(db,scope,"OFFLINE");
  const command: DescriptionCommand = {version:1,kind:"PRODUCT_DESCRIPTION_EDIT",clientCommandId:crypto.randomUUID(),scope:{...scope},occurredAt:new Date().toISOString(),grantToken:record.grantToken,productId:product.id,expectedUpdatedAt:product.updatedAt,expectedDescription:product.description??null,description};
  return recordAdvancedCommand(db,command);
}

/** One command/request. A bounded pass avoids blocking the register; there is no completed-sale count cap. */
export async function drainAdvancedCommands(db: OfflineDatabase, scope: OfflineScope, authenticatedUserId: string, transport: (command: AdvancedCommand) => Promise<unknown>, options: { signal?: AbortSignal; now?: () => number } = {}) {
  if (scope.userId !== authenticatedUserId) throw new OfflineError("ORIGINAL_ACTOR_REQUIRED", "Sync as the original operator.");
  const now = options.now ?? Date.now;
  const key = scopeKey(scope);
  let synced=0, review=0, retry=0;
  for (let i=0;i<25 && !options.signal?.aborted;i++) {
    const row = await db.transaction("rw", db.advancedCommands, async () => {
      for (const state of ["PENDING","UNKNOWN","RETRY_WAIT","SENDING","BLOCKED_AUTH"] as const) {
        const candidate = await db.advancedCommands.where("[scopeKey+state+nextAttemptAt]").between([key,state,0],[key,state,now()],true,true).first();
        if (!candidate) continue;
        const next: AdvancedRecord = {...candidate,state:"SENDING",attemptId:crypto.randomUUID(),nextAttemptAt:now()+45_000,attempts:candidate.attempts+1};
        await db.advancedCommands.put(next);return next;
      }
      return undefined;
    });
    if (!row) break;
    let state: OutboxState = "UNKNOWN", acknowledgment: AdvancedAck | undefined, lastCode: string | undefined, lastMessage: string | undefined;
    try {
      try { parseAdvancedCommand(row.command); } catch { throw new OfflineError("LOCAL_COMMAND_INTEGRITY", "Saved command fields cannot be verified."); }
      if (row.scopeKey !== key || scopeKey(row.command.scope) !== key || row.clientCommandId !== row.command.clientCommandId || row.payloadHash !== await sha256(row.command) || row.entityKey !== advancedEntityKey(row.command.kind,row.command.scope,commandEntity(row.command))) throw new OfflineError("LOCAL_COMMAND_INTEGRITY", "Saved evidence identity or fingerprint does not match.");
      if (options.signal?.aborted) throw new Error("Sync paused after operator changed");
      const result = await transport(row.command);
      if (!matchesAdvancedAck(result,row.command,row.payloadHash)) throw new OfflineError("INVALID_COMMAND_ACK", "Server result does not match original evidence. Keep it for review.");
      state="SYNCED";acknowledgment=result;
    } catch (cause) {
      const error = cause as {status?: number;code?: string;message?: string};
      lastCode=error?.code ?? "COMMAND_OUTCOME_UNKNOWN";lastMessage=error?.message ?? "Command result is unknown.";
      if (cause instanceof OfflineError || [400,404,409,422].includes(error?.status??0) && lastCode!=="COMMAND_RETRY_SAME_ID" && lastCode!=="SESSION_RENEWED_RETRY_REQUIRED" || ["COMMAND_NOT_AUTHORIZED","COMMAND_AUTHORITY_CHANGED","OFFLINE_GRANT_REVOKED"].includes(lastCode)) state="NEEDS_REVIEW";
      else if ([401,403].includes(error?.status??0)) state="BLOCKED_AUTH";
      else state=(!error?.status || error.status>=500)?"UNKNOWN":"RETRY_WAIT";
    }
    const applied = await db.transaction("rw",db.advancedCommands,async()=>{
      const current=await db.advancedCommands.get(row.clientCommandId);
      if (!current || current.attemptId!==row.attemptId || current.state!=="SENDING") return false;
      await db.advancedCommands.put({...current,state,attemptId:undefined,nextAttemptAt:state==="SYNCED"||state==="NEEDS_REVIEW"?0:now()+Math.min(300_000,1000*2**Math.min(9,row.attempts)),acknowledgment,lastCode,lastMessage});return true;
    });
    if (applied) { if(state==="SYNCED")synced++;else if(state==="NEEDS_REVIEW")review++;else retry++; }
    if (state==="BLOCKED_AUTH" || state==="RETRY_WAIT" || state==="UNKNOWN") break;
  }
  return {synced,review,retry};
}
