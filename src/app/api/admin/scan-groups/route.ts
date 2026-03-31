import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { isAdmin } from "@/lib/admin-auth";

const UNAUTHORIZED = NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });

const VALID_COLORS = ["emerald", "sky", "violet", "amber", "rose"];

const DEFAULT_GROUPS = [
  {
    id: "formasyon_bull",
    label: "Bullish Formasyonlar",
    description: "Yukarı kırılım ve tersine dönüş formasyonları",
    emoji: "📈",
    icon: "candle",
    color: "emerald",
    display_order: 0,
    is_bull: true,
    keys: [
      { id: "strong_up", label: "Güçlü Yükseliş" },
      { id: "golden_cross", label: "Altın Kesişim" },
      { id: "tobo_break", label: "TOBO (Ters Baş-Omuz)" },
      { id: "channel_break", label: "Kanal Kırılımı" },
      { id: "triangle_break", label: "Üçgen Kırılımı" },
      { id: "trend_break", label: "Trend Kırılımı" },
      { id: "ikili_dip_break", label: "İkili Dip (W)" },
      { id: "price_desc_break", label: "Düşen Trend Kırılımı" },
      { id: "hbreak", label: "Yatay Direnç Kırılımı" },
      { id: "fibo_setup", label: "Fibonacci Setup" },
      { id: "rsi_asc_break", label: "RSI Alt Trend Kırılım" },
      { id: "rsi_tobo", label: "RSI TOBO" },
      { id: "rsi_pos_div", label: "RSI Pozitif Uyumsuzluk" },
    ],
  },
  {
    id: "rsi",
    label: "RSI Analizleri",
    description: "Aşırı alım/satım sinyalleri",
    emoji: "📊",
    icon: "activity",
    color: "sky",
    display_order: 1,
    is_bull: true,
    keys: [
      { id: "rsi_os", label: "Aşırı Satım (< 30)" },
      { id: "rsi_ob", label: "Aşırı Alım (> 70)" },
    ],
  },
  {
    id: "macd",
    label: "MACD Analizleri",
    description: "MACD kesişim sinyali",
    emoji: "〰️",
    icon: "wave",
    color: "violet",
    display_order: 2,
    is_bull: true,
    keys: [{ id: "macd_cross", label: "MACD Kesişim Yukarı" }],
  },
  {
    id: "harmonik",
    label: "Harmonik Formasyonlar",
    description: "Fibonacci bazlı harmonik fiyat desenleri",
    emoji: "🔷",
    icon: "triangle",
    color: "amber",
    display_order: 3,
    is_bull: true,
    keys: [
      { id: "harmonic_long", label: "Harmonik Long" },
      { id: "harmonic_short", label: "Harmonik Short" },
    ],
  },
  {
    id: "hacim",
    label: "Hacim & Göstergeler",
    description: "Hacim artışları ve sıkışma sinyalleri",
    emoji: "🔥",
    icon: "bar",
    color: "rose",
    display_order: 4,
    is_bull: true,
    keys: [
      { id: "vol_spike", label: "Hacim Patlaması" },
      { id: "bb_squeeze", label: "Bollinger Sıkışması" },
    ],
  },
  {
    id: "bearish",
    label: "Satış Sinyalleri",
    description: "Aşağı kırılım ve tersine dönüş formasyonları",
    emoji: "📉",
    icon: "trending_down",
    color: "rose",
    display_order: 5,
    is_bull: false,
    keys: [
      { id: "death_cross", label: "Ölüm Kesişimi" },
      { id: "obo_break", label: "OBO (Baş-Omuz)" },
      { id: "ikili_tepe_break", label: "İkili Tepe (M)" },
      { id: "rsi_desc_break", label: "RSI Düşen Trend Kırılım" },
    ],
  },
];

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return UNAUTHORIZED;

  const { data, error } = await supabaseAdmin
    .from("scan_groups")
    .select("*")
    .order("display_order", { ascending: true });

  if (error) return NextResponse.json({ error: "Veri alınamadı." }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return UNAUTHORIZED;

  const url = req.nextUrl;

  // Seed endpoint: POST /api/admin/scan-groups?seed=1
  if (url.searchParams.get("seed") === "1") {
    const results = await Promise.all(
      DEFAULT_GROUPS.map((g) =>
        supabaseAdmin.from("scan_groups").upsert(g, { onConflict: "id" })
      )
    );
    const errors = results.filter((r) => r.error).map((r) => r.error!.message);
    if (errors.length > 0)
      return NextResponse.json({ error: errors.join("; ") }, { status: 500 });
    return NextResponse.json({ ok: true, count: DEFAULT_GROUPS.length });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const { id, label, description, emoji, icon, color, keys, display_order, is_bull } = body as Record<string, unknown>;

  if (!id || typeof id !== "string" || !label || typeof label !== "string") {
    return NextResponse.json({ error: "id ve label zorunludur." }, { status: 400 });
  }
  if (!/^[a-z][a-z0-9_]{0,49}$/.test(id)) {
    return NextResponse.json({ error: "id: küçük harf, rakam ve alt çizgi içerebilir." }, { status: 400 });
  }
  if (color && !VALID_COLORS.includes(color as string)) {
    return NextResponse.json({ error: "Geçersiz renk." }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from("scan_groups").insert({
    id,
    label,
    description: description ?? "",
    emoji: emoji ?? "📊",
    icon: icon ?? "chart",
    color: color ?? "emerald",
    keys: Array.isArray(keys) ? keys : [],
    display_order: typeof display_order === "number" ? display_order : 0,
    is_bull: is_bull !== undefined ? Boolean(is_bull) : true,
  });

  if (error) return NextResponse.json({ error: "Kayıt oluşturulamadı." }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest) {
  if (!isAdmin(req)) return UNAUTHORIZED;

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id gerekli." }, { status: 400 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (body.label !== undefined) updates.label = String(body.label);
  if (body.description !== undefined) updates.description = String(body.description);
  if (body.emoji !== undefined) updates.emoji = String(body.emoji);
  if (body.icon !== undefined) updates.icon = String(body.icon);
  if (body.color !== undefined) {
    if (!VALID_COLORS.includes(body.color as string))
      return NextResponse.json({ error: "Geçersiz renk." }, { status: 400 });
    updates.color = body.color;
  }
  if (body.keys !== undefined && Array.isArray(body.keys)) updates.keys = body.keys;
  if (body.display_order !== undefined) updates.display_order = Number(body.display_order);
  if (body.is_bull !== undefined) updates.is_bull = Boolean(body.is_bull);

  const { error } = await supabaseAdmin.from("scan_groups").update(updates).eq("id", id);
  if (error) return NextResponse.json({ error: "Güncelleme başarısız." }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  if (!isAdmin(req)) return UNAUTHORIZED;

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id gerekli." }, { status: 400 });

  const { error } = await supabaseAdmin.from("scan_groups").delete().eq("id", id);
  if (error) return NextResponse.json({ error: "Silme işlemi başarısız." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
