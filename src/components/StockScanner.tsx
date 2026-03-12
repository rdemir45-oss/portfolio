"use client";

import React, { useState, useEffect, useCallback } from "react";
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
  TbBell,
  TbBellOff,
  TbBrandTelegram,
  TbDeviceFloppy,
  TbCheck,
  TbSearch,
  TbCrown,
  TbUser,
} from "react-icons/tb";
import { useRouter } from "next/navigation";
import type { DbScanGroup } from "@/lib/supabase";

interface StockRow {
  ticker: string;
  price?: number;
  changePct?: number;
}

interface ScanCategory {
  key: string;
  label: string;
  emoji: string;
  count: number;
  stocks: StockRow[];
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
      "channel_break", "triangle_break", "trend_break",
      "ikili_dip_break", "price_desc_break", "hbreak", "fibo_setup",
      "rsi_asc_break", "rsi_tobo", "rsi_pos_div",
    ],
  },
  {
    id: "rsi",
    label: "RSI Analizleri",
    desc: "Aşırı alım/satım sinyalleri",
    icon: <TbActivity size={16} />,
    color: "sky",
    keys: ["rsi_os", "rsi_ob"],
  },
  {
    id: "macd",
    label: "MACD Analizleri",
    desc: "MACD kesişim sinyali",
    icon: <TbWaveSine size={16} />,
    color: "violet",
    keys: ["macd_cross"],
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
    desc: "Hacim artışları ve sıkışma sinyalleri",
    icon: <TbChartBar size={16} />,
    color: "rose",
    keys: ["vol_spike", "bb_squeeze"],
  },
  {
    id: "bearish",
    label: "Satış Sinyalleri",
    desc: "Aşağı kırılım ve tersine dönüş formasyonları",
    icon: <HiTrendingDown size={16} />,
    color: "rose",
    keys: ["death_cross", "obo_break", "ikili_tepe_break", "rsi_desc_break"],
  },
];

// Gruplanmamış her şeyi yakala
const ALL_GROUPED_KEYS = GROUPS.flatMap((g) => g.keys);

// ── İkon haritası (DB'den gelen icon string → React node) ────────────────────
const ICON_MAP: Record<string, React.ReactNode> = {
  candle:         <TbChartCandle size={16} />,
  activity:       <TbActivity size={16} />,
  wave:           <TbWaveSine size={16} />,
  triangle:       <TbTriangle size={16} />,
  bar:            <TbChartBar size={16} />,
  chart:          <TbChartLine size={16} />,
  flame:          <TbFlame size={16} />,
  trending_up:    <HiTrendingUp size={16} />,
  trending_down:  <HiTrendingDown size={16} />,
};

function dbGroupToGroupDef(g: DbScanGroup): GroupDef {
  return {
    id: g.id,
    label: g.label,
    desc: g.description,
    icon: ICON_MAP[g.icon] ?? <TbChartLine size={16} />,
    color: g.color as GroupDef["color"],
    keys: (g.keys ?? []).map((k) => k.id),
  };
}

