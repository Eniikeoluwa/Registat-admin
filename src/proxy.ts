import { NextRequest, NextResponse } from "next/server";
import { clearTokens, session, writeTokens } from "@/lib/auth/server";

export async function proxy(request: NextRequest) {
  try {
    const current = await session(request);
    if (!current.user) {
      if (current.status >= 500 || current.status === 429) {
        return new NextResponse("Authentication is temporarily unavailable. Please try again shortly.", {
          status: 503,
          headers: { "Cache-Control": "no-store", "Retry-After": current.retryAfter || "30" },
        });
      }
      const url = new URL("/login", request.url);
      url.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
      const response = NextResponse.redirect(url);
      clearTokens(response);
      return response;
    }
    if (current.user.role !== "admin") {
      const response = new NextResponse("Admin access is required.", { status: 403, headers: { "Cache-Control": "no-store" } });
      clearTokens(response);
      return response;
    }
    const response = NextResponse.next();
    if (current.tokens) writeTokens(response, current.tokens);
    return response;
  } catch {
    return new NextResponse("Authentication is temporarily unavailable. Please try again shortly.", { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}

export const config = { matcher: ["/admin/:path*"] };
