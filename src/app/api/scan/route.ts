import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { injectTriangleSplit } from "@/lib/scan-transform";
import { supabaseAdmin } from "@/lib/supabase";

const SCAN_API_URL          = process.env.SCAN_API_URL ?? "";
const SCAN_API_KEY          = process.env.SCAN_API_KEY ?? "";
const SCAN_SESSION_SECRET   = process.env.SCAN_SESSION_SECRET ?? "";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function isValidViewerToken(token: string): boolean {
  if (!SCAN_SESSION_SECRET) return false;
  const dot = token.lastIndexOf(".");
  if (dot === -1) return false;
  try {
    const payload  = token.slice(0, dot);
    const sig      = token.slice(dot + 1);
    const expected = crypto.createHmac("sha256", SCAN_SESSION_SECRET).update(payload).digest("base64url");
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
  } catch {
    return false;
  }
}

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
async function getStoredIndicatorCats(): Promise<
  { key: string; label: string; emoji: string; count: number; stocks: unknown[] }[]
> {
  try {
    const { data } = await supabaseAdmin
      .from("custom_indicators")
      .select("last_scan_categories")
      .not("last_scanned_at", "is", null);
    if (!data) return [];
    return data.flatMap(
      (row) => (Array.isArray(row.last_scan_categories) ? row.last_scan_categories : [])
    );
  } catch { return []; }
}

export async function GET(req: NextRequest) {
  // Sadece giriş yapmış kullanıcılar tarama sonuçlarına erişebilir
  const token = req.cookies.get("viewer_token")?.value;
  if (!token || !isValidViewerToken(token)) {
    return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });
  }

  if (!SCAN_API_URL || !SCAN_API_KEY) {
    return NextResponse.json(
      { error: "Tarama servisi yapılandırılmamış." },
      { status: 503 }
    );
  }

  try {
    const headers = { "X-API-Key": SCAN_API_KEY };

    // Standart tarama + özel indikatör sonuçlarını paralel çek
    const [scanRes, indRes] = await Promise.all([
      fetch(`${SCAN_API_URL}/api/scan/public`, { headers, cache: "no-store" }),
      fetch(`${SCAN_API_URL}/api/indicators/latest`, { headers, cache: "no-store" }),
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

    // Scan API boş döndüyse: indikatörleri yeniden kaydet (memory reset sonrası)
    if (indCats.length === 0) {
      await resyncIndicatorsToScanApi();
      const indRes2 = await fetch(`${SCAN_API_URL}/api/indicators/latest`, { headers, cache: "no-store" });
      if (indRes2.ok) {
        const indData2 = await indRes2.json();
        indCats = indData2.categories ?? [];
      }
    }

    // Supabase'deki kaydedilmiş sonuçları çek — bunlar primary source
    // (Scan API /latest endpoint'i manual scan sonuçlarını yansıtmıyor)
    const storedCats = await getStoredIndicatorCats();

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

    return NextResponse.json(injectTriangleSplit(data));
  } catch {
    return NextResponse.json(
      { error: "Tarama servisine bağlanılamadı." },
      { status: 502 }
    );
  }
}

