import { describe, expect, it, vi } from "vitest";
import type { InternalAxiosRequestConfig } from "axios";
import { apiClient, apiFetch, bindUnauthorizedHandler } from "@/lib/api-client";
import { ApiClientError } from "@/types/api";

const mockConfig = { headers: {} } as unknown as InternalAxiosRequestConfig;

describe("API Client & apiFetch (Guide Reference Lines 20-55, 70, 308)", () => {
  it("initializes apiClient with required base config (same-origin BFF /api/v1)", () => {
    expect(apiClient.defaults.baseURL).toBe("/api/v1");
    expect(apiClient.defaults.withCredentials).toBe(true);
    expect(apiClient.defaults.timeout).toBe(15_000);
    expect(apiClient.defaults.headers.Accept).toBe("application/json");
  });

  it("unwraps standard API envelope data { success: true, data: ... }", async () => {
    const mockData = { id: "biz_123", name: "SunTech Retail" };
    const spy = vi.spyOn(apiClient, "request").mockResolvedValueOnce({
      data: mockData,
      status: 200,
      statusText: "OK",
      headers: {},
      config: mockConfig,
    });

    const result = await apiFetch("/tenant/businesses");
    expect(result).toEqual(mockData);
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "/tenant/businesses",
        method: "get",
      }),
    );
    spy.mockRestore();
  });

  it("normalizes endpoints with leading /api/v1", async () => {
    const spy = vi.spyOn(apiClient, "request").mockResolvedValueOnce({
      data: { status: "healthy" },
      status: 200,
      statusText: "OK",
      headers: {},
      config: mockConfig,
    });

    await apiFetch("/api/v1/health");
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "/health",
      }),
    );
    spy.mockRestore();
  });

  it("passes headers and JSON stringified bodies to apiClient request", async () => {
    const spy = vi.spyOn(apiClient, "request").mockResolvedValueOnce({
      data: { created: true },
      status: 201,
      statusText: "Created",
      headers: {},
      config: mockConfig,
    });

    await apiFetch("/catalog/products", {
      method: "POST",
      headers: { "Idempotency-Key": "test-key-123" },
      body: JSON.stringify({ name: "Demo Product" }),
    });

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "/catalog/products",
        method: "post",
        headers: { "Idempotency-Key": "test-key-123" },
        data: { name: "Demo Product" },
      }),
    );
    spy.mockRestore();
  });

  it("binds unauthorized handler and returns cleanup unsubscribe function", () => {
    const handler = vi.fn();
    const unbind = bindUnauthorizedHandler(handler);
    expect(unbind).toBeTypeOf("function");
    unbind();
  });

  it("preserves ApiClientError structure with status, message, and errors payload", () => {
    const error = new ApiClientError(
      "Resource conflict occurred",
      409,
      "2026-11-02T12:00:00Z",
      { sku: ["SKU already exists"] },
      "CONFLICT_ERROR",
    );

    expect(error.status).toBe(409);
    expect(error.message).toBe("Resource conflict occurred");
    expect(error.errors).toEqual({ sku: ["SKU already exists"] });
    expect(error.code).toBe("CONFLICT_ERROR");
  });
});
