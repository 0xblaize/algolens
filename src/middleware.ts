import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/src/lib/agent-session";

const PROTECTED_ROUTES = [
  "/dashboard",
  "/radar",
  "/marketcourt",
  "/execution",
  "/ledger",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the route requires session
  const isProtected = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));

  if (!isProtected) {
    return NextResponse.next();
  }

  // Check for valid session cookie
  const session = request.cookies.get(SESSION_COOKIE)?.value;

  if (!session) {
    // Redirect to create-agent page with return URL
    const createAgentUrl = new URL("/create-agent", request.url);
    createAgentUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(createAgentUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/radar/:path*",
    "/marketcourt/:path*",
    "/execution/:path*",
    "/ledger/:path*",
  ],
};
