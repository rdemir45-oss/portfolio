import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase";
import { customIndicatorWriteSchema } from "@/lib/schemas";

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

  let raw: unknown;
  try { raw = await req.json(); } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const parsed = customIndicatorWriteSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Geçersiz veri." }, { status: 422 });
  }

  const { code, name, description, script } = parsed.data;

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

  // ── Sonuçları Supabase'e kaydet (Railway restart'a karşı kalıcı yedek) ──
  // Scan API yanıt formatlarını normalize et
  if (res.ok) {
    try {
      // İndikatörün adını çek (kategori label'ı için)
      const { data: ci } = await supabaseAdmin
        .from("custom_indicators")
        .select("name")
        .eq("code", code)
        .single();

      // Scan API'nin döndürdüğü tickers listesini bul (çeşitli format desteği)
      let tickers: string[] = [];
      // Format 1 (birincil): { keys: { "signal_key": ["TICKER1", ...] veya [{ticker,rsi,...}] } }
      if (data.keys && typeof data.keys === "object" && !Array.isArray(data.keys)) {
        const allRaw = Object.values(data.keys as Record<string, unknown[]>).flat();
        // Her eleman ya string ya da { ticker/symbol: string, rsi, macd, ... } objesi olabilir
        const extracted = allRaw
          .map((item) => {
            if (typeof item === "string") return item;
            if (item && typeof item === "object") {
              const obj = item as Record<string, unknown>;
              return typeof obj.ticker === "string" ? obj.ticker
                   : typeof obj.symbol === "string" ? obj.symbol
                   : null;
            }
            return null;
          })
          .filter((t): t is string => typeof t === "string" && t.length > 0);
        tickers = Array.from(new Set(extracted));
      }
      // Format 2: { tickers: ["TICKER1", ...] }
      else if (Array.isArray(data.tickers)) tickers = data.tickers;
      // Format 3: { passed: ["TICKER1", ...] }
      else if (Array.isArray(data.passed)) tickers = data.passed;
      // Format 4: { results: [{ symbol, passed }, ...] }
      else if (Array.isArray(data.results)) {
        tickers = data.results
          .filter((r: { passed?: boolean }) => r.passed)
          .map((r: { symbol?: string; ticker?: string }) => r.symbol ?? r.ticker ?? "")
          .filter(Boolean);
      }

      const stocks = tickers.map((t: string) => ({ ticker: t }));
      const categories = [{
        key:    code,
        label:  ci?.name ?? code,
        emoji:  "📊",
        count:  stocks.length,
        stocks,
      }];

      await supabaseAdmin
        .from("custom_indicators")
        .update({
          last_scan_categories: categories,
          last_scanned_at: new Date().toISOString(),
        })
        .eq("code", code);
    } catch { /* best-effort — ana yanıtı etkileme */ }
  }

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
