"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiRefresh,
  HiClock,
  HiChevronDown,
  HiChevronUp,
  HiLogout,
  HiTrendingUp,
  HiTrendingDown,
} from "react-icons/hi";
import {
  TbChartLine,
  TbChartCandle,
  TbActivity,
  TbWaveSine,
  TbArrowUpRight,
  TbArrowDownRight,
  TbFlame,
  TbDroplet,
  TbChartBar,
  TbTriangle,
  TbExternalLink,
  TbStar,
  TbStarFilled,
} from "react-icons/tb";
import { useRouter } from "next/navigation";

interface ScanCategory {
  key: string;
  label: string;
  emoji: string;
  count: number;
  stocks: string[];
}

interface ScanData {
  status: "pending" | "running" | "done" | null;
  lastRun: number | null;
  nextRun: number | null;
  minutesAgo: number | null;
  categories: ScanCategory[];
}

// ── Grup tanımları ────────────────────────────────────────────────────────────
interface GroupDef {
  id: string;
  label: string;
  desc: string;
  icon: React.ReactNode;
  color: "emerald" | "sky" | "violet" | "amber" | "rose";
  keys: string[];
}

const GROUPS: GroupDef[] = [
  {
    id: "formasyon_bull",
    label: "Bullish Formasyonlar",
    desc: "Yukarı kırılım ve tersine dönüş formasyonları",
    icon: <TbChartCandle size={16} />,
    color: "emerald",
    keys: [
      "strong_up", "golden_cross", "tobo_break",
      "channel_break_up", "triangle_break_up", "trend_break_up",
      "ikili_dip_break", "price_desc_break", "hbreak", "fibo_setup",
    ],
  },
  {
    id: "rsi",
    label: "RSI Analizleri",
    desc: "Aşırı alım/satım ve RSI kırılım sinyalleri",
    icon: <TbActivity size={16} />,
    color: "sky",
    keys: ["rsi_os", "rsi_asc_break", "rsi_tobo", "rsi_ob", "rsi_desc_break", "rsi_hdts"],
  },
  {
    id: "macd",
    label: "MACD Analizleri",
    desc: "MACD kesişim ve momentum sinyalleri",
    icon: <TbWaveSine size={16} />,
    color: "violet",
    keys: ["macd_cross", "macd_bear", "macd_bull", "macd_neg", "macd_pos"],
  },
  {
    id: "harmonik",
    label: "Harmonik Formasyonlar",
    desc: "Fibonacci bazlı harmonik fiyat desenleri",
    icon: <TbTriangle size={16} />,
    color: "amber",
    keys: ["harmonic_long", "harmonic_short"],
  },
  {
    id: "hacim",
    label: "Hacim & Göstergeler",
    desc: "Hacim artışları ve volatilite sinyalleri",
    icon: <TbChartBar size={16} />,
    color: "rose",
    keys: ["vol_spike", "bb_squeeze", "vol_dry"],
  },
];

// Gruplanmamış her şeyi yakala
const ALL_GROUPED_KEYS = GROUPS.flatMap((g) => g.keys);

const BULL_KEYS = [
  "rsi_os", "vol_spike", "macd_cross", "bb_squeeze",
  "strong_up", "golden_cross", "tobo_break",
  "channel_break_up", "triangle_break_up", "trend_break_up",
  "ikili_dip_break", "fibo_setup", "rsi_asc_break", "rsi_tobo",
  "hbreak", "price_desc_break", "harmonic_long", "macd_bull", "macd_pos",
];

