import Dexie from "dexie";
import type { Order } from "@/types/domain";
import type { OfflineDatabase } from "../db/offline-db";
import type { LocalSale, OfflineScope, OutboxRecord, OutboxState, SyncEnvelope, SyncLease, SyncResult } from "./types";
import { OfflineError, scopeKey, sha256 } from "./scope";

export type SyncTransport = (envelope: SyncEnvelope, signal?: AbortSignal) => Promise<{ results: SyncResult[] }>;
export interface SyncPassOptions {
  authenticatedUserId: string; owner?: string; signal?: AbortSignal;
  force?: boolean; resumeAuthenticated?: boolean; now?: () => number;
}
export interface SyncPassResult { claimed: number; synced: number; review: number; retry: number; blocked: boolean; leaseBusy: boolean }
const LEASE_MS = 45_000;
export const MAX_SYNC_REQUEST_BYTES = 3 * 1024 * 1024;
const batchCapKey = (scope: OfflineScope) => `sync-request-item-cap:${scopeKey(scope)}`;
const jsonBytes = (value: unknown) => new TextEncoder().encode(JSON.stringify(value)).byteLength;
const STATES: OutboxState[] = ["PENDING", "SENDING", "UNKNOWN", "RETRY_WAIT", "BLOCKED_AUTH", "NEEDS_REVIEW", "SYNCED"];
const ELIGIBLE: OutboxState[] = ["PENDING", "UNKNOWN", "RETRY_WAIT", "SENDING"];
const leaseKey = (scope: OfflineScope) => `sales:${scopeKey(scope)}`;

