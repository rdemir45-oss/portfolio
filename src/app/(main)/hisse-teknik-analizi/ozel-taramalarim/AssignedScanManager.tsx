"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  TbPlayerPlay, TbChevronDown, TbChevronUp, TbLoader2,
  TbShieldCheck, TbSearch, TbClock, TbCheck,
} from "react-icons/tb";

type LastResult = { id: string; scan_id: string; tickers: string[]; ran_at: string };

type AssignedScan = {
  id: string;
  name: string;
  description?: string | null;
  scan_type: "rules" | "python";
  rules?: unknown;
  is_active: boolean;
  created_at: string;
  last_result: LastResult | null;
};

function formatDate(d: string) {
  return new Date(d).toLocaleString("tr-TR", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function ScanCard({ scan }: { scan: AssignedScan }) {
  const [expanded, setExpanded] = useState(false);
  const [running, setRunning]   = useState(false);
  const [result, setResult]     = useState<{ tickers: string[]; ranAt: string } | null>(
    scan.last_result
      ? { tickers: scan.last_result.tickers, ranAt: scan.last_result.ran_at }
      : null
  );
  const [runError, setRunError] = useState("");

  async function handleRun() {
    setRunning(true); setRunError("");
    try {
      const res = await fetch(`/api/user/assigned-scans/${scan.id}/run`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) { setRunError(data.error ?? "Hata oluştu."); }
      else { setResult({ tickers: data.tickers, ranAt: data.ranAt }); setExpanded(true); }
    } catch { setRunError("Bağlantı hatası."); }
    setRunning(false);
  }

  const tickers = result?.tickers ?? [];

  return (
    <div className="border border-slate-800 rounded-2xl bg-[#0a1628] overflow-hidden">
      {/* Kart başlığı */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-base font-bold text-white">{scan.name}</span>
              <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border text-violet-400 bg-violet-950/30 border-violet-800/50 shrink-0">
                <TbShieldCheck size={11} /> Yönetici Taraması
              </span>
            </div>
            {scan.description && (
              <p className="text-sm text-slate-400 mt-1">{scan.description}</p>
            )}
          </div>

          {/* Çalıştır butonu */}
          <button
            onClick={handleRun}
            disabled={running}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-700 hover:bg-emerald-600 text-white transition-colors disabled:opacity-50 shrink-0"
          >
            {running
              ? <TbLoader2 size={15} className="animate-spin" />
              : <TbPlayerPlay size={15} />}
            {running ? "Tarıyor..." : "Çalıştır"}
          </button>
        </div>

        {/* Son çalıştırma özeti */}
        {result && (
          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={() => setExpanded(v => !v)}
              className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              <TbClock size={12} />
              Son: {formatDate(result.ranAt)} —
              <span className={`font-semibold ${tickers.length > 0 ? "text-emerald-400" : "text-slate-500"}`}>
                {tickers.length} hisse
              </span>
              {expanded ? <TbChevronUp size={13} /> : <TbChevronDown size={13} />}
            </button>
          </div>
        )}

        {runError && <p className="text-xs text-rose-400 mt-2">{runError}</p>}
      </div>

      {/* Genişletilmiş sonuç */}
      {expanded && result && (
        <div className="border-t border-slate-800 px-5 py-4">
          {tickers.length === 0 ? (
            <p className="text-sm text-slate-500">Bu tarama için hisse bulunamadı.</p>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-3">
                <TbCheck size={14} className="text-emerald-400" />
                <span className="text-xs text-emerald-400 font-semibold">{tickers.length} hisse bulundu</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {tickers.map((ticker) => (
                  <span key={ticker}
                    className="text-xs font-mono px-2.5 py-1 rounded-lg border border-emerald-800/60 bg-emerald-950/30 text-emerald-300">
                    {ticker}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function AssignedScanManager() {
  const [scans, setScans]   = useState<AssignedScan[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchScans = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/user/assigned-scans");
    if (res.ok) setScans(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchScans(); }, [fetchScans]);

  return (
    <div className="max-w-3xl mx-auto px-4">
      {/* Başlık */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Size Özel Taramalar</h1>
        <p className="text-slate-400 text-sm mt-1">
          Yöneticiniz tarafından hesabınıza özel olarak hazırlanan taramalar. Çalıştırın ve sonuçları kalıcı olarak saklayın.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <TbLoader2 size={28} className="animate-spin text-violet-400" />
        </div>
      ) : scans.length === 0 ? (
        <div className="text-center py-24">
          <TbSearch size={40} className="mx-auto text-slate-700 mb-4" />
          <p className="text-slate-400 font-medium">Henüz size özel bir tarama atanmadı.</p>
          <p className="text-slate-600 text-sm mt-1">Yöneticiniz hesabınıza özel bir tarama oluşturduğunda burada görünecek.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {scans.map((scan) => (
            <ScanCard key={scan.id} scan={scan} />
          ))}
        </div>
      )}
    </div>
  );
}
