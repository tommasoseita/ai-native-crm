import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "wibo_session";

/**
 * Optimistic auth gate: redirects clearly unauthenticated visitors to /login
 * before any rendering happens. This only checks cookie *presence* — real
 * session validation lives in the data layer (src/lib/auth.ts), which every
 * protected layout, action and route handler goes through.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSessionCookie = request.cookies.has(SESSION_COOKIE);

  if (!hasSessionCookie && pathname !== "/login") {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  // Everything except API routes (they return 401 themselves), Next internals
  // and static assets.
  matcher: [
    "/((?!api|_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