function eligibleRows(db: OfflineDatabase, key: string, state: OutboxState, before: number) {
  return db.outbox.where("[scopeKey+state+nextAttemptAt]").between([key, state, Dexie.minKey], [key, state, before], true, true);
}
export async function getSyncSummary(db: OfflineDatabase, scope: OfflineScope) {
  return db.transaction("r",db.outbox,async()=>{
  const counts = Object.fromEntries(await Promise.all(STATES.map(async state => [state, await eligibleRows(db, scopeKey(scope), state, Number.MAX_SAFE_INTEGER).count()]))) as Record<OutboxState, number>;
  return { counts, pending: counts.PENDING + counts.SENDING + counts.UNKNOWN + counts.RETRY_WAIT + counts.BLOCKED_AUTH, review: counts.NEEDS_REVIEW, synced: counts.SYNCED };
  });
}
export async function listOutboxPage(db: OfflineDatabase, scope: OfflineScope, state: OutboxState, offset = 0, limit = 50) {
  return eligibleRows(db, scopeKey(scope), state, Number.MAX_SAFE_INTEGER).offset(Math.max(0, offset)).limit(Math.max(1, Math.min(100, limit))).toArray();
}
async function acquire(db: OfflineDatabase, scope: OfflineScope, owner: string, now: number): Promise<SyncLease | undefined> {
  return db.transaction("rw", db.syncLeases, async () => {
    const key = leaseKey(scope);
    const previous = await db.syncLeases.get(key);
    if (previous && previous.expiresAt > now) return undefined;
    const next = { key, owner, fence: (previous?.fence ?? 0) + 1, expiresAt: now + LEASE_MS };
    await db.syncLeases.put(next);
    return next;
  });
}
async function release(db: OfflineDatabase, lease: SyncLease) {
  await db.transaction("rw", db.syncLeases, async () => {
    const current = await db.syncLeases.get(lease.key);
    if (current?.fence === lease.fence && current.owner === lease.owner) await db.syncLeases.put({ ...current, expiresAt: 0 });
  });
}
async function claim(db: OfflineDatabase, scope: OfflineScope, lease: SyncLease, now: number, force: boolean): Promise<OutboxRecord[]> {
  return db.transaction("rw", [db.outbox, db.syncLeases, db.localSales, db.metadata], async () => {
    const current = await db.syncLeases.get(lease.key);
    if (current?.fence !== lease.fence || current.expiresAt <= now) return [];
    const configured = (await db.metadata.get(batchCapKey(scope)))?.value;
    const itemCap = typeof configured === "number" && Number.isSafeInteger(configured) ? Math.min(100,Math.max(1,configured)) : 100;
    const candidates: OutboxRecord[] = [];
    for (const state of ELIGIBLE) {
      const before = force && state !== "SENDING" ? Number.MAX_SAFE_INTEGER : now;
      candidates.push(...await eligibleRows(db, scopeKey(scope), state, before).limit(itemCap - candidates.length).toArray());
      if (candidates.length === itemCap) break;
    }
    const rows: OutboxRecord[] = [];
    const envelopeBytes = jsonBytes({ deviceId:scope.deviceId, businessId:scope.businessId, locationId:scope.locationId, orders:[] });
    let totalBytes = envelopeBytes;
    for (const candidate of candidates) {
      const sale = await db.localSales.get(candidate.clientOrderId);
      let size = 0;
      try { if (sale) size = jsonBytes(sale.wire); } catch { /* Claim corrupt evidence so it can be quarantined below. */ }
      // A single over-budget event is claimed for review, without sending or altering it.
      if (size + envelopeBytes > MAX_SYNC_REQUEST_BYTES) { rows.push(candidate); continue; }
      if (totalBytes + size + (rows.length ? 1 : 0) > MAX_SYNC_REQUEST_BYTES) break;
      totalBytes += size + (rows.length ? 1 : 0);
      rows.push(candidate);
    }
    const claimed = rows.map(row => ({ ...row, state: "SENDING" as const, fence: lease.fence, nextAttemptAt: lease.expiresAt, attempts: row.attempts + 1, updatedAt: new Date(now).toISOString() }));
    await db.outbox.bulkPut(claimed);
    return claimed;
  });
}
function retryAt(attempts: number, now: number) { return now + Math.min(300_000, 1000 * 2 ** Math.min(Math.max(0, attempts - 1), 9)) + Math.floor(Math.random() * 1000); }
function transportStatus(error: unknown): number | undefined {
  if (error && typeof error === "object") {
    const value = error as { status?: number; statusCode?: number; response?: { status?: number } };
    return value.status ?? value.statusCode ?? value.response?.status;
  }
  return undefined;
}
function transportCode(error: unknown): string | undefined {
  if (!error || typeof error !== "object") return undefined;
  const value = error as { code?: string; response?: { data?: { code?: string } } };
  return value.code ?? value.response?.data?.code;
}
function officialOrder(result: SyncResult, sale: LocalSale): Order {
  const raw = result.order;
  if (!raw || !raw.id || !raw.invoiceNumber || !["PAID", "REFUNDED", "PARTIALLY_REFUNDED"].includes(raw.status) || raw.businessId !== sale.scope.businessId || raw.locationId !== sale.scope.locationId || raw.cashierId !== sale.scope.userId || raw.totalAmount !== sale.totalAmount || raw.paymentMethod !== sale.wire.paymentMethod || !Array.isArray(raw.lines) || (raw.clientOrderId && raw.clientOrderId !== sale.clientOrderId)) {
    throw new OfflineError("INVALID_ACKNOWLEDGMENT", "The server confirmation does not match this saved sale.");
  }
  const lineIdentity = (line: { variantId?: string | null; productName?: string; variantName?: string | null; quantity: number; unitPrice: number }) => JSON.stringify([
    sale.wire.orderType === "CATALOG" ? line.variantId : [line.productName?.trim() ?? "", line.variantName?.trim() ?? ""],
    line.quantity, line.unitPrice,
  ]);
  const expectedLines = sale.lines.map(lineIdentity).sort();
  const actualLines = raw.lines.map(lineIdentity).sort();
  if (raw.lines.some(line => !line.id) || new Set(raw.lines.map(line=>line.id)).size !== raw.lines.length || (raw.tenderedAmount != null && raw.tenderedAmount !== sale.wire.tenderedAmount) || (raw.changeDue != null && raw.changeDue !== sale.changeDue) || expectedLines.length !== actualLines.length || expectedLines.some((line,index) => line !== actualLines[index])) {
    throw new OfflineError("INVALID_ACKNOWLEDGMENT", "The official sale lines do not match the immutable local sale.");
  }
  const type = raw.type ?? raw.orderType;
  if (type !== sale.wire.orderType) throw new OfflineError("INVALID_ACKNOWLEDGMENT", "The server confirmed the wrong sale kind.");
  return { ...raw, type };
}

