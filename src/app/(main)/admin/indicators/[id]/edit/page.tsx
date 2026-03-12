"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { TbArrowLeft, TbUpload, TbX } from "react-icons/tb";
import type { DbIndicator } from "@/lib/supabase";

function slugify(str: string) {
  return str
    .toLowerCase()
    .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
    .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim().replace(/\s+/g, "-").replace(/-+/g, "-");
}

export default function EditIndicatorPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [autoSlug, setAutoSlug] = useState(false);

  const [form, setForm] = useState({
    title: "",
    slug: "",
    platform: "TradingView",
    short_desc: "",
    description: "",
    cover_image: "",
    tags: "",
    badge: "",
    badge_color: "",
    tradingview_url: "",
    sort_order: 0,
  });

  function set(field: string, value: string | number) {
    setForm((p) => ({ ...p, [field]: value }));
  }

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/admin/indicators?id=${id}`);
      if (!res.ok) { setLoading(false); return; }
      const ind: DbIndicator = await res.json();
      if (ind && !("error" in ind)) {
        setForm({
          title: ind.title,
          slug: ind.slug,
          platform: ind.platform,
          short_desc: ind.short_desc,
          description: ind.description,
          cover_image: ind.cover_image ?? "",
          tags: (ind.tags ?? []).join(", "),
          badge: ind.badge ?? "",
          badge_color: ind.badge_color ?? "",
          tradingview_url: ind.tradingview_url ?? "",
          sort_order: ind.sort_order ?? 0,
        });
      }
      setLoading(false);
    }
    load();
  }, [id]);

  async function uploadCover(file: File) {
    setUploadingCover(true);
    const data = new FormData();
    data.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: data });
    const json = await res.json();
    if (json.url) set("cover_image", json.url);
    setUploadingCover(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      id: parseInt(id),
      ...form,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
    };
    const res = await fetch("/api/admin/indicators", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      router.push("/admin/dashboard");
    } else {
      alert("Hata oluştu. Lütfen tekrar deneyin.");
      setSaving(false);
    }
  }

  const inputCls = "w-full bg-slate-900/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-600 transition-colors";
  const labelCls = "block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5";

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500">Yükleniyor...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 sm:px-8 pt-10 pb-20">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/admin/dashboard" className="p-2 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-600 rounded-xl transition-colors">
            <TbArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-black text-white">İndikatörü Düzenle</h1>
            <p className="text-slate-500 text-xs mt-0.5">{form.title || "Düzenleniyor..."}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div>
            <label className={labelCls}>Başlık *</label>
            <input required value={form.title} onChange={(e) => {
              set("title", e.target.value);
              if (autoSlug) set("slug", slugify(e.target.value));
            }} placeholder="RdAlgo XYZ İndikatörü" className={inputCls} />
          </div>

          {/* Slug */}
          <div>
            <label className={labelCls}>
              Slug *{" "}
              <span className="text-slate-600 font-normal normal-case tracking-normal">
                (değiştirmek için dikkatli ol — mevcut linkler bozulur)
              </span>
            </label>
            <input required value={form.slug} onChange={(e) => {
              set("slug", e.target.value);
              setAutoSlug(false);
            }} placeholder="rdalgo-xyz-indikator" className={inputCls} />
          </div>

          {/* Platform */}
          <div>
            <label className={labelCls}>Platform *</label>
            <select value={form.platform} onChange={(e) => set("platform", e.target.value)}
              className={inputCls + " appearance-none"}>
              <option value="TradingView">TradingView</option>
              <option value="Matriks">Matriks</option>
            </select>
          </div>

          {/* Short Desc */}
          <div>
            <label className={labelCls}>Kısa Açıklama *</label>
            <input required value={form.short_desc} onChange={(e) => set("short_desc", e.target.value)}
              placeholder="Kart üzerinde görünecek kısa açıklama" className={inputCls} />
          </div>

          {/* Description */}
          <div>
            <label className={labelCls}>Detay İçeriği (Markdown) *</label>
            <textarea required rows={10} value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="İndikatörün detaylı açıklaması. Markdown desteklenir."
              className={inputCls + " resize-y"} />
          </div>

          {/* Cover Image */}
          <div>
            <label className={labelCls}>Kapak Görseli</label>
            {form.cover_image ? (
              <div className="relative w-full rounded-xl overflow-hidden border border-slate-700 bg-slate-900/40">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.cover_image} alt="Kapak" className="w-full h-48 object-cover" />
                <button type="button" onClick={() => set("cover_image", "")}
                  className="absolute top-2 right-2 p-1.5 bg-red-900/80 hover:bg-red-700 text-white rounded-lg transition-colors">
                  <TbX size={14} />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-2 w-full h-32 border-2 border-dashed border-slate-700 hover:border-emerald-700 rounded-xl cursor-pointer transition-colors group">
                <TbUpload size={20} className={`transition-colors ${uploadingCover ? "text-emerald-400 animate-bounce" : "text-slate-500 group-hover:text-emerald-400"}`} />
                <span className="text-xs text-slate-500 group-hover:text-slate-300 transition-colors">
                  {uploadingCover ? "Yükleniyor..." : "Görsel seç veya sürükle"}
                </span>
                <input type="file" accept="image/*" className="hidden"
                  onChange={(e) => { if (e.target.files?.[0]) uploadCover(e.target.files[0]); }} />
              </label>
            )}
          </div>

          {/* Tags */}
          <div>
            <label className={labelCls}>Etiketler (virgülle ayır)</label>
            <input value={form.tags} onChange={(e) => set("tags", e.target.value)}
              placeholder="Pine Script v5, Harmonik, Fibonacci" className={inputCls} />
          </div>

          {/* Badge */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Rozet Etiketi</label>
              <input value={form.badge} onChange={(e) => set("badge", e.target.value)}
                placeholder="Popüler" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Rozet Rengi</label>
              <select value={form.badge_color} onChange={(e) => set("badge_color", e.target.value)}
                className={inputCls + " appearance-none"}>
                <option value="">Seç</option>
                <option value="emerald">Yeşil (emerald)</option>
                <option value="blue">Mavi (blue)</option>
                <option value="purple">Mor (purple)</option>
                <option value="amber">Sarı (amber)</option>
              </select>
            </div>
          </div>

          {/* TradingView URL + Sort */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>TradingView URL</label>
              <input value={form.tradingview_url} onChange={(e) => set("tradingview_url", e.target.value)}
                placeholder="https://www.tradingview.com/..." className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Sıralama</label>
              <input type="number" value={form.sort_order}
                onChange={(e) => set("sort_order", parseInt(e.target.value) || 0)}
                className={inputCls} />
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button type="submit" disabled={saving}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors">
              {saving ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
