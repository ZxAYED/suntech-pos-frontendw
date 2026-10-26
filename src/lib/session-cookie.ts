import type { User, UserRole } from "@/types/domain";

export const SESSION_COOKIE = "suntech_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export interface SessionProjection {
  user: User;
  issuedAt: number;
}

function sessionSecret(): string {
  const configured = process.env.SUNTECH_SESSION_SECRET;
  if (configured && configured.length >= 32) return configured;
  if (process.env.NODE_ENV !== "production") return "suntech-development-session-secret-change-me";
  throw new Error("SUNTECH_SESSION_SECRET must contain at least 32 characters in production");
}

function encodeBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodeBase64Url(value: string): string {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  return new TextDecoder().decode(Uint8Array.from(binary, (character) => character.charCodeAt(0)));
}

async function signature(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(sessionSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signed = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload)));
  let binary = "";
  for (const byte of signed) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function isRole(value: unknown): value is UserRole {
  return value === "SUPER_ADMIN" || value === "ADMIN" || value === "CASHIER";
}

function isUser(value: unknown): value is User {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<User>;
  return typeof candidate.id === "string" && typeof candidate.fullName === "string" && isRole(candidate.role);
}

export async function createSessionToken(user: User): Promise<string> {
  const payload = encodeBase64Url(JSON.stringify({ user, issuedAt: Date.now() } satisfies SessionProjection));
  return `${payload}.${await signature(payload)}`;
}

export async function verifySessionToken(token: string | undefined): Promise<SessionProjection | null> {
  if (!token) return null;
  const [payload, suppliedSignature, extra] = token.split(".");
  if (!payload || !suppliedSignature || extra) return null;
  const expectedSignature = await signature(payload);
  if (expectedSignature.length !== suppliedSignature.length) return null;
  let difference = 0;
  for (let index = 0; index < expectedSignature.length; index += 1) {
    difference |= expectedSignature.charCodeAt(index) ^ suppliedSignature.charCodeAt(index);
  }
  if (difference !== 0) return null;
  try {
    const parsed = JSON.parse(decodeBase64Url(payload)) as SessionProjection;
    if (!isUser(parsed.user) || !Number.isFinite(parsed.issuedAt)) return null;
    if (Date.now() - parsed.issuedAt > SESSION_MAX_AGE_SECONDS * 1000) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}
