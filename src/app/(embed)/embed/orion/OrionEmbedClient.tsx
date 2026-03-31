"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";

interface StockRow { ticker: string; changePct?: number; }
interface ScanCategory { key: string; label: string; emoji: string; count: number; stocks: StockRow[]; }
interface GroupDef { id: string; label: string; emoji: string; color: "emerald" | "sky" | "violet" | "amber" | "rose"; keys: string[]; }
interface ScanData { lastRun: number | null; minutesAgo: number | null; categories: ScanCategory[]; groups?: DbGroupDef[]; }
interface DbGroupDef { id: string; label: string; emoji: string; color: string; keys: { id: string; label: string }[]; is_bull: boolean; }

const colorMap = {
  emerald: { border: "border-emerald-800/50", headerBg: "bg-emerald-950/30", icon: "text-emerald-400 bg-emerald-950/50 border-emerald-900/50", badge: "bg-emerald-800/60 text-emerald-300", ticker: "border-emerald-700/50 text-emerald-400 hover:bg-emerald-900/40 bg-emerald-950/30", label: "text-emerald-400", divider: "border-emerald-900/30" },
  sky:     { border: "border-sky-800/50",     headerBg: "bg-sky-950/30",     icon: "text-sky-400 bg-sky-950/50 border-sky-900/50",         badge: "bg-sky-800/60 text-sky-300",         ticker: "border-sky-700/50 text-sky-400 hover:bg-sky-900/40 bg-sky-950/30",         label: "text-sky-400",     divider: "border-sky-900/30" },
  violet:  { border: "border-violet-800/50",  headerBg: "bg-violet-950/30",  icon: "text-violet-400 bg-violet-950/50 border-violet-900/50", badge: "bg-violet-800/60 text-violet-300", ticker: "border-violet-700/50 text-violet-400 hover:bg-violet-900/40 bg-violet-950/30", label: "text-violet-400", divider: "border-violet-900/30" },
  amber:   { border: "border-amber-800/50",   headerBg: "bg-amber-950/30",   icon: "text-amber-400 bg-amber-950/50 border-amber-900/50",   badge: "bg-amber-800/60 text-amber-300",   ticker: "border-amber-700/50 text-amber-400 hover:bg-amber-900/40 bg-amber-950/30",   label: "text-amber-400",   divider: "border-amber-900/30" },
  rose:    { border: "border-rose-800/50",    headerBg: "bg-rose-950/30",    icon: "text-rose-400 bg-rose-950/50 border-rose-900/50",     badge: "bg-rose-800/60 text-rose-300",     ticker: "border-rose-700/50 text-rose-400 hover:bg-rose-900/40 bg-rose-950/30",     label: "text-rose-400",   divider: "border-rose-900/30" },
};

const GROUPS: GroupDef[] = [
  { id: "formasyon_bull", label: "Bullish Formasyonlar", emoji: "📈", color: "emerald", keys: ["strong_up","golden_cross","tobo_break","channel_break","triangle_break_up","trend_break","ikili_dip_break","price_desc_break","hbreak","fibo_setup","rsi_asc_break","rsi_tobo","rsi_pos_div"] },
  { id: "rsi",      label: "RSI Analizleri",        emoji: "📊", color: "sky",    keys: ["rsi_os","rsi_ob"] },
  { id: "macd",     label: "MACD Analizleri",       emoji: "〰️", color: "violet", keys: ["macd_cross"] },
  { id: "harmonik", label: "Harmonik Formasyonlar", emoji: "🔷", color: "amber",  keys: ["harmonic_long","harmonic_short"] },
  { id: "hacim",    label: "Hacim & Göstergeler",   emoji: "🔥", color: "rose",   keys: ["vol_spike","bb_squeeze"] },
  { id: "stochrsi", label: "Stokastik RSI",         emoji: "📊", color: "sky",    keys: ["stoch_rsi_os","stoch_rsi_crossup"] },
  { id: "bearish",  label: "Bearish Formasyonlar",  emoji: "📉", color: "rose",   keys: ["death_cross","obo_break","ikili_tepe_break","rsi_desc_break","triangle_break_down"] },
];

const BULL_KEYS = new Set([
  "rsi_os","vol_spike","macd_cross","bb_squeeze","strong_up","golden_cross","tobo_break",
  "channel_break","triangle_break_up","trend_break","ikili_dip_break","fibo_setup",
  "rsi_asc_break","rsi_tobo","hbreak","price_desc_break","harmonic_long","rsi_pos_div",
  "stoch_rsi_os","stoch_rsi_crossup",
]);

const REVERSAL_KEYS = new Set(["ikili_dip_break","harmonic_long"]);

