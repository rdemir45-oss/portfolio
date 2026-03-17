"use client";

import { useEffect } from "react";

export default function ScannerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Scanner Error]", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#050a0e] flex items-center justify-center px-4">
      <div className="bg-[#0a1628] border border-rose-800/60 rounded-2xl p-8 max-w-lg w-full text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <h2 className="text-lg font-bold text-white mb-2">Sayfa Yüklenirken Hata Oluştu</h2>
        <p className="text-sm text-slate-400 mb-4">{error?.message ?? "Bilinmeyen hata"}</p>
        {error?.stack && (
          <pre className="text-left text-xs text-rose-400 bg-rose-950/30 border border-rose-900/40 rounded-xl p-3 mb-4 overflow-auto max-h-48 whitespace-pre-wrap">
            {error.stack}
          </pre>
        )}
        <button
          onClick={reset}
          className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-semibold transition-colors"
        >
          Tekrar Dene
        </button>
      </div>
    </div>
  );
}
