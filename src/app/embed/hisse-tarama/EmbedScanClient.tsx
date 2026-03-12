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

// ── Renk haritası ──────────────────────────────────────────────────────────────
const colors: Record<string, { bg: string; border: string; text: string; badge: string; ticker: string }> = {
  emerald: {
    bg: "rgba(6,78,59,0.15)",
    border: "rgba(6,78,59,0.5)",
    text: "#34d399",
    badge: "rgba(6,78,59,0.6)",
    ticker: "rgba(6,78,59,0.3)",
  },
  sky: {
    bg: "rgba(8,47,73,0.15)",
    border: "rgba(8,47,73,0.5)",
    text: "#38bdf8",
    badge: "rgba(8,47,73,0.6)",
    ticker: "rgba(8,47,73,0.3)",
  },
  violet: {
    bg: "rgba(46,16,101,0.15)",
    border: "rgba(46,16,101,0.5)",
    text: "#a78bfa",
    badge: "rgba(46,16,101,0.6)",
    ticker: "rgba(46,16,101,0.3)",
  },
  amber: {
    bg: "rgba(78,50,0,0.15)",
    border: "rgba(78,50,0,0.5)",
    text: "#fbbf24",
    badge: "rgba(78,50,0,0.6)",
    ticker: "rgba(78,50,0,0.3)",
  },
  rose: {
    bg: "rgba(76,5,25,0.15)",
    border: "rgba(76,5,25,0.5)",
    text: "#fb7185",
    badge: "rgba(76,5,25,0.6)",
    ticker: "rgba(76,5,25,0.3)",
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
    <div style={{ borderRadius: 10, border: `1px solid ${c.border}`, overflow: "hidden", marginBottom: 6 }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 14px",
          background: "transparent",
          color: "#e2e8f0",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600 }}>
          <span>{cat.emoji}</span>
          <span>{cat.label}</span>
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: "2px 8px",
              borderRadius: 999,
              background: cat.count > 0 ? c.badge : "rgba(51,65,85,0.8)",
              color: cat.count > 0 ? c.text : "#64748b",
            }}
          >
            {cat.count}
          </span>
          <span style={{ color: "#64748b", fontSize: 12 }}>{open ? "▲" : "▼"}</span>
        </span>
      </button>

      {open && (
        <div style={{ padding: "0 14px 12px", borderTop: `1px solid ${c.border}` }}>
          {(cat.stocks ?? []).length === 0 ? (
            <p style={{ fontSize: 12, color: "#475569", fontStyle: "italic", marginTop: 8 }}>
              Sinyal bulunamadı.
            </p>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
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
                      gap: 4,
                      fontSize: 12,
                      fontFamily: "monospace",
                      fontWeight: 700,
                      padding: "4px 10px",
                      borderRadius: 8,
                      border: `1px solid ${c.border}`,
                      background: c.ticker,
                      color: c.text,
                    }}
                  >
                    {ticker}
                    {change !== undefined && (
                      <span style={{ fontSize: 10, fontWeight: 400, color: change >= 0 ? "#34d399" : "#fb7185" }}>
                        {change >= 0 ? "+" : ""}{change.toFixed(1)}%
                      </span>
                    )}
                    <span style={{ fontSize: 10, opacity: 0.5 }}>↗</span>
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
  const [collapsed, setCollapsed] = useState(false);
  const c = colors[group.color] ?? colors.emerald;
  const total = cats.reduce((a, cat) => a + cat.count, 0);

  return (
    <div style={{ borderRadius: 14, border: `1px solid ${c.border}`, overflow: "hidden", marginBottom: 12 }}>
      <button
        onClick={() => setCollapsed((v) => !v)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 18px",
          background: c.bg,
          color: "#e2e8f0",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18 }}>{group.emoji}</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: c.text }}>{group.label}</span>
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18, fontWeight: 900, color: c.text }}>{total}</span>
          <span style={{ color: "#64748b", fontSize: 12 }}>{collapsed ? "▼" : "▲"}</span>
        </span>
      </button>

      {!collapsed && (
        <div style={{ padding: "10px 12px", background: c.bg }}>
          {cats.length === 0 ? (
            <p style={{ fontSize: 12, color: "#475569", fontStyle: "italic", padding: "4px 2px" }}>
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
    <div style={{ padding: "12px 14px", maxWidth: 800, margin: "0 auto" }}>
      {/* Başlık */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
          paddingBottom: 12,
          borderBottom: "1px solid rgba(51,65,85,0.5)",
        }}
      >
        <div>
          <h1 style={{ fontSize: 16, fontWeight: 800, color: "#f1f5f9", margin: 0 }}>
            📡 BIST Teknik Analiz Taraması
          </h1>
          {data?.minutesAgo !== undefined && data?.minutesAgo !== null && (
            <p style={{ fontSize: 11, color: "#64748b", margin: "2px 0 0" }}>
              Son tarama: {timeAgoLabel(data.minutesAgo)}
            </p>
          )}
        </div>
        <button
          onClick={load}
          disabled={loading}
          style={{
            fontSize: 12,
            padding: "6px 12px",
            borderRadius: 8,
            border: "1px solid rgba(51,65,85,0.7)",
            background: "rgba(15,23,42,0.8)",
            color: loading ? "#475569" : "#94a3b8",
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
            background: "rgba(76,5,25,0.2)",
            border: "1px solid rgba(76,5,25,0.5)",
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
      <div style={{ marginTop: 16, paddingTop: 10, borderTop: "1px solid rgba(51,65,85,0.3)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <a
          href="https://recepdemirborsa.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: 11, color: "#334155" }}
        >
          recepdemirborsa.com
        </a>
        {lastRefresh && (
          <span style={{ fontSize: 11, color: "#334155" }}>
            {lastRefresh.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })} güncellendi
          </span>
        )}
      </div>
    </div>
  );
}
