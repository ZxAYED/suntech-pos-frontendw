import { ApiClientError } from "@/types/api";

/** Conservative classification for the existing online recovery path.
 * A failed retry cannot establish that the original request did not commit. */
export function financialFailureOutcome(error: unknown, isRetry: boolean): "unknown" | "failed" {
  if (isRetry || !(error instanceof ApiClientError)) return "unknown";
  // Ordinary validation/auth/permission errors on an initial attempt are
  // rejected before domain effects by the existing server contract.
  if ([400, 401, 403, 404, 422, 429].includes(error.status)) return "failed";
  return "unknown";
}

export function isInitialPriceRejection(error: unknown, isRetry: boolean): error is ApiClientError {
  return !isRetry && error instanceof ApiClientError && error.status === 409 &&
    (error.code === "PRICE_CHANGED" || error.data?.code === "PRICE_CHANGED");
}
