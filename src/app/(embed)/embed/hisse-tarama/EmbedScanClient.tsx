"use client";

import React, { useState, useEffect, useCallback } from "react";

interface StockRow { ticker: string; changePct?: number; }
interface ScanCategory { key: string; label: string; emoji: string; count: number; stocks: StockRow[]; }
interface GroupDef { id: string; label: string; emoji: string; color: "emerald" | "sky" | "violet" | "amber" | "rose"; keys: string[]; }
interface ScanData { lastRun: number | null; minutesAgo: number | null; categories: ScanCategory[]; groups?: DbGroupDef[]; }
interface DbGroupDef { id: string; label: string; emoji: string; color: string; keys: { id: string; label: string }[]; is_bull: boolean; }
interface FlatItem { ticker: string; changePct?: number; }

// ── Renk haritası ─────────────────────────────────────────────────────────────
const colorMap = {
  emerald: { border: "border-emerald-800/50", headerBg: "bg-emerald-950/30", icon: "text-emerald-400 bg-emerald-950/50 border-emerald-900/50", badge: "bg-emerald-800/60 text-emerald-300", ticker: "border-emerald-700/50 text-emerald-400 hover:bg-emerald-900/40 bg-emerald-950/30", label: "text-emerald-400", sidebarActive: "bg-emerald-950/50 border border-emerald-700/60 text-emerald-300" },
  sky:     { border: "border-sky-800/50",     headerBg: "bg-sky-950/30",     icon: "text-sky-400 bg-sky-950/50 border-sky-900/50",         badge: "bg-sky-800/60 text-sky-300",         ticker: "border-sky-700/50 text-sky-400 hover:bg-sky-900/40 bg-sky-950/30",         label: "text-sky-400",     sidebarActive: "bg-sky-950/50 border border-sky-700/60 text-sky-300" },
  violet:  { border: "border-violet-800/50",  headerBg: "bg-violet-950/30",  icon: "text-violet-400 bg-violet-950/50 border-violet-900/50", badge: "bg-violet-800/60 text-violet-300", ticker: "border-violet-700/50 text-violet-400 hover:bg-violet-900/40 bg-violet-950/30", label: "text-violet-400", sidebarActive: "bg-violet-950/50 border border-violet-700/60 text-violet-300" },
  amber:   { border: "border-amber-800/50",   headerBg: "bg-amber-950/30",   icon: "text-amber-400 bg-amber-950/50 border-amber-900/50",   badge: "bg-amber-800/60 text-amber-300",   ticker: "border-amber-700/50 text-amber-400 hover:bg-amber-900/40 bg-amber-950/30",   label: "text-amber-400",   sidebarActive: "bg-amber-950/50 border border-amber-700/60 text-amber-300" },
  rose:    { border: "border-rose-800/50",    headerBg: "bg-rose-950/30",    icon: "text-rose-400 bg-rose-950/50 border-rose-900/50",     badge: "bg-rose-800/60 text-rose-300",     ticker: "border-rose-700/50 text-rose-400 hover:bg-rose-900/40 bg-rose-950/30",     label: "text-rose-400",   sidebarActive: "bg-rose-950/50 border border-rose-700/60 text-rose-900" },
};

// ── Statik grup tanımları ─────────────────────────────────────────────────────
const GROUPS: GroupDef[] = [
  { id: "formasyon_bull", label: "Bullish Form.", emoji: "📈", color: "emerald", keys: ["strong_up","golden_cross","tobo_break","channel_break","triangle_break_up","trend_break","ikili_dip_break","price_desc_break","hbreak","fibo_setup","rsi_asc_break","rsi_tobo","rsi_pos_div"] },
  { id: "rsi",      label: "RSI",       emoji: "📊", color: "sky",    keys: ["rsi_os","rsi_ob"] },
  { id: "macd",     label: "MACD",      emoji: "〰️", color: "violet", keys: ["macd_cross"] },
  { id: "harmonik", label: "Harmonik",  emoji: "🔷", color: "amber",  keys: ["harmonic_long","harmonic_short"] },
  { id: "hacim",    label: "Hacim",     emoji: "🔥", color: "rose",   keys: ["vol_spike","bb_squeeze"] },
  { id: "stochrsi", label: "Stoch RSI", emoji: "📉", color: "sky",    keys: ["stoch_rsi_os","stoch_rsi_crossup"] },
  { id: "bearish",  label: "Bearish",   emoji: "📉", color: "rose",   keys: ["death_cross","obo_break","ikili_tepe_break","rsi_desc_break","triangle_break_down"] },
];

const BULL_KEYS = new Set([
  "rsi_os","vol_spike","macd_cross","bb_squeeze","strong_up","golden_cross","tobo_break",
  "channel_break","triangle_break_up","trend_break","ikili_dip_break","fibo_setup",
  "rsi_asc_break","rsi_tobo","hbreak","price_desc_break","harmonic_long","rsi_pos_div",
  "stoch_rsi_os","stoch_rsi_crossup",
]);

const REVERSAL_KEYS = new Set(["ikili_dip_break","harmonic_long"]);

