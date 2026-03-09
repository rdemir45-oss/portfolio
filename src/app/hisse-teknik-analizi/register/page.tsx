"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { HiUserAdd } from "react-icons/hi";
import Link from "next/link";

export default function ScannerRegister() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== password2) {
      setError("Şifreler eşleşmiyor.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json().catch(() => ({}));

    if (res.ok) {
      setSuccess(true);
    } else {
      setError(data.error ?? "Kayıt oluşturulamadı.");
    }
    setLoading(false);
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
              <HiUserAdd className="w-6 h-6 text-emerald-400" />
            </div>
          </div>
          <h1 className="text-lg font-bold text-white text-center mb-1">
            Üyelik Talebi
          </h1>
          <p className="text-slate-400 text-sm text-center mb-6">
            Hesabın oluşturulduktan sonra onayımla aktif hale gelecek.
          </p>

          {success ? (
            <div className="text-center space-y-4">
              <div className="p-4 bg-emerald-950/40 border border-emerald-800/60 rounded-xl">
                <p className="text-emerald-400 font-semibold text-sm">
                  Talebiniz alındı! ✓
                </p>
                <p className="text-slate-400 text-sm mt-1">
                  Hesabınız onaylandığında giriş yapabilirsiniz.
                </p>
              </div>
              <Link
                href="/hisse-teknik-analizi/login"
                className="block text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                Giriş sayfasına dön →
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  placeholder="Kullanıcı adı"
                  autoFocus
                  autoComplete="username"
                  maxLength={30}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-600 transition-colors"
                />
                <p className="text-xs text-slate-600 mt-1 pl-1">
                  Küçük harf, rakam ve _ kullanılabilir (3-30 karakter)
                </p>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Şifre"
                autoComplete="new-password"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-600 transition-colors"
              />
              <input
                type="password"
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                placeholder="Şifre tekrar"
                autoComplete="new-password"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-600 transition-colors"
              />
              {error && (
                <p className="text-red-400 text-sm text-center">{error}</p>
              )}
              <button
                type="submit"
                disabled={loading || !username || !password || !password2}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
              >
                {loading ? "Gönderiliyor…" : "Üyelik Talebi Gönder"}
              </button>
            </form>
          )}
        </div>

        {!success && (
          <p className="text-center text-slate-600 text-xs mt-6">
            Zaten hesabın var mı?{" "}
            <Link
              href="/hisse-teknik-analizi/login"
              className="text-emerald-500 hover:text-emerald-400 transition-colors"
            >
              Giriş yap
            </Link>
          </p>
        )}
      </motion.div>
    </main>
  );
}
