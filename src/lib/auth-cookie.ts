export const AUTH_TOKEN_COOKIE = "suntech_token";
export const AUTH_ROLE_COOKIE = "suntech_role";

export function setAuthCookies(accessToken: string, role: string) {
  if (typeof document === "undefined") return;
  const maxAge = 60 * 60 * 24 * 7; // 7 days
  document.cookie = `${AUTH_TOKEN_COOKIE}=${encodeURIComponent(accessToken)}; path=/; max-age=${maxAge}; SameSite=Lax`;
  document.cookie = `${AUTH_ROLE_COOKIE}=${encodeURIComponent(role)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export function clearAuthCookies() {
  if (typeof document === "undefined") return;
  document.cookie = `${AUTH_TOKEN_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
  document.cookie = `${AUTH_ROLE_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}
