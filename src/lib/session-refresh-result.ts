export type SessionRefreshResult = "refreshed" | "rejected" | "unavailable";

export function classifyRefreshFailure(status?: number): SessionRefreshResult {
  return status === 401 || status === 403 ? "rejected" : "unavailable";
}
