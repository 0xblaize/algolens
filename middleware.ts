import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that require an active agent session
const PROTECTED = [
  "/dashboard",
  "/radar",
  "/marketcourt",
  "/execution",
  "/ledger",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  if (!isProtected) return NextResponse.next();

  // Check for agent session cookie (set server-side, HttpOnly)
  const session = request.cookies.get("agoralens_agent_session");

  if (!session?.value) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/create-agent";
    // Preserve the intended destination so we can redirect back after login
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Run on all routes except static files, images, and API internals
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
