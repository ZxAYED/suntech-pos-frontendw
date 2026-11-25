import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET, HEAD, POST } from "../route";

const context = (path: string[]) => ({ params: Promise.resolve({ path }) });
const request = (path: string, method = "GET") => new NextRequest(`http://localhost:3000/api/v1/${path}`, { method });

describe("F08: actual BFF response forwarding", () => {
  beforeEach(() => vi.stubEnv("BACKEND_API_URL", "http://127.0.0.1:9"));
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); });

  it.each([204, 205, 304])("forwards status %s without a body", async (status) => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response(null, { status, headers: { etag: '"abc"' } }));
    const response = await GET(request("catalog/categories"), context(["catalog", "categories"]));
    expect(response.status).toBe(status);
    expect(response.body).toBeNull();
    expect(response.headers.get("etag")).toBe('"abc"');
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("forwards HEAD as HEAD with no response body", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response(null, { status: 200 }));
    const response = await HEAD(request("catalog/categories", "HEAD"), context(["catalog", "categories"]));
    expect(response.status).toBe(200);
    expect(response.body).toBeNull();
    expect(fetchSpy).toHaveBeenCalledWith(expect.any(URL), expect.objectContaining({ method: "HEAD" }));
  });

  it("keeps confirmed bodyless logout and clears routing/access cookies", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response(null, { status: 204, headers: { "set-cookie": "refreshToken=; Max-Age=0; Path=/" } }));
    const response = await POST(request("auth/logout", "POST"), context(["auth", "logout"]));
    expect(response.status).toBe(204);
    expect(response.body).toBeNull();
    expect(response.cookies.get("suntech_session")?.value).toBe("");
    expect(response.cookies.get("accessToken")?.value).toBe("");
    expect(response.headers.get("set-cookie")).toContain("refreshToken=");
    expect(response.headers.getSetCookie()).toContainEqual(expect.stringMatching(/^refreshToken=;.*Path=\/api\/v1\/auth;.*Max-Age=0/));
  });

  it("expires the real refresh-cookie path when the backend is unreachable", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("Backend offline"));
    const response = await POST(request("auth/logout", "POST"), context(["auth", "logout"]));
    expect(await response.json()).toMatchObject({ data: { loggedOut: true, serverLogoutConfirmed: false } });
    expect(response.headers.getSetCookie()).toContainEqual(expect.stringMatching(/^refreshToken=;.*Path=\/api\/v1\/auth;.*Max-Age=0/));
    expect(response.headers.getSetCookie()).toContainEqual(expect.stringMatching(/^refreshToken=; Path=\/; Max-Age=0/));
  });

  it("still clears local cookies if backend configuration is missing", async () => {
    vi.stubEnv("BACKEND_API_URL", "");
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const response = await POST(request("auth/logout", "POST"), context(["auth", "logout"]));
    expect(await response.json()).toMatchObject({ data: { serverLogoutConfirmed: false } });
    expect(response.cookies.get("refreshToken")?.path).toBe("/api/v1/auth");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it.each(["login", "refresh"])("preserves the rotating refresh cookie during %s", async (action) => {
    const headers = new Headers({ "content-type": "application/json" });
    headers.append("set-cookie", "refreshToken=rotated-value; Path=/api/v1/auth; HttpOnly; SameSite=Lax");
    headers.append("set-cookie", "accessToken=new-access; Path=/; HttpOnly");
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response(JSON.stringify({
      success: true,
      data: { accessToken: "new-access", user: { id: "operator-1", fullName: "Operator", role: "CASHIER", businessId: "business-1", locationId: "branch-1" } },
    }), { status: 200, headers }));
    const response = await POST(request(`auth/${action}`, "POST"), context(["auth", action]));
    const cookieHeaders = response.headers.getSetCookie();
    expect(cookieHeaders.some(value => value === "refreshToken=rotated-value; Path=/api/v1/auth; HttpOnly; SameSite=Lax")).toBe(true);
    expect(cookieHeaders.filter(value => value.startsWith("accessToken="))).toHaveLength(1);
    expect(response.cookies.get("suntech_session")?.value).toBeTruthy();
    expect(await response.json()).not.toHaveProperty("data.accessToken");
  });

  it("forwards scope, query, and immutable idempotency headers unchanged", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(Response.json({ success: true, data: [] }));
    const input = new NextRequest("http://localhost:3000/api/v1/orders?businessId=b&locationId=l&page=2", {
      headers: { "idempotency-key": "same-purchase", "x-business-id": "b", "x-location-id": "l", cookie: "accessToken=test" },
    });
    await GET(input, context(["orders"]));
    const [url, options] = fetchSpy.mock.calls[0];
    expect(String(url)).toBe("http://127.0.0.1:9/api/v1/orders?businessId=b&locationId=l&page=2");
    const sentHeaders = new Headers(options?.headers);
    expect(sentHeaders.get("idempotency-key")).toBe("same-purchase");
    expect(sentHeaders.get("x-business-id")).toBe("b");
    expect(sentHeaders.get("x-location-id")).toBe("l");
    expect(sentHeaders.get("cookie")).toBe("accessToken=test");
  });

  it("rejects cross-site mutation without contacting the backend", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const input = new NextRequest("http://localhost:3000/api/v1/orders/sync/v2", { method: "POST", headers: { origin: "https://another.example" } });
    const response = await POST(input, context(["orders", "sync", "v2"]));
    expect(response.status).toBe(403);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
