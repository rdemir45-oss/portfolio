import { NextRequest, NextResponse } from "next/server";
import { injectTriangleSplit } from "@/lib/scan-transform";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyViewerToken } from "@/lib/viewer-auth";

const SCAN_API_URL = process.env.SCAN_API_URL ?? "";
const SCAN_API_KEY = process.env.SCAN_API_KEY ?? "";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// ── Sunucu tarafı in-memory cache (60 sn TTL) ─────────────────────────────
// Her kullanıcı isteği için dış API'ye çağrı yapmak yerine önbellekten dön.
// Token doğrulaması hâlâ her istekte yapılır; sadece veri önbelleklenir.
let _cache: { payload: unknown; ts: number } | null = null;
const CACHE_TTL = 60_000; // 60 saniye

/** Supabase'deki tüm custom_indicators kayıtlarını scan API'ye yeniden kaydeder. */
async function resyncIndicatorsToScanApi(): Promise<void> {
  if (!SCAN_API_URL || !SCAN_API_KEY) return;
  try {
    const { data: storedCIs } = await supabaseAdmin
      .from("custom_indicators")
      .select("code, name, description, script");
    if (!storedCIs || storedCIs.length === 0) return;
    await Promise.all(
      storedCIs.map((ci) =>
        fetch(`${SCAN_API_URL}/api/indicators/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-API-Key": SCAN_API_KEY },
          body: JSON.stringify({ code: ci.code, name: ci.name, description: ci.description, script: ci.script }),
        }).catch(() => {})
      )
    );
  } catch { /* ignore — best-effort */ }
}

/** Supabase'den son tarama sonuçlarını çeker (Scan API yedek kaynağı). */
/** Stok objesini güvenli { ticker: string } formatına dönüştürür. */
function normalizeStock(item: unknown): { ticker: string } | null {
  if (typeof item === "string" && item.length > 0) return { ticker: item };
  if (item && typeof item === "object") {
    const obj = item as Record<string, unknown>;
    // Zaten normalize edilmiş: { ticker: "THYAO" }
    if (typeof obj.ticker === "string") return { ticker: obj.ticker };
    // Bozuk kayıt: { ticker: { ticker: "THYAO", rsi: ... } }
    if (obj.ticker && typeof obj.ticker === "object") {
      const inner = obj.ticker as Record<string, unknown>;
      if (typeof inner.ticker === "string") return { ticker: inner.ticker };
      if (typeof inner.symbol === "string") return { ticker: inner.symbol };
    }
    if (typeof obj.symbol === "string") return { ticker: obj.symbol };
  }
  return null;
}

async function getStoredIndicatorCats(): Promise<
  { key: string; label: string; emoji: string; count: number; stocks: unknown[] }[]
> {
  try {
    const { data } = await supabaseAdmin
      .from("custom_indicators")
      .select("last_scan_categories")
      .not("last_scanned_at", "is", null);
    if (!data) return [];
    const cats = data.flatMap(
      (row) => (Array.isArray(row.last_scan_categories) ? row.last_scan_categories : [])
    ) as { key: string; label: string; emoji: string; count: number; stocks: unknown[] }[];
    // Bozuk stocks verilerini normalize et (obje içinde obje ticker durumu)
    return cats.map((cat) => ({
      ...cat,
      stocks: (cat.stocks ?? []).map(normalizeStock).filter(Boolean),
      count: (cat.stocks ?? []).map(normalizeStock).filter(Boolean).length,
    }));
  } catch { return []; }
}

export async function GET(req: NextRequest) {
  // Sadece geçerli token + aktif abonesi olan kullanıcılar erişebilir
  const auth = verifyViewerToken(
    req.cookies.get("viewer_token")?.value,
    process.env.SCAN_SESSION_SECRET
  );
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  if (!SCAN_API_URL || !SCAN_API_KEY) {
    return NextResponse.json(
      { error: "Tarama servisi yapılandırılmamış." },
      { status: 503 }
    );
  }

  // Cache HIT — 60 sn içindeyse dış API'yi çağırma
  if (_cache && Date.now() - _cache.ts < CACHE_TTL) {
    return NextResponse.json(_cache.payload);
  }

  try {
    const headers = { "X-API-Key": SCAN_API_KEY };

    // Standart tarama + özel indikatör + Supabase stored cats PARALEL çek
    const [scanRes, indRes, storedCats] = await Promise.all([
      fetch(`${SCAN_API_URL}/api/scan/public`, { headers, cache: "no-store" }),
      fetch(`${SCAN_API_URL}/api/indicators/latest`, { headers, cache: "no-store" }),
      getStoredIndicatorCats(),
    ]);

    if (!scanRes.ok) {
      return NextResponse.json(
        { error: "Tarama servisi yanıt vermedi." },
        { status: scanRes.status }
      );
    }

    const data = await scanRes.json();

    // Özel indikatör kategorilerini mevcut listeyle birleştir
    let indCats: { key: string; label: string; emoji: string; count: number; stocks: unknown[] }[] = [];

    if (indRes.ok) {
      const indData = await indRes.json();
      indCats = indData.categories ?? [];
    }

    // Scan API boş döndüyse: indikatörleri arka planda yeniden kaydet.
    // Yanıtı BLOKLAMAZ — bir sonraki istek güncel veriyi alır.
    if (indCats.length === 0) {
      resyncIndicatorsToScanApi().catch(() => {});
    }

    // indCats ile storedCats'i birleştir: Supabase'de gerçek sonuç varsa o öncelikli
    const mergedIndCats = [...indCats];
    for (const stored of storedCats) {
      const existingIdx = mergedIndCats.findIndex((c) => c.key === stored.key);
      if (existingIdx === -1) {
        mergedIndCats.push(stored);
      } else if (stored.count > 0) {
        // Supabase = manuel "Tara" sonucu — Scan API /latest'ten her zaman öncelikli
        mergedIndCats[existingIdx] = stored;
      }
    }

    // Standart tarama içinde olmayan custom indikatör kategorilerini ekle
    if (mergedIndCats.length > 0) {
      const existingKeys = new Set((data.categories ?? []).map((c: { key: string }) => c.key));
      for (const cat of mergedIndCats) {
        if (!existingKeys.has(cat.key)) {
          data.categories = [...(data.categories ?? []), cat];
        } else {
          // Var olan key için Supabase verisi daha iyiyse güncelle
          const idx = (data.categories ?? []).findIndex((c: { key: string }) => c.key === cat.key);
          if (idx !== -1 && (data.categories[idx] as { count: number }).count === 0 && cat.count > 0) {
            data.categories[idx] = cat;
          }
        }
      }
    }

    const payload = injectTriangleSplit(data);

    // Cache'e yaz
    _cache = { payload, ts: Date.now() };

    return NextResponse.json(payload);
  } catch {
    return NextResponse.json(
      { error: "Tarama servisine bağlanılamadı." },
      { status: 502 }
    );
  }
}

