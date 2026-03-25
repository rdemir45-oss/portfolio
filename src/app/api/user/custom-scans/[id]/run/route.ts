import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import type { ScanRule, ScanRuleGroup } from "@/lib/supabase";
import { verifyViewerToken } from "@/lib/viewer-auth";

export const dynamic = "force-dynamic";

const SCAN_API_URL = process.env.SCAN_API_URL ?? "";
const SCAN_API_KEY = process.env.SCAN_API_KEY ?? "";


// Kural grubunu Python motorunun anlayacağı formata çevir
function rulesToQueryString(ruleGroup: ScanRuleGroup): string {
  const parts = ruleGroup.rules.map((r: ScanRule) => {
    switch (r.indicator) {
      case "RSI":
        if (r.condition === "lt")  return `rsi(${r.period ?? 14}) < ${r.value ?? 30}`;
        if (r.condition === "gt")  return `rsi(${r.period ?? 14}) > ${r.value ?? 70}`;
        if (r.condition === "lte") return `rsi(${r.period ?? 14}) <= ${r.value ?? 30}`;
        if (r.condition === "gte") return `rsi(${r.period ?? 14}) >= ${r.value ?? 70}`;
        return `rsi(${r.period ?? 14}) ${r.condition} ${r.value}`;
      case "EMA":
        if (r.condition === "price_above") return `close > ema(${r.period ?? 50})`;
        if (r.condition === "price_below") return `close < ema(${r.period ?? 50})`;
        if (r.condition === "cross_above") return `ema(${r.period ?? 20}) cross_above ema(${r.period2 ?? 50})`;
        if (r.condition === "cross_below") return `ema(${r.period ?? 20}) cross_below ema(${r.period2 ?? 50})`;
        return `ema(${r.period ?? 50})`;
      case "SMA":
        if (r.condition === "price_above") return `close > sma(${r.period ?? 50})`;
        if (r.condition === "price_below") return `close < sma(${r.period ?? 50})`;
        return `sma(${r.period ?? 50})`;
      case "MACD":
        if (r.condition === "cross_above") return "macd_cross_above";
        if (r.condition === "cross_below") return "macd_cross_below";
        return "macd_cross";
      case "VOLUME":
        if (r.condition === "spike") return `volume > ${r.multiplier ?? 2} * avg_volume(${r.period ?? 20})`;
        if (r.condition === "gt")    return `volume > ${r.value}`;
        return `volume_spike(${r.multiplier ?? 2})`;
      case "PRICE_CHANGE":
        if (r.condition === "gt") return `change_pct > ${r.value ?? 3}`;
        if (r.condition === "lt") return `change_pct < ${r.value ?? -3}`;
        return `change_pct ${r.condition} ${r.value}`;
      case "BOLLINGER":
        if (r.condition === "squeeze") return "bb_squeeze";
        if (r.condition === "price_above") return "close > bb_upper";
        if (r.condition === "price_below") return "close < bb_lower";
        return "bb_squeeze";
      case "STOCH":
        if (r.condition === "lt")  return `stoch(${r.period ?? 14}) < ${r.value ?? 20}`;
        if (r.condition === "gt")  return `stoch(${r.period ?? 14}) > ${r.value ?? 80}`;
        return `stoch(${r.period ?? 14}) ${r.condition} ${r.value}`;
      default:
        return "";
    }
  }).filter(Boolean);

  return parts.join(` ${ruleGroup.operator} `);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = verifyViewerToken(
    req.cookies.get("viewer_token")?.value,
    process.env.SCAN_SESSION_SECRET
  );
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const user = auth.user;

  const { id } = await params;

  // Taramayı çek + sahiplik kontrolü
  const { data: scan } = await supabaseAdmin
    .from("custom_scans")
    .select("id, scan_type, rules, python_code, is_active")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!scan)           return NextResponse.json({ error: "Tarama bulunamadı." }, { status: 404 });
  if (!scan.is_active) return NextResponse.json({ error: "Tarama devre dışı." }, { status: 400 });

  if (!SCAN_API_URL || !SCAN_API_KEY) {
    return NextResponse.json({ error: "Tarama servisi yapılandırılmamış." }, { status: 503 });
  }

  // Python motoruna gönderilecek payload
  let requestBody: Record<string, unknown>;

  if (scan.scan_type === "python" && scan.python_code) {
    // Python kodu modunda — kodu doğrula ve gönder
    const { validateScanCode } = await import("@/lib/scan-code-validator");
    const validation = validateScanCode(scan.python_code as string);
    if (!validation.valid) {
      return NextResponse.json({ error: `Kod geçersiz: ${validation.error}` }, { status: 422 });
    }
    requestBody = { mode: "python", python_code: scan.python_code };
  } else {
    // Kural modu — kuralları sorgu dizisine çevir
    const query = rulesToQueryString(scan.rules as ScanRuleGroup);
    requestBody = { query, rules: scan.rules };
  }

  let tickers: string[] = [];
  try {
    const res = await fetch(`${SCAN_API_URL}/api/scan/custom`, {
      method: "POST",
      headers: {
        "X-API-Key": SCAN_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });
    if (res.ok) {
      const data = await res.json();
      tickers = Array.isArray(data.tickers) ? data.tickers : [];
    }
  } catch {
    // Motor yoksa boş döner
  }

  // Sonucu kaydet
  await supabaseAdmin.from("custom_scan_results").insert({
    scan_id: scan.id,
    user_id: user.id,
    tickers,
  });

  return NextResponse.json({ tickers, count: tickers.length, ranAt: new Date().toISOString() });
}
