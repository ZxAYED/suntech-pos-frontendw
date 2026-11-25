import type { OfflineDatabase } from "../db/offline-db";
import type { GrantClaims, OfflinePermission, OfflineScope, ProvisioningResponse, VerificationKey } from "./types";
import type { User } from "@/types/domain";
import { base64url, canonicalJson, decodeBase64url, OfflineError, scopeKey } from "./scope";
import { publishBootstrap } from "./bootstrap";

export const TRUSTED_WORKSPACE_KEY = "active-workspace";
export interface TrustedWorkspaceRecord {
  active: boolean;
  scope?: OfflineScope;
  role?: User["role"];
  reason?: "online_verified" | "logged_out" | "rejected" | "account_switched";
  updatedAt: number;
}

const WORKSPACE_CHANNEL = "suntech-offline-auth";
const WORKSPACE_STORAGE_EVENT = "stpos_workspace_auth_event";

export function broadcastWorkspaceLock(
  reason: "logged_out" | "rejected" | "account_switched",
  userId?: string,
): void {
  if (typeof window === "undefined") return;
  try {
    if ("BroadcastChannel" in window) {
      const channel = new BroadcastChannel(WORKSPACE_CHANNEL);
      channel.postMessage({ type: "LOCK_WORKSPACE", reason, userId, at: Date.now() });
      channel.close();
    }
  } catch {
    // Ignore BroadcastChannel unavailability
  }
  try {
    window.localStorage.setItem(
      WORKSPACE_STORAGE_EVENT,
      JSON.stringify({ type: "LOCK_WORKSPACE", reason, userId, at: Date.now() }),
    );
  } catch {
    // Ignore localStorage unavailability
  }
}

export async function readTrustedWorkspace(db: OfflineDatabase): Promise<TrustedWorkspaceRecord | null> {
  const row = await db.metadata.get(TRUSTED_WORKSPACE_KEY);
  const val = row?.value as TrustedWorkspaceRecord | undefined;
  return val && typeof val.active === "boolean" ? val : null;
}

export async function isTrustedWorkspaceActive(db: OfflineDatabase, scope: OfflineScope): Promise<boolean> {
  const ws = await readTrustedWorkspace(db);
  if (!ws?.active || !ws.scope) return false;
  try {
    return scopeKey(ws.scope) === scopeKey(scope);
  } catch {
    return false;
  }
}

export async function activateTrustedWorkspace(
  db: OfflineDatabase,
  scope: OfflineScope,
  role: User["role"],
): Promise<void> {
  const record: TrustedWorkspaceRecord = {
    active: true,
    scope: { ...scope },
    role,
    reason: "online_verified",
    updatedAt: Date.now(),
  };
  await db.metadata.put({ key: TRUSTED_WORKSPACE_KEY, value: record });
}

export async function deactivateTrustedWorkspace(
  db: OfflineDatabase,
  reason: "logged_out" | "rejected" | "account_switched",
  expectedUserId?: string,
): Promise<void> {
  await db.transaction("rw", db.metadata, async () => {
    const existing = await readTrustedWorkspace(db);
    if (expectedUserId && existing?.scope && existing.scope.userId !== expectedUserId && reason !== "account_switched") {
      return;
    }
    const next: TrustedWorkspaceRecord = {
      active: false,
      reason,
      updatedAt: Date.now(),
    };
    await db.metadata.put({ key: TRUSTED_WORKSPACE_KEY, value: next });
  });
  broadcastWorkspaceLock(reason, expectedUserId);
}

const unlocked = new Map<string, string>();
let lockGeneration = 0;
export function offlineLockGeneration(): number { return lockGeneration; }
export function assertOfflineLockGeneration(expected: number): void {
  if (expected !== lockGeneration) throw new OfflineError("UNLOCK_CANCELLED", "The register was locked while verifying access. Unlock it again.");
}
const PIN_ITERATIONS = 210_000;

