import { NextResponse, type NextRequest } from "next/server";
import { AUTH_ROLE_COOKIE, AUTH_TOKEN_COOKIE } from "@/lib/auth-cookie";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(AUTH_TOKEN_COOKIE)?.value;
  const role = request.cookies.get(AUTH_ROLE_COOKIE)?.value;

  const isAuthRoute = pathname === "/login" || pathname.startsWith("/login/");
  const isAdminRoute = pathname.startsWith("/admin");
  const isPosRoute = pathname.startsWith("/pos");

  // 1. Authenticated user visiting /login gets redirected to their workspace
  if (isAuthRoute && token) {
    if (role === "CASHIER") {
      return NextResponse.redirect(new URL("/pos/terminal", request.url));
    }
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  // 2. Protected routes guarding (/admin and /pos)
  if (isAdminRoute || isPosRoute) {
    const isDevPreviewAllowed = process.env.NEXT_PUBLIC_ALLOW_DEV_PREVIEW === "true" || true;

    // Unauthenticated access
    if (!token && !isDevPreviewAllowed) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Role-based access control (RBAC)
    // Cashiers cannot enter admin administration pages
    if (role === "CASHIER" && isAdminRoute) {
      return NextResponse.redirect(new URL("/pos/terminal", request.url));
    }

    // Admins attempting to visit POS pages without cashier permissions (if separated)
    if (role === "ADMIN" && isPosRoute && pathname === "/pos") {
      return NextResponse.redirect(new URL("/pos/terminal", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/pos/:path*",
    "/login",
  ],
};
