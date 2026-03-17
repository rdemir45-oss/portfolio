"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
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
  TbFlame,
  TbChartBar,
  TbTriangle,
  TbExternalLink,
  TbStar,
  TbStarFilled,
  TbBell,
  TbBellOff,
  TbBrandTelegram,
  TbBrandX,
  TbDeviceFloppy,
  TbCheck,
  TbSearch,
  TbUser,
  TbDownload,
  TbX,
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
      "channel_break", "triangle_break_up", "trend_break",
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
    id: "stochrsi",
    label: "Stokastik RSI",
    desc: "StochRSI aşırı satım ve kesişim sinyalleri",
    icon: <TbActivity size={16} />,
    color: "sky",
    keys: ["stoch_rsi_os", "stoch_rsi_crossup"],
  },
  {
    id: "bearish",
    label: "Bearish Formasyonlar",
    desc: "Aşağı kırılım ve tersine dönüş formasyonları",
    icon: <HiTrendingDown size={16} />,
    color: "rose",
    keys: ["death_cross", "obo_break", "ikili_tepe_break", "rsi_desc_break", "triangle_break_down"],
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

const VALID_COLORS = new Set<string>(["emerald", "sky", "violet", "amber", "rose"]);

function dbGroupToGroupDef(g: DbScanGroup): GroupDef {
  return {
    id: g.id,
    label: g.label,
    desc: g.description ?? "",
    icon: ICON_MAP[g.icon] ?? <TbChartLine size={16} />,
    color: (VALID_COLORS.has(g.color) ? g.color : "emerald") as GroupDef["color"],
    keys: (g.keys ?? []).map((k) => k.id),
  };
}

const BULL_KEYS = [
  "rsi_os", "vol_spike", "macd_cross", "bb_squeeze",
  "strong_up", "golden_cross", "tobo_break",
  "channel_break", "triangle_break_up", "trend_break",
  "ikili_dip_break", "fibo_setup", "rsi_asc_break", "rsi_tobo",
  "hbreak", "price_desc_break", "harmonic_long",
  "rsi_pos_div",
  "stoch_rsi_os", "stoch_rsi_crossup",
];

const REVERSAL_KEYS = ["ikili_dip_break", "harmonic_long"];

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
    sidebar: "border-l-emerald-500 text-emerald-400 bg-emerald-950/30",
    sidebarActive: "bg-emerald-950/50 border border-emerald-700/60 text-emerald-300",
    dot: "bg-emerald-400",
    progress: "bg-emerald-500",
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
    sidebar: "border-l-sky-500 text-sky-400 bg-sky-950/30",
    sidebarActive: "bg-sky-950/50 border border-sky-700/60 text-sky-300",
    dot: "bg-sky-400",
    progress: "bg-sky-500",
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
    sidebar: "border-l-violet-500 text-violet-400 bg-violet-950/30",
    sidebarActive: "bg-violet-950/50 border border-violet-700/60 text-violet-300",
    dot: "bg-violet-400",
    progress: "bg-violet-500",
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
    sidebar: "border-l-amber-500 text-amber-400 bg-amber-950/30",
    sidebarActive: "bg-amber-950/50 border border-amber-700/60 text-amber-300",
    dot: "bg-amber-400",
    progress: "bg-amber-500",
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
    sidebar: "border-l-rose-500 text-rose-400 bg-rose-950/30",
    sidebarActive: "bg-rose-950/50 border border-rose-700/60 text-rose-300",
    dot: "bg-rose-400",
    progress: "bg-rose-500",
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

// ── Tweet yardımcıları ────────────────────────────────────────────────────────
function toHashtags(stocks: ScanCategory["stocks"]): string {
  return (stocks ?? [])
    .map((r) => `#${typeof r === "string" ? r : r.ticker}`)
    .join(" ");
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://recepdemirborsa.com";

// Görsel manuel eklenecek → URL yok, sadece metin
function buildCatTweetText(cat: ScanCategory): string {
  const tickers = toHashtags(cat.stocks);
  const header = `${cat.emoji} ${cat.label} (${cat.count} hisse)\n`;
  const tags = "\n#bist #borsa";
  const budget = 280 - header.length - tags.length;
  const body = tickers.length > budget ? tickers.substring(0, budget).trimEnd() : tickers;
  return header + body + tags;
}

function buildGroupTweetText(groupLabel: string, cats: ScanCategory[]): string {
  const activeCats = cats.filter((c) => c.count > 0);
  const header = `${groupLabel}\n`;
  const tags = "\n#bist #borsa";
  const lines = activeCats.map((c) => {
    const tickers = toHashtags(c.stocks);
    return `${c.emoji} ${c.label}: ${tickers}`;
  });
  let body = lines.join("\n");
  const budget = 280 - header.length - tags.length;
  if (body.length > budget) body = body.substring(0, budget).trimEnd();
  return header + body + tags;
}

function openTweet(text: string) {
  window.open(
    `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
    "_blank",
    "noopener,noreferrer"
  );
}

// ── Share Modal ───────────────────────────────────────────────────────────────
const SHARE_BEAR_KEYS = new Set([
  "death_cross", "obo_break", "ikili_tepe_break", "rsi_desc_break",
  "triangle_break_down", "rsi_ob", "harmonic_short",
]);

function buildCardSvg(cat: ScanCategory): string {
  const isBull   = !SHARE_BEAR_KEYS.has(cat.key);
  const accent   = isBull ? "#34d399" : "#f87171";
  const accentBg = isBull ? "#052e16" : "#4c0519";
  const accentBorder = isBull ? "#166534" : "#9f1239";
  const date = new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });

  const tickers = (cat.stocks ?? [])
    .slice(0, 30)
    .map((r) => `#${typeof r === "string" ? r : r.ticker}`);

  const PER_ROW = 5;
  const rows: string[] = [];
  for (let i = 0; i < tickers.length; i += PER_ROW) {
    rows.push(tickers.slice(i, i + PER_ROW).join("   "));
  }

  const tickerEls = rows
    .map((row, i) =>
      `<text x="64" y="${298 + i * 50}" font-family="'Courier New',Courier,monospace" font-size="28" font-weight="700" fill="${accent}">${row}</text>`
    )
    .join("\n");

  const extra = cat.count > 30 ? `<text x="64" y="${298 + rows.length * 50}" font-family="Arial,sans-serif" font-size="20" fill="#64748b">+${cat.count - 30} hisse daha</text>` : "";

  // Encode label safely for SVG
  const safeLabel = cat.label.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  return `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1200" y2="630" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#050a0e"/>
      <stop offset="65%" stop-color="#0a1628"/>
      <stop offset="100%" stop-color="#050a0e"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <!-- Brand -->
  <rect x="48" y="36" width="44" height="44" rx="12" fill="${accent}"/>
  <text x="70" y="67" font-family="Arial Black,sans-serif" font-size="26" font-weight="900" fill="#050a0e" text-anchor="middle">R</text>
  <text x="104" y="67" font-family="Arial Black,sans-serif" font-size="24" font-weight="900" fill="${accent}">RdAlgo</text>
  <text x="1152" y="67" font-family="Arial,sans-serif" font-size="18" fill="#475569" text-anchor="end">BIST · ${date}</text>
  <!-- Category box -->
  <rect x="48" y="108" width="1104" height="112" rx="18" fill="${accentBg}" stroke="${accentBorder}" stroke-width="1"/>
  <text x="80" y="186" font-family="Arial Black,sans-serif" font-size="44" font-weight="900" fill="white">${safeLabel}</text>
  <text x="80" y="212" font-family="Arial,sans-serif" font-size="22" font-weight="600" fill="${accent}">${cat.count} hisse sinyal verdi</text>
  <!-- Divider -->
  <line x1="48" y1="250" x2="1152" y2="250" stroke="#1e293b" stroke-width="1"/>
  <!-- Tickers -->
  ${tickerEls}
  ${extra}
  <!-- Footer -->
  <line x1="48" y1="591" x2="1152" y2="591" stroke="#1e293b" stroke-width="1"/>
  <text x="600" y="616" font-family="Arial,sans-serif" font-size="16" fill="#475569" text-anchor="middle">#bist #borsa #hisse</text>
</svg>`;
}

async function svgToPngBlob(svg: string): Promise<Blob | null> {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    canvas.width  = 1200;
    canvas.height = 630;
    const ctx = canvas.getContext("2d");
    if (!ctx) { resolve(null); return; }
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url  = URL.createObjectURL(blob);
    const img  = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      canvas.toBlob((b) => resolve(b), "image/png");
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
    img.src = url;
  });
}

function ShareModal({
  cat,
  onClose,
}: {
  cat: ScanCategory;
  onClose: () => void;
}) {
  const isBull   = !SHARE_BEAR_KEYS.has(cat.key);
  const accent   = isBull ? "emerald" : "rose";
  const tweetText = buildCatTweetText(cat);
  const [copied, setCopied]         = useState(false);
  const [downloading, setDownloading] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  const tickers = (cat.stocks ?? [])
    .slice(0, 30)
    .map((r) => (typeof r === "string" ? r : r.ticker));

  async function handleDownload() {
    setDownloading(true);
    try {
      const svg  = buildCardSvg(cat);
      const blob = await svgToPngBlob(svg);
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a   = document.createElement("a");
      a.href     = url;
      a.download = `rdalgo-${cat.key}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch { /* ignore */ } finally {
      setDownloading(false);
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(tweetText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  }

  const colorCls = {
    emerald: { border: "border-emerald-800/50", bg: "bg-emerald-950/20", hdr: "bg-emerald-950/30", text: "text-emerald-400", badge: "bg-emerald-900/60 text-emerald-300", ticker: "bg-emerald-950/40 border-emerald-700/40 text-emerald-300" },
    rose:    { border: "border-rose-800/50",    bg: "bg-rose-950/20",    hdr: "bg-rose-950/30",    text: "text-rose-400",    badge: "bg-rose-900/60 text-rose-300",    ticker: "bg-rose-950/40 border-rose-700/40 text-rose-300" },
  }[accent];

  return (
    <motion.div
      ref={overlayRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <motion.div
        initial={{ scale: 0.93, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.93, opacity: 0 }}
        transition={{ type: "spring", damping: 22, stiffness: 260 }}
        className="bg-[#0a1628] border border-slate-700/60 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl"
      >
        {/* Modal başlık */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <TbBrandX size={16} className="text-sky-400" />
            <span className="text-sm font-bold text-white">X'te Paylaş</span>
          </div>
          <button onClick={onClose} className="p-1 text-slate-500 hover:text-white transition-colors">
            <TbX size={16} />
          </button>
        </div>

        {/* Kart önizleme — tamamen client-side */}
        <div className="p-5">
          <div className={`rounded-xl border overflow-hidden ${colorCls.border} ${colorCls.bg}`} style={{ aspectRatio: "1200/630" }}>
            {/* Kart header */}
            <div className={`flex items-center justify-between px-4 py-3 border-b ${colorCls.border} ${colorCls.hdr}`}>
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-md flex items-center justify-center font-black text-sm ${colorCls.text} border ${colorCls.border}`}>R</div>
                <span className={`text-xs font-black tracking-widest ${colorCls.text}`}>RdAlgo · BIST</span>
              </div>
              <span className={`text-xs font-black px-2 py-0.5 rounded-full ${colorCls.badge}`}>{cat.count} sinyal</span>
            </div>
            {/* Kategori başlığı */}
            <div className="px-4 pt-3 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">{cat.emoji}</span>
                <span className={`text-sm font-black ${colorCls.text}`}>{cat.label}</span>
              </div>
            </div>
            {/* Ticker listesi */}
            <div className="px-4 pb-3 flex flex-wrap gap-1.5">
              {tickers.slice(0, 18).map((t) => (
                <span key={t} className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded border ${colorCls.ticker}`}>
                  #{t}
                </span>
              ))}
              {cat.count > 18 && (
                <span className="text-[11px] text-slate-600 self-center">+{cat.count - 18} hisse</span>
              )}
            </div>
            {/* Footer */}
            <div className="px-4 py-2 border-t border-slate-800/40 flex justify-between">
              <span className="text-[10px] text-slate-600">#bist #borsa #hisse</span>
            </div>
          </div>

          {/* Tweet metni */}
          <div className="mt-4 rounded-xl border border-slate-700/50 bg-slate-900/60 p-3">
            <p className="text-xs text-slate-600 mb-1.5 uppercase tracking-widest font-semibold">Tweet Metni</p>
            <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{tweetText}</p>
          </div>
          <p className="mt-2 text-xs text-slate-600 text-center">
            Görseli indirin, tweete ekleyin ve metin ile birlikte paylaşın.
          </p>
        </div>

        {/* Butonlar */}
        <div className="flex gap-2.5 px-5 pb-5">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-sm font-semibold transition-colors disabled:opacity-50"
          >
            <TbDownload size={15} />
            {downloading ? "İndiriliyor..." : "PNG İndir"}
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-sm font-semibold transition-colors"
            title="Metni kopyala"
          >
            {copied ? <TbCheck size={15} className="text-emerald-400" /> : <span className="text-xs">Kopyala</span>}
          </button>
          <button
            onClick={() => openTweet(tweetText)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-sm font-bold transition-colors"
          >
            <TbBrandX size={15} />
            Tweet At
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Sidebar — tek grup satırı ─────────────────────────────────────────────────
function SidebarGroupItem({
  group,
  cats,
  isActive,
  onSelect,
}: {
  group: GroupDef;
  cats: ScanCategory[];
  isActive: boolean;
  onSelect: () => void;
}) {
  const c = colorMap[group.color] ?? colorMap["emerald"];
  const totalSignals = cats.reduce((a, cat) => a + cat.count, 0);
  const activeCats = cats.filter((cat) => cat.count > 0).length;
  const progress = cats.length > 0 ? Math.round((activeCats / cats.length) * 100) : 0;

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left px-3 py-2.5 rounded-xl border transition-all duration-150 ${
        isActive
          ? c.sidebarActive
          : "border-transparent hover:bg-slate-800/40 text-slate-400 hover:text-slate-200"
      }`}
    >
      <div className="flex items-center gap-2.5">
        <div className={`shrink-0 p-1 rounded-lg border ${c.icon}`}>{group.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span className={`text-xs font-semibold truncate ${isActive ? c.label : ""}`}>
              {group.label}
            </span>
            <span className={`shrink-0 text-xs font-black px-1.5 py-0.5 rounded-full ${
              totalSignals > 0 ? c.badge : "bg-slate-800/60 text-slate-600"
            }`}>
              {totalSignals}
            </span>
          </div>
          {/* Mini progress bar */}
          <div className="mt-1 h-0.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${c.progress}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-600 mt-0.5">
            {activeCats > 0 ? `${activeCats}/${cats.length} aktif` : "Sinyal yok"}
          </p>
        </div>
      </div>
    </button>
  );
}

// ── Sağ panel — seçili grubun içeriği ─────────────────────────────────────────
function ResultPanel({
  group,
  cats,
  favorites,
  toggleFavorite,
  onShare,
}: {
  group: GroupDef;
  cats: ScanCategory[];
  favorites: Set<string>;
  toggleFavorite: (ticker: string) => void;
  onShare: (cat: ScanCategory) => void;
}) {
  const c = colorMap[group.color] ?? colorMap["emerald"];
  const totalSignals = cats.reduce((a, cat) => a + cat.count, 0);

  return (
    <motion.div
      key={group.id}
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.18 }}
      className="h-full"
    >
      {/* Panel başlık */}
      <div className={`flex items-center justify-between px-5 py-4 rounded-2xl border mb-3 ${c.border} ${c.headerBg}`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl border ${c.icon}`}>{group.icon}</div>
          <div>
            <h2 className={`text-base font-black ${c.label}`}>{group.label}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{group.desc}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {totalSignals > 0 && (
            <button
              onClick={() => openTweet(buildGroupTweetText(group.label, cats))}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors border-sky-800/50 text-sky-500 hover:text-sky-300 hover:border-sky-600 bg-sky-950/20`}
              title="Tüm grubu X'te paylaş"
            >
              <TbBrandX size={13} />
              <span className="hidden sm:inline">Paylaş</span>
            </button>
          )}
          <div className="text-right">
            <p className={`text-2xl font-black ${c.label}`}>{totalSignals}</p>
            <p className="text-[10px] text-slate-600 uppercase tracking-widest">sinyal</p>
          </div>
        </div>
      </div>

      {/* Kategoriler */}
      <div className="space-y-3">
        {cats.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900/20 p-8 text-center">
            <p className="text-slate-600 text-sm">Bu grupta kategori tanımlanmamış.</p>
          </div>
        ) : (
          cats.map((cat) => (
            <CategoryCard
              key={cat.key}
              cat={cat}
              color={group.color}
              favorites={favorites}
              toggleFavorite={toggleFavorite}
              onShare={onShare}
            />
          ))
        )}
      </div>
    </motion.div>
  );
}

