"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HiRefresh, HiClock, HiChevronDown, HiChevronUp, HiLogout } from "react-icons/hi";
import { useRouter } from "next/navigation";

interface ScanCategory {
  key: string;
  label: string;
  emoji: string;
  count: number;
  tickers: string[];
}

interface ScanData {
  status: "pending" | "running" | "done" | null;
  lastRun: number | null;
  nextRun: number | null;
  minutesAgo: number | null;
  categories: ScanCategory[];
}

const BULL_KEYS = [
  "golden_cross", "rsi_oversold", "macd_cross_up", "squeeze_breakout",
  "triangle_break", "trend_break", "ikili_dip_break", "fibo_setup",
  "rsi_asc_break", "rsi_tobo", "hbreak", "price_desc_break",
  "harmonic_long",
];

function timeAgoLabel(minutesAgo: number | null): string {
  if (minutesAgo === null) return "";
  if (minutesAgo < 1) return "Az önce";
  if (minutesAgo < 60) return `${minutesAgo} dk önce`;
  const h = Math.floor(minutesAgo / 60);
  const m = minutesAgo % 60;
  return m > 0 ? `${h} sa ${m} dk önce` : `${h} sa önce`;
}

function CategoryCard({ cat }: { cat: ScanCategory }) {
  const [open, setOpen] = useState(false);
  const isBull = BULL_KEYS.includes(cat.key);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border ${
        isBull
          ? "border-emerald-800/50 bg-emerald-950/20"
          : "border-rose-900/40 bg-rose-950/10"
      } overflow-hidden`}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-xl leading-none">{cat.emoji}</span>
          <span className="text-sm font-semibold text-slate-200 truncate">{cat.label}</span>
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-3">
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              cat.count > 0
                ? isBull
                  ? "bg-emerald-800/60 text-emerald-300"
                  : "bg-rose-900/60 text-rose-300"
                : "bg-slate-800 text-slate-500"
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
            transition={{ duration: 0.2 }}
          >
            <div className="px-4 pb-4">
              {cat.tickers.length === 0 ? (
                <p className="text-xs text-slate-500 italic">
                  Bu formasyonda hisse bulunamadı.
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {cat.tickers.map((ticker) => (
                    <a
                      key={ticker}
                      href={`https://tr.tradingview.com/chart/?symbol=BIST%3A${ticker}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`text-xs font-mono font-bold px-2 py-1 rounded-md border transition-colors ${
                        isBull
                          ? "border-emerald-700/50 text-emerald-400 hover:bg-emerald-900/40 bg-emerald-950/30"
                          : "border-rose-800/50 text-rose-400 hover:bg-rose-900/30 bg-rose-950/20"
                      }`}
                    >
                      {ticker}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function StockScanner() {
  const [data, setData] = useState<ScanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "bull" | "bear">("all");
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
    // Her 5 dakikada bir otomatik yenile
    const id = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [load]);

  const visibleCats =
    data?.categories?.filter((c) => {
      if (filter === "bull") return BULL_KEYS.includes(c.key);
      if (filter === "bear") return !BULL_KEYS.includes(c.key);
      return true;
    }) ?? [];

  const totalSignals = visibleCats.reduce((a, c) => a + c.count, 0);

  return (
    <section id="hisse-teknik-analizi" className="py-24 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Başlık */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-10"
        >
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <p className="text-xs font-semibold tracking-[0.2em] text-emerald-500 uppercase mb-2">
                Otomatik Tarama
              </p>
              <h2 className="text-3xl md:text-4xl font-black text-white mb-2">
                Hisse <span className="text-emerald-400">Teknik</span> Analizi
              </h2>
              <p className="text-slate-400 text-sm max-w-xl">
                BIST hisseleri her saat otomatik taranır. İkili dip, trend kırılımı, RSI
                sinyalleri ve daha fazlası gerçek zamanlı olarak güncellenir.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={load}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:border-emerald-700 transition-colors text-sm disabled:opacity-40"
              >
                <HiRefresh className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                Yenile
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-700 text-slate-500 hover:text-rose-400 hover:border-rose-800 transition-colors text-sm"
                title="Çıkış Yap"
              >
                <HiLogout className="w-4 h-4" />
                Çıkış
              </button>
            </div>
          </div>

          {/* Durum satırı */}
          {data && (
            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <HiClock className="w-3.5 h-3.5" />
                {data.lastRun
                  ? `Son tarama: ${timeAgoLabel(data.minutesAgo)}`
                  : "Henüz tarama yapılmadı"}
              </span>
              {data.status === "running" && (
                <span className="flex items-center gap-1 text-amber-400">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  Tarama devam ediyor…
                </span>
              )}
              <span className="text-slate-600">
                {totalSignals} aktif sinyal
              </span>
            </div>
          )}
        </motion.div>

        {/* Filtre */}
        <div className="flex gap-2 mb-6">
          {(["all", "bull", "bear"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                filter === f
                  ? f === "bear"
                    ? "bg-rose-900/40 border-rose-700 text-rose-300"
                    : "bg-emerald-900/40 border-emerald-700 text-emerald-300"
                  : "border-slate-700 text-slate-500 hover:text-slate-300"
              }`}
            >
              {f === "all" ? "Tümü" : f === "bull" ? "📈 Alış Sinyali" : "📉 Satış Sinyali"}
            </button>
          ))}
        </div>

        {/* İçerik */}
        {loading && !data && (
          <div className="grid gap-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-12 rounded-xl bg-slate-800/40 animate-pulse"
              />
            ))}
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-rose-900/50 bg-rose-950/20 p-6 text-center">
            <p className="text-rose-400 font-semibold mb-1">Bağlantı Hatası</p>
            <p className="text-slate-500 text-sm">{error}</p>
            <button
              onClick={load}
              className="mt-3 text-xs text-emerald-400 hover:underline"
            >
              Tekrar dene
            </button>
          </div>
        )}

        {!loading && !error && data && (
          <div className="grid gap-3">
            {visibleCats.map((cat) => (
              <CategoryCard key={cat.key} cat={cat} />
            ))}
          </div>
        )}

        {!loading && !error && data?.status === "pending" && (
          <div className="mt-6 text-center text-slate-500 text-sm">
            İlk tarama başlatılıyor, lütfen bekleyin…
          </div>
        )}
      </div>
    </section>
  );
}
