import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase";

const SCAN_API_URL = process.env.SCAN_API_URL ?? "";
const SCAN_API_KEY = process.env.SCAN_API_KEY ?? "";

export const dynamic = "force-dynamic";

const UNAUTHORIZED = NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
const UNAVAILABLE  = NextResponse.json({ error: "Tarama servisi yapılandırılmamış." }, { status: 503 });

const scanHeaders = { "Content-Type": "application/json", "X-API-Key": SCAN_API_KEY };

/** Scan API'ye indikatörü kaydeder (register upsert). Scan API opsiyoneldir — yoksa uyarı döner. */
async function pushToScanApi(code: string, name: string, description: string, script: string) {
  if (!SCAN_API_URL || !SCAN_API_KEY) return null;
  try {
    const res = await fetch(`${SCAN_API_URL}/api/indicators/register`, {
      method: "POST",
      headers: scanHeaders,
      body: JSON.stringify({ code, name, description, script }),
    });
    return await res.json();
  } catch {
    return null;
  }
}

/** GET /api/admin/custom-indicators — liste; ?code=xxx → tek indikatör detayı+script */
export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return UNAUTHORIZED;

  const code = req.nextUrl.searchParams.get("code");

  if (code) {
    // Tek indikatör — Supabase'den çek (script dahil)
    const { data, error } = await supabaseAdmin
      .from("custom_indicators")
      .select("code, name, description, script")
      .eq("code", code)
      .single();
    if (error || !data) return NextResponse.json({ error: "Bulunamadı." }, { status: 404 });
    return NextResponse.json({
      code: data.code,
      name: data.name,
      description: data.description,
      script: data.script,
      keys: [{ id: data.code, label: data.name }],
    });
  }

  // Liste — Supabase'den çek
  const { data, error } = await supabaseAdmin
    .from("custom_indicators")
    .select("code, name, description")
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const indicators = (data ?? []).map((ci) => ({
    code: ci.code,
    name: ci.name,
    description: ci.description,
    keys: [{ id: ci.code, label: ci.name }],
  }));

  return NextResponse.json({ indicators });
}

/** POST /api/admin/custom-indicators — yeni indikatör kaydet */
export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return UNAUTHORIZED;

  const body = await req.json();
  const { code, name, description = "", script = "" } = body;

  if (!code || !name) {
    return NextResponse.json({ error: "code ve name zorunludur." }, { status: 400 });
  }

  // 1. Supabase'e kaydet (kaynak of truth)
  const { error } = await supabaseAdmin.from("custom_indicators").upsert(
    { code, name, description, script, updated_at: new Date().toISOString() },
    { onConflict: "code" }
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 2. Scan API'ye gönder (best-effort)
  if (SCAN_API_URL && SCAN_API_KEY) {
    const scanRes = await pushToScanApi(code, name, description, script);
    if (scanRes && scanRes.error) {
      return NextResponse.json({ error: scanRes.detail ?? scanRes.error }, { status: 400 });
    }
  }

  return NextResponse.json({ ok: true, code, name });
}

/** DELETE /api/admin/custom-indicators?code=xxx — indikatör sil */
export async function DELETE(req: NextRequest) {
  if (!isAdmin(req)) return UNAUTHORIZED;

  const code = req.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.json({ error: "code parametresi gerekli." }, { status: 400 });

  // 1. Supabase'den sil
  const { error } = await supabaseAdmin.from("custom_indicators").delete().eq("code", code);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 2. Scan API'den sil (best-effort)
  if (SCAN_API_URL && SCAN_API_KEY) {
    await fetch(`${SCAN_API_URL}/api/indicators/${encodeURIComponent(code)}`, {
      method: "DELETE",
      headers: { "X-API-Key": SCAN_API_KEY },
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}

/** PATCH /api/admin/custom-indicators?code=xxx — taramayı tetikle */
export async function PATCH(req: NextRequest) {
  if (!isAdmin(req)) return UNAUTHORIZED;
  if (!SCAN_API_URL || !SCAN_API_KEY) return UNAVAILABLE;

  const code = req.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.json({ error: "code parametresi gerekli." }, { status: 400 });

  // Scan API'de kayıt yoksa önce Supabase'den yükle ve yeniden kaydet
  const checkRes = await fetch(`${SCAN_API_URL}/api/indicators/${encodeURIComponent(code)}`, {
    headers: { "X-API-Key": SCAN_API_KEY },
  }).catch(() => null);

  if (!checkRes || !checkRes.ok) {
    // Scan API'de yok — Supabase'den yükle ve kaydet
    const { data: ci } = await supabaseAdmin
      .from("custom_indicators")
      .select("code, name, description, script")
      .eq("code", code)
      .single();
    if (ci) await pushToScanApi(ci.code, ci.name, ci.description, ci.script);
  }

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

  const oldCode = req.nextUrl.searchParams.get("code");
  if (!oldCode) return NextResponse.json({ error: "code parametresi gerekli." }, { status: 400 });

  const body = await req.json();
  const { code: newCode = oldCode, name, description = "", script = "" } = body;

  // 1. Supabase güncelle
  if (newCode !== oldCode) {
    // Kod değiştiyse: eski kaydı sil, yeni kayıt oluştur
    await supabaseAdmin.from("custom_indicators").delete().eq("code", oldCode);
    const { error } = await supabaseAdmin.from("custom_indicators").insert(
      { code: newCode, name, description, script }
    );
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { error } = await supabaseAdmin.from("custom_indicators").update(
      { name, description, script, updated_at: new Date().toISOString() }
    ).eq("code", oldCode);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 2. Scan API güncelle (best-effort)
  if (SCAN_API_URL && SCAN_API_KEY) {
    if (newCode !== oldCode) {
      await fetch(`${SCAN_API_URL}/api/indicators/${encodeURIComponent(oldCode)}`, {
        method: "DELETE",
        headers: { "X-API-Key": SCAN_API_KEY },
      }).catch(() => {});
    }
    const scanRes = await pushToScanApi(newCode, name, description, script);
    if (scanRes && scanRes.error) {
      return NextResponse.json({ error: scanRes.detail ?? scanRes.error }, { status: 400 });
    }
  }

  return NextResponse.json({ ok: true, code: newCode });
}
