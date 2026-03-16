"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TbPlus, TbEdit, TbTrash, TbLogout, TbPin, TbChartLine, TbBook, TbBell, TbChartCandle, TbDatabaseImport, TbMail, TbMailOpened, TbCheck, TbBrandWhatsapp, TbPhone, TbUser, TbUserCheck, TbUserX, TbClock, TbShieldCheck, TbShieldX, TbFileSpreadsheet, TbVideo, TbCalendar, TbCrown, TbRefresh, TbCalendarOff, TbKey, TbCopy, TbWifi, TbWifiOff, TbCode, TbPlayerPlay, TbCircleCheck, TbAlertCircle } from "react-icons/tb";
import type { DbPost, DbIndicator, DbMessage, DbWhatsappRequest, DbScannerUser, DbLiveStream } from "@/lib/supabase";

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
  const [messages, setMessages] = useState<DbMessage[]>([]);
  const [whatsappRequests, setWhatsappRequests] = useState<DbWhatsappRequest[]>([]);
  const [scannerUsers, setScannerUsers] = useState<DbScannerUser[]>([]);
  const [liveStreams, setLiveStreams] = useState<DbLiveStream[]>([]);
  const [streamForm, setStreamForm] = useState({ title: "", stream_at: "", description: "" });
  const [streamSaving, setStreamSaving] = useState(false);
  const [deletingStream, setDeletingStream] = useState<number | null>(null);
  const [tab, setTab] = useState<"posts" | "indicators" | "messages" | "whatsapp" | "scannerUsers" | "liveStreams" | "customIndicators">("posts");
  type CustomIndicator = { code: string; name: string; description: string; keys: { id: string; label: string }[] };
  type ScanGroup = { id: string; label: string; color: string; emoji: string; is_bull: boolean; keys: { id: string; label: string }[] };
  const [customIndicators, setCustomIndicators] = useState<CustomIndicator[]>([]);
  const [scanGroups, setScanGroups] = useState<ScanGroup[]>([]);
  const [ciForm, setCiForm] = useState({ code: "", name: "", description: "", script: "" });
  const [ciGroupMode, setCiGroupMode] = useState<"none" | "existing" | "new">("none");
  const [ciGroupId, setCiGroupId] = useState("");
  const [ciNewGroup, setCiNewGroup] = useState({ id: "", label: "", color: "emerald", emoji: "📊", is_bull: true });
  const [ciSaving, setCiSaving] = useState(false);
  const [ciDeleting, setCiDeleting] = useState<string | null>(null);
  const [ciRunning, setCiRunning] = useState<string | null>(null);
  const [ciRunResult, setCiRunResult] = useState<Record<string, number>>({});
  const [ciError, setCiError] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [deletingScannerUser, setDeletingScannerUser] = useState<string | null>(null);
  const [updatingScannerUser, setUpdatingScannerUser] = useState<string | null>(null);
  const [renewingScannerUser, setRenewingScannerUser] = useState<string | null>(null);
  const [resettingPassword, setResettingPassword] = useState<string | null>(null);
  const [tempPasswordModal, setTempPasswordModal] = useState<{ username: string; password: string } | null>(null);
  const [clearingRateLimit, setClearingRateLimit] = useState(false);
  const [rateLimitIp, setRateLimitIp] = useState("");
  const [seeding, setSeeding] = useState(false);
  const [seedingPosts, setSeedingPosts] = useState(false);
  const router = useRouter();

  async function fetchAll() {
    setLoading(true);
    const [postsRes, indRes, msgRes, waRes, scRes, lsRes, ciRes, sgRes] = await Promise.all([
      fetch("/api/admin/posts"),
      fetch("/api/admin/indicators"),
      fetch("/api/admin/messages"),
      fetch("/api/admin/whatsapp"),
      fetch("/api/admin/scanner-users"),
      fetch("/api/admin/live-stream"),
      fetch("/api/admin/custom-indicators"),
      fetch("/api/admin/scan-groups"),
    ]);
    if (postsRes.ok) setPosts(await postsRes.json());
    if (indRes.ok) setIndicators(await indRes.json());
    if (msgRes.ok) setMessages(await msgRes.json());
    if (waRes.ok) setWhatsappRequests(await waRes.json());
    if (scRes.ok) setScannerUsers(await scRes.json());
    if (lsRes.ok) setLiveStreams(await lsRes.json());
    if (ciRes.ok) { const d = await ciRes.json(); setCustomIndicators(d.indicators ?? []); }
    if (sgRes.ok) setScanGroups(await sgRes.json());
    setLoading(false);
  }

  async function handleCiRegister() {
    if (!ciForm.code || !ciForm.name || !ciForm.script) return;
    setCiSaving(true); setCiError("");
    const res = await fetch("/api/admin/custom-indicators", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: ciForm.code, name: ciForm.name, description: ciForm.description, script: ciForm.script }),
    });
    if (!res.ok) {
      const d = await res.json();
      setCiError(d.detail ?? d.error ?? "Kayıt başarısız.");
      setCiSaving(false);
      return;
    }

    // Group assignment
    const newKey = { id: ciForm.code, label: ciForm.name };
    if (ciGroupMode === "existing" && ciGroupId) {
      const group = scanGroups.find(g => g.id === ciGroupId);
      const updatedKeys = [...(group?.keys ?? []).filter(k => k.id !== ciForm.code), newKey];
      await fetch(`/api/admin/scan-groups?id=${encodeURIComponent(ciGroupId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keys: updatedKeys }),
      });
    } else if (ciGroupMode === "new" && ciNewGroup.id && ciNewGroup.label) {
      await fetch("/api/admin/scan-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: ciNewGroup.id,
          label: ciNewGroup.label,
          color: ciNewGroup.color,
          emoji: ciNewGroup.emoji,
          is_bull: ciNewGroup.is_bull,
          keys: [newKey],
        }),
      });
    }

    setCiForm({ code: "", name: "", description: "", script: "" });
    setCiGroupMode("none");
    setCiGroupId("");
    setCiNewGroup({ id: "", label: "", color: "emerald", emoji: "📊", is_bull: true });
    await fetchAll();
    setCiSaving(false);
  }

  async function handleCiDelete(code: string) {
    if (!confirm(`"${code}" indikatörünü silmek istediğinize emin misiniz?`)) return;
    setCiDeleting(code);
    await fetch(`/api/admin/custom-indicators?code=${encodeURIComponent(code)}`, { method: "DELETE" });
    await fetchAll();
    setCiDeleting(null);
  }

  async function handleCiRun(code: string) {
    setCiRunning(code);
    const res = await fetch(`/api/admin/custom-indicators?code=${encodeURIComponent(code)}`, { method: "PATCH" });
    if (res.ok) {
      const d = await res.json();
      const total = Object.values(d.keys ?? {}).reduce((s: number, arr: unknown) => s + (arr as unknown[]).length, 0);
      setCiRunResult(prev => ({ ...prev, [code]: total as number }));
    }
    setCiRunning(null);
  }

  async function handleScannerUserStatus(id: string, status: "approved" | "rejected" | "pending") {
    setUpdatingScannerUser(id);
    await fetch(`/api/admin/scanner-users?id=${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await fetchAll();
    setUpdatingScannerUser(null);
  }

  async function handleScannerUserPlan(id: string, plan: string) {
    setUpdatingScannerUser(id);
    await fetch(`/api/admin/scanner-users?id=${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    await fetchAll();
    setUpdatingScannerUser(null);
  }

  async function handleRenewSubscription(id: string, subscription_plan: string) {
    setRenewingScannerUser(id);
    await fetch(`/api/admin/scanner-users?id=${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscription_plan }),
    });
    await fetchAll();
    setRenewingScannerUser(null);
  }

  async function handleRemoveSubscription(id: string) {
    if (!confirm("Bu kullanıcının aboneliği kaldırılsın mı?")) return;
    setRenewingScannerUser(id);
    await fetch(`/api/admin/scanner-users?id=${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscription_plan: null }),
    });
    await fetchAll();
    setRenewingScannerUser(null);
  }

  async function handleResetPassword(id: string, username: string) {
    if (!confirm(`"${username}" kullanıcısının şifresi sıfırlanacak. Devam?`)) return;
    setResettingPassword(id);
    const res = await fetch(`/api/admin/scanner-users?id=${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reset-password" }),
    });
    const data = await res.json();
    if (res.ok && data.tempPassword) {
      setTempPasswordModal({ username, password: data.tempPassword });
    } else {
      alert("Şifre sıfırlanamadı: " + (data.error ?? "Bilinmeyen hata"));
    }
    setResettingPassword(null);
  }

  async function handleClearRateLimit() {
    const ip = rateLimitIp.trim();
    if (!ip) return;
    setClearingRateLimit(true);
    const res = await fetch("/api/admin/scanner-users?id=none", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "clear-ratelimit", ip }),
    });
    if (res.ok) {
      alert(`"${ip}" IP adresi için giriş kilidi kaldırıldı.`);
      setRateLimitIp("");
    } else {
      const data = await res.json();
      alert("Hata: " + (data.error ?? "Bilinmeyen hata"));
    }
    setClearingRateLimit(false);
  }

  async function handleAddStream() {
    if (!streamForm.title || !streamForm.stream_at) return;
    setStreamSaving(true);
    await fetch("/api/admin/live-stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(streamForm),
    });
    setStreamForm({ title: "", stream_at: "", description: "" });
    await fetchAll();
    setStreamSaving(false);
  }

  async function handleDeleteStream(id: number, title: string) {
    if (!confirm(`"${title}" yayını silinsin mi?`)) return;
    setDeletingStream(id);
    await fetch(`/api/admin/live-stream?id=${id}`, { method: "DELETE" });
    await fetchAll();
    setDeletingStream(null);
  }

  function downloadWhatsappExcel() {
    const header = ["Ad", "Soyad", "Telefon", "Tarih"];
    const rows = whatsappRequests.map((r) => [
      r.name,
      r.surname,
      r.phone,
      new Date(r.created_at).toLocaleString("tr-TR"),
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const bom = "\uFEFF"; // UTF-8 BOM – Excel Türkçe karakterleri doğru okusun
    const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `whatsapp-talepleri-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleDeleteScannerUser(id: string, username: string) {
    if (!confirm(`"${username}" kullanıcısı silinsin mi?`)) return;
    setDeletingScannerUser(id);
    await fetch(`/api/admin/scanner-users?id=${id}`, { method: "DELETE" });
    await fetchAll();
    setDeletingScannerUser(null);
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

  async function handleSeedIndicators() {
    if (!confirm("Mevcut 10 indikatör Supabase'e aktarılsın mı? Zaten varsa üzerine yazılmaz.")) return;
    setSeeding(true);
    const res = await fetch("/api/admin/seed-indicators", { method: "POST" });
    const json = await res.json();
    if (json.success) {
      alert(`${json.count} indikatör başarıyla aktarıldı.`);
      fetchAll();
    } else {
      alert("Bazı indikatörler aktarılamadı: " + JSON.stringify(json.failed));
    }
    setSeeding(false);
  }

  async function handleSeedPosts() {
    if (!confirm("Mevcut 4 yazı Supabase'e aktarılsın mı? Zaten varsa üzerine yazılmaz.")) return;
    setSeedingPosts(true);
    const res = await fetch("/api/admin/seed-posts", { method: "POST" });
    const json = await res.json();
    if (json.success) {
      alert(`${json.count} yazı başarıyla aktarıldı.`);
      fetchAll();
    } else {
      alert("Bazı yazılar aktarılamadı: " + JSON.stringify(json.failed));
    }
    setSeedingPosts(false);
  }

  return (
    <main className="min-h-screen px-4 sm:px-8 pt-10 pb-20">
      <div className="max-w-5xl mx-auto">
        {/* Geçici Şifre Modalı */}
        {tempPasswordModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
            <div className="bg-[#0a1628] border border-slate-700 rounded-2xl p-8 w-full max-w-sm shadow-2xl">
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-xl bg-amber-950/50 border border-amber-800/50">
                  <TbKey size={24} className="text-amber-400" />
                </div>
              </div>
              <h2 className="text-lg font-bold text-white text-center mb-1">Geçici Şifre</h2>
              <p className="text-slate-400 text-sm text-center mb-5">
                <span className="text-white font-semibold">{tempPasswordModal.username}</span> kullanıcısının şifresi sıfırlandı. Bu şifreyi kullanıcıya iletin:
              </p>
              <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 mb-5">
                <span className="flex-1 text-amber-400 font-mono text-lg font-bold tracking-widest select-all">{tempPasswordModal.password}</span>
                <button
                  onClick={() => { navigator.clipboard.writeText(tempPasswordModal.password); }}
                  className="p-1.5 text-slate-400 hover:text-white transition-colors"
                  title="Kopyala"
                >
                  <TbCopy size={16} />
                </button>
              </div>
              <p className="text-xs text-slate-600 text-center mb-5">Bu şifre bir kez gösterilir, sayfayı kapatmadan kopyalayın.</p>
              <button
                onClick={() => setTempPasswordModal(null)}
                className="w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2.5 rounded-xl transition-colors"
              >
                Tamam, Kapattım
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-2xl font-black text-white">Admin Paneli</h1>
            <p className="text-slate-400 text-sm mt-1">İçerikleri buradan yönet.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/scan-groups"
              className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-emerald-400 transition-colors"
            >
              <TbChartCandle size={15} />
              Tarama Grupları
            </Link>
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
          <button onClick={() => setTab("posts")}
            className={`px-5 py-2 rounded-xl text-sm font-semibold border transition-all ${tab === "posts"
              ? "bg-emerald-950/40 border-emerald-800 text-emerald-400"
              : "bg-transparent border-slate-800 text-slate-500 hover:text-slate-300"}`}>
            Yazılar ({posts.length})
          </button>
          <button onClick={() => setTab("indicators")}
            className={`px-5 py-2 rounded-xl text-sm font-semibold border transition-all ${tab === "indicators"
              ? "bg-emerald-950/40 border-emerald-800 text-emerald-400"
              : "bg-transparent border-slate-800 text-slate-500 hover:text-slate-300"}`}>
            İndikatörler ({indicators.length})
          </button>
          <button onClick={() => setTab("messages")}
            className={`relative px-5 py-2 rounded-xl text-sm font-semibold border transition-all ${tab === "messages"
              ? "bg-emerald-950/40 border-emerald-800 text-emerald-400"
              : "bg-transparent border-slate-800 text-slate-500 hover:text-slate-300"}`}>
            Mesajlar ({messages.length})
            {messages.filter(m => !m.read).length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold">
                {messages.filter(m => !m.read).length}
              </span>
            )}
          </button>
          <button onClick={() => setTab("whatsapp")}
            className={`relative px-5 py-2 rounded-xl text-sm font-semibold border transition-all ${tab === "whatsapp"
              ? "bg-green-950/40 border-green-800 text-green-400"
              : "bg-transparent border-slate-800 text-slate-500 hover:text-slate-300"}`}>
            WhatsApp ({whatsappRequests.length})
          </button>
          <button onClick={() => setTab("scannerUsers")}
            className={`relative px-5 py-2 rounded-xl text-sm font-semibold border transition-all ${tab === "scannerUsers"
              ? "bg-sky-950/40 border-sky-800 text-sky-400"
              : "bg-transparent border-slate-800 text-slate-500 hover:text-slate-300"}`}>
            Üyeler ({scannerUsers.length})
            {scannerUsers.filter(u => u.status === "pending").length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold">
                {scannerUsers.filter(u => u.status === "pending").length}
              </span>
            )}
          </button>
          <button onClick={() => setTab("liveStreams")}
            className={`px-5 py-2 rounded-xl text-sm font-semibold border transition-all ${tab === "liveStreams"
              ? "bg-violet-950/40 border-violet-800 text-violet-400"
              : "bg-transparent border-slate-800 text-slate-500 hover:text-slate-300"}`}>
            Yayınlar ({liveStreams.length})
          </button>
          <button onClick={() => setTab("customIndicators")}
            className={`px-5 py-2 rounded-xl text-sm font-semibold border transition-all ${tab === "customIndicators"
              ? "bg-amber-950/40 border-amber-800 text-amber-400"
              : "bg-transparent border-slate-800 text-slate-500 hover:text-slate-300"}`}>
            <span className="flex items-center gap-1.5"><TbCode size={14} />Özel Taramalar ({customIndicators.length})</span>
          </button>
        </div>

        <div className="bg-[#0a1628] border border-slate-800 rounded-2xl p-6">
          {/* Posts Tab */}
          {tab === "posts" && (
            <>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-white">Yazılar</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSeedPosts}
                    disabled={seedingPosts}
                    className="flex items-center gap-2 px-4 py-2 border border-slate-700 hover:border-emerald-700 text-slate-400 hover:text-emerald-400 text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
                  >
                    <TbDatabaseImport size={16} />
                    {seedingPosts ? "Aktarılıyor..." : "Mevcut Verileri Aktar"}
                  </button>
                  <Link
                    href="/admin/posts/new"
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition-colors"
                  >
                    <TbPlus size={16} />
                    Yeni Yazı
                  </Link>
                </div>
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
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSeedIndicators}
                  disabled={seeding}
                  className="flex items-center gap-2 px-4 py-2 border border-slate-700 hover:border-emerald-700 text-slate-400 hover:text-emerald-400 text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
                >
                  <TbDatabaseImport size={16} />
                  {seeding ? "Aktarılıyor..." : "Mevcut Verileri Aktar"}
                </button>
                <Link
                  href="/admin/indicators/new"
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition-colors"
                >
                  <TbPlus size={16} />
                  Yeni İndikatör
                </Link>
              </div>
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

          {/* Messages Tab */}
          {tab === "messages" && (
            <>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-white">Gelen Mesajlar</h2>
                <span className="text-sm text-slate-500">{messages.filter(m => !m.read).length} okunmamış</span>
              </div>
              {loading ? (
                <p className="text-slate-500 text-sm py-8 text-center">Yükleniyor...</p>
              ) : messages.length === 0 ? (
                <p className="text-slate-500 text-sm py-8 text-center">Henüz mesaj yok.</p>
              ) : (
                <div className="space-y-3">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-4 border rounded-xl transition-colors ${
                        msg.read
                          ? "bg-slate-900/30 border-slate-800"
                          : "bg-[#0a1e15]/60 border-emerald-900/60"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-2 mb-1">
                          {msg.read
                            ? <TbMailOpened size={15} className="text-slate-500 shrink-0" />
                            : <TbMail size={15} className="text-emerald-400 shrink-0" />}
                          <span className="text-sm font-semibold text-white">{msg.name}</span>
                          <a href={`mailto:${msg.email}`} className="text-xs text-emerald-400 hover:underline">{msg.email}</a>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-slate-500">
                            {new Date(msg.created_at).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </span>
                          {!msg.read && (
                            <button
                              onClick={async () => {
                                await fetch(`/api/admin/messages?id=${msg.id}`, { method: "PATCH" });
                                fetchAll();
                              }}
                              className="p-1.5 text-slate-500 hover:text-emerald-400 hover:bg-emerald-950/40 rounded-lg transition-colors"
                              title="Okundu olarak işaretle"
                            >
                              <TbCheck size={15} />
                            </button>
                          )}
                          <button
                            onClick={async () => {
                              if (!confirm(`"${msg.name}" adlı kişinin mesajı silinsin mi?`)) return;
                              await fetch(`/api/admin/messages?id=${msg.id}`, { method: "DELETE" });
                              fetchAll();
                            }}
                            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-950/40 rounded-lg transition-colors"
                          >
                            <TbTrash size={15} />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-slate-300 mt-2 leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* WhatsApp Requests Tab */}
          {tab === "whatsapp" && (
            <>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-white">WhatsApp Grubu Talepleri</h2>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-500">{whatsappRequests.length} kayıt</span>
                  {whatsappRequests.length > 0 && (
                    <button
                      onClick={downloadWhatsappExcel}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-800/60 bg-emerald-950/30 text-emerald-400 hover:bg-emerald-900/40 transition-colors text-xs font-semibold"
                    >
                      <TbFileSpreadsheet size={15} />
                      Excel İndir
                    </button>
                  )}
                </div>
              </div>
              {loading ? (
                <p className="text-slate-500 text-sm py-8 text-center">Yükleniyor...</p>
              ) : whatsappRequests.length === 0 ? (
                <p className="text-slate-500 text-sm py-8 text-center">Henüz talep yok.</p>
              ) : (
                <div className="space-y-3">
                  {whatsappRequests.map((req) => (
                    <div key={req.id} className="flex items-center gap-4 p-4 bg-slate-900/50 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors">
                      <div className="p-2 bg-green-950/40 border border-green-900/60 rounded-xl shrink-0">
                        <TbBrandWhatsapp size={18} className="text-green-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="flex items-center gap-1.5 text-sm font-semibold text-white">
                            <TbUser size={13} className="text-slate-400" />
                            {req.name} {req.surname}
                          </span>
                          <a
                            href={`tel:${req.phone}`}
                            className="flex items-center gap-1.5 text-sm text-green-400 hover:underline"
                          >
                            <TbPhone size={13} />
                            {req.phone}
                          </a>
                          <span className="text-xs text-slate-500">
                            {new Date(req.created_at).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={async () => {
                          if (!confirm(`"${req.name} ${req.surname}" kaydı silinsin mi?`)) return;
                          await fetch(`/api/admin/whatsapp?id=${req.id}`, { method: "DELETE" });
                          fetchAll();
                        }}
                        className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-950/40 rounded-lg transition-colors shrink-0"
                      >
                        <TbTrash size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
          {/* Scanner Users Tab */}
          {tab === "scannerUsers" && (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white">Hisse Analiz Üyeleri</h2>
                <span className="text-sm text-slate-500">
                  {scannerUsers.filter(u => u.status === "pending").length} bekleyen onay
                </span>
              </div>
              {/* Rate limit sıfırlama */}
              <div className="flex items-center gap-2 mb-6 bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3">
                <TbWifiOff size={15} className="text-amber-400 shrink-0" />
                <span className="text-xs text-slate-400 shrink-0">Giriş kilidi kaldır:</span>
                <input
                  type="text"
                  placeholder="IP adresi (örn: 85.123.45.67)"
                  value={rateLimitIp}
                  onChange={(e) => setRateLimitIp(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-white placeholder-slate-600 focus:outline-none min-w-0"
                  onKeyDown={(e) => { if (e.key === "Enter") handleClearRateLimit(); }}
                />
                <button
                  onClick={handleClearRateLimit}
                  disabled={clearingRateLimit || !rateLimitIp.trim()}
                  className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-amber-400 bg-amber-950/40 border border-amber-800/60 rounded-lg hover:bg-amber-900/40 transition-colors disabled:opacity-50"
                >
                  <TbWifi size={13} />
                  {clearingRateLimit ? "Kaldırılıyor..." : "Kilidi Kaldır"}
                </button>
              </div>
              {loading ? (
                <p className="text-slate-500 text-sm py-8 text-center">Yükleniyor...</p>
              ) : scannerUsers.length === 0 ? (
                <p className="text-slate-500 text-sm py-8 text-center">Henüz üyelik talebi yok.</p>
              ) : (
                <div className="space-y-3">
                  {scannerUsers.map((u) => (
                    <div
                      key={u.id}
                      className={`flex items-center gap-4 p-4 border rounded-xl transition-colors ${
                        u.status === "pending"
                          ? "bg-amber-950/20 border-amber-800/50"
                          : u.status === "approved"
                          ? "bg-emerald-950/20 border-emerald-900/50"
                          : "bg-slate-900/30 border-slate-800"
                      }`}
                    >
                      <div className="shrink-0">
                        {u.status === "pending" && <TbClock size={18} className="text-amber-400" />}
                        {u.status === "approved" && <TbShieldCheck size={18} className="text-emerald-400" />}
                        {u.status === "rejected" && <TbShieldX size={18} className="text-slate-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-white">{u.username}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                            u.status === "pending"
                              ? "text-amber-400 bg-amber-950/40 border-amber-800/60"
                              : u.status === "approved"
                              ? "text-emerald-400 bg-emerald-950/40 border-emerald-800/60"
                              : "text-slate-500 bg-slate-800/40 border-slate-700/60"
                          }`}>
                            {u.status === "pending" ? "Bekliyor" : u.status === "approved" ? "Onaylı" : "Reddedildi"}
                          </span>
                          <span className="text-xs text-slate-600">
                            {new Date(u.created_at).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                          {/* Abonelik bilgisi */}
                          {u.subscription_expires_at && (() => {
                            const exp = new Date(u.subscription_expires_at);
                            const isExpired = exp.getTime() < Date.now();
                            const planLabel = u.subscription_plan === "weekly" ? "Haftalık" : u.subscription_plan === "monthly" ? "Aylık" : u.subscription_plan === "yearly" ? "Yıllık" : "";
                            return (
                              <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${
                                isExpired
                                  ? "text-red-400 bg-red-950/40 border-red-800/60"
                                  : "text-sky-400 bg-sky-950/40 border-sky-800/60"
                              }`}>
                                <TbCalendar size={10} />
                                {planLabel}{isExpired ? " – Süresi Doldu" : " – " + exp.toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" })}
                              </span>
                            );
                          })()}
                          <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${
                            u.plan === "elite"
                              ? "text-amber-400 bg-amber-950/40 border-amber-800/60"
                              : u.plan === "pro"
                              ? "text-violet-400 bg-violet-950/40 border-violet-800/60"
                              : "text-slate-500 bg-slate-800/40 border-slate-700/60"
                          }`}>
                            <TbCrown size={10} />
                            {u.plan ?? "starter"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                        {/* Abonelik alanı */}
                        {(() => {
                          const isExpired = u.subscription_expires_at
                            ? new Date(u.subscription_expires_at).getTime() < Date.now()
                            : false;
                          return (
                            <div className="flex items-center gap-1.5">
                              <select
                                defaultValue=""
                                onChange={(e) => { if (e.target.value) handleRenewSubscription(u.id, e.target.value); }}
                                disabled={renewingScannerUser === u.id}
                                className="text-xs bg-slate-800 border border-slate-700 text-slate-300 rounded-lg px-2 py-1 focus:outline-none focus:border-sky-600 transition-colors disabled:opacity-50"
                                title="Abonelik süresini başlat / yenile"
                              >
                                <option value="" disabled>
                                  {renewingScannerUser === u.id
                                    ? "Kaydediliyor..."
                                    : u.subscription_expires_at
                                    ? isExpired ? "⚠ Süresi Doldu — Yenile" : "Aboneliği Yenile"
                                    : "Abonelik Başlat"}
                                </option>
                                <option value="weekly">Haftalık (7 gün)</option>
                                <option value="monthly">Aylık (30 gün)</option>
                                <option value="yearly">Yıllık (365 gün)</option>
                              </select>
                              {u.subscription_expires_at && (
                                <button
                                  onClick={() => handleRemoveSubscription(u.id)}
                                  disabled={renewingScannerUser === u.id}
                                  title="Aboneliği kaldır"
                                  className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-950/40 rounded-lg transition-colors disabled:opacity-50"
                                >
                                  <TbCalendarOff size={14} />
                                </button>
                              )}
                            </div>
                          );
                        })()}
                        <select
                          value={u.plan ?? "starter"}
                          onChange={(e) => handleScannerUserPlan(u.id, e.target.value)}
                          disabled={updatingScannerUser === u.id}
                          className="text-xs bg-slate-800 border border-slate-700 text-slate-300 rounded-lg px-2 py-1 focus:outline-none focus:border-violet-600 transition-colors disabled:opacity-50"
                        >
                          <option value="starter">Starter</option>
                          <option value="pro">Pro</option>
                          <option value="elite">Elite</option>
                        </select>
                        {u.status !== "approved" && (
                          <button
                            onClick={() => handleScannerUserStatus(u.id, "approved")}
                            disabled={updatingScannerUser === u.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:text-white bg-emerald-950/40 hover:bg-emerald-700 border border-emerald-800/60 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <TbUserCheck size={14} />
                            Onayla
                          </button>
                        )}
                        {u.status !== "rejected" && (
                          <button
                            onClick={() => handleScannerUserStatus(u.id, "rejected")}
                            disabled={updatingScannerUser === u.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-red-400 bg-slate-800/40 hover:bg-red-950/40 border border-slate-700/60 hover:border-red-800/60 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <TbUserX size={14} />
                            Reddet
                          </button>
                        )}
                        <button
                          onClick={() => handleResetPassword(u.id, u.username)}
                          disabled={resettingPassword === u.id}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-amber-400 hover:text-white bg-amber-950/40 hover:bg-amber-700 border border-amber-800/60 rounded-lg transition-colors disabled:opacity-50"
                          title="Geçici şifre ata"
                        >
                          <TbKey size={13} />
                          {resettingPassword === u.id ? "..." : "Şifre Sıfırla"}
                        </button>
                        <button
                          onClick={() => handleDeleteScannerUser(u.id, u.username)}
                          disabled={deletingScannerUser === u.id}
                          className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-950/40 rounded-lg transition-colors disabled:opacity-50"
                          title="Kullanıcıyı sil"
                        >
                          <TbTrash size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
          {/* Custom Indicators Tab */}
          {tab === "customIndicators" && (
            <>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-white">Özel Tarama İndikatörleri</h2>
                <span className="text-sm text-slate-500">{customIndicators.length} indikatör</span>
              </div>

              {/* Yeni indikatör formu */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 mb-5 space-y-3">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Yeni İndikatör Ekle</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text" placeholder="Kod (örn: my_rsi_cross)"
                    value={ciForm.code}
                    onChange={(e) => setCiForm(f => ({ ...f, code: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") }))}
                    className="bg-[#0a1628] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-600 transition-colors font-mono"
                  />
                  <input
                    type="text" placeholder="Görünen Ad (örn: RSI Kesişim)"
                    value={ciForm.name}
                    onChange={(e) => setCiForm(f => ({ ...f, name: e.target.value }))}
                    className="bg-[#0a1628] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-600 transition-colors"
                  />
                  <input
                    type="text" placeholder="Açıklama (opsiyonel)"
                    value={ciForm.description}
                    onChange={(e) => setCiForm(f => ({ ...f, description: e.target.value }))}
                    className="bg-[#0a1628] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-600 transition-colors"
                  />
                </div>
                <textarea
                  rows={10}
                  placeholder="Python script kodu buraya yapıştırın..."
                  value={ciForm.script}
                  onChange={(e) => setCiForm(f => ({ ...f, script: e.target.value }))}
                  className="w-full bg-[#050a0e] border border-slate-700 rounded-lg px-3 py-2 text-sm text-emerald-300 placeholder-slate-600 focus:outline-none focus:border-amber-600 transition-colors font-mono resize-y"
                />

                {/* Kategori seçimi */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-400">Tarama Kategorisi</p>
                  <div className="flex gap-2 flex-wrap">
                    {(["none", "existing", "new"] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setCiGroupMode(mode)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                          ciGroupMode === mode
                            ? "bg-amber-600/30 border-amber-600 text-amber-300"
                            : "bg-transparent border-slate-700 text-slate-500 hover:border-slate-600"
                        }`}
                      >
                        {mode === "none" ? "Kategorisiz" : mode === "existing" ? "Mevcut Kategoriye Ekle" : "Yeni Kategori Oluştur"}
                      </button>
                    ))}
                  </div>

                  {ciGroupMode === "existing" && (
                    <select
                      value={ciGroupId}
                      onChange={(e) => setCiGroupId(e.target.value)}
                      className="w-full bg-[#0a1628] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-600 transition-colors"
                    >
                      <option value="">-- Kategori seçin --</option>
                      {scanGroups.map(g => (
                        <option key={g.id} value={g.id}>{g.emoji} {g.label}</option>
                      ))}
                    </select>
                  )}

                  {ciGroupMode === "new" && (
                    <div className="bg-[#0a1628] border border-slate-700 rounded-xl p-3 space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text" placeholder="Kategori ID (örn: stoch_rsi)"
                          value={ciNewGroup.id}
                          onChange={(e) => setCiNewGroup(f => ({ ...f, id: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") }))}
                          className="bg-[#050a0e] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-600 transition-colors font-mono"
                        />
                        <input
                          type="text" placeholder="Kategori Adı (örn: StochRSI Sinyalleri)"
                          value={ciNewGroup.label}
                          onChange={(e) => setCiNewGroup(f => ({ ...f, label: e.target.value }))}
                          className="bg-[#050a0e] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-600 transition-colors"
                        />
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <input
                          type="text" placeholder="Emoji (örn: 📊)"
                          value={ciNewGroup.emoji}
                          onChange={(e) => setCiNewGroup(f => ({ ...f, emoji: e.target.value }))}
                          className="w-24 bg-[#050a0e] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-600 transition-colors"
                        />
                        <div className="flex gap-1.5">
                          {["emerald", "sky", "violet", "amber", "rose"].map(c => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => setCiNewGroup(f => ({ ...f, color: c }))}
                              title={c}
                              className={`w-6 h-6 rounded-full border-2 transition-all ${
                                ciNewGroup.color === c ? "border-white scale-110" : "border-transparent opacity-60 hover:opacity-100"
                              } bg-${c}-500`}
                            />
                          ))}
                        </div>
                        <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={ciNewGroup.is_bull}
                            onChange={(e) => setCiNewGroup(f => ({ ...f, is_bull: e.target.checked }))}
                            className="rounded border-slate-600"
                          />
                          Bullish kategori
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                {ciError && (
                  <p className="flex items-center gap-2 text-xs text-red-400"><TbAlertCircle size={14} />{ciError}</p>
                )}
                <button
                  onClick={handleCiRegister}
                  disabled={ciSaving || !ciForm.code || !ciForm.name || !ciForm.script}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
                >
                  <TbPlus size={16} />
                  {ciSaving ? "Kaydediliyor..." : "İndikatör Ekle"}
                </button>
              </div>

              {/* Liste */}
              {loading ? (
                <p className="text-slate-500 text-sm py-8 text-center">Yükleniyor...</p>
              ) : customIndicators.length === 0 ? (
                <div className="py-12 text-center">
                  <TbCode size={32} className="text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">Henüz özel indikatör yok.</p>
                  <p className="text-slate-600 text-xs mt-1">Yukarıdaki formu kullanarak ekleyebilirsiniz.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {customIndicators.map((ci) => (
                    <div key={ci.code} className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-950/40 border border-amber-900/60 rounded-xl shrink-0">
                          <TbCode size={18} className="text-amber-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white">{ci.name}</p>
                          <p className="text-xs text-slate-500 font-mono">{ci.code}</p>
                          {ci.description && <p className="text-xs text-slate-600 mt-0.5 truncate">{ci.description}</p>}
                          {ci.keys?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {ci.keys.map(k => (
                                <span key={k.id} className="text-sky-400 bg-sky-950/40 border border-sky-800/60 rounded-full px-2 py-0.5 text-xs">
                                  {k.label}
                                </span>
                              ))}
                            </div>
                          )}
                          {ciRunResult[ci.code] !== undefined && (
                            <p className="flex items-center gap-1 text-xs text-emerald-400 mt-1.5">
                              <TbCircleCheck size={13} />{ciRunResult[ci.code]} hisse eşleşti
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button
                            onClick={() => handleCiRun(ci.code)}
                            disabled={ciRunning === ci.code}
                            title="Şimdi Tara"
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-400 border border-emerald-900/60 bg-emerald-950/30 hover:bg-emerald-950/60 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <TbPlayerPlay size={13} />
                            {ciRunning === ci.code ? "Tarıyor..." : "Tara"}
                          </button>
                          <button
                            onClick={() => handleCiDelete(ci.code)}
                            disabled={ciDeleting === ci.code}
                            title="Sil"
                            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-950/40 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <TbTrash size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
          {/* Live Streams Tab */}
          {tab === "liveStreams" && (
            <>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-white">Canlı Yayın Takvimi</h2>
                <span className="text-sm text-slate-500">{liveStreams.length} kayıt</span>
              </div>
              {/* Form */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 mb-5 space-y-3">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Yeni Yayın Ekle</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Başlık"
                    value={streamForm.title}
                    onChange={(e) => setStreamForm((f) => ({ ...f, title: e.target.value }))}
                    className="bg-[#0a1628] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-violet-600 transition-colors"
                  />
                  <input
                    type="datetime-local"
                    value={streamForm.stream_at}
                    onChange={(e) => setStreamForm((f) => ({ ...f, stream_at: e.target.value }))}
                    className="bg-[#0a1628] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-violet-600 transition-colors"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Açıklama (opsiyonel)"
                  value={streamForm.description}
                  onChange={(e) => setStreamForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full bg-[#0a1628] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-violet-600 transition-colors"
                />
                <button
                  onClick={handleAddStream}
                  disabled={streamSaving || !streamForm.title || !streamForm.stream_at}
                  className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
                >
                  <TbPlus size={16} />
                  {streamSaving ? "Kaydediliyor..." : "Yayın Ekle"}
                </button>
              </div>
              {/* List */}
              {loading ? (
                <p className="text-slate-500 text-sm py-8 text-center">Yükleniyor...</p>
              ) : liveStreams.length === 0 ? (
                <p className="text-slate-500 text-sm py-8 text-center">Henüz yayın takvimi yok.</p>
              ) : (
                <div className="space-y-3">
                  {liveStreams.map((ls) => (
                    <div key={ls.id} className="flex items-center gap-4 p-4 bg-slate-900/50 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors">
                      <div className="p-2 bg-violet-950/40 border border-violet-900/60 rounded-xl shrink-0">
                        <TbVideo size={18} className="text-violet-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white">{ls.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <TbCalendar size={12} className="text-slate-500" />
                          <span className="text-xs text-slate-400">
                            {new Date(ls.stream_at).toLocaleString("tr-TR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </span>
                          {ls.description && <span className="text-xs text-slate-600 truncate">{ls.description}</span>}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteStream(ls.id, ls.title)}
                        disabled={deletingStream === ls.id}
                        className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-950/40 rounded-lg transition-colors disabled:opacity-50 shrink-0"
                      >
                        <TbTrash size={15} />
                      </button>
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
