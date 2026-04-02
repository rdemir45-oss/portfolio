import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { userProfileUpdateSchema } from "@/lib/schemas";
import crypto from "crypto";

// GROUP_KEYS: GROUPS tanımıyla senkron olmalı (StockScanner.tsx)
const GROUP_KEYS: Record<string, string[]> = {
  formasyon_bull: [
    "strong_up", "golden_cross", "tobo_break", "channel_break_up",
    "triangle_break_up", "trend_break_up", "ikili_dip_break",
    "price_desc_break", "hbreak", "fibo_setup",
    "supertrend_bull",
  ],
  rsi:      ["rsi_os", "rsi_asc_break", "rsi_tobo", "rsi_ob", "rsi_desc_break", "rsi_hdts", "rsi_pos_div"],
  macd:     ["macd_cross", "macd_bear", "macd_bull", "macd_neg", "macd_pos"],
  harmonik: ["harmonic_long", "harmonic_short"],
  hacim:    ["vol_spike", "bb_squeeze", "vol_dry"],
  trend:    ["supertrend", "supertrend_bull", "supertrend_bear"],
};

// Statik VALID_KEYS (yedek); dinamik doğrulama format ile yapılır
const STATIC_VALID_KEYS = new Set([...Object.keys(GROUP_KEYS), ...Object.values(GROUP_KEYS).flat()]);

function getUserFromToken(token: string, secret: string): { id: string; username: string } | null {
  const dot = token.lastIndexOf(".");
  if (dot === -1) return null;
  try {
    const payload = token.slice(0, dot);
    const sig = token.slice(dot + 1);
    // HMAC imzasını doğrula — atlayamazsın
    const expected = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
    if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) return null;
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

  const secret = process.env.SCAN_SESSION_SECRET;
  if (!secret) return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });

  const user = getUserFromToken(token, secret);
  if (!user) return NextResponse.json({ error: "Geçersiz token." }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from("scanner_users")
    .select("telegram_chat_id, alert_categories, alerts_enabled, plan, created_at")
    .eq("id", user.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Admin kontrolü: ADMIN_SCANNER_USERNAMES="user1,user2" şeklinde Railway'de set edilir
  const adminNames = (process.env.ADMIN_SCANNER_USERNAMES ?? "")
    .split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  const isAdmin = adminNames.length > 0 && adminNames.includes(user.username.toLowerCase());

  return NextResponse.json({
    username:        user.username,
    telegramChatId:  data?.telegram_chat_id  ?? "",
    alertCategories: data?.alert_categories  ?? [],
    alertsEnabled:   data?.alerts_enabled    ?? false,
    plan:            data?.plan              ?? "starter",
    isAdmin,
    createdAt:       data?.created_at        ?? null,
  });
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get("viewer_token")?.value;
  if (!token) return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });

  const secret = process.env.SCAN_SESSION_SECRET;
  if (!secret) return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });

  const user = getUserFromToken(token, secret);
  if (!user) return NextResponse.json({ error: "Geçersiz token." }, { status: 401 });

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const parsed = userProfileUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Geçersiz veri." }, { status: 422 });
  }

  const telegramChatId  = parsed.data.telegramChatId ?? "";
  const rawCategories   = parsed.data.alertCategories ?? [];

  // Dinamik doğrulama: scan_groups tablosundan geçerli anahtarları al
  // Tablo yoksa veya hata olursa statik listeye dön
  let validKeySet: Set<string> = STATIC_VALID_KEYS;
  try {
    const { data: groupRows } = await supabaseAdmin.from("scan_groups").select("keys");
    if (groupRows && groupRows.length > 0) {
      const dynamicKeys = groupRows.flatMap((g: { keys: { id: string }[] }) =>
        (g.keys ?? []).map((k) => k.id)
      );
      validKeySet = new Set([...dynamicKeys, ...STATIC_VALID_KEYS]);
    }
  } catch { /* use static fallback */ }

  const alertCategories = rawCategories.filter(
    (k) => typeof k === "string" && /^[a-z][a-z0-9_]{1,49}$/.test(k) && validKeySet.has(k)
  );
  const alertsEnabled = parsed.data.alertsEnabled ?? false;

  // Chat ID: rakam veya eksi+rakam (grup ID -100xxx gibi olabilir)
  if (telegramChatId && !/^-?\d{5,15}$/.test(telegramChatId)) {
    return NextResponse.json(
      { error: "Geçersiz Telegram Chat ID. Sadece rakamlardan oluşmalı." },
      { status: 400 }
    );
  }

  const { error } = await supabaseAdmin
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
