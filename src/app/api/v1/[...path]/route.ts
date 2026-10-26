import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions } from "@/lib/session-cookie";
import type { ApiResponse } from "@/types/api";
import type { User } from "@/types/domain";

const SAFE_RESPONSE_HEADERS = ["content-type", "content-disposition", "etag", "last-modified"];
const FORWARDED_REQUEST_HEADERS = ["accept", "content-type", "cookie", "idempotency-key", "if-none-match", "if-modified-since"];

type RouteContext = { params: Promise<{ path: string[] }> };

function backendBaseUrl(): string | null {
  const value = process.env.SUNTECH_BACKEND_URL ?? process.env.NEXT_PUBLIC_API_URL;
  return value ? value.replace(/\/$/, "") : null;
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

async function proxyRequest(request: NextRequest, context: RouteContext) {
  if (isMutation(request.method) && !hasAllowedOrigin(request)) {
    return NextResponse.json({ success: false, message: "Cross-site request rejected" }, { status: 403 });
  }

  const baseUrl = backendBaseUrl();
  if (!baseUrl) {
    return NextResponse.json({ success: false, message: "Backend connection is not configured" }, { status: 503 });
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
    const contentType = upstream.headers.get("content-type") ?? "";
    if (contentType.includes("application/json") && rawBody.byteLength > 0) {
      try {
        parsed = JSON.parse(new TextDecoder().decode(rawBody));
        if (pathName === "auth/login" || pathName === "auth/refresh") {
          const data = authData(parsed);
          if (data?.accessToken) {
            delete data.accessToken;
            if (pathName === "auth/refresh") Object.assign(data, { refreshed: true });
          }
          responseBody = JSON.stringify(parsed);
        }
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

    if (upstream.ok && pathName === "auth/login") {
      const user = authData(parsed)?.user;
      if (user) response.cookies.set(SESSION_COOKIE, await createSessionToken(user), sessionCookieOptions());
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
