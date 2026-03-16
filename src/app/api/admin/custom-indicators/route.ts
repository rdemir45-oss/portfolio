import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";

const SCAN_API_URL = process.env.SCAN_API_URL ?? "";
const SCAN_API_KEY = process.env.SCAN_API_KEY ?? "";

export const dynamic = "force-dynamic";

const UNAUTHORIZED = NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
const UNAVAILABLE  = NextResponse.json({ error: "Tarama servisi yapılandırılmamış." }, { status: 503 });

/** GET /api/admin/custom-indicators — kayıtlı indikatör listesi */
export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return UNAUTHORIZED;
  if (!SCAN_API_URL || !SCAN_API_KEY) return UNAVAILABLE;

  const res = await fetch(`${SCAN_API_URL}/api/indicators`, {
    headers: { "X-API-Key": SCAN_API_KEY },
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

/** POST /api/admin/custom-indicators — yeni indikatör kaydet */
export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return UNAUTHORIZED;
  if (!SCAN_API_URL || !SCAN_API_KEY) return UNAVAILABLE;

  const body = await req.json();
  const res = await fetch(`${SCAN_API_URL}/api/indicators/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": SCAN_API_KEY,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

/** DELETE /api/admin/custom-indicators?code=xxx — indikatör sil */
export async function DELETE(req: NextRequest) {
  if (!isAdmin(req)) return UNAUTHORIZED;
  if (!SCAN_API_URL || !SCAN_API_KEY) return UNAVAILABLE;

  const code = req.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.json({ error: "code parametresi gerekli." }, { status: 400 });

  const res = await fetch(`${SCAN_API_URL}/api/indicators/${encodeURIComponent(code)}`, {
    method: "DELETE",
    headers: { "X-API-Key": SCAN_API_KEY },
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

/** PATCH /api/admin/custom-indicators?code=xxx — taramayı tetikle */
export async function PATCH(req: NextRequest) {
  if (!isAdmin(req)) return UNAUTHORIZED;
  if (!SCAN_API_URL || !SCAN_API_KEY) return UNAVAILABLE;

  const code = req.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.json({ error: "code parametresi gerekli." }, { status: 400 });

  const res = await fetch(`${SCAN_API_URL}/api/indicators/${encodeURIComponent(code)}/scan`, {
    method: "POST",
    headers: { "X-API-Key": SCAN_API_KEY },
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
