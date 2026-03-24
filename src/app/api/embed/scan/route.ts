import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { injectTriangleSplit } from "@/lib/scan-transform";
import { supabaseAdmin } from "@/lib/supabase";

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
  const reqHost = (req.headers.get("host") ?? "").split(":")[0];

  if (!origin) {
    if (!referer) return false;
    try {
      const refHost = new URL(referer).hostname;
      return refHost === reqHost || ALLOWED_HOSTS.has(refHost);
    } catch { return false; }
  }

  if (ALLOWED_ORIGINS.has(origin)) return true;

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

/** Supabase'deki scan_groups tablosundan aktif grupları çeker */
async function getScanGroups(): Promise<
  { id: string; label: string; emoji: string; icon: string; color: string; keys: { id: string; label: string }[]; display_order: number; is_bull: boolean }[]
> {
  try {
    const { data } = await supabaseAdmin
      .from("scan_groups")
      .select("id, label, emoji, icon, color, keys, display_order, is_bull")
      .order("display_order", { ascending: true });
    return data ?? [];
  } catch { return []; }
}

/** Supabase'deki custom_indicators son tarama sonuçlarını çeker */
function normalizeStock(item: unknown): { ticker: string } | null {
  if (typeof item === "string" && item.length > 0) return { ticker: item };
  if (item && typeof item === "object") {
    const obj = item as Record<string, unknown>;
    if (typeof obj.ticker === "string") return { ticker: obj.ticker };
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
    return cats.map((cat) => ({
      ...cat,
      stocks: (cat.stocks ?? []).map(normalizeStock).filter(Boolean),
      count: (cat.stocks ?? []).map(normalizeStock).filter(Boolean).length,
    }));
  } catch { return []; }
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
    const headers = { "X-API-Key": SCAN_API_KEY };

    // Standart tarama + özel indikatör sonuçlarını + grupları paralel çek
    const [scanRes, indRes, groups] = await Promise.all([
      fetch(`${SCAN_API_URL}/api/scan/public`, { headers, cache: "no-store" }),
      fetch(`${SCAN_API_URL}/api/indicators/latest`, { headers, cache: "no-store" }),
      getScanGroups(),
    ]);

    if (!scanRes.ok) {
      return NextResponse.json(
        { error: "Tarama servisi yanıt vermedi." },
        { status: scanRes.status, headers: corsHeaders(req) }
      );
    }

    const data = await scanRes.json();

    // Özel indikatör kategorilerini al
    let indCats: { key: string; label: string; emoji: string; count: number; stocks: unknown[] }[] = [];
    if (indRes.ok) {
      const indData = await indRes.json();
      indCats = indData.categories ?? [];
    }

    // Supabase'deki kaydedilmiş en son tarama sonuçlarını çek
    const storedCats = await getStoredIndicatorCats();

    // Supabase verisi öncelikli olarak indCats ile birleştir
    const mergedIndCats = [...indCats];
    for (const stored of storedCats) {
      const existingIdx = mergedIndCats.findIndex((c) => c.key === stored.key);
      if (existingIdx === -1) {
        mergedIndCats.push(stored);
      } else if (stored.count > 0) {
        mergedIndCats[existingIdx] = stored;
      }
    }

    // Birleştirilmiş özel indikatör kategorilerini standart tarama sonucuna ekle
    if (mergedIndCats.length > 0) {
      const existingKeys = new Set((data.categories ?? []).map((c: { key: string }) => c.key));
      for (const cat of mergedIndCats) {
        if (!existingKeys.has(cat.key)) {
          data.categories = [...(data.categories ?? []), cat];
        } else {
          const idx = (data.categories ?? []).findIndex((c: { key: string }) => c.key === cat.key);
          if (idx !== -1 && (data.categories[idx] as { count: number }).count === 0 && cat.count > 0) {
            data.categories[idx] = cat;
          }
        }
      }
    }

    const result = injectTriangleSplit(data);
    return NextResponse.json({ ...result, groups }, { headers: corsHeaders(req) });
  } catch {
    return NextResponse.json(
      { error: "Tarama servisine bağlanılamadı." },
      { status: 502, headers: corsHeaders(req) }
    );
  }
}