const colorMap = {
  emerald: {
    border: "border-emerald-800/50",
    bg: "bg-emerald-950/20",
    headerBg: "bg-emerald-950/30",
    icon: "text-emerald-400 bg-emerald-950/50 border-emerald-900/50",
    badge: "bg-emerald-800/60 text-emerald-300",
    ticker: "border-emerald-700/50 text-emerald-400 hover:bg-emerald-900/40 bg-emerald-950/30",
    label: "text-emerald-400",
    divider: "border-emerald-900/30",
  },
  sky: {
    border: "border-sky-800/50",
    bg: "bg-sky-950/20",
    headerBg: "bg-sky-950/30",
    icon: "text-sky-400 bg-sky-950/50 border-sky-900/50",
    badge: "bg-sky-800/60 text-sky-300",
    ticker: "border-sky-700/50 text-sky-400 hover:bg-sky-900/40 bg-sky-950/30",
    label: "text-sky-400",
    divider: "border-sky-900/30",
  },
  violet: {
    border: "border-violet-800/50",
    bg: "bg-violet-950/20",
    headerBg: "bg-violet-950/30",
    icon: "text-violet-400 bg-violet-950/50 border-violet-900/50",
    badge: "bg-violet-800/60 text-violet-300",
    ticker: "border-violet-700/50 text-violet-400 hover:bg-violet-900/40 bg-violet-950/30",
    label: "text-violet-400",
    divider: "border-violet-900/30",
  },
  amber: {
    border: "border-amber-800/50",
    bg: "bg-amber-950/20",
    headerBg: "bg-amber-950/30",
    icon: "text-amber-400 bg-amber-950/50 border-amber-900/50",
    badge: "bg-amber-800/60 text-amber-300",
    ticker: "border-amber-700/50 text-amber-400 hover:bg-amber-900/40 bg-amber-950/30",
    label: "text-amber-400",
    divider: "border-amber-900/30",
  },
  rose: {
    border: "border-rose-800/50",
    bg: "bg-rose-950/20",
    headerBg: "bg-rose-950/30",
    icon: "text-rose-400 bg-rose-950/50 border-rose-900/50",
    badge: "bg-rose-800/60 text-rose-300",
    ticker: "border-rose-700/50 text-rose-400 hover:bg-rose-900/40 bg-rose-950/30",
    label: "text-rose-400",
    divider: "border-rose-900/30",
  },
};

function timeAgoLabel(minutesAgo: number | null): string {
  if (minutesAgo === null) return "";
  if (minutesAgo < 1) return "Az önce";
  if (minutesAgo < 60) return `${minutesAgo} dk önce`;
  const h = Math.floor(minutesAgo / 60);
  const m = minutesAgo % 60;
  return m > 0 ? `${h} sa ${m} dk önce` : `${h} sa önce`;
}

