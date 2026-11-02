import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getBackendApiOrigin } from "@/lib/server/backend-api-url";

describe("getBackendApiOrigin", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.BACKEND_API_URL;
    delete process.env.SUNTECH_BACKEND_API_URL;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("returns normalized origin for valid BACKEND_API_URL", () => {
    process.env.BACKEND_API_URL = "http://localhost:3000";
    expect(getBackendApiOrigin()).toBe("http://localhost:3000");

    process.env.BACKEND_API_URL = "https://api.example.com/";
    expect(getBackendApiOrigin()).toBe("https://api.example.com");
  });

  it("falls back to SUNTECH_BACKEND_API_URL if BACKEND_API_URL is missing", () => {
    process.env.SUNTECH_BACKEND_API_URL = "http://127.0.0.1:3000";
    expect(getBackendApiOrigin()).toBe("http://127.0.0.1:3000");
  });

  it("throws when neither is defined", () => {
    expect(() => getBackendApiOrigin()).toThrow("BACKEND_API_URL is required");
  });

  it("throws when URL contains path, query, hash, or credentials", () => {
    process.env.BACKEND_API_URL = "http://localhost:3000/api/v1";
    expect(() => getBackendApiOrigin()).toThrow("without a path or credentials");

    process.env.BACKEND_API_URL = "http://user:pass@localhost:3000";
    expect(() => getBackendApiOrigin()).toThrow("without a path or credentials");

    process.env.BACKEND_API_URL = "http://localhost:3000?foo=bar";
    expect(() => getBackendApiOrigin()).toThrow("without a path or credentials");

    process.env.BACKEND_API_URL = "not-a-url";
    expect(() => getBackendApiOrigin()).toThrow("must be a valid http(s) origin");
  });
});