export async function verifyGrant(token: string, verificationKey: VerificationKey, scope: OfflineScope, now = Date.now(), recoveryOnly = false): Promise<GrantClaims> {
  const parts = token.split(".");
  if (parts.length !== 3) throw new OfflineError("INVALID_GRANT", "Offline permission is not valid. Sign in online to renew it.");
  let header: { alg?: string; kid?: string };
  let claims: GrantClaims;
  try {
    header = JSON.parse(new TextDecoder().decode(decodeBase64url(parts[0])));
    claims = JSON.parse(new TextDecoder().decode(decodeBase64url(parts[1])));
  } catch { throw new OfflineError("INVALID_GRANT", "Offline permission cannot be read."); }
  if (header.alg !== "ES256" || !header.kid || header.kid !== verificationKey.kid || verificationKey.jwk.kty !== "EC" || verificationKey.jwk.crv !== "P-256" || verificationKey.jwk.d) {
    throw new OfflineError("INVALID_GRANT", "Offline permission uses an unsupported signing key.");
  }
  const key = await crypto.subtle.importKey("jwk", verificationKey.jwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["verify"]);
  const valid = await crypto.subtle.verify({ name: "ECDSA", hash: "SHA-256" }, key, decodeBase64url(parts[2]), new TextEncoder().encode(`${parts[0]}.${parts[1]}`));
  if (!valid || claims.version !== 1 || claims.iss !== "suntech-pos" || claims.aud !== "suntech-offline" || !claims.jti || claims.sub !== claims.userId || !Array.isArray(claims.permissions)) {
    throw new OfflineError("INVALID_GRANT", "Offline permission signature or contents do not match.");
  }
  if (scopeKey(claims) !== scopeKey(scope)) throw new OfflineError("GRANT_SCOPE_MISMATCH", "This permission belongs to a different operator, branch, or device.");
  if (!Number.isSafeInteger(claims.iat) || !Number.isSafeInteger(claims.exp) || claims.exp <= claims.iat || (!recoveryOnly && (claims.iat * 1000 > now + 1_000 || claims.exp * 1000 <= now))) {
    throw new OfflineError("GRANT_EXPIRED", "New sales need renewed permission. Existing saved sales remain available for recovery.");
  }
  return claims;
}

export async function installProvisioning(
  db: OfflineDatabase,
  response: ProvisioningResponse,
  expectedScope: OfflineScope,
  options: { requestStartedAt?: number; trustWorkspace?: boolean } = {},
): Promise<OfflinePermission> {
  const now = Date.now();
  const claims = await verifyGrant(response.grantToken, response.verificationKey, expectedScope, now);
  if (canonicalJson(response.claims) !== canonicalJson(claims) || response.bootstrap.user.id !== expectedScope.userId) throw new OfflineError("INVALID_PROVISIONING", "The signed permission and downloaded operator do not agree.");
  // Commit snapshot and permission together; an older response cannot replace newer authority.
  return db.transaction("rw", [db.permissions, db.catalogSnapshots, db.stockOverlays, db.metadata], async () => {
    const previous = await db.permissions.get(scopeKey(expectedScope));
    if (previous?.rejectedAt && (options.requestStartedAt === undefined || options.requestStartedAt <= previous.rejectedAt)) throw new OfflineError("PROVISIONING_STALE", "An older permission response cannot reverse a newer authorization rejection.");
    if (previous?.provisionRequestStartedAt !== undefined && options.requestStartedAt !== undefined && options.requestStartedAt < previous.provisionRequestStartedAt) return previous;
    const published = await publishBootstrap(db, expectedScope, response.bootstrap);
    if (published.snapshotId !== response.bootstrap.manifest.snapshotId) {
      if (previous) return previous;
      throw new OfflineError("PROVISIONING_SUPERSEDED", "A newer shop snapshot arrived. Refresh setup to finish verifying permission.");
    }
    const next: OfflinePermission = {
      scopeKey: scopeKey(expectedScope), scope: { ...expectedScope }, grantToken: response.grantToken,
      verificationKey: response.verificationKey, user: response.bootstrap.user,
      installedAt: new Date(now).toISOString(), lastObservedAt: Math.max(now, previous?.lastObservedAt ?? 0), provisionRequestStartedAt: options.requestStartedAt ?? previous?.provisionRequestStartedAt,
      unlock: previous?.unlock, failedUnlocks: previous?.failedUnlocks ?? 0, unlockRetryAt: previous?.unlockRetryAt ?? 0,
    };
    await db.permissions.put(next);
    if (options.trustWorkspace) {
      const workspace: TrustedWorkspaceRecord = {
        active: true,
        scope: { ...expectedScope },
        role: response.bootstrap.user.role,
        reason: "online_verified",
        updatedAt: now,
      };
      await db.metadata.put({ key: TRUSTED_WORKSPACE_KEY, value: workspace });
    }
    return next;
  });
}