const BULL_KEYS = [
  "rsi_os", "vol_spike", "macd_cross", "bb_squeeze",
  "strong_up", "golden_cross", "tobo_break",
  "channel_break", "triangle_break", "trend_break",
  "ikili_dip_break", "fibo_setup", "rsi_asc_break", "rsi_tobo",
  "hbreak", "price_desc_break", "harmonic_long",
  "rsi_pos_div",
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
  favorites,
  toggleFavorite,
}: {
  cat: ScanCategory;
  color: keyof typeof colorMap;
  favorites: Set<string>;
  toggleFavorite: (ticker: string) => void;
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
                  {(cat.stocks ?? []).map((row) => {
                    const ticker = typeof row === "string" ? row : row.ticker;
                    const change = typeof row === "object" ? row.changePct : undefined;
                    return (
                    <React.Fragment key={ticker}>
                    <a
                      href={`https://tr.tradingview.com/chart/?symbol=BIST%3A${ticker}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-1 text-xs font-mono font-bold px-2.5 py-1 rounded-lg border transition-colors ${c.ticker}`}
                    >
                      {ticker}
                      {change !== undefined && (
                        <span className={`text-[10px] font-normal ${
                          change >= 0 ? "text-emerald-400" : "text-rose-400"
                        }`}>
                          {change >= 0 ? "+" : ""}{change.toFixed(1)}%
                        </span>
                      )}
                      <TbExternalLink size={10} className="opacity-50" />
                    </a>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(ticker); }}
                      className={`p-0.5 rounded transition-colors ${
                        favorites.has(ticker)
                          ? "text-amber-400 hover:text-amber-300"
                          : "text-slate-700 hover:text-amber-400"
                      }`}
                      title={favorites.has(ticker) ? "Favorilerden çıkar" : "Favorilere ekle"}
                    >
                      {favorites.has(ticker)
                        ? <TbStarFilled size={11} />
                        : <TbStar size={11} />}
                    </button>
                    </React.Fragment>
                    );
                  })}
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
  favorites,
  toggleFavorite,
}: {
  group: GroupDef;
  cats: ScanCategory[];
  favorites: Set<string>;
  toggleFavorite: (ticker: string) => void;
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
            <p className="text-xs text-slate-600">
              {cats.length === 0 ? "Sinyal yok" : `${activeCats} aktif sinyal`}
            </p>
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
              {cats.length === 0 ? (
                <p className="text-xs text-slate-600 italic px-1 py-2">
                  Bugün bu grupta sinyal çıkmadı.
                </p>
              ) : (
                cats.map((cat) => (
                  <CategoryRow key={cat.key} cat={cat} color={group.color} favorites={favorites} toggleFavorite={toggleFavorite} />
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Bildirim grubu metadata (bireysel key'lerle) ────────────────────────────
const ALERT_GROUPS_DETAILED = [
  {
    id: "formasyon_bull", label: "Bullish Formasyonlar", emoji: "📈",
    keys: [
      { id: "strong_up",        label: "Güçlü Yükseliş"         },
      { id: "golden_cross",     label: "Altın Kesişim"           },
      { id: "tobo_break",       label: "TOBO (Ters Baş-Omuz)"   },
      { id: "channel_break",    label: "Kanal Kırılımı"          },
      { id: "triangle_break",   label: "Üçgen Kırılımı"          },
      { id: "trend_break",      label: "Trend Kırılımı"          },
      { id: "ikili_dip_break",  label: "İkili Dip (W)"           },
      { id: "price_desc_break", label: "Düşen Trend Kırılımı"   },
      { id: "hbreak",           label: "Yatay Direnç Kırılımı"  },
      { id: "fibo_setup",       label: "Fibonacci Setup"         },
      { id: "rsi_asc_break",    label: "RSI Alt Trend Kırılım"  },
      { id: "rsi_tobo",         label: "RSI TOBO"                },
      { id: "rsi_pos_div",      label: "RSI Pozitif Uyumsuzluk" },
    ],
  },
  {
    id: "rsi", label: "RSI Analizleri", emoji: "📊",
    keys: [
      { id: "rsi_os", label: "Aşırı Satım (< 30)" },
      { id: "rsi_ob", label: "Aşırı Alım (> 70)"  },
    ],
  },
  {
    id: "macd", label: "MACD Analizleri", emoji: "〰️",
    keys: [
      { id: "macd_cross", label: "MACD Kesişim Yukarı" },
    ],
  },
  {
    id: "harmonik", label: "Harmonik Formasyonlar", emoji: "🔷",
    keys: [
      { id: "harmonic_long",  label: "Harmonik Long"  },
      { id: "harmonic_short", label: "Harmonik Short" },
    ],
  },
  {
    id: "hacim", label: "Hacim & Göstergeler", emoji: "🔥",
    keys: [
      { id: "vol_spike",  label: "Hacim Patlaması"    },
      { id: "bb_squeeze", label: "Bollinger Sıkışması" },
    ],
  },
  {
    id: "bearish", label: "Satış Sinyalleri", emoji: "📉",
    keys: [
      { id: "death_cross",      label: "Ölüm Kesişimi"           },
      { id: "obo_break",        label: "OBO (Baş-Omuz)"          },
      { id: "ikili_tepe_break", label: "İkili Tepe (M)"          },
      { id: "rsi_desc_break",   label: "RSI Düşen Trend Kırılım" },
    ],
  },
];

// ── Favoriler bölümü ───────────────────────────────────────────────
function FavoritesSection({
  favorites,
  scanCategories,
  toggleFavorite,
}: {
  favorites: Set<string>;
  scanCategories: ScanCategory[];
  toggleFavorite: (ticker: string) => void;
}) {
  if (favorites.size === 0) return null;

  const tickerSignals = new Map<string, string[]>();
  for (const ticker of favorites) tickerSignals.set(ticker, []);
  for (const cat of scanCategories) {
    for (const row of cat.stocks ?? []) {
      const ticker = typeof row === "string" ? row : row.ticker;
      if (favorites.has(ticker)) tickerSignals.get(ticker)?.push(cat.label);
    }
  }

  return (
    <div className="mb-5 rounded-2xl border border-amber-700/50 bg-amber-950/20 overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-3.5 bg-amber-950/30 border-b border-amber-800/30">
        <TbStarFilled size={15} className="text-amber-400" />
        <p className="text-sm font-bold text-amber-300">Favorilerim</p>
        <span className="text-xs text-amber-700">{favorites.size} hisse</span>
      </div>
      <div className="p-4 flex flex-wrap gap-2">
        {[...favorites].map((ticker) => {
          const signals = tickerSignals.get(ticker) ?? [];
          const hasSignal = signals.length > 0;
          return (
            <div key={ticker} className="inline-flex items-center gap-0.5">
              <a
                href={`https://tr.tradingview.com/chart/?symbol=BIST%3A${ticker}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-1.5 text-xs font-mono font-black px-2.5 py-1.5 rounded-xl border transition-colors ${
                  hasSignal
                    ? "border-amber-600/60 text-amber-300 bg-amber-950/40 hover:bg-amber-800/40"
                    : "border-slate-700/50 text-slate-500 bg-slate-900/30 hover:bg-slate-800/40"
                }`}
                title={hasSignal ? signals.join(" · ") : "Bugün sinyal yok"}
              >
                {ticker}
                {hasSignal && (
                  <span className="flex items-center justify-center w-4 h-4 rounded-full bg-amber-500 text-[10px] font-black text-black">
                    {signals.length}
                  </span>
                )}
                <TbExternalLink size={10} className="opacity-50" />
              </a>
              <button
                onClick={() => toggleFavorite(ticker)}
                className="p-0.5 text-amber-500 hover:text-rose-400 transition-colors"
                title="Favorilerden çıkar"
              >
                <TbStarFilled size={11} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Onboarding ───────────────────────────────────────────────────────────────
const ONBOARDING_STEPS = [
  {
    icon: "🚀",
    title: "Hoş Geldiniz!",
    desc: "BIST hisse tarama paneline hoş geldiniz. Bu kısa turda temel özellikleri göstereceğiz.",
  },
  {
    icon: "📊",
    title: "Otomatik Tarama",
    desc: "Hisseler her 30 dakikada bir otomatik taranır. Formasyon, RSI, MACD, Harmonik ve Hacim gruplarındaki sinyaller listelenir. Hisseye tıklayarak TradingView grafiğini açabilirsiniz.",
  },
  {
    icon: "⭐",
    title: "Ortak Sinyaller",
    desc: "Birden fazla kategoride aynı anda görünen hisseler en üstte vurgulanır — bunlar genellikle daha güçlü sinyal verir.",
  },
  {
    icon: "🔔",
    title: "Telegram Bildirimleri",
    desc: "Sağ üstteki Bildirim butonuna tıklayarak Telegram bildirimlerini etkinleştirebilirsiniz. Bota /mychatid yazarak Chat ID'nizi alın, kategorileri seçin ve kaydedin.",
  },
];

function OnboardingTour({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const current = ONBOARDING_STEPS[step];
  const isLast = step === ONBOARDING_STEPS.length - 1;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm px-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", damping: 20 }}
        className="bg-[#0d1f35] border border-slate-700/60 rounded-3xl p-8 max-w-sm w-full shadow-2xl"
      >
        <div className="text-5xl text-center mb-4">{current.icon}</div>
        <h2 className="text-xl font-black text-white text-center mb-3">{current.title}</h2>
        <p className="text-slate-400 text-sm text-center leading-relaxed mb-6">{current.desc}</p>
        <div className="flex items-center justify-center gap-1.5 mb-6">
          {ONBOARDING_STEPS.map((_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all duration-300 ${
                i === step ? "w-6 h-2 bg-emerald-400" : "w-2 h-2 bg-slate-700"
              }`}
            />
          ))}
        </div>
        <div className="flex gap-3">
          <button
            onClick={onDone}
            className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white text-sm transition-colors"
          >
            Atla
          </button>
          <button
            onClick={() => (isLast ? onDone() : setStep((s) => s + 1))}
            className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors"
          >
            {isLast ? "Başla 🚀" : "İleri →"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Ana bileşen ────────────────────────────────────────────────────────────────
export default function StockScanner() {
  const [data, setData] = useState<ScanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // ── Bildirim ayarları state ──────────────────────────────────────────────
  const [alertPanelOpen, setAlertPanelOpen]   = useState(false);
  const [alertChatId, setAlertChatId]         = useState("");
  const [alertEnabled, setAlertEnabled]       = useState(false);
  const [alertCategories, setAlertCategories] = useState<string[]>([]);
  const [alertLoading, setAlertLoading]       = useState(false);
  const [alertSaving, setAlertSaving]         = useState(false);
  const [alertMsg, setAlertMsg]               = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [showOnboarding, setShowOnboarding]   = useState(false);
  const [expandedGroups, setExpandedGroups]   = useState<Set<string>>(new Set());

  const [plan, setPlan]                         = useState<string>("starter");
  const [isAdmin, setIsAdmin]                   = useState(false);
  const [remoteGroups, setRemoteGroups]           = useState<DbScanGroup[] | null>(null);

  // ── Dinamik grup türemeleri ───────────────────────────────────────────────
  const activeGroups = (remoteGroups && remoteGroups.length > 0)
    ? remoteGroups.map(dbGroupToGroupDef)
    : GROUPS;

  const activeAlertGroups = (remoteGroups && remoteGroups.length > 0)
    ? remoteGroups.map((g) => ({
        id: g.id,
        label: g.label,
        emoji: g.emoji,
        keys: (g.keys ?? []).map((k) => ({ id: k.id, label: k.label })),
      }))
    : ALERT_GROUPS_DETAILED;

  const activeBullKeys = (remoteGroups && remoteGroups.length > 0)
    ? remoteGroups.filter((g) => g.is_bull).flatMap((g) => (g.keys ?? []).map((k) => k.id))
    : BULL_KEYS;

  // ── Favoriler ──────────────────────────────────────────────
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  useEffect(() => {
    const stored = localStorage.getItem("hisse_favorites_v1");
    if (stored) {
      try { setFavorites(new Set(JSON.parse(stored))); } catch { /* ignore */ }
    }
  }, []);

  function toggleFavorite(ticker: string) {
    setFavorites((prev) => {
      const next = new Set(prev);
      next.has(ticker) ? next.delete(ticker) : next.add(ticker);
      localStorage.setItem("hisse_favorites_v1", JSON.stringify([...next]));
      return next;
    });
  }

  const loadProfile = useCallback(async () => {
    setAlertLoading(true);
    try {
      const res = await fetch("/api/user/profile");
      if (res.ok) {
        const d = await res.json();
        setAlertChatId(d.telegramChatId ?? "");
        setAlertEnabled(d.alertsEnabled  ?? false);
        setPlan(d.plan ?? "starter");
        setIsAdmin(d.isAdmin === true);
        // Eski grup ID'lerini bireysel key'lere dönüştür
        const cats: string[] = d.alertCategories ?? [];
        const expanded = cats.flatMap((id: string) => {
          const grp = ALERT_GROUPS_DETAILED.find((g) => g.id === id);
          return grp ? grp.keys.map((k) => k.id) : [id];
        });
        setAlertCategories([...new Set(expanded)]);
      }
    } catch { /* ignore */ } finally {
      setAlertLoading(false);
    }
  }, []);

  const loadGroups = useCallback(async () => {
    try {
      const res = await fetch("/api/scan-groups");
      if (res.ok) {
        const d = await res.json();
        if (Array.isArray(d) && d.length > 0) setRemoteGroups(d);
      }
    } catch { /* use static fallback */ }
  }, []);

  const saveProfile = useCallback(async () => {
    setAlertSaving(true);
    setAlertMsg(null);
    try {
      const res = await fetch("/api/user/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telegramChatId:  alertChatId.trim(),
          alertsEnabled:   alertEnabled,
          alertCategories: alertCategories,
        }),
      });
      const d = await res.json();
      if (res.ok) {
        setAlertMsg({ type: "ok", text: "Ayarlar kaydedildi." });
      } else {
        setAlertMsg({ type: "err", text: d.error ?? "Kayıt başarısız." });
      }
    } catch {
      setAlertMsg({ type: "err", text: "Bağlantı hatası." });
    } finally {
      setAlertSaving(false);
    }
  }, [alertChatId, alertEnabled, alertCategories]);

  function toggleKey(keyId: string) {
    setAlertCategories((prev) =>
      prev.includes(keyId) ? prev.filter((k) => k !== keyId) : [...prev, keyId]
    );
  }

  function toggleGroup(groupId: string) {
    const grp = activeAlertGroups.find((g) => g.id === groupId);
    if (!grp) return;
    const keys = grp.keys.map((k) => k.id);
    const allSelected = keys.every((k) => alertCategories.includes(k));
    if (allSelected) {
      setAlertCategories((prev) => prev.filter((k) => !keys.includes(k)));
    } else {
      setAlertCategories((prev) => [...new Set([...prev, ...keys])]);
    }
  }

  function isGroupFull(groupId: string): boolean {
    const grp = activeAlertGroups.find((g) => g.id === groupId);
    if (!grp) return false;
    return grp.keys.every((k) => alertCategories.includes(k.id));
  }

  function isGroupPartial(groupId: string): boolean {
    const grp = activeAlertGroups.find((g) => g.id === groupId);
    if (!grp) return false;
    return grp.keys.some((k) => alertCategories.includes(k.id)) && !isGroupFull(groupId);
  }

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
    loadProfile();
    loadGroups();
    const id = setInterval(load, 5 * 60 * 1000);
    if (!localStorage.getItem("hisse_onboarding_v1")) setShowOnboarding(true);
    return () => clearInterval(id);
  }, [load, loadProfile, loadGroups]);

  // Kategorileri grupla — admin'de tanımlı sıraya göre sırala
  const groupedData = activeGroups.map((group) => ({
    group,
    cats: (data?.categories ?? [])
      .filter((c) => group.keys.includes(c.key))
      .sort((a, b) => group.keys.indexOf(a.key) - group.keys.indexOf(b.key)),
  }));
  // Grubun hiç key'i yoksa gizle (boş/tanımsız grup); key tanımlıysa sinyal olmasa da göster
  const visibleGroupData = groupedData.filter(({ group }) => group.keys.length > 0);

  // Gruplanmamış kategoriler (API'den yeni gelen ama tanımlı olmayan)
  const activeAllGroupedKeys = activeGroups.flatMap((g) => g.keys);
  const ungroupedCats = (data?.categories ?? []).filter(
    (c) => !activeAllGroupedKeys.includes(c.key)
  );

  // Birden fazla kategoride geçen hisseler
  const tickerCountMap = new Map<string, { count: number; categories: string[]; isBull: boolean }>();
  for (const cat of (data?.categories ?? [])) {
    for (const row of (cat.stocks ?? [])) {
      const ticker = typeof row === "string" ? row : row.ticker;
      const existing = tickerCountMap.get(ticker);
      if (existing) {
        existing.count++;
        if (!existing.categories.includes(cat.label)) existing.categories.push(cat.label);
      } else {
        tickerCountMap.set(ticker, {
          count: 1,
          categories: [cat.label],
          isBull: activeBullKeys.includes(cat.key),
        });
      }
    }
  }
  const overlappingTickers = [...tickerCountMap.entries()]
    .filter(([, v]) => v.count >= 2)
    .sort((a, b) => b[1].count - a[1].count);

  const totalSignals = (data?.categories ?? []).reduce((a, c) => a + c.count, 0);
  const bullSignals = (data?.categories ?? [])
    .filter((c) => activeBullKeys.includes(c.key))
    .reduce((a, c) => a + c.count, 0);
  const bearSignals = totalSignals - bullSignals;

  return (
    <>
      <AnimatePresence>
        {showOnboarding && (
          <OnboardingTour
            onDone={() => {
              localStorage.setItem("hisse_onboarding_v1", "1");
              setShowOnboarding(false);
            }}
          />
        )}
      </AnimatePresence>
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
                BIST hisseleri her 30 dakikada bir otomatik taranır. Formasyon, RSI, MACD ve harmonik
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
                onClick={() => { setAlertPanelOpen((v) => !v); if (!alertPanelOpen) loadProfile(); }}
                className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg border transition-colors text-sm ${
                  alertEnabled && alertChatId
                    ? "border-emerald-600 text-emerald-400 bg-emerald-950/30 hover:bg-emerald-950/50"
                    : "border-emerald-800/60 text-emerald-500 bg-emerald-950/20 hover:border-emerald-500 hover:text-emerald-400"
                }`}
                title="Bildirim Ayarları"
              >
                {alertEnabled && alertChatId
                  ? <TbBell className="w-4 h-4" />
                  : <TbBellOff className="w-4 h-4" />
                }
                <span className="hidden sm:inline">Bildirim</span>
                {!alertChatId && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </button>
              <a
                href="/hisse-teknik-analizi/profil"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition-colors text-sm"
                title="Profilim"
              >
                <TbUser className="w-4 h-4" />
                <span className="hidden sm:inline">Profilim</span>
              </a>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-700 text-slate-500 hover:text-rose-400 hover:border-rose-800 transition-colors text-sm"
              >
                <HiLogout className="w-4 h-4" />
                <span className="hidden sm:inline">Çıkış</span>
              </button>
              <a
                href="/hisse-teknik-analizi/taramalarim"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-blue-800/60 text-blue-400 bg-blue-950/20 hover:border-blue-500 hover:bg-blue-950/40 transition-colors text-sm"
              >
                <TbSearch className="w-4 h-4" />
                <span className="hidden sm:inline">Taramalarım</span>
              </a>
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

        {/* ── Bildirim Ayarları Paneli ── */}
        <AnimatePresence>
          {alertPanelOpen && (
            <motion.div
              key="alert-panel"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="mb-6"
            >
              <div className="rounded-2xl border border-emerald-800/60 bg-emerald-950/20 overflow-hidden">
                {/* Panel başlık */}
                <div className="flex items-center justify-between px-5 py-4 bg-emerald-950/30 border-b border-emerald-900/30">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg border border-emerald-800/50 bg-emerald-950/50">
                      <TbBell size={16} className="text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-emerald-300">Telegram Bildirim Ayarları</p>
                      <p className="text-xs text-emerald-700 mt-0.5">Seçtiğin kategorilerde sinyal çıkınca mesaj al</p>
                    </div>
                  </div>
                  {/* Master toggle — her zaman görünür */}
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 hidden sm:block">
                      {alertEnabled ? "Açık" : "Kapalı"}
                    </span>
                    <button
                      onClick={() => setAlertEnabled((v) => !v)}
                      className={`relative w-11 h-6 rounded-full transition-colors ${
                        alertEnabled ? "bg-emerald-600" : "bg-slate-700"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                          alertEnabled ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div className="p-5 space-y-5">
                  {alertLoading ? (
                      <div className="space-y-3">
                        <div className="h-4 w-32 bg-slate-800/50 rounded animate-pulse" />
                        <div className="h-10 bg-slate-800/50 rounded animate-pulse" />
                      </div>
                    ) : (
                    <>
                      {/* Chat ID */}
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                          Telegram Chat ID
                        </label>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-xs text-slate-600 flex-1">
                            Önce botu başlatın, ardından{" "}
                            <span className="text-emerald-500 font-mono">/mychatid</span>{" "}
                            yazın ve çıkan numarayı yapıştırın.
                          </p>
                          <a
                            href="https://t.me/RdAlgoBildirim_Bot"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-950/50 border border-sky-800/60 hover:bg-sky-900/50 transition-colors text-sky-400 text-xs font-semibold"
                          >
                            <TbBrandTelegram size={14} />
                            Botu Aç
                          </a>
                        </div>
                        <div className="flex items-center gap-2">
                          <TbBrandTelegram size={16} className="text-sky-400 shrink-0" />
                          <input
                            type="text"
                            inputMode="numeric"
                            placeholder="örn: 123456789"
                            value={alertChatId}
                            onChange={(e) => setAlertChatId(e.target.value.replace(/[^-\d]/g, ""))}
                            className="flex-1 bg-[#0a1628] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-600 transition-colors"
                          />
                        </div>
                      </div>

                      {/* Kategori seçimi */}
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                          Hangi Sinyallerde Bildirim Alayım?
                        </label>
                        <div className="space-y-1.5">
                          {activeAlertGroups.map((g) => {
                            const full    = isGroupFull(g.id);
                            const partial = isGroupPartial(g.id);
                            const open    = expandedGroups.has(g.id);
                            const selectedCount = g.keys.filter((k) => alertCategories.includes(k.id)).length;
                            return (
                              <div
                                key={g.id}
                                className={`rounded-xl border overflow-hidden transition-colors ${
                                  full ? "border-emerald-700/70" : partial ? "border-emerald-900/50" : "border-slate-800"
                                }`}
                              >
                                {/* Grup satırı */}
                                <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-900/40">
                                  {/* Grup checkbox */}
                                  <button
                                    onClick={() => toggleGroup(g.id)}
                                    className={`flex items-center justify-center w-5 h-5 rounded border shrink-0 transition-colors ${
                                      full
                                        ? "bg-emerald-600 border-emerald-500"
                                        : partial
                                        ? "bg-emerald-950 border-emerald-700"
                                        : "bg-slate-800 border-slate-600 hover:border-slate-400"
                                    }`}
                                  >
                                    {full    && <TbCheck size={11} className="text-white" />}
                                    {partial && <span className="w-2 h-0.5 bg-emerald-400 rounded-full" />}
                                  </button>
                                  <span className="text-base leading-none">{g.emoji}</span>
                                  <span className={`flex-1 text-sm font-semibold ${
                                    full || partial ? "text-white" : "text-slate-400"
                                  }`}>
                                    {g.label}
                                  </span>
                                  {(full || partial) && (
                                    <span className="text-xs text-emerald-600 shrink-0">{selectedCount}/{g.keys.length}</span>
                                  )}
                                  {/* Genişlet butonu */}
                                  <button
                                    onClick={() =>
                                      setExpandedGroups((prev) => {
                                        const next = new Set(prev);
                                        next.has(g.id) ? next.delete(g.id) : next.add(g.id);
                                        return next;
                                      })
                                    }
                                    className="p-1 text-slate-500 hover:text-slate-300 transition-colors"
                                  >
                                    {open ? <HiChevronUp size={14} /> : <HiChevronDown size={14} />}
                                  </button>
                                </div>
                                {/* Bireysel key'ler */}
                                {open && (
                                  <div className="px-3 pb-2 pt-1 bg-slate-950/50 border-t border-slate-800/50 grid grid-cols-1 sm:grid-cols-2 gap-0.5">
                                    {g.keys.map((k) => {
                                      const keyActive = alertCategories.includes(k.id);
                                      return (
                                        <button
                                          key={k.id}
                                          onClick={() => toggleKey(k.id)}
                                          className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors ${
                                            keyActive
                                              ? "text-emerald-300"
                                              : "text-slate-500 hover:text-slate-300"
                                          }`}
                                        >
                                          <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                                            keyActive ? "bg-emerald-600 border-emerald-500" : "border-slate-600"
                                          }`}>
                                            {keyActive && <TbCheck size={9} className="text-white" />}
                                          </div>
                                          <span className="text-xs">{k.label}</span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Kaydet */}
                      <div className="flex items-center gap-3">
                        <button
                          onClick={saveProfile}
                          disabled={alertSaving}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors disabled:opacity-50"
                        >
                          <TbDeviceFloppy size={16} />
                          {alertSaving ? "Kaydediliyor..." : "Kaydet"}
                        </button>
                        {alertMsg && (
                          <p className={`text-sm ${
                            alertMsg.type === "ok" ? "text-emerald-400" : "text-rose-400"
                          }`}>
                            {alertMsg.type === "ok" ? "✅ " : "❌ "}{alertMsg.text}
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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

        {/* ── Favoriler ── */}
        {!loading && !error && data && (
          <FavoritesSection
            favorites={favorites}
            scanCategories={data.categories}
            toggleFavorite={toggleFavorite}
          />
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
            {visibleGroupData.map(({ group, cats }) => (
              <GroupBlock key={group.id} group={group} cats={cats} favorites={favorites} toggleFavorite={toggleFavorite} />
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
                      color={activeBullKeys.includes(cat.key) ? "emerald" : "rose"}
                      favorites={favorites}
                      toggleFavorite={toggleFavorite}
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
    </>
  );
}

