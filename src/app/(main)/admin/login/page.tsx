"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { HiShieldCheck } from "react-icons/hi";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password) return;
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      window.location.href = "/admin/dashboard";
    } else {
      setError("Yanlış şifre. Tekrar deneyin.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#050a0e] flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <a href="/" className="inline-flex items-center gap-2">
            <span className="text-emerald-400 font-black text-2xl tracking-tight">RdAlgo</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
          </a>
          <p className="text-slate-500 text-sm mt-2">Yönetim Paneli</p>
        </div>

        {/* Kart */}
        <div className="bg-[#0a1628] border border-slate-800 rounded-2xl p-8">
          {/* İkon */}
          <div className="flex justify-center mb-5">
            <div className="p-3 rounded-xl bg-violet-950/50 border border-violet-900/50">
              <HiShieldCheck className="w-6 h-6 text-violet-400" />
            </div>
          </div>

          <h1 className="text-lg font-bold text-white text-center mb-1">Admin Girişi</h1>
          <p className="text-slate-400 text-sm text-center mb-6">
            Devam etmek için yönetici şifresini girin.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Şifre alanı */}
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Şifre"
                autoFocus
                autoComplete="current-password"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 pr-12 text-white placeholder-slate-500 focus:outline-none focus:border-violet-600 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors text-xs select-none"
                tabIndex={-1}
              >
                {showPass ? "Gizle" : "Göster"}
              </button>
            </div>

            {error && (
              <p className="text-red-400 text-sm text-center bg-red-950/30 border border-red-900/40 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full bg-violet-700 hover:bg-violet-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
            >
              {loading ? "Giriş yapılıyor…" : "Giriş Yap"}
            </button>
          </form>
        </div>

        {/* Alt not */}
        <p className="text-center text-slate-600 text-xs mt-6">
          <a href="/" className="hover:text-slate-400 transition-colors">
            ← Ana sayfaya dön
          </a>
        </p>
      </motion.div>
    </main>
  );
}
