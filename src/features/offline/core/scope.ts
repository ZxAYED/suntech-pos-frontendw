import type { OfflineScope } from "./types";
import type { OfflineDatabase } from "../db/offline-db";

export class OfflineError extends Error {
  constructor(public readonly code: string, message: string) { super(message); this.name = "OfflineError"; }
}
export function scopeKey(scope: OfflineScope): string {
  for (const key of ["userId", "businessId", "locationId", "deviceId"] as const) {
    if (typeof scope[key] !== "string" || !scope[key].trim() || scope[key].length > 200) {
      throw new OfflineError("INVALID_SCOPE", `Missing or invalid ${key}; choose the correct operator and branch.`);
    }
  }
  return JSON.stringify([scope.userId, scope.businessId, scope.locationId, scope.deviceId]);
}
export function sameScope(a: OfflineScope, b: OfflineScope): boolean { return scopeKey(a) === scopeKey(b); }
export const isUuid = (value: string): boolean => /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

export async function getDeviceId(db: OfflineDatabase): Promise<string> {
  return db.transaction("rw", db.metadata, async () => {
    const row = await db.metadata.get("device-id");
    if (row) {
      if (typeof row.value !== "string" || !isUuid(row.value)) throw new OfflineError("DEVICE_ID_CORRUPT", "Saved device identity needs recovery. It has not been replaced.");
      return row.value;
    }
    const id = crypto.randomUUID();
    await db.metadata.add({ key: "device-id", value: id });
    return id;
  });
}

/** Stable JSON means key order cannot change a financial fingerprint. Arrays keep their order. */
export function canonicalJson(value: unknown): string {
  if (value === null || typeof value === "string" || typeof value === "boolean") return JSON.stringify(value);
  if (typeof value === "number" && Number.isFinite(value)) return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (typeof value === "object" && value) {
    const object = value as Record<string, unknown>;
    return `{${Object.keys(object).filter(k => object[k] !== undefined).sort().map(k => `${JSON.stringify(k)}:${canonicalJson(object[k])}`).join(",")}}`;
  }
  throw new OfflineError("INVALID_PAYLOAD", "The sale contains a value that cannot be saved safely.");
}
export async function sha256(value: unknown): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonicalJson(value)));
  return Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, "0")).join("");
}
export function base64url(bytes: Uint8Array): string {
  let result = "";
  for (const byte of bytes) result += String.fromCharCode(byte);
  return btoa(result).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
export function decodeBase64url(value: string): Uint8Array<ArrayBuffer> {
  if (!/^[a-zA-Z0-9_-]*$/.test(value)) throw new OfflineError("INVALID_ENCODING", "Saved data has invalid encoding.");
  const raw = atob(value.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, c => c.charCodeAt(0));
}
