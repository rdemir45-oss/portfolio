import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const SCAN_API_URL = process.env.SCAN_API_URL ?? "";
const SCAN_API_KEY = process.env.SCAN_API_KEY ?? "";

const ALLOWED_ORIGINS = new Set(["https://www.orionstrateji.com", "https://orionstrateji.com"]);

function isAllowedOrigin(req: NextRequest): boolean {
  const origin  = req.headers.get("origin")  ?? "";
  const referer = req.headers.get("referer") ?? "";
  if (origin && ALLOWED_ORIGINS.has(origin)) return true;
  try {
    const host = new URL(referer).hostname;
    return host === "www.orionstrateji.com" || host === "orionstrateji.com";
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
