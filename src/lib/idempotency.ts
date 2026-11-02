export function createIdempotencyKey(): string {
  // Secure UUID support is required for transaction creation.
  // Do not fall back to Date.now(), Math.random(), or a generated new key on retry.
  if (typeof crypto === "undefined" || typeof crypto.randomUUID !== "function") {
    throw new Error("Secure UUID generation is unavailable; transaction not submitted.");
  }
  return crypto.randomUUID();
}

/**
 * Compatibility alias for createIdempotencyKey
 */
export const getIdempotencyKey = createIdempotencyKey;

export function idempotencyHeaders(key: string) {
  if (!key.trim()) throw new Error("Idempotency key is required");
  return { "Idempotency-Key": key };
}

