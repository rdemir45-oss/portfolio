"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { HiLockClosed } from "react-icons/hi";
import { TbBrandInstagram, TbBrandX, TbPhone, TbCheck } from "react-icons/tb";
import Link from "next/link";

function ExpiredBanner({ onExpired }: { onExpired: (msg: string) => void }) {
  const searchParams = useSearchParams();
  useEffect(() => {
    if (searchParams.get("expired") === "1") {
      onExpired("Abonelik süreniz dolmuştur. Yenileme için yönetici ile iletişime geçin.");
    }
  }, [searchParams, onExpired]);
  return null;
}

export default function ScannerLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [callName, setCallName] = useState("");
  const [callPhone, setCallPhone] = useState("");
  const [callLoading, setCallLoading] = useState(false);
  const [callSent, setCallSent] = useState(false);
  const [callError, setCallError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (res.ok) {
      router.push("/hisse-teknik-analizi");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Giriş başarısız.");
      setLoading(false);
    }
  }

  async function handleCallRequest(e: React.FormEvent) {
    e.preventDefault();
    setCallError("");
    if (!callName.trim() || !callPhone.trim()) return;
    setCallLoading(true);
    const res = await fetch("/api/whatsapp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: callName.trim(), surname: "-", phone: callPhone.trim() }),
    });
    if (res.ok) {
      setCallSent(true);
    } else {
      setCallError("Bir hata oluştu, tekrar deneyin.");
    }
    setCallLoading(false);
  }

  return (
    <main className="min-h-screen bg-[#050a0e] flex items-center justify-center px-4 py-12">
      <Suspense>
        <ExpiredBanner onExpired={setError} />
      </Suspense>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-3xl"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <a href="/" className="inline-flex items-center gap-2">
            <span className="text-emerald-400 font-black text-2xl tracking-tight">RdAlgo</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
          </a>
          <p className="text-slate-500 text-sm mt-2">Hisse Teknik Analizi</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* ── Sol: Giriş Formu ── */}
          <div className="bg-[#0a1628] border border-slate-800 rounded-2xl p-8">
            <div className="flex justify-center mb-5">
              <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-900/50">
                <HiLockClosed className="w-6 h-6 text-emerald-400" />
              </div>
            </div>
            <h1 className="text-lg font-bold text-white text-center mb-1">Üye Girişi</h1>
            <p className="text-slate-400 text-sm text-center mb-6">
              Bu sayfa yalnızca üyelere özeldir.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                placeholder="Kullanıcı adı"
                autoFocus
                autoComplete="username"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-600 transition-colors"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Şifre"
                autoComplete="current-password"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-600 transition-colors"
              />
              {error && <p className="text-red-400 text-sm text-center">{error}</p>}
              <button
                type="submit"
                disabled={loading || !username || !password}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
              >
                {loading ? "Giriş yapılıyor…" : "Giriş Yap"}
              </button>
            </form>

            <p className="text-center text-slate-600 text-xs mt-6">
              Hesabın yok mu?{" "}
              <Link
                href="/hisse-teknik-analizi/register"
                className="text-emerald-500 hover:text-emerald-400 transition-colors"
              >
                Üyelik talebi oluştur
              </Link>
            </p>
          </div>

          {/* ── Sağ: İletişim + Numara Bırak ── */}
          <div className="flex flex-col gap-4">
            {/* İletişim bilgileri */}
            <div className="bg-[#0a1628] border border-slate-800 rounded-2xl p-6 space-y-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">İletişim</p>
              <div className="space-y-3">
                <a
                  href="https://x.com/0TheBigShort1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-700/60 hover:border-slate-500/70 transition-colors group"
                >
                  <TbBrandX size={20} className="text-white shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors">Twitter / X</p>
                    <p className="text-sm font-semibold text-white">@0TheBigShort1</p>
                  </div>
                </a>
                <a
                  href="https://www.instagram.com/0thebigshort1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl bg-pink-950/20 border border-pink-900/40 hover:border-pink-700/60 transition-colors group"
                >
                  <TbBrandInstagram size={20} className="text-pink-400 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors">Instagram</p>
                    <p className="text-sm font-semibold text-white">@0thebigshort1</p>
                  </div>
                </a>
              </div>
            </div>

            {/* Numara bırak formu */}
            <div className="bg-[#0a1628] border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-1">
                <TbPhone size={16} className="text-emerald-400" />
                <p className="text-sm font-bold text-white">Sizi Arayalım</p>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Numaranızı bırakın, sistem hakkında bilgi verelim.
              </p>

              {callSent ? (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60">
                  <TbCheck size={18} className="text-emerald-400 shrink-0" />
                  <p className="text-sm text-emerald-300">Numaranız alındı, en kısa sürede ulaşacağız!</p>
                </div>
              ) : (
                <form onSubmit={handleCallRequest} className="space-y-3">
                  <input
                    type="text"
                    placeholder="Adınız"
                    value={callName}
                    onChange={(e) => setCallName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-600 transition-colors"
                  />
                  <input
                    type="tel"
                    placeholder="Telefon numarası"
                    value={callPhone}
                    onChange={(e) => setCallPhone(e.target.value.replace(/[^\d\s+\-()]/g, ""))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-600 transition-colors"
                  />
                  {callError && <p className="text-red-400 text-xs">{callError}</p>}
                  <button
                    type="submit"
                    disabled={callLoading || !callName.trim() || !callPhone.trim()}
                    className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
                  >
                    <TbPhone size={15} />
                    {callLoading ? "Gönderiliyor…" : "Numara Bırak"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
