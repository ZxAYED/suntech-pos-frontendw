import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session-cookie";

function homeFor(role: "SUPER_ADMIN" | "ADMIN" | "CASHIER") {
  if (role === "SUPER_ADMIN") return "/super-admin";
  if (role === "CASHIER") return "/pos/terminal";
  return "/admin/select-business";
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
  const isAuthRoute = pathname === "/login" || pathname.startsWith("/login/");
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");
  const isPosRoute = pathname === "/pos" || pathname.startsWith("/pos/");
  const isPlatformRoute = pathname === "/super-admin" || pathname.startsWith("/super-admin/");

  if (isAuthRoute && session) return NextResponse.redirect(new URL(homeFor(session.user.role), request.url));

  if (isAdminRoute || isPosRoute || isPlatformRoute) {
    if (!session) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (isAdminRoute && session.user.role !== "ADMIN") return NextResponse.redirect(new URL(homeFor(session.user.role), request.url));
    if (isPosRoute) {
      const isSharedOrdersRoute = pathname === "/pos/orders" || pathname.startsWith("/pos/orders/");
      if (isSharedOrdersRoute) {
        if (session.user.role !== "CASHIER" && session.user.role !== "ADMIN") {
          return NextResponse.redirect(new URL(homeFor(session.user.role), request.url));
        }
      } else if (session.user.role !== "CASHIER") {
        return NextResponse.redirect(new URL(homeFor(session.user.role), request.url));
      }
    }
    if (isPlatformRoute && session.user.role !== "SUPER_ADMIN") return NextResponse.redirect(new URL(homeFor(session.user.role), request.url));
    if (pathname === "/admin") return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    if (pathname === "/pos") return NextResponse.redirect(new URL("/pos/terminal", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin",
    "/admin/:path*",
    "/pos",
    "/pos/:path*",
    "/super-admin",
    "/super-admin/:path*",
    "/login",
    "/login/:path*",
  ],
};