export function listOfflineProfiles(db: OfflineDatabase): Promise<OfflinePermission[]> { return db.permissions.toArray(); }
export function lockOffline(scope?: OfflineScope): void { lockGeneration++; if (scope) unlocked.delete(scopeKey(scope)); else unlocked.clear(); }
export function isOfflineUnlocked(scope: OfflineScope): boolean { return unlocked.has(scopeKey(scope)); }
export function matchesOfflineUnlock(record: OfflinePermission): boolean { return Boolean(record.unlock && unlocked.get(record.scopeKey) === canonicalJson(record.unlock)); }

export async function verifySavedPermission(db: OfflineDatabase, scope: OfflineScope, mode: "ONLINE" | "OFFLINE", now = Date.now()): Promise<{ record: OfflinePermission; claims: GrantClaims }> {
  const record = await db.permissions.get(scopeKey(scope));
  if (!record) throw new OfflineError("NOT_PROVISIONED", "Sign in online and prepare this register before taking sales.");
  if (record.rejectedAt) throw new OfflineError("OFFLINE_AUTHORITY_REJECTED", "The server rejected this operator’s authorization. Sign in online to renew permission; saved evidence can still be recovered.");
  if (now + 1000 < record.lastObservedAt) throw new OfflineError("CLOCK_ROLLBACK", "The device clock moved backwards. Correct the clock and renew permission online.");
  const claims = await verifyGrant(record.grantToken, record.verificationKey, scope, now);
  if (mode === "OFFLINE") {
    if (!claims.offlineIntakeAllowed) throw new OfflineError("OFFLINE_NOT_APPROVED", "Offline selling has not been enabled for this register.");
    const trusted = await isTrustedWorkspaceActive(db, scope);
    if (!matchesOfflineUnlock(record) && !trusted) {
      throw new OfflineError("LOCAL_UNLOCK_REQUIRED", "Unlock this operator's offline register first.");
    }
  }
  return { record, claims };
}
async function pinHash(passphrase: string, salt: string, iterations: number): Promise<string> {
  const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(passphrase), "PBKDF2", false, ["deriveBits"]);
  return base64url(new Uint8Array(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: decodeBase64url(salt), iterations }, base, 256)));
}

