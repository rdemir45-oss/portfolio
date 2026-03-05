"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TbPlus, TbEdit, TbTrash, TbLogout, TbPin, TbChartLine, TbBook, TbBell, TbChartCandle } from "react-icons/tb";
import type { DbPost, DbIndicator } from "@/lib/supabase";

const catColors: Record<string, string> = {
  "Teknik Analiz": "text-emerald-400 bg-emerald-950/40 border-emerald-800/60",
  Eğitim: "text-sky-400 bg-sky-950/40 border-sky-800/60",
  Duyuru: "text-amber-400 bg-amber-950/40 border-amber-800/60",
};

const catIcons: Record<string, React.ReactNode> = {
  "Teknik Analiz": <TbChartLine size={12} />,
  Eğitim: <TbBook size={12} />,
  Duyuru: <TbBell size={12} />,
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" });
}

export default function AdminDashboard() {
  const [posts, setPosts] = useState<DbPost[]>([]);
  const [indicators, setIndicators] = useState<DbIndicator[]>([]);
  const [tab, setTab] = useState<"posts" | "indicators">("posts");
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);
  const router = useRouter();

  async function fetchAll() {
    setLoading(true);
    const [postsRes, indRes] = await Promise.all([
      fetch("/api/admin/posts"),
      fetch("/api/admin/indicators"),
    ]);
    if (postsRes.ok) setPosts(await postsRes.json());
    if (indRes.ok) setIndicators(await indRes.json());
    setLoading(false);
  }

  useEffect(() => { fetchAll(); }, []);

  async function handleDelete(id: number, title: string) {
    if (!confirm(`"${title}" silinsin mi?`)) return;
    setDeleting(id);
    await fetch(`/api/admin/posts?id=${id}`, { method: "DELETE" });
    await fetchAll();
    setDeleting(null);
  }

  async function handleDeleteIndicator(id: number, title: string) {
    if (!confirm(`"${title}" silinsin mi?`)) return;
    setDeleting(id);
    await fetch(`/api/admin/indicators?id=${id}`, { method: "DELETE" });
    await fetchAll();
    setDeleting(null);
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  }

  return (
    <main className="min-h-screen px-4 sm:px-8 pt-10 pb-20">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-2xl font-black text-white">Admin Paneli</h1>
            <p className="text-slate-400 text-sm mt-1">İçerikleri buradan yönet.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-sm text-slate-400 hover:text-white transition-colors"
              target="_blank"
            >
              Siteyi Gör ↗
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-700 text-slate-400 hover:text-red-400 hover:border-red-800 text-sm transition-colors"
            >
              <TbLogout size={16} />
              Çıkış
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(["posts", "indicators"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-xl text-sm font-semibold border transition-all ${tab === t
                ? "bg-emerald-950/40 border-emerald-800 text-emerald-400"
                : "bg-transparent border-slate-800 text-slate-500 hover:text-slate-300"}`}>
              {t === "posts" ? `Yazılar (${posts.length})` : `İndikatörler (${indicators.length})`}
            </button>
          ))}
        </div>

        <div className="bg-[#0a1628] border border-slate-800 rounded-2xl p-6">
          {/* Posts Tab */}
          {tab === "posts" && (
            <>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-white">Yazılar</h2>
                <Link
                  href="/admin/posts/new"
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition-colors"
                >
                  <TbPlus size={16} />
                  Yeni Yazı
                </Link>
              </div>
              {loading ? (
                <p className="text-slate-500 text-sm py-8 text-center">Yükleniyor...</p>
              ) : posts.length === 0 ? (
                <p className="text-slate-500 text-sm py-8 text-center">
                  Henüz yazı yok.{" "}
                  <Link href="/admin/posts/new" className="text-emerald-400 hover:underline">
                    İlk yazıyı ekle.
                  </Link>
                </p>
              ) : (
                <div className="space-y-3">
                  {posts.map((post) => (
                    <div
                      key={post.id}
                      className="flex items-start gap-4 p-4 bg-slate-900/50 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${catColors[post.category] || ""}`}>
                            {catIcons[post.category]}
                            {post.category}
                          </span>
                          {post.pinned && (
                            <TbPin size={13} className="text-emerald-500 rotate-45" />
                          )}
                          <span className="text-xs text-slate-500">{formatDate(post.date)}</span>
                        </div>
                        <p className="text-sm font-semibold text-white truncate">{post.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5 truncate">{post.summary}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Link
                          href={`/admin/posts/${post.id}/edit`}
                          className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-950/40 rounded-lg transition-colors"
                        >
                          <TbEdit size={16} />
                        </Link>
                        <button
                          onClick={() => handleDelete(post.id, post.title)}
                          disabled={deleting === post.id}
                          className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-950/40 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <TbTrash size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Indicators Tab */}
          {tab === "indicators" && (
            <>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-white">İndikatörler</h2>
                <Link
                  href="/admin/indicators/new"
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition-colors"
                >
                  <TbPlus size={16} />
                  Yeni İndikatör
                </Link>
              </div>
              {loading ? (
                <p className="text-slate-500 text-sm py-8 text-center">Yükleniyor...</p>
              ) : indicators.length === 0 ? (
                <p className="text-slate-500 text-sm py-8 text-center">
                  Henüz indikatör yok.{" "}
                  <Link href="/admin/indicators/new" className="text-emerald-400 hover:underline">
                    İlk indikatörü ekle.
                  </Link>
                </p>
              ) : (
                <div className="space-y-3">
                  {indicators.map((ind) => (
                    <div
                      key={ind.id}
                      className="flex items-start gap-4 p-4 bg-slate-900/50 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${
                            ind.platform === "TradingView"
                              ? "text-blue-400 bg-blue-950/40 border-blue-800/60"
                              : "text-orange-400 bg-orange-950/40 border-orange-800/60"
                          }`}>
                            <TbChartCandle size={12} />{ind.platform}
                          </span>
                          {ind.badge && (
                            <span className="text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                              {ind.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-white truncate">{ind.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5 truncate">{ind.short_desc}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Link
                          href={`/admin/indicators/${ind.id}/edit`}
                          className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-950/40 rounded-lg transition-colors"
                        >
                          <TbEdit size={16} />
                        </Link>
                        <button
                          onClick={() => handleDeleteIndicator(ind.id, ind.title)}
                          disabled={deleting === ind.id}
                          className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-950/40 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <TbTrash size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
