import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const SCAN_API_URL = process.env.SCAN_API_URL ?? "";
const SCAN_API_KEY = process.env.SCAN_API_KEY ?? "";

const ALLOWED_ORIGINS = new Set(["https://www.orionstrateji.com", "https://orionstrateji.com"]);

// İzinli hostname'ler (hem embed sitesi hem orion)
const ALLOWED_HOSTS = new Set([
  "www.orionstrateji.com",
  "orionstrateji.com",
  "recepdemirborsa.com",
  "www.recepdemirborsa.com",
]);

function isAllowedOrigin(req: NextRequest): boolean {
  const origin  = req.headers.get("origin")  ?? "";
  const referer = req.headers.get("referer") ?? "";
  const reqHost = (req.headers.get("host") ?? "").split(":")[0]; // port'u at

  // Origin boşsa → same-origin fetch (tarayıcı embed sayfasından)
  // Referer header'ından host doğrulaması yap; eksikse reddet
  if (!origin) {
    if (!referer) return false;
    try {
      const refHost = new URL(referer).hostname;
      // Referer, isteğin yapıldığı sunucunun kendisiyse geç
      return refHost === reqHost || ALLOWED_HOSTS.has(refHost);
    } catch { return false; }
  }

  // Cross-origin: izin verilenler listesinde olmalı
  if (ALLOWED_ORIGINS.has(origin)) return true;

  // Ek güvence: Referer da kontrol et
  try {
    const refHost = new URL(referer).hostname;
    return ALLOWED_HOSTS.has(refHost);
  } catch { return false; }
}

function corsHeaders(req: NextRequest) {
  const origin = req.headers.get("origin") ?? "";
  const allowedOrigin = ALLOWED_ORIGINS.has(origin) ? origin : "https://www.orionstrateji.com";
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Vary": "Origin",
    "Cache-Control": "no-store",
  };
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req) });
}

export async function GET(req: NextRequest) {
  if (!isAllowedOrigin(req)) {
    return NextResponse.json(
      { error: "Yetkisiz erişim." },
      { status: 403 }
    );
  }

  // Embed endpoint rate limit: dakikada 20 istek
  const ip = getClientIp(req);
  const rl = await rateLimit(`embed:${ip}`, { limit: 20, windowSec: 60 });
  if (!rl.success) {
    return NextResponse.json(
      { error: "Çok fazla istek." },
      { status: 429, headers: corsHeaders(req) }
    );
  }

  if (!SCAN_API_URL || !SCAN_API_KEY) {
    return NextResponse.json(
      { error: "Tarama servisi yapılandırılmamış." },
      { status: 503, headers: corsHeaders(req) }
    );
  }

  try {
    const res = await fetch(`${SCAN_API_URL}/api/scan/public`, {
      headers: { "X-API-Key": SCAN_API_KEY },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Tarama servisi yanıt vermedi." },
        { status: res.status, headers: corsHeaders(req) }
      );
    }

    return NextResponse.json(await res.json(), { headers: corsHeaders(req) });
  } catch {
    return NextResponse.json(
      { error: "Tarama servisine bağlanılamadı." },
      { status: 502, headers: corsHeaders(req) }
    );
  }
}
