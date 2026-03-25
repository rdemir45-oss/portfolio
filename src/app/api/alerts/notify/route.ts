import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const SCAN_API_KEY        = process.env.SCAN_API_KEY ?? "";
const TELEGRAM_BOT_TOKEN  = process.env.TELEGRAM_BOT_TOKEN ?? "";
const WEBSITE_URL         = process.env.NEXT_PUBLIC_WEBSITE_URL ?? "";

// GROUP_KEYS: kullanıcılar grup ID'si seçiyor, bireysel key ile de eşleşir
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

interface StockRow {
  ticker: string;
  changePct?: number;
  price?: number;
}

interface CategoryResult {
  key: string;
  label: string;
  emoji: string;
  stocks: StockRow[];
}

function userMatchesCategory(userCats: string[], catKey: string): boolean {
  for (const uc of userCats) {
    if (uc === catKey) return true;
    if (GROUP_KEYS[uc]?.includes(catKey)) return true;
  }
  return false;
}

async function sendTelegramMessage(chatId: string, text: string): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN) return false;
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
      }
    );
    return res.ok;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get("X-API-Key") ?? "";
  if (!SCAN_API_KEY || apiKey !== SCAN_API_KEY) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }

  // Rate limit: Scan API'den saniyede 2'den fazla çağrı gelmemeli
  // SCAN_API_KEY sızsa bile toplu spam önlenir
  const ip = getClientIp(req);
  const rl = await rateLimit(`alerts-notify:${ip}`, { limit: 10, windowSec: 60 });
  if (!rl.success) {
    return NextResponse.json({ error: "Çok fazla bildirim isteği." }, { status: 429 });
  }

  let body: { categories?: CategoryResult[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const categories       = body.categories ?? [];
  const activeCategories = categories.filter((c) => c.stocks && c.stocks.length > 0);

  if (activeCategories.length === 0) {
    return NextResponse.json({ ok: true, sent: 0 });
  }

  const { data: users, error } = await supabaseAdmin
    .from("scanner_users")
    .select("telegram_chat_id, alert_categories")
    .eq("status", "approved")
    .eq("alerts_enabled", true)
    .not("telegram_chat_id", "is", null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!users || users.length === 0) {
    return NextResponse.json({ ok: true, sent: 0 });
  }

  const now = new Date().toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Istanbul",
  });

  let sentCount = 0;

  for (const user of users) {
    if (!user.telegram_chat_id) continue;
    const userCats: string[] = user.alert_categories ?? [];

    const matching = activeCategories.filter((c) =>
      userMatchesCategory(userCats, c.key)
    );
    if (matching.length === 0) continue;

    const lines: string[] = [`🔔 <b>Tarama Sinyalleri</b> (${now})\n`];

    for (const cat of matching) {
      lines.push(`${cat.emoji} <b>${cat.label}</b>`);
      const topStocks = cat.stocks.slice(0, 10);
      lines.push(
        topStocks
          .map((s: StockRow) => {
            const pct =
              s.changePct != null
                ? ` ${s.changePct > 0 ? "+" : ""}${s.changePct.toFixed(1)}%`
                : "";
            return `  • ${s.ticker}${pct}`;
          })
          .join("\n")
      );
      lines.push("");
    }

    const detailUrl = WEBSITE_URL
      ? `${WEBSITE_URL}/hisse-teknik-analizi`
      : "https://thebigshort.app/hisse-teknik-analizi";
    lines.push(`<a href="${detailUrl}">🔗 Detayları Gör</a>`);

    const sent = await sendTelegramMessage(
      user.telegram_chat_id,
      lines.join("\n")
    );
    if (sent) sentCount++;
  }

  return NextResponse.json({ ok: true, sent: sentCount });
}
