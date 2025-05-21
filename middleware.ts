import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ✅ Only needed to bypass auth on this route
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ✅ Let Stripe reach this route with no protection
  if (pathname.startsWith("/api/stripe/webhook")) {
    return NextResponse.next();
  }

  // Optional: Add other logic if you want
  return NextResponse.next();
}

// ✅ Apply only to API routes
export const config = {
  matcher: ["/api/:path*"],
};
