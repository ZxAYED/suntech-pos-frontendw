import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionTokenWithGrace } from "@/lib/session-cookie";
import { clearAuthenticationCookies } from "@/lib/server/clear-auth-cookies";

export async function GET(request: NextRequest) {
  const verified = await verifySessionTokenWithGrace(request.cookies.get(SESSION_COOKIE)?.value);
  if (!verified) {
    return NextResponse.json({ message: "No authenticated session" }, { status: 401 });
  }
  if (verified.expired) {
    return NextResponse.json(
      { message: "Session projection expired", code: "ROUTING_COOKIE_EXPIRED" },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }
  return NextResponse.json({ user: verified.session.user }, { headers: { "Cache-Control": "no-store" } });
}

export async function DELETE() {
  const response = NextResponse.json({ signedOut: true });
  clearAuthenticationCookies(response);
  return response;
}
