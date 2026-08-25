import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Optimistic redirect only — checks that a session cookie exists, nothing
// more. NOT the security boundary: it cannot see role or isActive without a
// DB round trip, and a stale/revoked cookie still passes this check. Every
// Server Action re-validates auth and role itself. See CLAUDE.md §7.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  const sessionCookie = getSessionCookie(request);

  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
