import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import crypto from "crypto";

/** viewer_token cookie değerini sunucu tarafında doğrular. */
function isValidViewerToken(token: string | undefined): boolean {
  const secret = process.env.SCAN_PASSWORD;
  if (!secret || !token) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update("viewer-session-v1")
    .digest("hex");
  // Sabit zamanlı karşılaştırma
  try {
    return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Admin koruma ──────────────────────────────────────────────────────
  if (pathname === "/admin/login") return NextResponse.next();

  if (pathname.startsWith("/admin")) {
    const token = request.cookies.get("admin_token")?.value;
    if (!token || token !== process.env.ADMIN_SECRET) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  // ── Hisse Tarama koruma ───────────────────────────────────────────────
  if (pathname === "/hisse-tarama/login") return NextResponse.next();

  if (pathname.startsWith("/hisse-tarama")) {
    const token = request.cookies.get("viewer_token")?.value;
    if (!isValidViewerToken(token)) {
      return NextResponse.redirect(
        new URL("/hisse-tarama/login", request.url)
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/hisse-tarama/:path*"],
};
