"use client";

import React, { useState, useEffect, useCallback } from "react";

// ── Tipler ────────────────────────────────────────────────────────────────────
interface StockRow {
  ticker: string;
  changePct?: number;
}

interface ScanCategory {
  key: string;
  label: string;
  emoji: string;
  count: number;
  stocks: StockRow[];
}

interface ScanGroup {
  id: string;
  label: string;
  emoji: string;
  color: string;
  keys: { id: string; label: string }[];
}

interface ScanData {
  lastRun: number | null;
  minutesAgo: number | null;
  categories: ScanCategory[];
}

// ── Orion teması renk haritası ───────────────────────────────────────────────
const THEME = {
  bg:          "#0b0e17",
  card:        "#131720",
  cardInner:   "#0f1219",
  border:      "rgba(255,255,255,0.08)",
  borderLight: "rgba(255,255,255,0.05)",
  text:        "#f0f4f8",
  textSub:     "#c8d0dc",
  textMuted:   "#6b7a99",
  green:       "#22c55e",
  greenBg:     "rgba(34,197,94,0.1)",
  greenBorder: "rgba(34,197,94,0.25)",
  red:         "#f87171",
  redBg:       "rgba(248,113,113,0.1)",
  redBorder:   "rgba(248,113,113,0.25)",
  accent:      "#60a5fa",
  accentBg:    "rgba(96,165,250,0.1)",
  font:        "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

const colors: Record<string, { bg: string; border: string; text: string; badge: string; ticker: string }> = {
  emerald: {
    bg:     THEME.greenBg,
    border: THEME.greenBorder,
    text:   THEME.green,
    badge:  "rgba(34,197,94,0.15)",
    ticker: "rgba(34,197,94,0.07)",
  },
  sky: {
    bg:     THEME.accentBg,
    border: "rgba(96,165,250,0.25)",
    text:   THEME.accent,
    badge:  "rgba(96,165,250,0.15)",
    ticker: "rgba(96,165,250,0.07)",
  },
  violet: {
    bg:     "rgba(167,139,250,0.08)",
    border: "rgba(167,139,250,0.25)",
    text:   "#a78bfa",
    badge:  "rgba(167,139,250,0.15)",
    ticker: "rgba(167,139,250,0.07)",
  },
  amber: {
    bg:     "rgba(251,191,36,0.08)",
    border: "rgba(251,191,36,0.25)",
    text:   "#fbbf24",
    badge:  "rgba(251,191,36,0.15)",
    ticker: "rgba(251,191,36,0.07)",
  },
  rose: {
    bg:     THEME.redBg,
    border: THEME.redBorder,
    text:   THEME.red,
    badge:  "rgba(248,113,113,0.15)",
    ticker: "rgba(248,113,113,0.07)",
  },
};

// Statik grup tanımları (DB'den gelmezse fallback)
const STATIC_GROUPS: ScanGroup[] = [
  {
    id: "formasyon_bull", label: "Bullish Formasyonlar", emoji: "📈", color: "emerald",
    keys: [
      { id: "strong_up", label: "Güçlü Yükseliş" },
      { id: "golden_cross", label: "Altın Kesişim" },
      { id: "tobo_break", label: "Ters Baş-Omuz" },
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
    id: "rsi", label: "RSI Analizleri", emoji: "📊", color: "sky",
    keys: [
      { id: "rsi_os", label: "Aşırı Satım (< 30)" },
      { id: "rsi_ob", label: "Aşırı Alım (> 70)" },
    ],
  },
  {
    id: "macd", label: "MACD Analizleri", emoji: "〰️", color: "violet",
    keys: [{ id: "macd_cross", label: "MACD Kesişim Yukarı" }],
  },
  {
    id: "harmonik", label: "Harmonik Formasyonlar", emoji: "🔷", color: "amber",
    keys: [
      { id: "harmonic_long", label: "Harmonik Long" },
      { id: "harmonic_short", label: "Harmonik Short" },
    ],
  },
  {
    id: "hacim", label: "Hacim & Göstergeler", emoji: "🔥", color: "rose",
    keys: [
      { id: "vol_spike", label: "Hacim Patlaması" },
      { id: "bb_squeeze", label: "Bollinger Sıkışması" },
    ],
  },
  {
    id: "bearish", label: "Satış Sinyalleri", emoji: "📉", color: "rose",
    keys: [
      { id: "death_cross", label: "Ölüm Kesişimi" },
      { id: "obo_break", label: "Baş-Omuz" },
      { id: "ikili_tepe_break", label: "İkili Tepe (M)" },
      { id: "rsi_desc_break", label: "RSI Düşen Trend Kırılım" },
    ],
  },
];

function timeAgoLabel(m: number | null): string {
  if (m === null) return "";
  if (m < 1) return "Az önce";
  if (m < 60) return `${m} dk önce`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem > 0 ? `${h} sa ${rem} dk önce` : `${h} sa önce`;
}

// ── Tek kategori satırı ────────────────────────────────────────────────────────
function CategoryRow({ cat, c }: { cat: ScanCategory; c: typeof colors.emerald }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{
      borderRadius: 8,
      border: `1px solid ${THEME.border}`,
      overflow: "hidden",
      marginBottom: 4,
    }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "9px 14px",
          background: THEME.cardInner,
          color: THEME.text,
          fontFamily: THEME.font,
          cursor: "pointer",
          border: "none",
          borderLeft: `3px solid ${c.border}`,
          textAlign: "left",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 500, letterSpacing: "0.01em" }}>
          <span style={{ fontSize: 14 }}>{cat.emoji}</span>
          <span style={{ color: THEME.textSub }}>{cat.label}</span>
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: "2px 9px",
              borderRadius: 999,
              background: cat.count > 0 ? c.badge : "rgba(255,255,255,0.04)",
              color: cat.count > 0 ? c.text : THEME.textMuted,
              letterSpacing: "0.02em",
            }}
          >
            {cat.count}
          </span>
          <span style={{ color: THEME.textMuted, fontSize: 10 }}>{open ? "▲" : "▼"}</span>
        </span>
      </button>

      {open && (
        <div style={{ padding: "8px 14px 12px", borderTop: `1px solid ${THEME.borderLight}`, background: THEME.bg }}>
          {(cat.stocks ?? []).length === 0 ? (
            <p style={{ fontSize: 12, color: THEME.textMuted, fontStyle: "italic", marginTop: 6 }}>
              Sinyal bulunamadı.
            </p>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 8 }}>
              {cat.stocks.map((row) => {
                const ticker = typeof row === "string" ? row : row.ticker;
                const change = typeof row === "object" ? row.changePct : undefined;
                return (
                  <a
                    key={ticker}
                    href={`https://tr.tradingview.com/chart/?symbol=BIST%3A${ticker}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      fontSize: 12,
                      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                      fontWeight: 700,
                      padding: "4px 10px",
                      borderRadius: 6,
                      border: `1px solid ${c.border}`,
                      background: c.ticker,
                      color: c.text,
                      textDecoration: "none",
                      letterSpacing: "0.03em",
                    }}
                  >
                    {ticker}
                    {change !== undefined && (
                      <span style={{ fontSize: 10, fontWeight: 500, color: change >= 0 ? THEME.green : THEME.red }}>
                        {change >= 0 ? "+" : ""}{change.toFixed(1)}%
                      </span>
                    )}
                  </a>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Grup bloğu ─────────────────────────────────────────────────────────────────
function GroupBlock({ group, cats }: { group: ScanGroup; cats: ScanCategory[] }) {
  const [collapsed, setCollapsed] = useState(true);
  const c = colors[group.color] ?? colors.emerald;
  const total = cats.reduce((a, cat) => a + cat.count, 0);

  return (
    <div style={{
      borderRadius: 10,
      border: `1px solid ${THEME.border}`,
      overflow: "hidden",
      marginBottom: 8,
    }}>
      <button
        onClick={() => setCollapsed((v) => !v)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "13px 18px",
          background: THEME.card,
          color: THEME.text,
          fontFamily: THEME.font,
          cursor: "pointer",
          border: "none",
          borderLeft: `4px solid ${c.text}`,
          textAlign: "left",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 17 }}>{group.emoji}</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: THEME.text, letterSpacing: "0.01em" }}>{group.label}</span>
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{
            fontSize: 13,
            fontWeight: 800,
            padding: "3px 11px",
            borderRadius: 999,
            background: c.badge,
            color: c.text,
            letterSpacing: "0.02em",
          }}>{total}</span>
          <span style={{ color: THEME.textMuted, fontSize: 11 }}>{collapsed ? "▼" : "▲"}</span>
        </span>
      </button>

      {!collapsed && (
        <div style={{ padding: "8px 10px 10px", background: THEME.bg, borderTop: `1px solid ${THEME.borderLight}` }}>
          {cats.length === 0 ? (
            <p style={{ fontSize: 12, color: THEME.textMuted, fontStyle: "italic", padding: "6px 4px" }}>
              Bu grupta sinyal yok.
            </p>
          ) : (
            cats.map((cat) => <CategoryRow key={cat.key} cat={cat} c={c} />)
          )}
        </div>
      )}
    </div>
  );
}

// ── Ana bileşen ────────────────────────────────────────────────────────────────
export default function EmbedScanClient({ embedKey }: { embedKey: string }) {
  const [data, setData] = useState<ScanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/embed/scan?key=${encodeURIComponent(embedKey)}`, { cache: "no-store" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      setData(await res.json());
      setLastRefresh(new Date());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Bilinmeyen hata");
    } finally {
      setLoading(false);
    }
  }, [embedKey]);

  useEffect(() => {
    load();
    const id = setInterval(load, 5 * 60 * 1000); // 5 dakikada bir yenile
    return () => clearInterval(id);
  }, [load]);

  // Grupları hazırla
  const groupedData = STATIC_GROUPS.map((group) => ({
    group,
    cats: (data?.categories ?? [])
      .filter((c) => group.keys.some((k) => k.id === c.key))
      .sort((a, b) => {
        const ai = group.keys.findIndex((k) => k.id === a.key);
        const bi = group.keys.findIndex((k) => k.id === b.key);
        return ai - bi;
      }),
  }));

  return (
    <div style={{ padding: "14px 16px", maxWidth: 820, margin: "0 auto", fontFamily: THEME.font }}>
      {/* Başlık */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 14,
          paddingBottom: 12,
          borderBottom: `1px solid ${THEME.border}`,
        }}
      >
        <div>
          <h1 style={{ fontSize: 15, fontWeight: 700, color: THEME.text, margin: 0, letterSpacing: "0.01em" }}>
            📡 BIST Teknik Analiz Taraması
          </h1>
          {data?.minutesAgo !== undefined && data?.minutesAgo !== null && (
            <p style={{ fontSize: 11, color: THEME.textMuted, margin: "3px 0 0", letterSpacing: "0.01em" }}>
              Son tarama: {timeAgoLabel(data.minutesAgo)}
            </p>
          )}
        </div>
        <button
          onClick={load}
          disabled={loading}
          style={{
            fontSize: 12,
            fontFamily: THEME.font,
            fontWeight: 500,
            padding: "6px 14px",
            borderRadius: 7,
            border: `1px solid ${THEME.border}`,
            background: THEME.card,
            color: loading ? THEME.textMuted : THEME.textSub,
            cursor: loading ? "default" : "pointer",
            letterSpacing: "0.02em",
          }}
        >
          {loading ? "⟳ Yükleniyor..." : "⟳ Yenile"}
        </button>
      </div>

      {/* İçerik */}
      {loading && !data && (
        <div style={{ textAlign: "center", padding: "40px 0", color: "#475569" }}>
          <p style={{ fontSize: 13 }}>Tarama verileri yükleniyor...</p>
        </div>
      )}

      {error && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: 10,
            background: THEME.redBg,
            border: `1px solid ${THEME.redBorder}`,
            color: "#fca5a5",
            fontSize: 13,
            marginBottom: 16,
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {data && (
        <div>
          {groupedData.map(({ group, cats }) => (
            <GroupBlock key={group.id} group={group} cats={cats} />
          ))}
        </div>
      )}

      {/* Footer */}
      <div style={{ marginTop: 16, paddingTop: 10, borderTop: `1px solid ${THEME.borderLight}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <a
          href="https://recepdemirborsa.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: 11, color: THEME.textMuted }}
        >
          recepdemirborsa.com
        </a>
        {lastRefresh && (
          <span style={{ fontSize: 11, color: THEME.textMuted }}>
            {lastRefresh.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })} güncellendi
          </span>
        )}
      </div>
    </div>
  );
}