/** Call only after the UI verifies an online session for this exact scope. */
export async function setLocalUnlock(db: OfflineDatabase, scope: OfflineScope, passphrase: string, expectedGeneration = lockGeneration): Promise<void> {
  assertOfflineLockGeneration(expectedGeneration);
  if (passphrase.length < 8) throw new OfflineError("WEAK_UNLOCK", "Use an offline passphrase with at least 8 characters.");
  const { record } = await verifySavedPermission(db, scope, "ONLINE");
  const salt = base64url(crypto.getRandomValues(new Uint8Array(16)));
  const hash = await pinHash(passphrase, salt, PIN_ITERATIONS);
  await db.transaction("rw", db.permissions, async () => {
    const current = await db.permissions.get(record.scopeKey);
    assertOfflineLockGeneration(expectedGeneration);
    if (!current || current.rejectedAt || current.grantToken !== record.grantToken || canonicalJson(current.unlock ?? null) !== canonicalJson(record.unlock ?? null)) throw new OfflineError("PERMISSION_CHANGED", "Permission changed; try setting the passphrase again.");
    await db.permissions.update(record.scopeKey, { unlock: { salt, hash, iterations: PIN_ITERATIONS }, failedUnlocks: 0, unlockRetryAt: 0 });
  });
  assertOfflineLockGeneration(expectedGeneration);
  unlocked.set(record.scopeKey, canonicalJson({ salt, hash, iterations: PIN_ITERATIONS }));
}
export async function unlockOffline(db: OfflineDatabase, scope: OfflineScope, passphrase: string, options: { recoveryOnly?: boolean } = {}): Promise<OfflinePermission> {
  const expectedGeneration = lockGeneration;
  const record = await db.permissions.get(scopeKey(scope));
  if (!record?.unlock) throw new OfflineError("NO_LOCAL_UNLOCK", "Set an offline passphrase while signed in online first.");
  if (record.rejectedAt && !options.recoveryOnly) throw new OfflineError("OFFLINE_AUTHORITY_REJECTED", "The server rejected this operator’s authorization. Reconnect and sign in before taking new sales.");
  const now = Date.now();
  if ((record.unlockRetryAt ?? 0) > now) throw new OfflineError("UNLOCK_WAIT", "Wait before trying the offline passphrase again.");
  const claims = await verifyGrant(record.grantToken, record.verificationKey, scope, now, options.recoveryOnly === true);
  if (!options.recoveryOnly && !claims.offlineIntakeAllowed) throw new OfflineError("OFFLINE_NOT_APPROVED", "Offline selling has not been approved for this register.");
  const computed = await pinHash(passphrase, record.unlock.salt, record.unlock.iterations);
  const result = await db.transaction("rw", db.permissions, async () => {
    const latest = await db.permissions.get(record.scopeKey);
    assertOfflineLockGeneration(expectedGeneration);
    if (!latest || latest.grantToken !== record.grantToken || canonicalJson(latest.unlock ?? null) !== canonicalJson(record.unlock) || (!options.recoveryOnly && latest.rejectedAt)) throw new OfflineError("PERMISSION_CHANGED", "The passphrase or permission changed while unlocking. Try again.");
    if ((latest.unlockRetryAt ?? 0) > Date.now()) throw new OfflineError("UNLOCK_WAIT", "Wait before trying the offline passphrase again.");
    if (computed !== record.unlock!.hash) {
      const failures = (latest.failedUnlocks ?? 0) + 1;
      await db.permissions.update(record.scopeKey, { failedUnlocks: failures, unlockRetryAt: Date.now() + Math.min(300_000, 1000 * 2 ** Math.min(failures, 9)) });
      return null;
    }
    await db.permissions.update(record.scopeKey, { failedUnlocks: 0, unlockRetryAt: 0 });
    return latest;
  });
  assertOfflineLockGeneration(expectedGeneration);
  if (!result) throw new OfflineError("WRONG_UNLOCK", "That offline passphrase did not match.");
  if (!options.recoveryOnly) unlocked.set(record.scopeKey, canonicalJson(record.unlock));
  return result;
}

/** A known denial is persistent; going offline must not turn it back into a permission. */
export async function markOfflinePermissionRejected(db: OfflineDatabase, scope: OfflineScope, reason = "Server rejected authorization", requestStartedAt?: number): Promise<void> {
  // Use the same transaction as provisioning so an old rejected request cannot
  // invalidate a newer accepted response. Explicit credential rejection without
  // an observation time still locks immediately.
  await db.transaction("rw", [db.permissions, db.metadata], async () => {
    const key = scopeKey(scope);
    const current = await db.permissions.get(key);
    if (requestStartedAt !== undefined && current?.provisionRequestStartedAt !== undefined && current.provisionRequestStartedAt > requestStartedAt) return;
    lockOffline(scope);
    await db.permissions.update(key, { rejectedAt: Date.now(), rejectedReason: reason });
    const ws = await readTrustedWorkspace(db);
    if (ws?.scope && ws.scope.userId === scope.userId) {
      await db.metadata.put({
        key: TRUSTED_WORKSPACE_KEY,
        value: { active: false, reason: "rejected", updatedAt: Date.now() } satisfies TrustedWorkspaceRecord,
      });
    }
  });
}
