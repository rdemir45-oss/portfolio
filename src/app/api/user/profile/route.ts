import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GROUP_KEYS: GROUPS tanımıyla senkron olmalı (StockScanner.tsx)
const GROUP_KEYS: Record<string, string[]> = {
  formasyon_bull: [
    "strong_up", "golden_cross", "tobo_break", "channel_break_up",
    "triangle_break_up", "trend_break_up", "ikili_dip_break",
    "price_desc_break", "hbreak", "fibo_setup",
  ],
  rsi:      ["rsi_os", "rsi_asc_break", "rsi_tobo", "rsi_ob", "rsi_desc_break", "rsi_hdts", "rsi_pos_div"],
  macd:     ["macd_cross", "macd_bear", "macd_bull", "macd_neg", "macd_pos"],
  harmonik: ["harmonic_long", "harmonic_short"],
  hacim:    ["vol_spike", "bb_squeeze", "vol_dry"],
};

const VALID_KEYS = new Set([...Object.keys(GROUP_KEYS), ...Object.values(GROUP_KEYS).flat()]);

function getUserFromToken(token: string): { id: string; username: string } | null {
  const dot = token.lastIndexOf(".");
  if (dot === -1) return null;
  try {
    const payload = token.slice(0, dot);
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf-8"));
    if (!decoded.id || !decoded.username) return null;
    return { id: decoded.id, username: decoded.username };
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get("viewer_token")?.value;
  if (!token) return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });

  const user = getUserFromToken(token);
  if (!user) return NextResponse.json({ error: "Geçersiz token." }, { status: 401 });

  const { data, error } = await supabase
    .from("scanner_users")
    .select("telegram_chat_id, alert_categories, alerts_enabled, plan")
    .eq("id", user.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    telegramChatId:  data?.telegram_chat_id  ?? "",
    alertCategories: data?.alert_categories  ?? [],
    alertsEnabled:   data?.alerts_enabled    ?? false,
    plan:            data?.plan              ?? "starter",
  });
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get("viewer_token")?.value;
  if (!token) return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });

  const user = getUserFromToken(token);
  if (!user) return NextResponse.json({ error: "Geçersiz token." }, { status: 401 });

  let body: { telegramChatId?: string; alertCategories?: string[]; alertsEnabled?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const telegramChatId  = (body.telegramChatId ?? "").toString().trim();
  const rawCategories   = Array.isArray(body.alertCategories) ? body.alertCategories : [];
  const alertCategories = rawCategories.filter(
    (k) => typeof k === "string" && VALID_KEYS.has(k)
  );
  const alertsEnabled = Boolean(body.alertsEnabled);

  // Chat ID: rakam veya eksi+rakam (grup ID -100xxx gibi olabilir)
  if (telegramChatId && !/^-?\d{5,15}$/.test(telegramChatId)) {
    return NextResponse.json(
      { error: "Geçersiz Telegram Chat ID. Sadece rakamlardan oluşmalı." },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("scanner_users")
    .update({
      telegram_chat_id: telegramChatId || null,
      alert_categories: alertCategories,
      alerts_enabled:   alertsEnabled,
    })
    .eq("id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