const VALID_COLORS = new Set(["emerald", "sky", "violet", "amber", "rose"]);

function timeAgoLabel(m: number | null): string {
  if (m === null) return "";
  if (m < 1) return "Az önce";
  if (m < 60) return `${m} dk önce`;
  const h = Math.floor(m / 60), rem = m % 60;
  return rem > 0 ? `${h} sa ${rem} dk` : `${h} sa`;
}

// ── Kategori akordeon kartı ───────────────────────────────────────────────────
function CategoryCard({ cat, color }: { cat: ScanCategory; color: keyof typeof colorMap }) {
  const [open, setOpen] = useState(cat.count > 0);
  const c = colorMap[color];
  return (
    <div className={`rounded-xl border overflow-hidden ${cat.count > 0 ? c.border : "border-slate-800/50"}`}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors ${cat.count > 0 ? c.headerBg : "bg-slate-900/20"}`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-sm leading-none">{cat.emoji}</span>
          <span className={`text-sm font-semibold truncate text-left ${cat.count > 0 ? "text-slate-200" : "text-slate-600"}`}>{cat.label}</span>
          {cat.count === 0 && <span className="text-[10px] text-slate-700 italic">sinyal yok</span>}
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          <span className={`text-xs font-black px-2 py-0.5 rounded-full ${cat.count > 0 ? c.badge : "bg-slate-800/40 text-slate-700"}`}>{cat.count}</span>
          <span className="text-slate-600 text-xs">{open ? "▲" : "▼"}</span>
        </div>
      </button>
      {open && (
        <div className={`px-4 pb-4 border-t ${c.divider}`}>
          {cat.stocks.length === 0 ? (
            <p className="text-xs text-slate-600 italic mt-3">Bu formasyonda hisse bulunamadı.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {cat.stocks.map((row) => (
                <a key={row.ticker}
                  href={`https://tr.tradingview.com/chart/?symbol=BIST%3A${row.ticker}`}
                  target="_blank" rel="noopener noreferrer"
                  className={`inline-flex items-center gap-1 text-xs font-mono font-bold px-2.5 py-1 rounded-lg border transition-colors ${c.ticker}`}
                >
                  {row.ticker}
                  {row.changePct !== undefined && (
                    <span className={`text-[10px] font-normal ${row.changePct >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {row.changePct >= 0 ? "+" : ""}{row.changePct.toFixed(1)}%
                    </span>
                  )}
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Orion embed — tüm gruplar alt alta, scrollbar yok ─────────────────────────
export default function OrionEmbedClient() {
  const [data, setData]       = useState<ScanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Yüksekliği parent iframe'e bildir — Wix + standart format
  useEffect(() => {
    const sendHeight = () => {
      const el = wrapperRef.current;
      if (!el) return;
      const h = el.scrollHeight;
      if (h < 50) return;
      // Standart format
      window.parent.postMessage({ type: "embed-resize", height: h }, "*");
      // Wix HtmlComponent format
      try { window.parent.postMessage(JSON.stringify({ type: "setHeight", data: h }), "*"); } catch {}
    };
    sendHeight();
    const t1 = setTimeout(sendHeight, 200);
    const t2 = setTimeout(sendHeight, 600);
    const t3 = setTimeout(sendHeight, 1500);
    const t4 = setTimeout(sendHeight, 3000);
    const ro = new ResizeObserver(sendHeight);
    if (wrapperRef.current) ro.observe(wrapperRef.current);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); ro.disconnect(); };
  }, [data, loading, error]);

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

  const activeGroups: GroupDef[] = (data?.groups && data.groups.length > 0)
    ? data.groups.map((g) => ({
        id: g.id, label: g.label, emoji: g.emoji,
        color: (VALID_COLORS.has(g.color) ? g.color : "emerald") as GroupDef["color"],
        keys: g.keys.map((k) => k.id),
      }))
    : GROUPS;

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

  const totalSignals = allCats.reduce((a, c) => a + c.count, 0);
  const bullRaw      = allCats.filter((c) => activeBullKeys.has(c.key)).reduce((a, c) => a + c.count, 0);
  const bullSignals  = bullRaw - allCats.filter((c) => activeReversalKeys.has(c.key)).reduce((a, c) => a + c.count, 0);
  const bearSignals  = allCats.filter((c) => !activeBullKeys.has(c.key) || c.key === "harmonic_short").reduce((a, c) => a + c.count, 0);
  const donusSignals = allCats.filter((c) => activeReversalKeys.has(c.key)).reduce((a, c) => a + c.count, 0);

  return (
    <div ref={wrapperRef} className="text-slate-200 p-3 max-w-2xl mx-auto"
      style={{ fontFamily: "'Inter', sans-serif", background: "#080a0c" }}>

      {/* Başlık */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
        <div>
          <p className="text-[10px] font-semibold tracking-widest text-[#dc2626] uppercase">RdAlgo • BIST Tarama</p>
          {data?.minutesAgo !== null && data?.minutesAgo !== undefined && (
            <p className="text-[11px] text-slate-600 mt-0.5">Son tarama: {timeAgoLabel(data.minutesAgo)}</p>
          )}
        </div>
        <button onClick={load} disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:border-red-700 transition-colors text-xs disabled:opacity-40">
          <span className={loading ? "animate-spin inline-block" : ""}>⟳</span>
          {loading ? "Yükleniyor" : "Yenile"}
        </button>
      </div>

      {/* İstatistikler */}
      {data && !loading && (
        <div className="mb-5 grid grid-cols-2 gap-1.5">
          <div className="bg-[#111115] border border-slate-800 rounded-xl p-2.5 flex flex-col items-center gap-1">
            <p className="text-lg font-black text-white">{totalSignals}</p>
            <p className="text-[9px] text-slate-600 uppercase tracking-wide">Toplam</p>
          </div>
          <div className="bg-emerald-950/30 border border-emerald-900/50 rounded-xl p-2.5 flex flex-col items-center gap-1">
            <p className="text-lg font-black text-emerald-400">{bullSignals}</p>
            <p className="text-[9px] text-emerald-700 uppercase tracking-wide">Bullish</p>
          </div>
          <div className="bg-rose-950/20 border border-rose-900/40 rounded-xl p-2.5 flex flex-col items-center gap-1">
            <p className="text-lg font-black text-rose-400">{bearSignals}</p>
            <p className="text-[9px] text-rose-700 uppercase tracking-wide">Bearish</p>
          </div>
          <div className="bg-violet-950/20 border border-violet-900/40 rounded-xl p-2.5 flex flex-col items-center gap-1">
            <p className="text-lg font-black text-violet-400">{donusSignals}</p>
            <p className="text-[9px] text-violet-700 uppercase tracking-wide">Dönüş</p>
          </div>
          <div className="col-span-2 bg-slate-900/40 border border-slate-800 rounded-xl p-2.5 flex flex-col justify-center gap-1.5">
            <div className="flex justify-between text-[9px]">
              <span className="text-emerald-500 font-semibold">B {totalSignals > 0 ? Math.round((bullRaw / totalSignals) * 100) : 0}%</span>
              <span className="text-rose-500 font-semibold">S {totalSignals > 0 ? Math.round((bearSignals / totalSignals) * 100) : 0}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-rose-950/60 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-700"
                style={{ width: totalSignals > 0 ? `${Math.round((bullRaw / totalSignals) * 100)}%` : "50%" }} />
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
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i}>
              <div className="h-14 rounded-2xl bg-slate-800/30 animate-pulse mb-2" />
              <div className="space-y-2">
                <div className="h-12 rounded-xl bg-slate-800/20 animate-pulse" />
                <div className="h-12 rounded-xl bg-slate-800/20 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tüm gruplar alt alta — tab yok, scrollbar yok */}
      {!loading && !error && data && (
        <div className="space-y-5">
          {groupedData.map(({ group, cats }) => {
            const total = cats.reduce((a, c) => a + c.count, 0);
            const c = colorMap[group.color];
            return (
              <div key={group.id}>
                {/* Grup başlığı */}
                <div className={`flex items-center justify-between px-4 py-3 rounded-2xl border mb-2 ${c.border} ${c.headerBg}`}>
                  <div className="flex items-center gap-3">
                    <span className={`flex items-center justify-center w-8 h-8 rounded-xl border text-sm ${c.icon}`}>{group.emoji}</span>
                    <h2 className={`text-sm font-black ${c.label}`}>{group.label}</h2>
                  </div>
                  <div className="text-right">
                    <p className={`text-xl font-black ${c.label}`}>{total}</p>
                    <p className="text-[9px] text-slate-600 uppercase tracking-widest">sinyal</p>
                  </div>
                </div>
                {/* Kategoriler */}
                <div className="space-y-2">
                  {cats.length === 0
                    ? <div className="rounded-xl border border-slate-800 bg-slate-900/20 p-4 text-center"><p className="text-slate-600 text-sm">Bu grupta kategori yok.</p></div>
                    : cats.map((cat) => <CategoryCard key={cat.key} cat={cat} color={group.color} />)
                  }
                </div>
              </div>
            );
          })}
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
