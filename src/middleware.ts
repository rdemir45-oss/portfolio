import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

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

  // ── Hisse Teknik Analizi koruma ───────────────────────────────────────
  if (pathname === "/hisse-teknik-analizi/login") return NextResponse.next();

  if (pathname.startsWith("/hisse-teknik-analizi")) {
    const token = request.cookies.get("viewer_token")?.value;
    const secret = process.env.SCAN_PASSWORD;
    if (!secret || !token || token !== secret) {
      return NextResponse.redirect(
        new URL("/hisse-teknik-analizi/login", request.url)
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/hisse-teknik-analizi/:path*"],
};
