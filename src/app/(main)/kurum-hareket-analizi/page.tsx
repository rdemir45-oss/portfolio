"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TbUpload,
  TbFileSpreadsheet,
  TbAlertTriangle,
  TbX,
  TbChartLine,
  TbSearch,
} from "react-icons/tb";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { KurumHareketData } from "@/lib/kurum-hareket-parser";
import { parseKurumHareket, formatZaman } from "@/lib/kurum-hareket-parser";

const COLORS_ALICI = [
  "#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#06b6d4",
  "#f97316", "#84cc16", "#ec4899", "#a78bfa", "#34d399",
];

const COLORS_SATICI = [
  "#ef4444", "#f97316", "#eab308", "#db2777", "#dc2626",
  "#9333ea", "#c2410c", "#be123c", "#b45309", "#7c3aed",
];

function formatMs(ms: number): string {
  return formatZaman(ms);
}

function formatLot(val: number): string {
  return `${val > 0 ? "+" : ""}${Math.round(val).toLocaleString("tr-TR")}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl bg-[#0a1628] border border-slate-700 shadow-xl px-3 py-2 text-xs">
      <p className="text-slate-400 mb-1 font-medium">{formatMs(label)}</p>
      {payload.map((entry: { name: string; value: number; color: string }) => (
        <p key={entry.name} style={{ color: entry.color }} className="leading-5">
          <span className="font-semibold">{entry.name.split(" (")[0]}</span>:{" "}
          {formatLot(entry.value)}
        </p>
      ))}
    </div>
  );
}

export default function KurumHareketAnaliziPage() {
  const [data, setData] = useState<KurumHareketData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [lotAdet, setLotAdet] = useState("");

  const handleFile = useCallback(async (file: File) => {
    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    if (![".xlsx", ".xls"].includes(ext)) {
      setError("Sadece .xlsx veya .xls dosyaları desteklenir.");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setError("Dosya boyutu 50 MB sınırını aşıyor.");
      return;
    }
    setLoading(true);
    setError(null);
    setData(null);
    setFileName(file.name);
    setLotAdet("");
    try {
      const buffer = await file.arrayBuffer();
      const parsed = parseKurumHareket(buffer);
      setData(parsed);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Dosya işlenirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      e.target.value = "";
    },
    [handleFile]
  );

  const xAxisProps = data
    ? {
        type: "number" as const,
        domain: [data.minZaman, data.maxZaman],
        tickFormatter: formatMs,
        tickCount: 8,
        tick: { fill: "#94a3b8", fontSize: 11 },
        stroke: "#334155",
      }
    : {};

  // Lot Sayar
  const targetAdet = lotAdet ? parseInt(lotAdet) : null;
  const lotSonuclar = data && targetAdet !== null && !isNaN(targetAdet)
    ? data.rawRows.filter((r) => r.adet === targetAdet)
    : null;

  const lotKurumOzet = lotSonuclar
    ? (() => {
        const map = new Map<string, { alan: number; satan: number }>();
        for (const r of lotSonuclar) {
          const a = map.get(r.alanKurum) ?? { alan: 0, satan: 0 };
          a.alan += 1;
          map.set(r.alanKurum, a);
          const s = map.get(r.satanKurum) ?? { alan: 0, satan: 0 };
          s.satan += 1;
          map.set(r.satanKurum, s);
        }
        return [...map.entries()]
          .map(([kurum, v]) => ({ kurum, alan: v.alan, satan: v.satan, toplam: v.alan + v.satan }))
          .sort((a, b) => b.toplam - a.toplam)
          .slice(0, 20);
      })()
    : null;

  return (
    <main className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            Kurum <span className="text-emerald-400">Hareket Analizi</span>
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Excel dosyanızı yükleyin, kurumların gün içi kümülatif net pozisyonlarını
            interaktif grafik olarak görüntüleyin.
          </p>
        </motion.div>

        {/* Upload Area */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div
            onDrop={onDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => fileInputRef.current?.click()}
            className={`
              relative cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-200
              ${dragOver ? "border-emerald-400 bg-emerald-950/20" : "border-slate-700 hover:border-slate-500 bg-[#0a1628]"}
              ${loading ? "pointer-events-none opacity-60" : ""}
            `}
          >
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={onFileChange} className="hidden" />
            {loading ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-300">Dosya işleniyor...</p>
              </div>
            ) : (
              <>
                <TbUpload className="mx-auto text-4xl text-slate-400 mb-3" />
                <p className="text-lg text-slate-300 mb-1">Excel dosyanızı sürükleyip bırakın veya tıklayın</p>
                <p className="text-sm text-slate-500">.xlsx veya .xls — maks. 50 MB</p>
                <p className="text-xs text-slate-600 mt-2">Gerekli sütunlar: Saat, Alan Kurum, Satan Kurum, Adet</p>
                {fileName && data && (
                  <div className="mt-4 flex items-center justify-center gap-2 text-emerald-400">
                    <TbFileSpreadsheet className="text-xl" />
                    <span className="text-sm">{fileName}</span>
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 flex items-start gap-2 rounded-xl bg-rose-950/40 border border-rose-800/60 px-4 py-3 text-rose-400"
            >
              <TbAlertTriangle className="text-xl shrink-0 mt-0.5" />
              <span className="text-sm whitespace-pre-line">{error}</span>
              <button onClick={() => setError(null)} className="ml-auto shrink-0">
                <TbX />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Charts */}
        <AnimatePresence>
          {data && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-8 space-y-6"
            >
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard label="Toplam İşlem" value={data.toplamIslem} />
                <StatCard label="Net Alıcı Kurum" value={data.alicilar.length} color="emerald" />
                <StatCard label="Net Satıcı Kurum" value={data.saticilar.length} color="rose" />
                <StatCard label="Saat Aralığı" timeRange={`${formatZaman(data.minZaman)} — ${formatZaman(data.maxZaman)}`} />
              </div>

              {/* Lot Sayar */}
              <div className="rounded-2xl bg-[#0a1628] border border-slate-800 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <TbSearch className="text-amber-400 text-xl" />
                  <h2 className="text-lg font-semibold text-amber-400">Lot Sayar</h2>
                </div>
                <div className="flex gap-3 items-end">
                  <div className="flex-1 max-w-xs">
                    <label className="block text-sm text-slate-400 mb-1.5">Adet Sayısı</label>
                    <input
                      type="number"
                      value={lotAdet}
                      onChange={(e) => setLotAdet(e.target.value)}
                      placeholder="Örn: 71"
                      className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>
                  {lotSonuclar !== null && (
                    <div className="rounded-lg bg-amber-950/30 border border-amber-800/60 px-4 py-2 text-center">
                      <p className="text-xs text-amber-400/70">Eşleşen İşlem</p>
                      <p className="text-2xl font-bold text-amber-400">{lotSonuclar.length.toLocaleString("tr-TR")}</p>
                    </div>
                  )}
                </div>

                {lotSonuclar !== null && lotSonuclar.length === 0 && (
                  <p className="mt-3 text-sm text-slate-500">{targetAdet} adetlik işlem bulunamadı.</p>
                )}

                {lotKurumOzet && lotKurumOzet.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs text-slate-500 mb-2">Kurum dağılımı (alan / satan işlem sayısı):</p>
                    <div className="overflow-x-auto rounded-xl border border-slate-800">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-800 bg-slate-800/40">
                            <th className="text-left px-4 py-2 text-slate-400 font-medium">Kurum</th>
                            <th className="text-center px-4 py-2 text-emerald-400 font-medium">Alan</th>
                            <th className="text-center px-4 py-2 text-rose-400 font-medium">Satan</th>
                            <th className="text-center px-4 py-2 text-amber-400 font-medium">Toplam</th>
                          </tr>
                        </thead>
                        <tbody>
                          {lotKurumOzet.map((row, i) => (
                            <tr key={row.kurum} className={`border-b border-slate-800/60 ${i % 2 === 0 ? "" : "bg-slate-800/20"}`}>
                              <td className="px-4 py-2 text-slate-300">{row.kurum}</td>
                              <td className="px-4 py-2 text-center text-emerald-400">{row.alan > 0 ? row.alan : "—"}</td>
                              <td className="px-4 py-2 text-center text-rose-400">{row.satan > 0 ? row.satan : "—"}</td>
                              <td className="px-4 py-2 text-center text-amber-400 font-semibold">{row.toplam}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Chart 1: Top 10 Net Alıcılar */}
              <div className="rounded-2xl bg-[#0a1628] border border-slate-800 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <TbChartLine className="text-emerald-400 text-xl" />
                  <h2 className="text-lg font-semibold text-emerald-400">TOP 10 NET ALICI</h2>
                </div>
                <div className="overflow-x-auto">
                  <div style={{ minWidth: 600 }}>
                    <ResponsiveContainer width="100%" height={380}>
                      <LineChart margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="zamanMs" {...xAxisProps} />
                        <YAxis
                          tickFormatter={(v: number) => Math.round(v).toLocaleString("tr-TR")}
                          tick={{ fill: "#94a3b8", fontSize: 11 }}
                          stroke="#334155"
                          width={75}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                          wrapperStyle={{ fontSize: "11px", color: "#94a3b8", paddingTop: "8px" }}
                          formatter={(value: string) => value.split(" (")[0]}
                        />
                        <ReferenceLine y={0} stroke="#475569" strokeWidth={1} />
                        {data.alicilar.map((seri, i) => (
                          <Line
                            key={seri.kurum}
                            data={seri.data}
                            type="monotone"
                            dataKey="kumulatif"
                            name={`${seri.kurum} (${formatLot(seri.sonLot)})`}
                            stroke={COLORS_ALICI[i % COLORS_ALICI.length]}
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 4 }}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                {/* Legend table */}
                <div className="mt-3 grid grid-cols-2 md:grid-cols-5 gap-1.5">
                  {data.alicilar.map((seri, i) => (
                    <div key={seri.kurum} className="flex items-center gap-1.5 text-xs">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ background: COLORS_ALICI[i % COLORS_ALICI.length] }} />
                      <span className="text-slate-400 truncate" title={seri.kurum}>{seri.kurum}</span>
                      <span className="text-emerald-400 font-medium shrink-0">{formatLot(seri.sonLot)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chart 2: Top 10 Net Satıcılar */}
              <div className="rounded-2xl bg-[#0a1628] border border-slate-800 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <TbChartLine className="text-rose-400 text-xl" />
                  <h2 className="text-lg font-semibold text-rose-400">TOP 10 NET SATICI</h2>
                </div>
                <div className="overflow-x-auto">
                  <div style={{ minWidth: 600 }}>
                    <ResponsiveContainer width="100%" height={380}>
                      <LineChart margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="zamanMs" {...xAxisProps} />
                        <YAxis
                          tickFormatter={(v: number) => Math.round(v).toLocaleString("tr-TR")}
                          tick={{ fill: "#94a3b8", fontSize: 11 }}
                          stroke="#334155"
                          width={75}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                          wrapperStyle={{ fontSize: "11px", color: "#94a3b8", paddingTop: "8px" }}
                          formatter={(value: string) => value.split(" (")[0]}
                        />
                        <ReferenceLine y={0} stroke="#475569" strokeWidth={1} />
                        {data.saticilar.map((seri, i) => (
                          <Line
                            key={seri.kurum}
                            data={seri.data}
                            type="monotone"
                            dataKey="kumulatif"
                            name={`${seri.kurum} (${formatLot(seri.sonLot)})`}
                            stroke={COLORS_SATICI[i % COLORS_SATICI.length]}
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 4 }}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                {/* Legend table */}
                <div className="mt-3 grid grid-cols-2 md:grid-cols-5 gap-1.5">
                  {data.saticilar.map((seri, i) => (
                    <div key={seri.kurum} className="flex items-center gap-1.5 text-xs">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ background: COLORS_SATICI[i % COLORS_SATICI.length] }} />
                      <span className="text-slate-400 truncate" title={seri.kurum}>{seri.kurum}</span>
                      <span className="text-rose-400 font-medium shrink-0">{formatLot(seri.sonLot)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-center text-xs text-slate-500">
                Verileriniz tarayıcınızda işlenir, sunucuya gönderilmez.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  color = "slate",
  timeRange,
}: {
  label: string;
  value?: number;
  color?: "slate" | "emerald" | "rose";
  timeRange?: string;
}) {
  const colorMap = {
    slate: "text-white",
    emerald: "text-emerald-400",
    rose: "text-rose-400",
  };
  return (
    <div className="rounded-xl bg-[#0a1628] border border-slate-800 px-4 py-3">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      {timeRange ? (
        <p className="text-sm font-semibold text-slate-300">{timeRange}</p>
      ) : (
        <p className={`text-2xl font-bold ${colorMap[color]}`}>
          {(value ?? 0).toLocaleString("tr-TR")}
        </p>
      )}
    </div>
  );
}
