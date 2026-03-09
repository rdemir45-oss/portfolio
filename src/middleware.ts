import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

async function verifyViewerToken(token: string, secret: string): Promise<boolean> {
  const dot = token.lastIndexOf(".");
  if (dot === -1) return false;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    const b64 = sig.replace(/-/g, "+").replace(/_/g, "/");
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    return await crypto.subtle.verify(
      "HMAC",
      key,
      bytes,
      new TextEncoder().encode(payload)
    );
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
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
  if (
    pathname === "/hisse-teknik-analizi/login" ||
    pathname === "/hisse-teknik-analizi/register"
  ) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/hisse-teknik-analizi")) {
    const token = request.cookies.get("viewer_token")?.value;
    const secret = process.env.SCAN_SESSION_SECRET;
    const valid = secret && token ? await verifyViewerToken(token, secret) : false;
    if (!valid) {
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
