import { describe, expect, it } from "vitest";
import {
  createIdempotencyKey,
  getIdempotencyKey,
  idempotencyHeaders,
} from "@/lib/idempotency";

describe("idempotency utilities", () => {
  it("generates valid UUIDv4 format", () => {
    const key = createIdempotencyKey();
    expect(key).toBeTypeOf("string");
    expect(key).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

    const aliasKey = getIdempotencyKey();
    expect(aliasKey).toBeTypeOf("string");
    expect(aliasKey).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });

  it("produces distinct keys on consecutive calls", () => {
    const key1 = createIdempotencyKey();
    const key2 = createIdempotencyKey();
    expect(key1).not.toBe(key2);
  });

  it("formats idempotency headers correctly", () => {
    const key = createIdempotencyKey();
    const headers = idempotencyHeaders(key);
    expect(headers).toEqual({ "Idempotency-Key": key });
  });

  it("throws when given an empty key", () => {
    expect(() => idempotencyHeaders("")).toThrow("Idempotency key is required");
    expect(() => idempotencyHeaders("   ")).toThrow("Idempotency key is required");
  });
});
