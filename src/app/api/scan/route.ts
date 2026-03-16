import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { injectTriangleSplit } from "@/lib/scan-transform";
import { supabase } from "@/lib/supabase";

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
    const { data: storedCIs } = await supabase
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
      fetch(`${SCAN_API_URL}/api/scan/public`, { headers, next: { revalidate: 0 } }),
      fetch(`${SCAN_API_URL}/api/indicators/latest`, { headers, next: { revalidate: 0 } }),
    ]);

    if (!scanRes.ok) {
      return NextResponse.json(
        { error: "Tarama servisi yanıt vermedi." },
        { status: scanRes.status }
      );
    }

    const data = await scanRes.json();

    // Özel indikatör kategorilerini mevcut listeyle birleştir
    if (indRes.ok) {
      const indData = await indRes.json();
      let indCats: { key: string; label: string; emoji: string; count: number; stocks: unknown[] }[] =
        indData.categories ?? [];

      // Scan API'de hiç indikatör yoksa Supabase'den yeniden kaydet (arka planda)
      // ve bu istekte sonuçları dahil et
      if (indCats.length === 0) {
        await resyncIndicatorsToScanApi();
        // Yeniden yüklendikten sonra tekrar sorgula
        const indRes2 = await fetch(`${SCAN_API_URL}/api/indicators/latest`, { headers, next: { revalidate: 0 } });
        if (indRes2.ok) {
          const indData2 = await indRes2.json();
          indCats = indData2.categories ?? [];
        }
      }

      if (indCats.length > 0) {
        const existingKeys = new Set((data.categories ?? []).map((c: { key: string }) => c.key));
        for (const cat of indCats) {
          if (!existingKeys.has(cat.key)) {
            data.categories = [...(data.categories ?? []), cat];
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

