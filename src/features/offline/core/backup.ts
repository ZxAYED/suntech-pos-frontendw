import { advancedEntityKey, type AdvancedRecord } from "./advanced-commands";
import { commandEntity, matchesAdvancedAck, parseAdvancedCommand } from "./advanced-wire";
import type { LegacyRefundEvidence } from "../services/refund-recovery";
import type { OfflineDatabase } from "../db/offline-db";
import type { CartRecord, LocalReceipt, LocalSale, MetaRecord, OfflineScope, OutboxRecord, ReviewRecord, ServerMapping, StockOverlay } from "./types";
import { base64url, canonicalJson, decodeBase64url, isUuid, OfflineError, scopeKey, sha256 } from "./scope";

const ITERATIONS = 210_000;
interface BackupPayload {
  version: 1 | 2; application: "SUNTECH_POS"; exportedAt: string; scope: OfflineScope;
  sales: LocalSale[]; receipts: LocalReceipt[]; outbox: OutboxRecord[]; mappings: ServerMapping[];
  overlays: StockOverlay[]; drafts: CartRecord[]; reviews: ReviewRecord[];
  legacyEvidence?: MetaRecord[];
  advancedCommands?: AdvancedRecord[];
  legacyRefunds?: MetaRecord[];
  recoveryEvidence?: MetaRecord[];
}
interface EncryptedEnvelope {
  application: "SUNTECH_POS_BACKUP"; version: 1 | 2; cipher: "AES-256-GCM"; kdf: "PBKDF2-SHA256";
  iterations: number; salt: string; iv: string; ciphertext: string;
}
function additionalData(envelope: Omit<EncryptedEnvelope, "ciphertext">) { return new TextEncoder().encode(canonicalJson(envelope)); }
async function keyFromPassword(password: string, salt: Uint8Array<ArrayBuffer>, iterations: number) {
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({ name: "PBKDF2", hash: "SHA-256", salt, iterations }, material, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}

/** Restored evidence must survive another device failure, not just the first restore. */
function recoveryEvidencePrefixes(key: string): string[] {
  return [
    `restored-draft-evidence:${key}:`, `restored-ack-evidence:${key}:`,
    `restored-legacy-evidence:legacy-financial-recovery:${key}:`,
    `restored-legacy-evidence:legacy-sale-confirmed:${key}:`,
    `restored-legacy-refund-evidence:${key}:`,
  ];
}
async function readRecoveryEvidence(db: OfflineDatabase, scope: OfflineScope): Promise<MetaRecord[]> {
  const rows = (await Promise.all(recoveryEvidencePrefixes(scopeKey(scope)).map(prefix => db.metadata.where("key").startsWith(prefix).toArray()))).flat();
  if (rows.some(row => !isScopedRecoveryEvidence(row, scope))) throw new OfflineError("BACKUP_INTEGRITY_ERROR", "Saved recovery evidence cannot be verified. Keep the original device data for review.");
  return rows;
}
function isScopedRecoveryEvidence(row: MetaRecord, scope: OfflineScope): boolean {
  const key = scopeKey(scope);
  if (!row || typeof row.key !== "string" || !recoveryEvidencePrefixes(key).some(prefix => row.key.startsWith(prefix))) return false;
  if (row.key.startsWith(`restored-draft-evidence:${key}:`) || row.key.startsWith(`restored-ack-evidence:${key}:`)) return (row.value as { scopeKey?: string } | null)?.scopeKey === key;
  const wrapped = row.value as MetaRecord | null;
  if (!wrapped || typeof wrapped.key !== "string") return false;
  const original = wrapped.value as {scope?:OfflineScope} | null;
  return !!original?.scope && scopeKey(original.scope) === key;
}

/** The caller must actually download/copy this result to independent storage. A local file is not a device-loss backup. */
export async function exportEncryptedBackup(db: OfflineDatabase, scope: OfflineScope, password: string): Promise<string> {
  if (password.length < 12) throw new OfflineError("WEAK_BACKUP_PASSWORD", "Use a backup password with at least 12 characters and store it separately.");
  const key = scopeKey(scope);
  const payload: BackupPayload = await db.transaction("r", [db.localSales, db.receipts, db.outbox, db.serverMappings, db.stockOverlays, db.drafts, db.reviews, db.metadata, db.advancedCommands], async () => ({
    version: 2, application: "SUNTECH_POS", scope: { ...scope }, exportedAt: new Date().toISOString(),
    sales: await db.localSales.where("scopeKey").equals(key).toArray(),
    receipts: await db.receipts.where("scopeKey").equals(key).toArray(),
    outbox: await db.outbox.where("scopeKey").equals(key).toArray(),
    mappings: await db.serverMappings.where("scopeKey").equals(key).toArray(),
    overlays: await db.stockOverlays.where("scopeKey").equals(key).toArray(),
    drafts: await db.drafts.where("scopeKey").equals(key).toArray(),
    reviews: await db.reviews.where("scopeKey").equals(key).toArray(),
    advancedCommands: await db.advancedCommands.where("scopeKey").equals(key).toArray(),
    legacyRefunds: await db.metadata.where("key").startsWith("legacy-refund:").filter(row=>{const evidence=row.value as LegacyRefundEvidence;return evidence?.scope && scopeKey(evidence.scope)===key;}).toArray(),
    recoveryEvidence: await readRecoveryEvidence(db, scope),
    legacyEvidence: [
      ...await db.metadata.where("key").startsWith(`legacy-financial-recovery:${key}:`).toArray(),
      ...await db.metadata.where("key").startsWith(`legacy-sale-confirmed:${key}:`).toArray(),
    ],
  }));
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const header: Omit<EncryptedEnvelope, "ciphertext"> = { application: "SUNTECH_POS_BACKUP", version: 2, cipher: "AES-256-GCM", kdf: "PBKDF2-SHA256", iterations: ITERATIONS, salt: base64url(salt), iv: base64url(iv) };
  const encryptionKey = await keyFromPassword(password, salt, ITERATIONS);
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv, additionalData: additionalData(header), tagLength: 128 }, encryptionKey, new TextEncoder().encode(canonicalJson(payload)));
  // Record creation, never claim that an external drive/cloud copy was made successfully.
  await db.metadata.put({ key: `backup-created:${key}`, value: payload.exportedAt });
  return JSON.stringify({ ...header, ciphertext: base64url(new Uint8Array(encrypted)) });
}

