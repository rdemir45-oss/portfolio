import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";

const SCAN_API_URL = process.env.SCAN_API_URL ?? "";
const SCAN_API_KEY = process.env.SCAN_API_KEY ?? "";

export const dynamic = "force-dynamic";

const UNAUTHORIZED = NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
const UNAVAILABLE  = NextResponse.json({ error: "Tarama servisi yapılandırılmamış." }, { status: 503 });

/** GET /api/admin/custom-indicators — liste; ?code=xxx → tek indikatör detayı */
export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return UNAUTHORIZED;
  if (!SCAN_API_URL || !SCAN_API_KEY) return UNAVAILABLE;

  const code = req.nextUrl.searchParams.get("code");
  if (code) {
    const res = await fetch(`${SCAN_API_URL}/api/indicators/${encodeURIComponent(code)}`, {
      headers: { "X-API-Key": SCAN_API_KEY },
    });
    const data = await res.json();
    if (!res.ok) return NextResponse.json(data, { status: res.status });

    // Script içeriğini script_path'ten doğrudan API'den çekemeyiz,
    // register endpoint'i source'u kaydettiğinden /api/indicators/{code}/source kullanırız.
    // Ama o endpoint yoksa, raw script dosyasını aynı servis üzerinden ister.
    const srcRes = await fetch(`${SCAN_API_URL}/api/indicators/${encodeURIComponent(code)}/source`, {
      headers: { "X-API-Key": SCAN_API_KEY },
    });
    if (srcRes.ok) {
      const src = await srcRes.json();
      data.script = src.script ?? "";
    }

    return NextResponse.json(data, { status: res.status });
  }

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

/** PUT /api/admin/custom-indicators?code=xxx — mevcut indikatörü güncelle (script/ad/açıklama) */
export async function PUT(req: NextRequest) {
  if (!isAdmin(req)) return UNAUTHORIZED;
  if (!SCAN_API_URL || !SCAN_API_KEY) return UNAVAILABLE;

  const oldCode = req.nextUrl.searchParams.get("code");
  if (!oldCode) return NextResponse.json({ error: "code parametresi gerekli." }, { status: 400 });

  const body = await req.json();

  // Kod değiştiyse eski kaydı sil
  if (body.code && body.code !== oldCode) {
    await fetch(`${SCAN_API_URL}/api/indicators/${encodeURIComponent(oldCode)}`, {
      method: "DELETE",
      headers: { "X-API-Key": SCAN_API_KEY },
    });
  }

  // Yeni/güncel kod ile kaydet (register upsert gibi davranır)
  const res = await fetch(`${SCAN_API_URL}/api/indicators/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-Key": SCAN_API_KEY },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
