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
  const isAdminRoute = pathname.startsWith("/admin");
  const isPosRoute = pathname.startsWith("/pos");
  const isPlatformRoute = pathname.startsWith("/super-admin");

  if (isAuthRoute && session) return NextResponse.redirect(new URL(homeFor(session.user.role), request.url));

  if (isAdminRoute || isPosRoute || isPlatformRoute) {
    if (!session) {
      const allowPreview = process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_ALLOW_DEV_PREVIEW === "true";
      if (!allowPreview) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(loginUrl);
      }
      return NextResponse.next();
    }
    if (isAdminRoute && session.user.role !== "ADMIN") return NextResponse.redirect(new URL(homeFor(session.user.role), request.url));
    if (isPosRoute && session.user.role !== "CASHIER") return NextResponse.redirect(new URL(homeFor(session.user.role), request.url));
    if (isPlatformRoute && session.user.role !== "SUPER_ADMIN") return NextResponse.redirect(new URL(homeFor(session.user.role), request.url));
    if (pathname === "/pos") return NextResponse.redirect(new URL("/pos/terminal", request.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*", "/pos/:path*", "/super-admin/:path*", "/login"] };