function timeAgoLabel(m: number | null): string {
  if (m === null) return "";
  if (m < 1) return "Az önce";
  if (m < 60) return `${m} dk önce`;
  const h = Math.floor(m / 60), rem = m % 60;
  return rem > 0 ? `${h} sa ${rem} dk` : `${h} sa`;
}

const PAGE_SIZE = 24;

// ── Ana bileşen ────────────────────────────────────────────────────────────────
export default function EmbedScanClient() {
  const [data, setData]             = useState<ScanData | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [page, setPage]             = useState(0);

  // Sayfa sıfırla: grup değişince en başa dön
  useEffect(() => { setPage(0); }, [selectedId]);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/embed/scan", { cache: "no-store" });
      if (!res.ok) { const j = await res.json().catch(() => ({})); throw new Error(j.error ?? `HTTP ${res.status}`); }
      setData(await res.json());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Bilinmeyen hata");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [load]);

  const allCats = data?.categories ?? [];
  const VALID_COLORS = new Set(["emerald", "sky", "violet", "amber", "rose"]);
  const activeGroups: GroupDef[] = (data?.groups && data.groups.length > 0)
    ? data.groups.map((g) => ({
        id: g.id, label: g.label, emoji: g.emoji,
        color: (VALID_COLORS.has(g.color) ? g.color : "emerald") as GroupDef["color"],
        keys: g.keys.map((k) => k.id),
      }))
    : GROUPS;

  const effectiveSelected  = selectedId ?? (activeGroups[0]?.id ?? null);

  const activeBullKeys: Set<string> = (data?.groups && data.groups.length > 0)
    ? new Set(data.groups.filter((g) => g.is_bull).flatMap((g) => g.keys.map((k) => k.id)))
    : BULL_KEYS;
  const activeReversalKeys: Set<string> = (data?.groups && data.groups.length > 0) ? new Set() : REVERSAL_KEYS;

  const groupedData = activeGroups.map((group) => ({
    group,
    cats: allCats
      .filter((c) => group.keys.includes(c.key))
      .sort((a, b) => group.keys.indexOf(a.key) - group.keys.indexOf(b.key)),
  }));

  const selectedGroupData = groupedData.find((g) => g.group.id === effectiveSelected) ?? groupedData[0] ?? null;

  // Tüm hisseleri düzleştir + tekrar edenleri at
  const seen = new Set<string>();
  const uniqueItems: FlatItem[] = (selectedGroupData?.cats ?? [])
    .flatMap((cat) => cat.stocks.map((s) => ({ ticker: s.ticker, changePct: s.changePct })))
    .filter((item) => { if (seen.has(item.ticker)) return false; seen.add(item.ticker); return true; });

  const totalPages = Math.max(1, Math.ceil(uniqueItems.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages - 1);
  const pageItems  = uniqueItems.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  // İstatistikler
  const totalSignals    = allCats.reduce((a, c) => a + c.count, 0);
  const reversalSignals = allCats.filter((c) => activeReversalKeys.has(c.key)).reduce((a, c) => a + c.count, 0);
  const bullRaw         = allCats.filter((c) => activeBullKeys.has(c.key)).reduce((a, c) => a + c.count, 0);
  const bullSignals     = bullRaw - reversalSignals;
  const bearSignals     = allCats.filter((c) => !activeBullKeys.has(c.key) || c.key === "harmonic_short").reduce((a, c) => a + c.count, 0);
  const donusSignals    = allCats.filter((c) => activeReversalKeys.has(c.key)).reduce((a, c) => a + c.count, 0);

  return (
    <div className="bg-[#080a0c] text-slate-200 p-3" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Başlık */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
        <div>
          <p className="text-[10px] font-semibold tracking-widest text-[#dc2626] uppercase">RdAlgo • BIST Tarama</p>
          {data?.minutesAgo !== null && data?.minutesAgo !== undefined && (
            <p className="text-[11px] text-slate-600 mt-0.5">Son tarama: {timeAgoLabel(data.minutesAgo)}</p>
          )}
        </div>
        <button
          onClick={load} disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:border-red-700 transition-colors text-xs disabled:opacity-40"
        >
          <span className={loading ? "animate-spin inline-block" : ""}>⟳</span>
          {loading ? "Yükleniyor" : "Yenile"}
        </button>
      </div>

      {/* İstatistik şeridi */}
      {data && !loading && (
        <div className="mb-4 grid grid-cols-5 gap-1.5">
          <div className="bg-[#111115] border border-slate-800 rounded-xl p-2 flex flex-col items-center gap-1">
            <p className="text-base font-black text-white">{totalSignals}</p>
            <p className="text-[9px] text-slate-600 uppercase tracking-wide">Toplam</p>
          </div>
          <div className="bg-emerald-950/30 border border-emerald-900/50 rounded-xl p-2 flex flex-col items-center gap-1">
            <p className="text-base font-black text-emerald-400">{bullSignals}</p>
            <p className="text-[9px] text-emerald-700 uppercase tracking-wide">Bullish</p>
          </div>
          <div className="bg-rose-950/20 border border-rose-900/40 rounded-xl p-2 flex flex-col items-center gap-1">
            <p className="text-base font-black text-rose-400">{bearSignals}</p>
            <p className="text-[9px] text-rose-700 uppercase tracking-wide">Bearish</p>
          </div>
          <div className="bg-violet-950/20 border border-violet-900/40 rounded-xl p-2 flex flex-col items-center gap-1">
            <p className="text-base font-black text-violet-400">{donusSignals}</p>
            <p className="text-[9px] text-violet-700 uppercase tracking-wide">Dönüş</p>
          </div>
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-2 flex flex-col justify-center gap-1.5">
            <div className="flex justify-between text-[9px]">
              <span className="text-emerald-500 font-semibold">B {totalSignals > 0 ? Math.round((bullRaw / totalSignals) * 100) : 0}%</span>
              <span className="text-rose-500 font-semibold">S {totalSignals > 0 ? Math.round((bearSignals / totalSignals) * 100) : 0}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-rose-950/60 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-700"
                style={{ width: totalSignals > 0 ? `${Math.round((bullRaw / totalSignals) * 100)}%` : "50%" }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Hata */}
      {error && (
        <div className="rounded-xl border border-rose-900/50 bg-rose-950/20 p-4 text-center mb-4">
          <p className="text-rose-400 text-sm">⚠️ {error}</p>
          <button onClick={load} className="text-xs text-emerald-400 hover:underline mt-2">Tekrar dene</button>
        </div>
      )}

      {/* Skeleton */}
      {loading && !data && (
        <div className="space-y-2">
          <div className="h-10 rounded-xl bg-slate-800/40 animate-pulse mb-3" />
          <div className="grid grid-cols-6 gap-1.5">
            {Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <div key={i} className="h-9 rounded-lg bg-slate-800/30 animate-pulse" />
            ))}
          </div>
        </div>
      )}

      {/* Tab bar + Izgara + Sayfalama */}
      {!loading && !error && data && (
        <div>
          {/* Yatay kaydırılabilir grup sekmeleri */}
          <div className="overflow-x-auto mb-3" style={{ scrollbarWidth: "none" }}>
            <div className="flex gap-1.5 pb-1 min-w-max">
              {groupedData.map(({ group, cats }) => {
                const total   = cats.reduce((a, c) => a + c.count, 0);
                const isActive = effectiveSelected === group.id;
                const c = colorMap[group.color];
                return (
                  <button
                    key={group.id}
                    onClick={() => setSelectedId(group.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all whitespace-nowrap ${
                      isActive
                        ? c.sidebarActive
                        : "border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-400"
                    }`}
                  >
                    <span>{group.emoji}</span>
                    <span>{group.label}</span>
                    <span className={`text-[10px] font-black px-1 rounded-full ${
                      total > 0
                        ? isActive ? c.badge : "bg-slate-800 text-slate-500"
                        : "text-slate-700"
                    }`}>{total}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {uniqueItems.length === 0 ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900/20 p-6 text-center">
              <p className="text-slate-600 text-sm">Bu grupta sinyal bulunamadı.</p>
            </div>
          ) : (
            <>
              {/* Sabit 6×4 ızgara */}
              <div className="grid grid-cols-6 gap-1">
                {Array.from({ length: PAGE_SIZE }).map((_, i) => {
                  const item = pageItems[i];
                  if (!item) return <div key={i} className="h-9" />;
                  const positive = (item.changePct ?? 0) >= 0;
                  return (
                    <a
                      key={item.ticker}
                      href={`https://tr.tradingview.com/chart/?symbol=BIST%3A${item.ticker}`}
                      target="_blank" rel="noopener noreferrer"
                      className="h-9 flex flex-col items-center justify-center rounded-lg border border-slate-800 hover:border-slate-600 bg-slate-900/30 hover:bg-slate-800/40 transition-colors"
                    >
                      <span className="text-[11px] font-bold font-mono text-slate-200 leading-tight">{item.ticker}</span>
                      {item.changePct !== undefined && (
                        <span className={`text-[9px] leading-tight ${positive ? "text-emerald-400" : "text-rose-400"}`}>
                          {positive ? "+" : ""}{item.changePct.toFixed(1)}%
                        </span>
                      )}
                    </a>
                  );
                })}
              </div>

              {/* Sayfalama (birden fazla sayfa varsa göster) */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-3 pt-2 border-t border-slate-800/50">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={safePage === 0}
                    className="px-3 py-1 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600 disabled:opacity-30 text-xs transition-colors"
                  >◀ Önceki</button>
                  <span className="text-xs text-slate-500">Sayfa {safePage + 1} / {totalPages}</span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={safePage === totalPages - 1}
                    className="px-3 py-1 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600 disabled:opacity-30 text-xs transition-colors"
                  >Sonraki ▶</button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-slate-800/50 flex items-center justify-between">
        <a href="https://recepdemirborsa.com" target="_blank" rel="noopener noreferrer"
          className="text-[10px] text-slate-700 hover:text-slate-500 transition-colors">
          recepdemirborsa.com
        </a>
        <p className="text-[10px] text-slate-700">Yatırım tavsiyesi değildir</p>
      </div>
    </div>
  );
}


