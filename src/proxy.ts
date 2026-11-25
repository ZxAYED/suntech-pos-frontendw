import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionTokenWithGrace } from "@/lib/session-cookie";

function homeFor(role: "SUPER_ADMIN" | "ADMIN" | "CASHIER") {
  if (role === "SUPER_ADMIN") return "/super-admin";
  if (role === "CASHIER") return "/pos/terminal";
  return "/admin/select-business";
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const verified = await verifySessionTokenWithGrace(request.cookies.get(SESSION_COOKIE)?.value);
  const activeSession = verified && !verified.expired ? verified.session : null;
  // Allow HMAC-verified >7-day session projections <=30 days only for ADMIN/CASHIER so client
  // providers can refresh online or fall back cleanly to valid 30-day offline grants.
  const routeSession =
    activeSession ??
    (verified && verified.session.user.role !== "SUPER_ADMIN" ? verified.session : null);
  const isAuthRoute = pathname === "/login" || pathname.startsWith("/login/");
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");
  const isPosRoute = pathname === "/pos" || pathname.startsWith("/pos/");
  const isPlatformRoute = pathname === "/super-admin" || pathname.startsWith("/super-admin/");

  if (isAuthRoute && activeSession) return NextResponse.redirect(new URL(homeFor(activeSession.user.role), request.url));

  if (isAdminRoute || isPosRoute || isPlatformRoute) {
    if (!routeSession) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (isAdminRoute && routeSession.user.role !== "ADMIN") return NextResponse.redirect(new URL(homeFor(routeSession.user.role), request.url));
    if (isPosRoute) {
      const isSharedOrdersRoute = pathname === "/pos/orders" || pathname.startsWith("/pos/orders/");
      if (isSharedOrdersRoute) {
        if (routeSession.user.role !== "CASHIER" && routeSession.user.role !== "ADMIN") {
          return NextResponse.redirect(new URL(homeFor(routeSession.user.role), request.url));
        }
      } else if (routeSession.user.role !== "CASHIER") {
        return NextResponse.redirect(new URL(homeFor(routeSession.user.role), request.url));
      }
    }
    if (isPlatformRoute && routeSession.user.role !== "SUPER_ADMIN") return NextResponse.redirect(new URL(homeFor(routeSession.user.role), request.url));
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
