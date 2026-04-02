import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Edge-compatible HMAC-SHA256 token doğrulama (Web Crypto API).
 * admin_token ve viewer_token için kullanılır.
 * admin_token: payload = base64url({ exp }) — sadece süre kontrolü
 * viewer_token: payload = base64url({ id, username }) — eski format, süre yok
 */
async function verifyHmacToken(
  token: string,
  secret: string,
  checkExpiry: boolean
): Promise<boolean> {
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
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      bytes,
      new TextEncoder().encode(payload)
    );
    if (!valid) return false;
    if (checkExpiry) {
      const b64Payload = payload.replace(/-/g, "+").replace(/_/g, "/");
      const { exp } = JSON.parse(atob(b64Payload));
      return typeof exp === "number" && Math.floor(Date.now() / 1000) < exp;
    }
    return true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Admin-app (PWA kurulum sayfası) — koruma dışı ──────────────────
  if (pathname.startsWith("/admin-app")) {
    return NextResponse.next();
  }

  // ── Admin koruma ──────────────────────────────────────────────────────
  if (pathname === "/admin/login") {
    // Zaten giriş yapılmışsa anahtara gerek yok
    const token = request.cookies.get("admin_token")?.value;
    const secret = process.env.ADMIN_SECRET;
    const alreadyLoggedIn = secret && token ? await verifyHmacToken(token, secret, true) : false;
    if (alreadyLoggedIn) return NextResponse.next();

    // Giriş yapılmamışsa: doğru gizli anahtar zorunlu
    const loginKey = request.nextUrl.searchParams.get("k");
    const expectedKey = process.env.ADMIN_LOGIN_KEY ?? "";
    // Anahtar boşsa veya eşleşmiyorsa 404
    if (expectedKey.length === 0 || loginKey !== expectedKey) {
      return new NextResponse("404 Not Found", {
        status: 404,
        headers: { "Content-Type": "text/plain" },
      });
    }
    return NextResponse.next();
  }

  // Login API'si token olmadan erişilebilmeli
  if (pathname === "/api/admin/login") {
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    const token = request.cookies.get("admin_token")?.value;
    const secret = process.env.ADMIN_SECRET;
    const valid = secret && token ? await verifyHmacToken(token, secret, true) : false;
    if (!valid) {
      // API route'ları için 401, sayfa route'ları için 404
      if (pathname.startsWith("/api/admin")) {
        return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
      }
      return new NextResponse("404 Not Found", {
        status: 404,
        headers: { "Content-Type": "text/plain" },
      });
    }
  }

  // ── Hisse Teknik Analizi koruma ───────────────────────────────────────
  // LOCAL DEV: üye girişi devre dışı
  if (process.env.NODE_ENV !== "development") {
    if (
      pathname === "/hisse-teknik-analizi/login" ||
      pathname === "/hisse-teknik-analizi/register"
    ) {
      return NextResponse.next();
    }

    if (pathname.startsWith("/hisse-teknik-analizi")) {
      const token = request.cookies.get("viewer_token")?.value;
      const secret = process.env.SCAN_SESSION_SECRET;
      const valid = secret && token ? await verifyHmacToken(token, secret, false) : false;
      if (!valid) {
        return NextResponse.redirect(
          new URL("/hisse-teknik-analizi/login", request.url)
        );
      }

      // Abonelik süresi kontrolü: token payload'ındaki sub_exp alanını kontrol et
      try {
        const dot = token!.lastIndexOf(".");
        const payloadB64 = token!.slice(0, dot).replace(/-/g, "+").replace(/_/g, "/");
        const decoded = JSON.parse(atob(payloadB64));
        const now = Math.floor(Date.now() / 1000);

        if (typeof decoded.sub_exp !== "number") {
          // Eski format token — yeniden giriş gerekli
          return NextResponse.redirect(
            new URL("/hisse-teknik-analizi/login", request.url)
          );
        }

        if (decoded.sub_exp === 0) {
          // Abonelik hiç atanmamış
          const loginUrl = new URL("/hisse-teknik-analizi/login", request.url);
          loginUrl.searchParams.set("no_sub", "1");
          return NextResponse.redirect(loginUrl);
        }

        if (now >= decoded.sub_exp) {
          // Abonelik süresi dolmuş
          const loginUrl = new URL("/hisse-teknik-analizi/login", request.url);
          loginUrl.searchParams.set("expired", "1");
          return NextResponse.redirect(loginUrl);
        }
      } catch {
        // Parse hatası → güvenli taraf: reddet
        return NextResponse.redirect(
          new URL("/hisse-teknik-analizi/login", request.url)
        );
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/hisse-teknik-analizi/:path*"],
};
