import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_ROUTES = ["/login"];

/**
 * Route protection at the edge. Presence of the long-lived refresh cookie is
 * the signal for "has a session" — the API still verifies every request, this
 * only decides which shell to show. (Next.js 16 renamed middleware to proxy.)
 */
export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has("refresh_token");
  const isPublic = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));

  if (!hasSession && !isPublic) {
    const login = new URL("/login", request.url);
    return NextResponse.redirect(login);
  }

  if (hasSession && (isPublic || pathname === "/")) {
    return NextResponse.redirect(new URL("/tasks", request.url));
  }

  if (!hasSession && pathname === "/") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Everything except Next internals, static assets and the API proxy.
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|ico|webp)).*)",
  ],
};