// ── Tek kategori satırı ────────────────────────────────────────────────────────
function CategoryRow({
  cat,
  color,
}: {
  cat: ScanCategory;
  color: keyof typeof colorMap;
}) {
  const [open, setOpen] = useState(false);
  const c = colorMap[color];

  return (
    <div className={`rounded-xl border ${c.border} overflow-hidden`}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors`}
        aria-expanded={open}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-lg leading-none">{cat.emoji}</span>
          <span className="text-sm font-semibold text-slate-200 truncate text-left">
            {cat.label}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-3">
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              cat.count > 0 ? c.badge : "bg-slate-800 text-slate-500"
            }`}
          >
            {cat.count}
          </span>
          {open ? (
            <HiChevronUp className="text-slate-500 w-4 h-4" />
          ) : (
            <HiChevronDown className="text-slate-500 w-4 h-4" />
          )}
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <div className={`px-4 pb-4 border-t ${c.divider}`}>
              {(cat.stocks ?? []).length === 0 ? (
                <p className="text-xs text-slate-500 italic mt-3">
                  Bu formasyonda hisse bulunamadı.
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {(cat.stocks ?? []).map((ticker) => (
                    <a
                      key={ticker}
                      href={`https://tr.tradingview.com/chart/?symbol=BIST%3A${ticker}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-1 text-xs font-mono font-bold px-2.5 py-1 rounded-lg border transition-colors ${c.ticker}`}
                    >
                      {ticker}
                      <TbExternalLink size={10} className="opacity-50" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Grup bloğu ─────────────────────────────────────────────────────────────────
function GroupBlock({
  group,
  cats,
}: {
  group: GroupDef;
  cats: ScanCategory[];
}) {
  const [collapsed, setCollapsed] = useState(false);
  const c = colorMap[group.color];
  const totalSignals = cats.reduce((a, cat) => a + cat.count, 0);
  const activeCats = cats.filter((cat) => cat.count > 0).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border ${c.border} overflow-hidden`}
    >
      {/* Grup başlığı */}
      <button
        onClick={() => setCollapsed((v) => !v)}
        className={`w-full flex items-center justify-between px-5 py-4 ${c.headerBg} hover:brightness-110 transition-all`}
      >
        <div className="flex items-center gap-3">
          <div className={`p-1.5 rounded-lg border ${c.icon}`}>{group.icon}</div>
          <div className="text-left">
            <p className={`text-sm font-bold ${c.label}`}>{group.label}</p>
            <p className="text-xs text-slate-500 mt-0.5">{group.desc}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className={`text-lg font-black ${c.label}`}>{totalSignals}</p>
            <p className="text-xs text-slate-600">{activeCats} aktif sinyal</p>
          </div>
          <span className={`sm:hidden text-sm font-black ${c.label}`}>{totalSignals}</span>
          {collapsed ? (
            <HiChevronDown className="text-slate-500 w-4 h-4" />
          ) : (
            <HiChevronUp className="text-slate-500 w-4 h-4" />
          )}
        </div>
      </button>

      {/* Kategoriler */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className={`p-3 space-y-2 ${c.bg}`}>
              {cats.map((cat) => (
                <CategoryRow key={cat.key} cat={cat} color={group.color} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Ana bileşen ────────────────────────────────────────────────────────────────
export default function StockScanner() {
  const [data, setData] = useState<ScanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/hisse-teknik-analizi/login");
    router.refresh();
  }

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/scan", { cache: "no-store" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      setData(await res.json());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Bilinmeyen hata");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [load]);

  // Kategorileri grupla
  const groupedData = GROUPS.map((group) => ({
    group,
    cats: (data?.categories ?? []).filter((c) => group.keys.includes(c.key)),
  })).filter(({ cats }) => cats.length > 0);

  // Gruplanmamış kategoriler (API'den yeni gelen ama tanımlı olmayan)
  const ungroupedCats = (data?.categories ?? []).filter(
    (c) => !ALL_GROUPED_KEYS.includes(c.key)
  );

  // Birden fazla kategoride geçen hisseler
  const tickerCountMap = new Map<string, { count: number; categories: string[]; isBull: boolean }>();
  for (const cat of (data?.categories ?? [])) {
    for (const ticker of (cat.stocks ?? [])) {
      const existing = tickerCountMap.get(ticker);
      if (existing) {
        existing.count++;
        existing.categories.push(cat.label);
      } else {
        tickerCountMap.set(ticker, {
          count: 1,
          categories: [cat.label],
          isBull: BULL_KEYS.includes(cat.key),
        });
      }
    }
  }
  const overlappingTickers = [...tickerCountMap.entries()]
    .filter(([, v]) => v.count >= 2)
    .sort((a, b) => b[1].count - a[1].count);

  const totalSignals = (data?.categories ?? []).reduce((a, c) => a + c.count, 0);
  const bullSignals = (data?.categories ?? [])
    .filter((c) => BULL_KEYS.includes(c.key))
    .reduce((a, c) => a + c.count, 0);
  const bearSignals = totalSignals - bullSignals;

  return (
    <section id="hisse-teknik-analizi" className="py-20 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        {/* ── Başlık ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <p className="text-xs font-semibold tracking-[0.2em] text-emerald-500 uppercase mb-2">
                Otomatik Tarama
              </p>
              <h1 className="text-3xl md:text-4xl font-black text-white mb-2">
                Hisse <span className="text-emerald-400">Teknik</span> Analizi
              </h1>
              <p className="text-slate-400 text-sm max-w-xl">
                BIST hisseleri her saat otomatik taranır. Formasyon, RSI, MACD ve harmonik
                sinyaller gruplandırılmış olarak listelenir.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={load}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:border-emerald-700 transition-colors text-sm disabled:opacity-40"
              >
                <HiRefresh className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">Yenile</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-700 text-slate-500 hover:text-rose-400 hover:border-rose-800 transition-colors text-sm"
              >
                <HiLogout className="w-4 h-4" />
                <span className="hidden sm:inline">Çıkış</span>
              </button>
            </div>
          </div>

          {/* Durum */}
          {data && (
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <HiClock className="w-3.5 h-3.5" />
                {data.lastRun ? `Son tarama: ${timeAgoLabel(data.minutesAgo)}` : "Henüz tarama yapılmadı"}
              </span>
              {data.status === "running" && (
                <span className="flex items-center gap-1 text-amber-400">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  Tarama devam ediyor…
                </span>
              )}
            </div>
          )}
        </motion.div>

        {/* ── Özet Stat Kartları ── */}
        {data && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-3 gap-3 mb-8"
          >
            <div className="bg-[#0a1628] border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center gap-1">
              <TbChartLine size={20} className="text-slate-400 mb-0.5" />
              <p className="text-2xl font-black text-white">{totalSignals}</p>
              <p className="text-xs text-slate-500 text-center">Toplam Sinyal</p>
            </div>
            <div className="bg-emerald-950/30 border border-emerald-900/50 rounded-2xl p-4 flex flex-col items-center justify-center gap-1">
              <div className="flex items-center gap-1 mb-0.5">
                <HiTrendingUp size={18} className="text-emerald-400" />
                <TbArrowUpRight size={14} className="text-emerald-500" />
              </div>
              <p className="text-2xl font-black text-emerald-400">{bullSignals}</p>
              <p className="text-xs text-emerald-600 text-center">Bullish</p>
            </div>
            <div className="bg-rose-950/20 border border-rose-900/40 rounded-2xl p-4 flex flex-col items-center justify-center gap-1">
              <div className="flex items-center gap-1 mb-0.5">
                <HiTrendingDown size={18} className="text-rose-400" />
                <TbArrowDownRight size={14} className="text-rose-500" />
              </div>
              <p className="text-2xl font-black text-rose-400">{bearSignals}</p>
              <p className="text-xs text-rose-700 text-center">Bearish</p>
            </div>
          </motion.div>
        )}

        {/* ── Skeleton ── */}
        {loading && !data && (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 rounded-2xl bg-slate-800/40 animate-pulse" />
            ))}
          </div>
        )}

        {/* ── Hata ── */}
        {error && (
          <div className="rounded-xl border border-rose-900/50 bg-rose-950/20 p-6 text-center">
            <p className="text-rose-400 font-semibold mb-1">Bağlantı Hatası</p>
            <p className="text-slate-500 text-sm mb-3">{error}</p>
            <button onClick={load} className="text-xs text-emerald-400 hover:underline">
              Tekrar dene
            </button>
          </div>
        )}

        {/* ── Ortak Sinyaller ── */}
        {!loading && !error && overlappingTickers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-5 rounded-2xl border border-amber-700/50 bg-amber-950/20 overflow-hidden"
          >
            <div className="flex items-center gap-3 px-5 py-4 bg-amber-950/30 border-b border-amber-800/30">
              <div className="p-1.5 rounded-lg border border-amber-800/50 bg-amber-950/50">
                <TbStarFilled size={16} className="text-amber-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-amber-300">Birden Fazla Teknikte Ortak Hisseler</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  {overlappingTickers.length} hisse 2+ sinyal kategorisinde birden yer alıyor
                </p>
              </div>
            </div>
            <div className="p-4">
              <div className="flex flex-wrap gap-2">
                {overlappingTickers.map(([ticker, info]) => (
                  <a
                    key={ticker}
                    href={`https://tr.tradingview.com/chart/?symbol=BIST%3A${ticker}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative inline-flex flex-col items-center gap-0.5"
                    title={info.categories.join(" · ")}
                  >
                    <span className="inline-flex items-center gap-1.5 text-sm font-mono font-black px-3 py-1.5 rounded-xl border border-amber-600/60 text-amber-300 bg-amber-950/40 hover:bg-amber-800/40 hover:border-amber-500 transition-colors">
                      {ticker}
                      <span className="flex items-center justify-center w-4 h-4 rounded-full bg-amber-500 text-[10px] font-black text-black">
                        {info.count}
                      </span>
                    </span>
                    <span className="text-[9px] text-amber-700 group-hover:text-amber-500 transition-colors truncate max-w-[80px] text-center">
                      {info.categories.slice(0, 2).join(", ")}
                      {info.categories.length > 2 && ` +${info.categories.length - 2}`}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Gruplandırılmış içerik ── */}
        {!loading && !error && data && (
          <div className="space-y-4">
            {groupedData.map(({ group, cats }) => (
              <GroupBlock key={group.id} group={group} cats={cats} />
            ))}

            {/* Gruplanmamış kategoriler */}
            {ungroupedCats.length > 0 && (
              <div className="rounded-2xl border border-slate-800 overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-4 bg-slate-900/50">
                  <div className="p-1.5 rounded-lg border text-slate-400 bg-slate-800/50 border-slate-700/50">
                    <TbFlame size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-300">Diğer Sinyaller</p>
                    <p className="text-xs text-slate-500 mt-0.5">Gruplanmamış tarama sonuçları</p>
                  </div>
                </div>
                <div className="p-3 space-y-2 bg-slate-900/20">
                  {ungroupedCats.map((cat) => (
                    <CategoryRow
                      key={cat.key}
                      cat={cat}
                      color={BULL_KEYS.includes(cat.key) ? "emerald" : "rose"}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Bekliyor ── */}
        {!loading && !error && data?.status === "pending" && (
          <div className="mt-6 text-center text-slate-500 text-sm">
            İlk tarama başlatılıyor, lütfen bekleyin…
          </div>
        )}

        {/* ── Yasal uyarı ── */}
        <p className="mt-8 text-xs text-slate-700 border-l-2 border-slate-800 pl-3">
          Bu sayfa yalnızca teknik formasyon tespiti yapar. Yatırım tavsiyesi değildir.
          Tüm kararlar yatırımcının kendi sorumluluğundadır.
        </p>
      </div>
    </section>
  );
}

