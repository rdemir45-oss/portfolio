"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  TbUser,
  TbCrown,
  TbCalendar,
  TbLock,
  TbLogout,
  TbArrowLeft,
  TbCheck,
  TbAlertCircle,
  TbChartBar,
  TbSearch,
} from "react-icons/tb";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface ProfileData {
  username: string;
  plan: "starter" | "pro" | "elite";
  createdAt: string | null;
  isAdmin: boolean;
  alertsEnabled: boolean;
  telegramChatId: string;
  alertCategories: string[];
}

const PLAN_LABELS: Record<string, string> = {
  starter: "Starter",
  pro: "Pro",
  elite: "Elite",
};

const PLAN_COLORS: Record<string, string> = {
  starter: "text-slate-400 bg-slate-800/60 border-slate-700",
  pro: "text-blue-400 bg-blue-950/40 border-blue-800/60",
  elite: "text-amber-400 bg-amber-950/30 border-amber-800/50",
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("tr-TR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

export default function ProfilPage() {
  const router = useRouter();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loadError, setLoadError] = useState("");

  // Password change state
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [newPw2, setNewPw2] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwError, setPwError] = useState("");

  useEffect(() => {
    fetch("/api/user/profile")
      .then((r) => {
        if (!r.ok) throw new Error("Yetkisiz");
        return r.json();
      })
      .then((d) => setProfile(d))
      .catch(() => {
        setLoadError("Profil yüklenemedi. Lütfen tekrar giriş yapın.");
      });
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/hisse-teknik-analizi/login");
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError("");
    setPwSuccess(false);

    if (newPw !== newPw2) {
      setPwError("Yeni şifreler eşleşmiyor.");
      return;
    }
    if (newPw.length < 6) {
      setPwError("Yeni şifre en az 6 karakter olmalıdır.");
      return;
    }

    setPwLoading(true);
    const res = await fetch("/api/user/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setPwSuccess(true);
      setCurrentPw("");
      setNewPw("");
      setNewPw2("");
    } else {
      setPwError(data.error ?? "Şifre değiştirilemedi.");
    }
    setPwLoading(false);
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-[#050a0e] text-white">
        <Navbar />
        <div className="pt-32 flex justify-center px-4">
          <div className="flex items-center gap-3 text-red-400">
            <TbAlertCircle className="w-5 h-5 shrink-0" />
            <span>{loadError}</span>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050a0e] text-white">
      <Navbar />
      <div className="pt-24 pb-20 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between flex-wrap gap-3"
          >
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/hisse-teknik-analizi")}
                className="p-2 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition-colors"
                aria-label="Geri dön"
              >
                <TbArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <p className="text-xs font-semibold tracking-[0.18em] text-emerald-500 uppercase">
                  Hesabım
                </p>
                <h1 className="text-2xl font-black text-white">Profil</h1>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-700 text-slate-500 hover:text-rose-400 hover:border-rose-800 transition-colors text-sm"
            >
              <TbLogout className="w-4 h-4" />
              <span>Çıkış Yap</span>
            </button>
          </motion.div>

          {/* Kullanıcı Kartı */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-[#0a1628] border border-slate-800 rounded-2xl p-6"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-900/50 shrink-0">
                <TbUser className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                {profile ? (
                  <>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xl font-bold text-white truncate">{profile.username}</p>
                      {profile.isAdmin && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-purple-950/50 border border-purple-800/60 text-purple-400 font-semibold">
                          Admin
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-3">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-semibold ${PLAN_COLORS[profile.plan] ?? PLAN_COLORS.starter}`}
                      >
                        <TbCrown className="w-3.5 h-3.5" />
                        {PLAN_LABELS[profile.plan] ?? profile.plan} Plan
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                        <TbCalendar className="w-3.5 h-3.5" />
                        Üye: {formatDate(profile.createdAt)}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="h-5 w-40 bg-slate-800 rounded animate-pulse" />
                )}
              </div>
            </div>
          </motion.div>

          {/* Bildirim Özeti */}
          {profile && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-[#0a1628] border border-slate-800 rounded-2xl p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <TbChartBar className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-bold text-white">Hesap Bilgileri</h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800">
                  <p className="text-xs text-slate-500 mb-0.5">Bildirimler</p>
                  <p className={`text-sm font-semibold ${profile.alertsEnabled ? "text-emerald-400" : "text-slate-400"}`}>
                    {profile.alertsEnabled ? "Aktif" : "Kapalı"}
                  </p>
                </div>
                <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800">
                  <p className="text-xs text-slate-500 mb-0.5">Telegram</p>
                  <p className="text-sm font-semibold text-slate-300 truncate">
                    {profile.telegramChatId ? `${profile.telegramChatId.slice(0, 6)}…` : "Bağlı değil"}
                  </p>
                </div>
                <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800">
                  <p className="text-xs text-slate-500 mb-0.5">Takip Edilen Kategoriler</p>
                  <p className="text-sm font-semibold text-slate-300">
                    {profile.alertCategories.length > 0
                      ? `${profile.alertCategories.length} kategori`
                      : "Seçilmedi"}
                  </p>
                </div>
                <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800">
                  <p className="text-xs text-slate-500 mb-0.5">Plan Limiti (Özel Tarama)</p>
                  <p className="text-sm font-semibold text-slate-300">
                    {profile.plan === "starter" ? "1" : profile.plan === "pro" ? "5" : "20"} tarama
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Taramalarım Linki */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-[#0a1628] border border-slate-800 rounded-2xl p-6"
          >
            <a
              href="/hisse-teknik-analizi/taramalarim"
              className="flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-950/40 border border-blue-900/50">
                  <TbSearch className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors">Özel Taramalarım</p>
                  <p className="text-xs text-slate-500 mt-0.5">Python veya kural tabanlı tarama oluştur, çalıştır</p>
                </div>
              </div>
              <span className="text-slate-600 group-hover:text-blue-400 transition-colors text-lg">→</span>
            </a>
          </motion.div>

          {/* Şifre Değiştir */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#0a1628] border border-slate-800 rounded-2xl p-6"
          >
            <div className="flex items-center gap-2 mb-5">
              <TbLock className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-white">Şifre Değiştir</h2>
            </div>

            {pwSuccess && (
              <div className="mb-4 flex items-center gap-2 p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-400 text-sm">
                <TbCheck className="w-4 h-4 shrink-0" />
                Şifreniz başarıyla güncellendi.
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3">
              <input
                type="password"
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                placeholder="Mevcut şifre"
                autoComplete="current-password"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-600 transition-colors text-sm"
              />
              <input
                type="password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                placeholder="Yeni şifre (min. 6 karakter)"
                autoComplete="new-password"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-600 transition-colors text-sm"
              />
              <input
                type="password"
                value={newPw2}
                onChange={(e) => setNewPw2(e.target.value)}
                placeholder="Yeni şifre tekrar"
                autoComplete="new-password"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-600 transition-colors text-sm"
              />
              {pwError && (
                <div className="flex items-center gap-2 text-red-400 text-sm">
                  <TbAlertCircle className="w-4 h-4 shrink-0" />
                  {pwError}
                </div>
              )}
              <button
                type="submit"
                disabled={pwLoading || !currentPw || !newPw || !newPw2}
                className="w-full bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors text-sm"
              >
                {pwLoading ? "Güncelleniyor…" : "Şifreyi Güncelle"}
              </button>
            </form>
          </motion.div>

        </div>
      </div>
      <Footer />
    </div>
  );
}