// ── Kategori kartı (yeni, daha zengin) ────────────────────────────────────────
function CategoryCard({
  cat,
  color,
  favorites,
  toggleFavorite,
  onShare,
}: {
  cat: ScanCategory;
  color: keyof typeof colorMap;
  favorites: Set<string>;
  toggleFavorite: (ticker: string) => void;
  onShare: (cat: ScanCategory) => void;
}) {
  const [open, setOpen] = useState(cat.count > 0);
  const c = colorMap[color] ?? colorMap["emerald"];

  return (
    <div className={`rounded-xl border overflow-hidden transition-colors ${
      cat.count > 0 ? c.border : "border-slate-800/50"
    }`}>
      <div className={`flex items-center hover:bg-white/5 transition-colors ${
        cat.count > 0 ? c.headerBg : "bg-slate-900/20"
      }`}>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex-1 flex items-center justify-between px-4 py-3"
          aria-expanded={open}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-base leading-none">{cat.emoji}</span>
            <span className={`text-sm font-semibold truncate text-left ${
              cat.count > 0 ? "text-slate-200" : "text-slate-600"
            }`}>
              {cat.label}
            </span>
            {cat.count === 0 && (
              <span className="text-[10px] text-slate-700 italic">sinyal yok</span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-3">
            <span className={`text-xs font-black px-2 py-0.5 rounded-full ${
              cat.count > 0 ? c.badge : "bg-slate-800/40 text-slate-700"
            }`}>
              {cat.count}
            </span>
            {open ? (
              <HiChevronUp className="text-slate-600 w-3.5 h-3.5" />
            ) : (
              <HiChevronDown className="text-slate-600 w-3.5 h-3.5" />
            )}
          </div>
        </button>
        {cat.count > 0 && (
          <button
            onClick={() => onShare(cat)}
            className="shrink-0 pr-4 py-3 text-slate-700 hover:text-sky-400 transition-colors"
            title="X'te paylaş"
          >
            <TbBrandX size={13} />
          </button>
        )}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <div className={`px-4 pb-4 border-t ${c.divider}`}>
              {(cat.stocks ?? []).length === 0 ? (
                <p className="text-xs text-slate-600 italic mt-3">
                  Bu formasyonda hisse bulunamadı.
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {(cat.stocks ?? []).map((row) => {
                    // ticker her zaman string olmalı — bozuk/nested objeden koru
                    const rawTicker = typeof row === "string" ? row : row.ticker;
                    const ticker = typeof rawTicker === "string" ? rawTicker : null;
                    if (!ticker) return null; // obje ticker → atla
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
                          {favorites.has(ticker) ? <TbStarFilled size={11} /> : <TbStar size={11} />}
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

// ── Bildirim grubu metadata (bireysel key'lerle) ────────────────────────────
const ALERT_GROUPS_DETAILED = [
  {
    id: "formasyon_bull", label: "Bullish Formasyonlar", emoji: "📈",
    keys: [
      { id: "strong_up",        label: "Güçlü Yükseliş"         },
      { id: "golden_cross",     label: "Altın Kesişim"           },
      { id: "tobo_break",       label: "TOBO (Ters Baş-Omuz)"   },
      { id: "channel_break",       label: "Kanal Kırılımı"          },
      { id: "triangle_break_up",   label: "Üçgen Yukarı Kıran"      },
      { id: "trend_break",         label: "Trend Kırılımı"          },
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
    id: "stochrsi", label: "Stokastik RSI", emoji: "📊",
    keys: [
      { id: "stoch_rsi_os",      label: "StochRSI Aşırı Satım (K<20)"   },
      { id: "stoch_rsi_crossup", label: "StochRSI K, D'yi Yukarı Kesti" },
    ],
  },
  {
    id: "bearish", label: "Bearish Formasyonlar", emoji: "📉",
    keys: [
      { id: "death_cross",         label: "Ölüm Kesişimi"           },
      { id: "obo_break",            label: "OBO (Baş-Omuz)"          },
      { id: "ikili_tepe_break",     label: "İkili Tepe (M)"          },
      { id: "rsi_desc_break",       label: "RSI Düşen Trend Kırılım" },
      { id: "triangle_break_down",  label: "Üçgen Aşağı Kıran"       },
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
  const [selectedGroupId, setSelectedGroupId]   = useState<string | null>(null);
  const [shareCat, setShareCat]                 = useState<ScanCategory | null>(null);

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
  // API henüz sonuç döndürmemiş key'ler için placeholder kategori oluşturulur
  const groupedData = activeGroups.map((group) => ({
    group,
    cats: group.keys.map((keyId) => {
      const found = (data?.categories ?? []).find((c) => c.key === keyId);
      if (found) return found;
      // API'den henüz sonuç gelmemiş — placeholder
      const keyDef = (remoteGroups ?? [])
        .flatMap((g) => g.keys ?? [])
        .find((k) => k.id === keyId);
      return {
        key: keyId,
        label: keyDef?.label ?? keyId,
        emoji: "📊",
        count: 0,
        stocks: [],
      } as ScanCategory;
    }),
  }));
  // Grubun hiç key'i yoksa gizle (boş/tanımsız grup); key tanımlıysa sinyal olmasa da göster
  const visibleGroupData = groupedData.filter(({ group }) => group.keys.length > 0);

  // Seçili grup — varsayılan olarak ilk grup
  const effectiveGroupId = selectedGroupId ?? visibleGroupData[0]?.group.id ?? null;
  const selectedEntry = visibleGroupData.find((x) => x.group.id === effectiveGroupId) ?? visibleGroupData[0] ?? null;

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
  // harmonic_short bear'a dahil
  const bearSignals = (data?.categories ?? [])
    .filter((c) => !activeBullKeys.includes(c.key) || c.key === "harmonic_short")
    .reduce((a, c) => a + c.count, 0);
  const reversalSignals = (data?.categories ?? [])
    .filter((c) => REVERSAL_KEYS.includes(c.key))
    .reduce((a, c) => a + c.count, 0);

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

      <AnimatePresence>
        {shareCat && (
          <ShareModal cat={shareCat} onClose={() => setShareCat(null)} />
        )}
      </AnimatePresence>

      <section id="hisse-teknik-analizi" className="py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">

          {/* ── Başlık + Toolbar ── */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <p className="text-xs font-semibold tracking-[0.2em] text-emerald-500 uppercase mb-1">
                  Otomatik Tarama
                </p>
                <h1 className="text-2xl md:text-3xl font-black text-white">
                  Hisse <span className="text-emerald-400">Teknik</span> Analizi
                </h1>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
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
                  {alertEnabled && alertChatId ? <TbBell className="w-4 h-4" /> : <TbBellOff className="w-4 h-4" />}
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
                <a
                  href="/hisse-teknik-analizi/taramalarim"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-blue-800/60 text-blue-400 bg-blue-950/20 hover:border-blue-500 hover:bg-blue-950/40 transition-colors text-sm"
                >
                  <TbSearch className="w-4 h-4" />
                  <span className="hidden sm:inline">Taramalarım</span>
                </a>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-700 text-slate-500 hover:text-rose-400 hover:border-rose-800 transition-colors text-sm"
                >
                  <HiLogout className="w-4 h-4" />
                  <span className="hidden sm:inline">Çıkış</span>
                </button>
              </div>
            </div>

            {/* Durum satırı */}
            {data && (
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                <span className="flex items-center gap-1">
                  <HiClock className="w-3 h-3" />
                  {data.lastRun ? `Son tarama: ${timeAgoLabel(data.minutesAgo)}` : "Henüz tarama yapılmadı"}
                </span>
                {data.status === "running" && (
                  <span className="flex items-center gap-1.5 text-amber-400 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    Tarama devam ediyor…
                  </span>
                )}
              </div>
            )}
          </motion.div>

          {/* ── Bildirim Paneli ── */}
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
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-500 hidden sm:block">{alertEnabled ? "Açık" : "Kapalı"}</span>
                      <button
                        onClick={() => setAlertEnabled((v) => !v)}
                        className={`relative w-11 h-6 rounded-full transition-colors ${alertEnabled ? "bg-emerald-600" : "bg-slate-700"}`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${alertEnabled ? "translate-x-5" : "translate-x-0"}`} />
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
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Telegram Chat ID</label>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-xs text-slate-600 flex-1">
                              Önce botu başlatın, ardından <span className="text-emerald-500 font-mono">/mychatid</span> yazın ve çıkan numarayı yapıştırın.
                            </p>
                            <a href="https://t.me/RdAlgoBildirim_Bot" target="_blank" rel="noopener noreferrer" className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-950/50 border border-sky-800/60 hover:bg-sky-900/50 transition-colors text-sky-400 text-xs font-semibold">
                              <TbBrandTelegram size={14} />Botu Aç
                            </a>
                          </div>
                          <div className="flex items-center gap-2">
                            <TbBrandTelegram size={16} className="text-sky-400 shrink-0" />
                            <input
                              type="text" inputMode="numeric" placeholder="örn: 123456789"
                              value={alertChatId}
                              onChange={(e) => setAlertChatId(e.target.value.replace(/[^-\d]/g, ""))}
                              className="flex-1 bg-[#0a1628] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-600 transition-colors"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Hangi Sinyallerde Bildirim Alayım?</label>
                          <div className="space-y-1.5">
                            {activeAlertGroups.map((g) => {
                              const full = isGroupFull(g.id);
                              const partial = isGroupPartial(g.id);
                              const open = expandedGroups.has(g.id);
                              const selectedCount = g.keys.filter((k) => alertCategories.includes(k.id)).length;
                              return (
                                <div key={g.id} className={`rounded-xl border overflow-hidden transition-colors ${full ? "border-emerald-700/70" : partial ? "border-emerald-900/50" : "border-slate-800"}`}>
                                  <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-900/40">
                                    <button onClick={() => toggleGroup(g.id)} className={`flex items-center justify-center w-5 h-5 rounded border shrink-0 transition-colors ${full ? "bg-emerald-600 border-emerald-500" : partial ? "bg-emerald-950 border-emerald-700" : "bg-slate-800 border-slate-600 hover:border-slate-400"}`}>
                                      {full && <TbCheck size={11} className="text-white" />}
                                      {partial && <span className="w-2 h-0.5 bg-emerald-400 rounded-full" />}
                                    </button>
                                    <span className="text-base leading-none">{g.emoji}</span>
                                    <span className={`flex-1 text-sm font-semibold ${full || partial ? "text-white" : "text-slate-400"}`}>{g.label}</span>
                                    {(full || partial) && <span className="text-xs text-emerald-600 shrink-0">{selectedCount}/{g.keys.length}</span>}
                                    <button onClick={() => setExpandedGroups((prev) => { const next = new Set(prev); next.has(g.id) ? next.delete(g.id) : next.add(g.id); return next; })} className="p-1 text-slate-500 hover:text-slate-300 transition-colors">
                                      {open ? <HiChevronUp size={14} /> : <HiChevronDown size={14} />}
                                    </button>
                                  </div>
                                  {open && (
                                    <div className="px-3 pb-2 pt-1 bg-slate-950/50 border-t border-slate-800/50 grid grid-cols-1 sm:grid-cols-2 gap-0.5">
                                      {g.keys.map((k) => {
                                        const keyActive = alertCategories.includes(k.id);
                                        return (
                                          <button key={k.id} onClick={() => toggleKey(k.id)} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors ${keyActive ? "text-emerald-300" : "text-slate-500 hover:text-slate-300"}`}>
                                            <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-colors ${keyActive ? "bg-emerald-600 border-emerald-500" : "border-slate-600"}`}>
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
                        <div className="flex items-center gap-3">
                          <button onClick={saveProfile} disabled={alertSaving} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors disabled:opacity-50">
                            <TbDeviceFloppy size={16} />
                            {alertSaving ? "Kaydediliyor..." : "Kaydet"}
                          </button>
                          {alertMsg && (
                            <p className={`text-sm ${alertMsg.type === "ok" ? "text-emerald-400" : "text-rose-400"}`}>
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

          {/* ── İstatistik Şeridi ── */}
          {data && !loading && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-6">
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {/* Toplam */}
                <div className="col-span-1 bg-[#0a1628] border border-slate-800 rounded-2xl p-3 flex flex-col items-center gap-1">
                  <TbChartLine size={18} className="text-slate-500" />
                  <p className="text-xl font-black text-white">{totalSignals}</p>
                  <p className="text-[10px] text-slate-600 uppercase tracking-wide">Toplam</p>
                </div>
                {/* Bull */}
                <div className="col-span-1 bg-emerald-950/30 border border-emerald-900/50 rounded-2xl p-3 flex flex-col items-center gap-1">
                  <HiTrendingUp size={18} className="text-emerald-400" />
                  <p className="text-xl font-black text-emerald-400">{bullSignals - reversalSignals}</p>
                  <p className="text-[10px] text-emerald-700 uppercase tracking-wide">Bullish</p>
                </div>
                {/* Bear */}
                <div className="col-span-1 bg-rose-950/20 border border-rose-900/40 rounded-2xl p-3 flex flex-col items-center gap-1">
                  <HiTrendingDown size={18} className="text-rose-400" />
                  <p className="text-xl font-black text-rose-400">{bearSignals}</p>
                  <p className="text-[10px] text-rose-700 uppercase tracking-wide">Bearish</p>
                </div>
                {/* Dönüş Sinyali */}
                <div className="col-span-1 bg-violet-950/20 border border-violet-900/40 rounded-2xl p-3 flex flex-col items-center gap-1">
                  <TbActivity size={18} className="text-violet-400" />
                  <p className="text-xl font-black text-violet-400">{reversalSignals}</p>
                  <p className="text-[10px] text-violet-700 uppercase tracking-wide">Dönüş</p>
                </div>
                {/* Bull/Bear oranı */}
                <div className="col-span-3 sm:col-span-2 bg-slate-900/40 border border-slate-800 rounded-2xl p-3 flex flex-col justify-center gap-2">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-emerald-500 font-semibold">BULL {totalSignals > 0 ? Math.round((bullSignals / totalSignals) * 100) : 0}%</span>
                    <span className="text-rose-500 font-semibold">BEAR {totalSignals > 0 ? Math.round((bearSignals / totalSignals) * 100) : 0}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-rose-950/60 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-700"
                      style={{ width: totalSignals > 0 ? `${Math.round((bullSignals / totalSignals) * 100)}%` : "50%" }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-600 text-center">
                    {overlappingTickers.length > 0 ? `${overlappingTickers.length} hisse 2+ kategoride` : "Sinyal dağılımı"}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Favoriler ── */}
          {!loading && !error && data && favorites.size > 0 && (
            <div className="mb-5">
              <FavoritesSection favorites={favorites} scanCategories={data.categories} toggleFavorite={toggleFavorite} />
            </div>
          )}

          {/* ── Skeleton ── */}
          {loading && !data && (
            <div className="flex gap-4">
              <div className="w-56 shrink-0 space-y-2">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-14 rounded-xl bg-slate-800/40 animate-pulse" />
                ))}
              </div>
              <div className="flex-1 space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-14 rounded-xl bg-slate-800/40 animate-pulse" />
                ))}
              </div>
            </div>
          )}

          {/* ── Hata ── */}
          {error && (
            <div className="rounded-xl border border-rose-900/50 bg-rose-950/20 p-6 text-center">
              <p className="text-rose-400 font-semibold mb-1">Bağlantı Hatası</p>
              <p className="text-slate-500 text-sm mb-3">{error}</p>
              <button onClick={load} className="text-xs text-emerald-400 hover:underline">Tekrar dene</button>
            </div>
          )}

          {/* ── Ana İki Sütunlu Layout ── */}
          {!loading && !error && data && (
            <div className="flex gap-4 items-start">

              {/* Sol Sidebar — Grup Listesi */}
              <motion.div
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 }}
                className="w-52 shrink-0 space-y-1 sticky top-20"
              >
                <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-3 mb-2">Kategoriler</p>
                {visibleGroupData.map(({ group, cats }) => (
                  <SidebarGroupItem
                    key={group.id}
                    group={group}
                    cats={cats}
                    isActive={effectiveGroupId === group.id}
                    onSelect={() => setSelectedGroupId(group.id)}
                  />
                ))}

                {/* Ortak Sinyaller */}
                {overlappingTickers.length > 0 && (
                  <button
                    onClick={() => setSelectedGroupId("__overlapping__")}
                    className={`w-full text-left px-3 py-2.5 rounded-xl border transition-all duration-150 ${
                      effectiveGroupId === "__overlapping__"
                        ? "bg-amber-950/50 border border-amber-700/60 text-amber-300"
                        : "border-transparent hover:bg-slate-800/40 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`shrink-0 p-1 rounded-lg border ${
                        effectiveGroupId === "__overlapping__"
                          ? "text-amber-400 bg-amber-950/50 border-amber-900/50"
                          : "text-slate-500 border-slate-700/50 bg-slate-800/40"
                      }`}>
                        <TbStarFilled size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className={`text-xs font-semibold truncate ${
                            effectiveGroupId === "__overlapping__" ? "text-amber-400" : ""
                          }`}>Ortak Sinyaller</span>
                          <span className={`shrink-0 text-xs font-black px-1.5 py-0.5 rounded-full ${
                            effectiveGroupId === "__overlapping__"
                              ? "bg-amber-800/60 text-amber-300"
                              : "bg-slate-800/60 text-slate-400"
                          }`}>{overlappingTickers.length}</span>
                        </div>
                        <p className="text-[10px] text-slate-600 mt-0.5">2+ kategoride görünen</p>
                      </div>
                    </div>
                  </button>
                )}

                {/* Özel: Gruplanmamış */}
                {ungroupedCats.length > 0 && (
                  <button
                    onClick={() => setSelectedGroupId("__ungrouped__")}
                    className={`w-full text-left px-3 py-2.5 rounded-xl border transition-all duration-150 ${
                      effectiveGroupId === "__ungrouped__"
                        ? "bg-slate-800/60 border border-slate-600 text-slate-300"
                        : "border-transparent hover:bg-slate-800/40 text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-lg border text-slate-500 border-slate-700/50 bg-slate-800/40">
                        <TbFlame size={14} />
                      </div>
                      <span className="text-xs font-semibold flex-1">Diğer</span>
                      <span className="text-xs font-black text-slate-600">{ungroupedCats.reduce((a, c) => a + c.count, 0)}</span>
                    </div>
                  </button>
                )}
              </motion.div>

              {/* Sağ Panel — Seçili Grubun İçeriği */}
              <div className="flex-1 min-w-0">
                <AnimatePresence mode="wait">
                  {effectiveGroupId === "__overlapping__" ? (
                    <motion.div key="overlapping" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.18 }}>
                      <div className="flex items-center justify-between px-5 py-4 rounded-2xl border border-amber-700/50 bg-amber-950/20 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl border border-amber-800/50 bg-amber-950/50 text-amber-400">
                            <TbStarFilled size={16} />
                          </div>
                          <div>
                            <h2 className="text-base font-black text-amber-300">Ortak Sinyaller</h2>
                            <p className="text-xs text-slate-500 mt-0.5">Aynı günde 2 veya daha fazla kategoride sinyal veren hisseler</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-black text-amber-400">{overlappingTickers.length}</p>
                          <p className="text-[10px] text-slate-600 uppercase tracking-widest">hisse</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {overlappingTickers.map(([ticker, info]) => (
                          <div key={ticker} className="flex items-center justify-between px-4 py-3 rounded-xl border border-amber-800/30 bg-amber-950/10 hover:bg-amber-950/20 transition-colors">
                            <div className="flex items-center gap-3">
                              <span className={`flex items-center justify-center w-7 h-7 rounded-full text-sm font-black ${
                                info.count >= 4 ? "bg-emerald-400 text-black" : info.count >= 3 ? "bg-amber-400 text-black" : "bg-amber-800/60 text-amber-200"
                              }`}>{info.count}</span>
                              <div>
                                <a
                                  href={`https://tr.tradingview.com/chart/?symbol=BIST%3A${ticker}`}
                                  target="_blank" rel="noopener noreferrer"
                                  className="text-sm font-mono font-black text-amber-300 hover:text-amber-200 hover:underline"
                                >{ticker}</a>
                                <p className="text-[10px] text-slate-600 mt-0.5">{info.categories.join(" · ")}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${
                                info.isBull
                                  ? "text-emerald-400 border-emerald-800/50 bg-emerald-950/30"
                                  : "text-rose-400 border-rose-800/50 bg-rose-950/30"
                              }`}>{info.isBull ? "↑ Bull" : "↓ Bear"}</span>
                              <TbExternalLink size={12} className="text-slate-600" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ) : effectiveGroupId === "__ungrouped__" ? (
                    <motion.div key="ungrouped" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.18 }}>
                      <div className="flex items-center justify-between px-5 py-4 rounded-2xl border border-slate-800 bg-slate-900/30 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl border border-slate-700/50 bg-slate-800/40 text-slate-400"><TbFlame size={16} /></div>
                          <div>
                            <h2 className="text-base font-black text-slate-300">Diğer Sinyaller</h2>
                            <p className="text-xs text-slate-600 mt-0.5">Gruplanmamış tarama sonuçları</p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {ungroupedCats.map((cat) => (
                          <CategoryCard key={cat.key} cat={cat} color={activeBullKeys.includes(cat.key) ? "emerald" : "rose"} favorites={favorites} toggleFavorite={toggleFavorite} onShare={(c) => setShareCat(c)} />
                        ))}
                      </div>
                    </motion.div>
                  ) : selectedEntry ? (
                    <ResultPanel
                      key={selectedEntry.group.id}
                      group={selectedEntry.group}
                      cats={selectedEntry.cats}
                      favorites={favorites}
                      toggleFavorite={toggleFavorite}
                      onShare={(cat) => setShareCat(cat)}
                    />
                  ) : null}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* ── Pending ── */}
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
