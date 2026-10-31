import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions, verifySessionToken } from "@/lib/session-cookie";
import type { ApiResponse } from "@/types/api";
import type { User } from "@/types/domain";

const SAFE_RESPONSE_HEADERS = ["content-type", "content-disposition", "etag", "last-modified"];
const FORWARDED_REQUEST_HEADERS = [
  "accept",
  "authorization",
  "content-type",
  "cookie",
  "idempotency-key",
  "if-none-match",
  "if-modified-since",
  "x-business-id",
  "x-location-id",
];

type RouteContext = { params: Promise<{ path: string[] }> };

function backendBaseUrl(): string {
  const value = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!value) {
    throw new Error("NEXT_PUBLIC_API_URL environment variable is missing. Configure it in .env (e.g. NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1).");
  }
  return value.replace(/\/$/, "");
}

function isMutation(method: string) {
  return method !== "GET" && method !== "HEAD" && method !== "OPTIONS";
}

function hasAllowedOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) return false;
  return request.headers.get("sec-fetch-site") !== "cross-site";
}

function authData(payload: unknown): { user?: User; accessToken?: string } | null {
  if (!payload || typeof payload !== "object") return null;
  const envelope = payload as Partial<ApiResponse<{ user?: User; accessToken?: string }>>;
  if (envelope.success === true && envelope.data && typeof envelope.data === "object") return envelope.data;
  return payload as { user?: User; accessToken?: string };
}

function stripAccessToken(payload: unknown) {
  if (!payload || typeof payload !== "object") return;
  const record = payload as Record<string, unknown>;
  delete record.accessToken;
  if (record.data && typeof record.data === "object") {
    delete (record.data as Record<string, unknown>).accessToken;
  }
}

function parseJwtPayload(token: string | undefined): Record<string, unknown> | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const padded = parts[1].replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(parts[1].length / 4) * 4, "=");
    const json = atob(padded);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function proxyRequest(request: NextRequest, context: RouteContext) {
  if (isMutation(request.method) && !hasAllowedOrigin(request)) {
    return NextResponse.json({ success: false, message: "Cross-site request rejected" }, { status: 403 });
  }

  let baseUrl: string;
  try {
    baseUrl = backendBaseUrl();
  } catch (err) {
    const message = err instanceof Error ? err.message : "NEXT_PUBLIC_API_URL is missing";
    return NextResponse.json({ success: false, message }, { status: 503 });
  }

  const { path } = await context.params;
  const pathName = path.join("/");
  const upstreamUrl = new URL(`${baseUrl}/${pathName}`);
  upstreamUrl.search = request.nextUrl.search;
  const headers = new Headers();
  for (const name of FORWARDED_REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  headers.set("x-forwarded-host", request.nextUrl.host);
  headers.set("x-forwarded-proto", request.nextUrl.protocol.replace(":", ""));

  try {
    const upstream = await fetch(upstreamUrl, {
      method: request.method,
      headers,
      body: request.method === "GET" || request.method === "HEAD" ? undefined : await request.arrayBuffer(),
      cache: "no-store",
      redirect: "manual",
    });
    const rawBody = await upstream.arrayBuffer();
    let responseBody: BodyInit | null = rawBody;
    let parsed: unknown;
    let renewedAccessToken: string | undefined;
    const contentType = upstream.headers.get("content-type") ?? "";
    if (contentType.includes("application/json") && rawBody.byteLength > 0) {
      try {
        parsed = JSON.parse(new TextDecoder().decode(rawBody));
        const data = authData(parsed);
        renewedAccessToken = typeof data?.accessToken === "string" ? data.accessToken : undefined;
        const hadAccessToken = Boolean(renewedAccessToken);
        stripAccessToken(parsed);
        if (pathName === "auth/refresh" && hadAccessToken && data) {
          Object.assign(data, { refreshed: true });
        }
        responseBody = JSON.stringify(parsed);
      } catch {
        parsed = undefined;
      }
    }

    const response = new NextResponse(responseBody, { status: upstream.status });
    for (const name of SAFE_RESPONSE_HEADERS) {
      const value = upstream.headers.get(name);
      if (value) response.headers.set(name, value);
    }
    response.headers.set("Cache-Control", "no-store");
    const setCookies = (upstream.headers as Headers & { getSetCookie?: () => string[] }).getSetCookie?.()
      ?? (upstream.headers.get("set-cookie") ? [upstream.headers.get("set-cookie") as string] : []);
    for (const cookie of setCookies) response.headers.append("set-cookie", cookie);
    if (upstream.ok && renewedAccessToken) {
      response.cookies.set("accessToken", renewedAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60,
      });
    }

    if (upstream.ok && (pathName === "auth/login" || pathName === "auth/refresh")) {
      let user = authData(parsed)?.user;
      if (!user && renewedAccessToken) {
        const existingToken = request.cookies.get(SESSION_COOKIE)?.value;
        const currentSession = await verifySessionToken(existingToken);
        if (currentSession?.user) {
          user = currentSession.user;
        }
      }
      if (user) {
        const tokenClaims = parseJwtPayload(renewedAccessToken);
        const businessIds = Array.isArray(tokenClaims?.businessIds) ? (tokenClaims.businessIds as string[]) : [];
        const locationIds = Array.isArray(tokenClaims?.locationIds) ? (tokenClaims.locationIds as string[]) : [];

        if (user.role === "SUPER_ADMIN") {
          // Super admin doesn't own a business or location ID: both null/empty
          user.businessId = null;
          user.locationId = null;
          user.businessIds = [];
          user.locationIds = [];
        } else if (user.role === "ADMIN") {
          // Admin owns multiple businesses and locations: keep multiples on token
          user.locationId = null; // Admin is not tied to a single branch
          user.businessIds = businessIds.length > 0 ? businessIds : (user.businessId ? [user.businessId] : []);
          user.locationIds = locationIds;
          user.businessId = user.businessId ?? (user.businessIds[0] ?? null);
        } else if (user.role === "CASHIER") {
          // Cashier keeps exactly one of each ID assigned to them
          const singleBiz = user.businessId ?? (typeof tokenClaims?.businessId === "string" ? tokenClaims.businessId : null);
          const singleLoc = user.locationId ?? (typeof tokenClaims?.locationId === "string" ? tokenClaims.locationId : null);
          user.businessId = singleBiz;
          user.locationId = singleLoc;
          user.businessIds = singleBiz ? [singleBiz] : [];
          user.locationIds = singleLoc ? [singleLoc] : [];
        }

        response.cookies.set(SESSION_COOKIE, await createSessionToken(user), sessionCookieOptions());
      }
    }
    if (pathName === "auth/logout") {
      response.cookies.set(SESSION_COOKIE, "", { ...sessionCookieOptions(), maxAge: 0 });
    }
    return response;
  } catch {
    return NextResponse.json({ success: false, message: "Backend is unavailable" }, { status: 503 });
  }
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PATCH = proxyRequest;
export const PUT = proxyRequest;
export const DELETE = proxyRequest;
