import type { NextResponse } from "next/server";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/session-cookie";

/** Cookie removal must use the same path that installed the cookie. */
export function clearAuthenticationCookies(response: NextResponse): void {
  const options = {
    httpOnly: true, secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "strict" as const : "lax" as const,
    maxAge: 0,
  };
  response.cookies.set(SESSION_COOKIE, "", { ...sessionCookieOptions(), maxAge: 0 });
  response.cookies.set("accessToken", "", { ...options, path: "/" });
  response.cookies.set("refreshToken", "", { ...options, path: "/api/v1/auth" });
  // Earlier deployments also used Path=/. Append only after every cookies.set:
  // Next's cookie map is keyed by name and cannot hold both paths itself.
  response.headers.append("Set-Cookie", `refreshToken=; Path=/; Max-Age=0; HttpOnly; SameSite=${options.sameSite === "strict" ? "Strict" : "Lax"}${options.secure ? "; Secure" : ""}`);
  response.headers.set("Cache-Control", "no-store");
}