export async function restoreEncryptedBackup(db: OfflineDatabase, encryptedText: string, password: string, authenticatedUserId: string): Promise<{scope: OfflineScope; imported: number; alreadyPresent: number}> {
  let payload: BackupPayload;
  try {
    const envelope = JSON.parse(encryptedText) as EncryptedEnvelope;
    if (envelope.application !== "SUNTECH_POS_BACKUP" || ![1,2].includes(envelope.version) || envelope.cipher !== "AES-256-GCM" || envelope.kdf !== "PBKDF2-SHA256" || envelope.iterations !== ITERATIONS || typeof envelope.ciphertext !== "string") throw new Error("format");
    const { ciphertext, ...header } = envelope;
    const salt = decodeBase64url(envelope.salt);
    const iv = decodeBase64url(envelope.iv);
    if (salt.byteLength !== 16 || iv.byteLength !== 12) throw new Error("format");
    const key = await keyFromPassword(password, salt, envelope.iterations);
    const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv, additionalData: additionalData(header), tagLength: 128 }, key, decodeBase64url(ciphertext));
    payload = JSON.parse(new TextDecoder().decode(plain));
    if(payload.version!==envelope.version)throw new Error("version mismatch");
  } catch { throw new OfflineError("BACKUP_UNREADABLE", "The backup password is wrong or the backup is damaged. No records were changed."); }
  if (payload.application !== "SUNTECH_POS" || ![1,2].includes(payload.version) || !payload.scope || payload.scope.userId !== authenticatedUserId || !Array.isArray(payload.sales) || !Array.isArray(payload.receipts) || !Array.isArray(payload.outbox) || !Array.isArray(payload.mappings) || !Array.isArray(payload.overlays) || !Array.isArray(payload.drafts) || !Array.isArray(payload.reviews)) throw new OfflineError("BACKUP_SCOPE_MISMATCH", "Sign in as the original operator to restore this backup. Manager recovery requires separate authorization.");
  const key = scopeKey(payload.scope);
  const advancedIds=new Set<string>();
  if(payload.version===2 && (!Array.isArray(payload.advancedCommands)||!Array.isArray(payload.legacyRefunds)))throw new OfflineError("BACKUP_INCOMPLETE","The v2 backup lacks its advanced command or refund evidence section.");
  for(const row of payload.advancedCommands??[]){
    try{
      const command=parseAdvancedCommand(row.command);
      if(row.clientCommandId!==command.clientCommandId||advancedIds.has(row.clientCommandId)||row.scopeKey!==key||scopeKey(command.scope)!==key||row.entityKey!==advancedEntityKey(command.kind,command.scope,commandEntity(command))||row.payloadHash!==await sha256(command)||!["PENDING","SENDING","UNKNOWN","RETRY_WAIT","BLOCKED_AUTH","NEEDS_REVIEW","SYNCED"].includes(row.state)||!Number.isSafeInteger(row.attempts)||row.attempts<0||!Number.isFinite(Date.parse(row.savedAt))||(row.state==="SYNCED"&&!matchesAdvancedAck(row.acknowledgment,command,row.payloadHash)))throw new Error("integrity");
      advancedIds.add(row.clientCommandId);
    }catch{throw new OfflineError("BACKUP_INTEGRITY_ERROR","Saved advanced command identity or evidence is inconsistent. No records were changed.");}
  }
  const legacyRefundKeys=new Set<string>();
  for(const row of payload.legacyRefunds??[]){
    const value=row.value as LegacyRefundEvidence;
    if(!value?.scope||scopeKey(value.scope)!==key||!value.operation?.payloadSnapshot?.orderId||!isUuid(value.operation.key)||value.operation.operationType!=="refund"||value.operation.userId!==payload.scope.userId||value.operation.businessId!==payload.scope.businessId||value.operation.locationId!==payload.scope.locationId||value.operation.scopeExtra!==value.operation.payloadSnapshot.orderId||row.key!==`legacy-refund:${advancedEntityKey("REFUND_PAYOUT_EVIDENCE",value.scope,value.operation.payloadSnapshot.orderId)}`||legacyRefundKeys.has(row.key)||!["PENDING","RESOLVED","RESTORED_REVIEW"].includes(value.state))throw new OfflineError("BACKUP_INTEGRITY_ERROR","Original legacy refund evidence is inconsistent.");
    legacyRefundKeys.add(row.key);
  }
  if (payload.recoveryEvidence !== undefined && (!Array.isArray(payload.recoveryEvidence) || payload.recoveryEvidence.some(row => !isScopedRecoveryEvidence(row, payload.scope)) || new Set(payload.recoveryEvidence.map(row => row.key)).size !== payload.recoveryEvidence.length)) throw new OfflineError("BACKUP_INTEGRITY_ERROR", "Restored evidence belongs to another register or has inconsistent identity.");
  const ids = new Set<string>();
  for (const sale of payload.sales) {
    if (!isUuid(sale.clientOrderId) || sale.scopeKey !== key || scopeKey(sale.scope) !== key || sale.wire.clientOrderId !== sale.clientOrderId || sale.wire.userId !== payload.scope.userId || ids.has(sale.clientOrderId) || sale.payloadHash !== await sha256({ scope: sale.scope, wire: sale.wire })) throw new OfflineError("BACKUP_INTEGRITY_ERROR", "A sale in the backup has inconsistent content. No records were changed.");
    ids.add(sale.clientOrderId);
  }
  for (const rows of [payload.receipts, payload.outbox, payload.mappings, payload.overlays, payload.reviews]) {
    for (const row of rows) if (row.scopeKey !== key || !ids.has(row.clientOrderId)) throw new OfflineError("BACKUP_INTEGRITY_ERROR", "Backup records refer to another scope or a missing sale.");
  }
  const receiptById = new Map(payload.receipts.map(row => [row.clientOrderId, row]));
  const outboxById = new Map(payload.outbox.map(row => [row.clientOrderId, row]));
  if (payload.receipts.length !== payload.sales.length || payload.outbox.length !== payload.sales.length || receiptById.size !== payload.sales.length || outboxById.size !== payload.sales.length) throw new OfflineError("BACKUP_INCOMPLETE", "The backup is missing a receipt or pending-sale record.");
  if (payload.legacyEvidence !== undefined && !Array.isArray(payload.legacyEvidence)) throw new OfflineError("BACKUP_INTEGRITY_ERROR", "Legacy recovery evidence is invalid.");
  for (const row of payload.legacyEvidence ?? []) {
    const value = row.value as { scope?: OfflineScope; operation?: { key?: string; userId?: string; businessId?: string; locationId?: string; operationType?: string; deliveryProtocol?: string }; originalKey?: string } | null;
    if (!value?.scope || scopeKey(value.scope) !== key) throw new OfflineError("BACKUP_SCOPE_MISMATCH", "Legacy recovery evidence belongs to another original register.");
    if (row.key.startsWith(`legacy-financial-recovery:${key}:`)) {
      const operation = value.operation;
      if (!operation?.key || !isUuid(operation.key) || !["catalog_sale","custom_sale"].includes(operation.operationType ?? "") || row.key !== `legacy-financial-recovery:${key}:${operation.operationType}` || operation.userId !== payload.scope.userId || operation.businessId !== payload.scope.businessId || operation.locationId !== payload.scope.locationId || (operation.deliveryProtocol && operation.deliveryProtocol !== "LEGACY_HTTP")) throw new OfflineError("BACKUP_INTEGRITY_ERROR", "A legacy recovery command has mismatched identity or scope.");
    } else if (!value.originalKey || !isUuid(value.originalKey) || row.key !== `legacy-sale-confirmed:${key}:${value.originalKey}`) {
      throw new OfflineError("BACKUP_INTEGRITY_ERROR", "A legacy acknowledgment has mismatched identity.");
    }
  }
  const saleById = new Map(payload.sales.map(sale => [sale.clientOrderId,sale]));
  for (const sale of payload.sales) {
    const receipt = receiptById.get(sale.clientOrderId)!;
    const total = sale.wire.lines.reduce((sum,line) => sum + line.quantity * line.unitPrice,0);
    if (!Number.isSafeInteger(total) || total < 0 || total !== sale.totalAmount || receipt.order.id !== sale.clientOrderId || receipt.order.totalAmount !== total || receipt.order.paymentMethod !== sale.wire.paymentMethod || receipt.order.businessId !== sale.scope.businessId || receipt.order.locationId !== sale.scope.locationId || receipt.order.cashierId !== sale.scope.userId) throw new OfflineError("BACKUP_INTEGRITY_ERROR", "A receipt does not match its original saved sale.");
  }
  for (const overlay of payload.overlays) {
    const sale = saleById.get(overlay.clientOrderId)!;
    const expected = -sale.wire.lines.filter(line => line.variantId === overlay.variantId).reduce((sum,line) => sum + line.quantity,0);
    if (sale.wire.orderType !== "CATALOG" || overlay.key !== `${sale.clientOrderId}:${overlay.variantId}` || expected === 0 || overlay.quantityDelta !== expected) throw new OfflineError("BACKUP_INTEGRITY_ERROR", "A stock change does not match its original sale.");
  }
  for (const draft of payload.drafts) if (draft.scopeKey !== key) throw new OfflineError("BACKUP_SCOPE_MISMATCH", "A cart in the backup belongs to another register.");
  let imported = 0;
  let alreadyPresent = 0;
  const importedIds = new Set<string>();
  await db.transaction("rw", [db.localSales, db.receipts, db.outbox, db.serverMappings, db.stockOverlays, db.drafts, db.reviews, db.metadata, db.catalogSnapshots, db.advancedCommands], async () => {
    for (const sale of payload.sales) {
      const existing = await db.localSales.get(sale.clientOrderId);
      if (existing) {
        if (existing.scopeKey !== key || existing.payloadHash !== sale.payloadHash) throw new OfflineError("RESTORE_ID_CONFLICT", "An existing sale has this ID with different content. Restore stopped without changing records.");
        alreadyPresent++;
        continue; // Never downgrade a newer accepted mapping or retry state.
      }
      await db.localSales.add(sale);
      await db.receipts.add(receiptById.get(sale.clientOrderId)!);
      // Even a backup labeled synced must replay its SAME ID to obtain authoritative server status.
      const original = outboxById.get(sale.clientOrderId)!;
      await db.outbox.add({ ...original, state: "BLOCKED_AUTH", nextAttemptAt: 0, fence: undefined, lastCode: "RESTORED_REQUIRES_VERIFICATION", updatedAt: new Date().toISOString() });
      importedIds.add(sale.clientOrderId);
      imported++;
    }
    // Never reintroduce stock deltas already reflected in a newer snapshot or an existing record.
    const reflected = new Set((await db.catalogSnapshots.get(key))?.acceptedClientOrderIds ?? []);
    for (const overlay of payload.overlays) if (importedIds.has(overlay.clientOrderId) && !reflected.has(overlay.clientOrderId) && !(await db.stockOverlays.get(overlay.key))) await db.stockOverlays.add(overlay);
    for (const review of payload.reviews) if (!(await db.reviews.get(review.clientOrderId))) await db.reviews.add(review);
    // Old active/held carts are recovery evidence, not automatically fresh checkout work.
    // A backup may predate a later sale, so silently restoring it as an active cart could sell it twice.
    for (const draft of payload.drafts) await db.metadata.put({ key: `restored-draft-evidence:${key}:${draft.key}:${payload.exportedAt}`, value: draft });
    for (const mapping of payload.mappings) await db.metadata.put({ key: `restored-ack-evidence:${key}:${mapping.clientOrderId}:${payload.exportedAt}`, value: mapping });
    for (const row of payload.legacyEvidence ?? []) {
      const existing = await db.metadata.get(row.key);
      if (!existing) await db.metadata.add(row);
      else if (canonicalJson(existing) !== canonicalJson(row)) await db.metadata.put({ key: `restored-legacy-evidence:${row.key}:${payload.exportedAt}`, value: row });
    }
    for(const row of payload.advancedCommands??[]){
      const existing=await db.advancedCommands.get(row.clientCommandId);
      if(existing){if(existing.scopeKey!==key||existing.payloadHash!==row.payloadHash)throw new OfflineError("RESTORE_ID_CONFLICT","An advanced command identity has different saved content.");alreadyPresent++;continue;}
      // Never trust imported confirmation as authority; same-ID server replay can confirm it.
      await db.advancedCommands.add({...row,state:row.state==="NEEDS_REVIEW"?"NEEDS_REVIEW":"BLOCKED_AUTH",attemptId:undefined,nextAttemptAt:0,acknowledgment:undefined,lastCode:row.state==="NEEDS_REVIEW"?row.lastCode:"RESTORED_REQUIRES_VERIFICATION"});imported++;
    }
    for (const row of payload.recoveryEvidence ?? []) {
      const existing = await db.metadata.get(row.key);
      if (!existing) await db.metadata.add(row);
      else if (canonicalJson(existing) !== canonicalJson(row)) throw new OfflineError("RESTORE_ID_CONFLICT", "Recovered evidence with the same identity differs. Keep both independent backups for review.");
    }
    for(const row of payload.legacyRefunds??[]){
      const original=row.value as LegacyRefundEvidence;
      const existing=await db.metadata.get(row.key);
      if(!existing)await db.metadata.add({key:row.key,value:{...original,state:"RESTORED_REVIEW"}});
      else if(canonicalJson(existing)!==canonicalJson(row)){
        // Conflicting old evidence must never overwrite or unlock a newer request.
        await db.metadata.put({key:`restored-legacy-refund-evidence:${key}:${original.operation.key}:${payload.exportedAt}`,value:row});
        const current=existing.value as LegacyRefundEvidence;
        const sameOriginal = current?.operation?.key === original.operation.key && current.operation.payloadHash === original.operation.payloadHash && canonicalJson(current.operation.payloadSnapshot ?? null) === canonicalJson(original.operation.payloadSnapshot ?? null) && scopeKey(current.scope) === scopeKey(original.scope);
        // Different unresolved identities for the same order require review,
        // including when the current register already has a pending refund.
        if (!sameOriginal && (original.state !== "RESOLVED" || current?.state !== "RESOLVED")) await db.metadata.put({key:row.key,value:{...current,state:"RESTORED_REVIEW"}});
      }
    }
    await db.metadata.put({ key: `recovered-scope:${key}`, value: { scope: payload.scope, restoredAt: new Date().toISOString(), exportedAt: payload.exportedAt } });
  });
  return { scope: payload.scope, imported, alreadyPresent };
}
export async function listRecoveredScopes(db: OfflineDatabase, userId: string): Promise<OfflineScope[]> {
  const rows = await db.metadata.where("key").startsWith("recovered-scope:").toArray();
  return rows.map(row => (row.value as { scope: OfflineScope }).scope).filter(scope => scope.userId === userId);
}
