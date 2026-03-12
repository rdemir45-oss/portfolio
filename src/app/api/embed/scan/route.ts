import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const EMBED_READ_KEY = process.env.EMBED_READ_KEY ?? "";
const SCAN_API_URL   = process.env.SCAN_API_URL ?? "";
const SCAN_API_KEY   = process.env.SCAN_API_KEY ?? "";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "no-store",
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key") ?? "";

  // Timing-safe key doğrulama
  if (
    !EMBED_READ_KEY ||
    key.length !== EMBED_READ_KEY.length ||
    !crypto.timingSafeEqual(Buffer.from(key), Buffer.from(EMBED_READ_KEY))
  ) {
    return NextResponse.json(
      { error: "Geçersiz anahtar." },
      { status: 401, headers: corsHeaders() }
    );
  }

  if (!SCAN_API_URL || !SCAN_API_KEY) {
    return NextResponse.json(
      { error: "Tarama servisi yapılandırılmamış." },
      { status: 503, headers: corsHeaders() }
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
        { status: res.status, headers: corsHeaders() }
      );
    }

    return NextResponse.json(await res.json(), { headers: corsHeaders() });
  } catch {
    return NextResponse.json(
      { error: "Tarama servisine bağlanılamadı." },
      { status: 502, headers: corsHeaders() }
    );
  }
}
