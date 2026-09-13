import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = [
  "/login",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/logout",
  "/api/auth/me",
  "/favicon.ico",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow static assets and Next.js internal routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/verification/verify-receipt") || // allow independent receipt verification
    pathname.includes(".") // static files
  ) {
    return NextResponse.next();
  }

  const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.substring(7).trim() : null;
  const sessionToken = request.cookies.get("resrec_session")?.value || bearerToken;

  // If path is public
  const isPublic = PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(path));

  if (!sessionToken && !isPublic) {
    // If it's an API request, return 401 JSON
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Redirect to /login with original return url
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If user is logged in and visits /login, redirect to /
  if (sessionToken && pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
