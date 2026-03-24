import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { validateScanCode } from "@/lib/scan-code-validator";
import type { ScanRule, ScanRuleGroup } from "@/lib/supabase";
import crypto from "crypto";

export const dynamic = "force-dynamic";

const SCAN_API_URL = process.env.SCAN_API_URL ?? "";
const SCAN_API_KEY = process.env.SCAN_API_KEY ?? "";

function getUser(req: NextRequest) {
  const token  = req.cookies.get("viewer_token")?.value;
  const secret = process.env.SCAN_SESSION_SECRET;
  if (!token || !secret) return null;
  const dot = token.lastIndexOf(".");
  if (dot === -1) return null;
  try {
    const payload  = token.slice(0, dot);
    const sig      = token.slice(dot + 1);
    const expected = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
    if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) return null;
    const decoded  = JSON.parse(Buffer.from(payload, "base64url").toString("utf-8"));
    if (!decoded.id || !decoded.username) return null;
    return { id: decoded.id as string, username: decoded.username as string };
  } catch { return null; }
}

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
        if (r.condition === "squeeze")     return "bb_squeeze";
        if (r.condition === "price_above") return "close > bb_upper";
        if (r.condition === "price_below") return "close < bb_lower";
        return "bb_squeeze";
      case "STOCH":
        if (r.condition === "lt") return `stoch(${r.period ?? 14}) < ${r.value ?? 20}`;
        if (r.condition === "gt") return `stoch(${r.period ?? 14}) > ${r.value ?? 80}`;
        return `stoch(${r.period ?? 14}) ${r.condition} ${r.value}`;
      default: return "";
    }
  }).filter(Boolean);
  return parts.join(` ${ruleGroup.operator} `);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = getUser(req);
  if (!user) return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });

  const ip = getClientIp(req);
  const rl = await rateLimit(`assigned-scan-run:${user.id}`, { limit: 10, windowSec: 60 });
  if (!rl.success) return NextResponse.json({ error: "Çok fazla istek. Bir dakika bekleyiniz." }, { status: 429 });

  const { id } = await params;

  // Taramayı çek + sahiplik kontrolü (sadece kendi user_id'siyle oluşturulmuş)
  const { data: scan } = await supabaseAdmin
    .from("admin_assigned_scans")
    .select("id, scan_type, rules, python_code, is_active")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!scan)           return NextResponse.json({ error: "Tarama bulunamadı." }, { status: 404 });
  if (!scan.is_active) return NextResponse.json({ error: "Bu tarama şu an devre dışı." }, { status: 400 });

  if (!SCAN_API_URL || !SCAN_API_KEY) {
    return NextResponse.json({ error: "Tarama servisi yapılandırılmamış." }, { status: 503 });
  }

  let requestBody: Record<string, unknown>;

  if (scan.scan_type === "python" && scan.python_code) {
    const validation = validateScanCode(scan.python_code as string);
    if (!validation.valid) {
      return NextResponse.json({ error: `Tarama kodu geçersiz: ${validation.error}` }, { status: 422 });
    }
    requestBody = { mode: "python", python_code: scan.python_code };
  } else {
    const query = rulesToQueryString(scan.rules as ScanRuleGroup);
    requestBody = { query, rules: scan.rules };
  }

  let tickers: string[] = [];
  try {
    const res = await fetch(`${SCAN_API_URL}/api/scan/custom`, {
      method: "POST",
      headers: { "X-API-Key": SCAN_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });
    if (res.ok) {
      const data = await res.json();
      tickers = Array.isArray(data.tickers) ? data.tickers : [];
    }
  } catch {
    // Motor yanıt vermezse boş döner
  }

  const ranAt = new Date().toISOString();

  // Sonucu kalıcı olarak kaydet
  const { data: savedResult } = await supabaseAdmin
    .from("admin_assigned_scan_results")
    .insert({ scan_id: scan.id, user_id: user.id, tickers })
    .select("id, scan_id, tickers, ran_at")
    .single();

  return NextResponse.json({
    tickers,
    count: tickers.length,
    ranAt: savedResult?.ran_at ?? ranAt,
  });
}
