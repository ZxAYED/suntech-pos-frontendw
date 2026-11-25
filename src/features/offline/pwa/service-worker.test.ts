import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { runInNewContext } from "node:vm";
import { describe, expect, it, vi } from "vitest";

/** Executes the worker's actual routing code. Browser lifecycle still needs Playwright/device QA. */
function worker() {
  const listeners = new Map<string, (event: unknown) => void>();
  const fetch = vi.fn(async () => new Response("private online HTML"));
  const cache = { match: vi.fn(async (key: string) => key === "/offline-assets/shell-test.html" ? new Response("neutral public shell") : undefined), addAll: vi.fn(async () => {}) };
  const caches = { open: vi.fn(async () => cache), keys: vi.fn(async () => ["suntech-shell-old", "suntech-shell-test", "unrelated-cache"]), delete: vi.fn(async () => true) };
  const self = { location: { origin: "https://pos.test" }, addEventListener: (type: string, cb: (event: unknown) => void) => listeners.set(type, cb), clients: { claim: vi.fn(async () => {}) }, skipWaiting: vi.fn() };
  const source = readFileSync(resolve("scripts/service-worker.template.js"), "utf8")
    .replace("__SUNTECH_VERSION__", '"test"')
    .replace("__SUNTECH_SHELL__", '"/offline-assets/shell-test.html"')
    .replace("__SUNTECH_ASSETS__", JSON.stringify(["/offline-assets/shell-test.html", "/offline-assets/app-test.js", "/fonts/fonts.css", "/manifest.json"]));
  runInNewContext(source, { self, caches, fetch, URL, Response, AbortController, setTimeout, clearTimeout });
  function request(url: string, options: { method?: string; mode?: string; headers?: Record<string, string> } = {}) {
    let response: Promise<Response> | undefined;
    listeners.get("fetch")!({ request: { url: new URL(url, "https://pos.test").href, method: options.method ?? "GET", mode: options.mode ?? "navigate", headers: new Headers(options.headers) }, respondWith: (value: Promise<Response>) => { response = value; } });
    return response;
  }
  async function lifecycle(type: string) { let done: Promise<void> | undefined; listeners.get(type)!({ waitUntil: (value: Promise<void>) => { done = value; } }); await done; }
  return { fetch, cache, caches, self, request, lifecycle };
}

describe("public service worker cache boundaries", () => {
  it("leaves API calls, financial POSTs, cross-origin and RSC requests to the network", () => {
    const sw = worker();
    for (const [url, options] of [["/api/v1/orders", {}], ["/pos/terminal", { method: "POST" }], ["https://other.test/pos/terminal", {}], ["/pos/terminal?_rsc=123", {}], ["/pos/terminal", { headers: { RSC: "1" } }], ["/api/session", { method: "HEAD" }]] as const) expect(sw.request(url, options)).toBeUndefined();
    expect(sw.caches.open).not.toHaveBeenCalled();
  });
  it("serves a fresh online response without storing personalized HTML", async () => {
    const sw = worker();
    expect(await (await sw.request("/admin/orders")!).text()).toBe("private online HTML");
    expect(sw.caches.open).not.toHaveBeenCalled();
  });
  it("falls back to only the neutral shell on a network failure or server 503", async () => {
    const sw = worker(); sw.fetch.mockRejectedValueOnce(new TypeError("offline"));
    expect(await (await sw.request("/pos/terminal")!).text()).toBe("neutral public shell");
    sw.fetch.mockResolvedValueOnce(new Response("server unavailable", { status: 503 }));
    expect(await (await sw.request("/admin/custom-sale")!).text()).toBe("neutral public shell");
    expect(sw.request("/unrelated/private-route")).toBeUndefined();
  });
  it("preserves a live authorization rejection instead of replacing it with cached content", async () => {
    const sw = worker(); sw.fetch.mockResolvedValueOnce(new Response("denied", { status: 403 }));
    expect((await sw.request("/admin/orders")!).status).toBe(403);
    expect(sw.caches.open).not.toHaveBeenCalled();
  });
  it("prepares only public assets and waits for old tabs instead of force-updating a working register", async () => {
    const sw = worker(); await sw.lifecycle("install");
    expect(sw.cache.addAll).toHaveBeenCalledWith(["/offline-assets/shell-test.html", "/offline-assets/app-test.js", "/fonts/fonts.css", "/manifest.json"]);
    expect(sw.self.skipWaiting).not.toHaveBeenCalled();
    await sw.lifecycle("activate"); expect(sw.caches.delete.mock.calls).toEqual([["suntech-shell-old"]]);
  });
});