export async function runSyncPass(db: OfflineDatabase, scope: OfflineScope, transport: SyncTransport, options: SyncPassOptions): Promise<SyncPassResult> {
  const outcome: SyncPassResult = { claimed: 0, synced: 0, review: 0, retry: 0, blocked: false, leaseBusy: false };
  if (options.authenticatedUserId !== scope.userId) throw new OfflineError("UPLOAD_IDENTITY_MISMATCH", "Sign in as the original operator to upload this queue. Recovery must keep the original seller.");
  if (options.signal?.aborted) return outcome;
  const now = options.now ?? Date.now;
  const owner = options.owner ?? crypto.randomUUID();
  const lease = await acquire(db, scope, owner, now());
  if (!lease) return { ...outcome, leaseBusy: true };
  try {
    if (options.resumeAuthenticated) await eligibleRows(db, scopeKey(scope), "BLOCKED_AUTH", Number.MAX_SAFE_INTEGER).modify({ state: "PENDING", nextAttemptAt: 0 });
    const batch = await claim(db, scope, lease, now(), options.force === true);
    outcome.claimed = batch.length;
    if (!batch.length) return outcome;
    const sales = await db.localSales.bulkGet(batch.map(row => row.clientOrderId));
    const validSales: LocalSale[] = [];
    const localProblems = new Map<string, SyncResult>();
    for (let index = 0; index < batch.length; index++) {
      const sale = sales[index];
      let intact = false;
      try { intact = !!sale && sale.clientOrderId === batch[index].clientOrderId && sale.wire.clientOrderId === sale.clientOrderId && sale.wire.userId === scope.userId && scopeKey(sale.scope) === scopeKey(scope) && sale.scopeKey === scopeKey(scope) && sale.payloadHash === await sha256({ scope: sale.scope, wire: sale.wire }); } catch { /* Do not let malformed data block the rest of the queue. */ }
      if (!intact || !sale) {
        localProblems.set(batch[index].clientOrderId, { clientOrderId: batch[index].clientOrderId, status: "REJECTED", code: "LOCAL_INTEGRITY_ERROR", retryable: false, message: "Saved sale integrity needs review. The original data has been kept." });
      } else if (jsonBytes({ deviceId: scope.deviceId, businessId: scope.businessId, locationId: scope.locationId, orders:[sale.wire] }) > MAX_SYNC_REQUEST_BYTES) {
        localProblems.set(sale.clientOrderId, { clientOrderId:sale.clientOrderId, status:"REJECTED", code:"REQUEST_TOO_LARGE", retryable:false, message:"This one saved sale exceeds the configured request size. Keep its original ID and encrypted backup for authorized recovery." });
      } else validSales.push(sale);
    }
    let results: SyncResult[] = [];
    let requestError: unknown;
    const requestStartedAt = now();
    if (validSales.length) {
      try {
        const response = await transport({ deviceId: scope.deviceId, businessId: scope.businessId, locationId: scope.locationId, orders: validSales.map(sale => sale.wire) }, options.signal);
        if (!response || !Array.isArray(response.results)) throw new OfflineError("INVALID_SYNC_RESPONSE", "The sync response is incomplete.");
        results = response.results;
      } catch (error) { requestError = error; }
    }
    const byId = new Map<string, SyncResult>();
    const repeated = new Set<string>();
    for (const result of results) {
      if (!result?.clientOrderId) continue;
      if (byId.has(result.clientOrderId)) repeated.add(result.clientOrderId);
      byId.set(result.clientOrderId, result);
    }
    // An acknowledgment is durable only after this entire local write transaction succeeds.
    await db.transaction("rw", [db.outbox, db.serverMappings, db.reviews, db.syncLeases, db.permissions, db.metadata], async () => {
      const currentLease = await db.syncLeases.get(lease.key);
      if (currentLease?.fence !== lease.fence || currentLease.owner !== owner) return;
      const requestStatus = transportStatus(requestError);
      const renewedSession = requestStatus === 401 && transportCode(requestError) === "SESSION_RENEWED_RETRY_REQUIRED";
      if (requestStatus === 413 && validSales.length > 1) await db.metadata.put({ key:batchCapKey(scope), value:Math.max(1,Math.floor(validSales.length/2)) });
      for (let index = 0; index < batch.length; index++) {
        const claimed = batch[index];
        const current = await db.outbox.get(claimed.clientOrderId);
        if (!current || current.fence !== lease.fence || current.state !== "SENDING") continue;
        const sale = sales[index];
        let result = localProblems.get(current.clientOrderId) ?? (repeated.has(current.clientOrderId) ? undefined : byId.get(current.clientOrderId));
        const stamp = new Date(now()).toISOString();
        if (result && ["ACCEPTED", "DUPLICATE"].includes(result.status) && sale) {
          try {
            const order = officialOrder(result, sale);
            await db.serverMappings.put({ clientOrderId: current.clientOrderId, scopeKey: current.scopeKey, orderId: order.id, invoiceNumber: order.invoiceNumber, order, acknowledgedAt: stamp, warnings: result.warnings ?? [] });
            await db.outbox.put({ ...current, state: "SYNCED", nextAttemptAt: 0, updatedAt: stamp, lastCode: result.status });
            outcome.synced++;
            continue;
          } catch (error) {
            if (!(error instanceof OfflineError)) throw error; // Storage failure must roll back acknowledgment, not hide it.
            result = { clientOrderId: current.clientOrderId, status: "REJECTED", retryable: false, code: error.code, message: error.message };
          }
        }
        if (!result && requestStatus === 413 && validSales.length === 1) result = { clientOrderId: current.clientOrderId, status:"REJECTED", code:"REQUEST_TOO_LARGE", retryable:false, message:"The server refused the size of this single saved sale. Keep the original event for authorized recovery; do not split it into new sales." };
        if (!result && (renewedSession || (requestStatus === 413 && validSales.length > 1))) {
          await db.outbox.put({ ...current, state:"RETRY_WAIT", nextAttemptAt:renewedSession ? retryAt(current.attempts,now()) : 0, lastCode:renewedSession ? "SESSION_RENEWED_RETRY_REQUIRED" : "REQUEST_TOO_LARGE_RETRY_SMALLER_BATCH", updatedAt:stamp });
          outcome.retry++;
        } else if ((!renewedSession && (requestStatus === 401 || requestStatus === 403)) || result?.code === "AUTH_REQUIRED") {
          await db.outbox.put({ ...current, state: "BLOCKED_AUTH", nextAttemptAt: 0, updatedAt: stamp, lastCode: result?.code ?? "AUTH_REQUIRED" });
          const permission = await db.permissions.get(current.scopeKey);
          if (permission?.provisionRequestStartedAt === undefined || permission.provisionRequestStartedAt <= requestStartedAt) await db.permissions.update(current.scopeKey, { rejectedAt: now(), rejectedReason: result?.code ?? "AUTH_REQUIRED" });
          outcome.blocked = true;
        } else if (result?.status === "REJECTED" && result.retryable === false) {
          const code = result.code ?? "SERVER_REVIEW_REQUIRED";
          const message = result.message ?? result.error ?? "The server could not post this saved sale. Keep the original payment evidence for review.";
          await db.reviews.put({ clientOrderId: current.clientOrderId, scopeKey: current.scopeKey, code, message, recordedAt: stamp });
          await db.outbox.put({ ...current, state: "NEEDS_REVIEW", nextAttemptAt: 0, lastCode: code, lastMessage: message, updatedAt: stamp });
          outcome.review++;
        } else {
          const state = result?.status === "REJECTED" && result.retryable === true ? "RETRY_WAIT" : "UNKNOWN";
          await db.outbox.put({ ...current, state, nextAttemptAt: retryAt(current.attempts, now()), lastCode: result?.code ?? "RESPONSE_UNCERTAIN", updatedAt: stamp });
          outcome.retry++;
        }
      }
    });
    return outcome;
  } finally { await release(db, lease); }
}

/** Foreground bounded turns drain any queue length over repeated calls; there is no sale-count ceiling. */
export async function drainSync(db: OfflineDatabase, scope: OfflineScope, transport: SyncTransport, options: SyncPassOptions & { timeBudgetMs?: number }) {
  const started = Date.now();
  const total: SyncPassResult = { claimed: 0, synced: 0, review: 0, retry: 0, blocked: false, leaseBusy: false };
  let first = true;
  while (!options.signal?.aborted && Date.now() - started < (options.timeBudgetMs ?? 15_000)) {
    const pass = await runSyncPass(db, scope, transport, { ...options, force: first && options.force, resumeAuthenticated: first && options.resumeAuthenticated });
    first = false;
    total.claimed += pass.claimed; total.synced += pass.synced; total.review += pass.review; total.retry += pass.retry;
    total.blocked ||= pass.blocked; total.leaseBusy ||= pass.leaseBusy;
    if (pass.blocked || pass.leaseBusy || pass.claimed === 0 || pass.retry > 0) break;
    await new Promise(resolve => setTimeout(resolve, 0));
  }
  return total;
}
