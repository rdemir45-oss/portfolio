"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { HiLockClosed } from "react-icons/hi";

export default function ScannerLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push("/hisse-teknik-analizi");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Yanlış şifre.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#050a0e] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <a href="/" className="inline-flex items-center gap-2">
            <span className="text-emerald-400 font-black text-2xl tracking-tight">
              TheBigShort
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
          </a>
          <p className="text-slate-500 text-sm mt-2">Hisse Teknik Analizi</p>
        </div>

        <div className="bg-[#0a1628] border border-slate-800 rounded-2xl p-8">
          <div className="flex justify-center mb-5">
            <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-900/50">
              <HiLockClosed className="w-6 h-6 text-emerald-400" />
            </div>
          </div>
          <h1 className="text-lg font-bold text-white text-center mb-1">
            Üye Girişi
          </h1>
          <p className="text-slate-400 text-sm text-center mb-6">
            Bu sayfa yalnızca üyelere özeldir.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Şifre"
              autoFocus
              autoComplete="current-password"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-600 transition-colors"
            />
            {error && (
              <p className="text-red-400 text-sm text-center">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading || !password}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
            >
              {loading ? "Giriş yapılıyor…" : "Giriş Yap"}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          Şifre almak için{" "}
          <a
            href="/#contact"
            className="text-emerald-500 hover:text-emerald-400 transition-colors"
          >
            iletişime geçin
          </a>
          .
        </p>
      </motion.div>
    </main>
  );
}
