"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TbArrowLeft, TbPhoto, TbX } from "react-icons/tb";
import Image from "next/image";

const categories = ["Teknik Analiz", "Eğitim", "Duyuru"];

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
    .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function NewPostPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [coverImage, setCoverImage] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    slug: "",
    category: "Teknik Analiz",
    date: new Date().toISOString().split("T")[0],
    summary: "",
    content: "",
    tags: "",
    pinned: false,
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value, type } = e.target;
    const val = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
    setForm((prev) => ({
      ...prev,
      [name]: val,
      ...(name === "title" ? { slug: slugify(value) } : {}),
    }));
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (data.url) setCoverImage(data.url);
    else setError("Resim yüklenemedi: " + data.error);
    setUploading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const payload = {
      ...form,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      cover_image: coverImage ?? null,
    };
    const res = await fetch("/api/admin/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      router.push("/admin/dashboard");
    } else {
      const data = await res.json();
      setError(data.error || "Bir hata oluştu.");
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen px-4 sm:px-8 pt-10 pb-20">
      <div className="max-w-2xl mx-auto">
        <Link href="/admin/dashboard" className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-8 transition-colors">
          <TbArrowLeft size={16} />
          Geri
        </Link>
        <h1 className="text-2xl font-black text-white mb-8">Yeni Yazı</h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Başlık */}
          <Field label="Başlık *">
            <input name="title" value={form.title} onChange={handleChange} required
              className={inputCls} placeholder="Yazı başlığı" />
          </Field>

          {/* Slug */}
          <Field label="Slug (URL)" hint="Otomatik oluşturulur, değiştirebilirsin.">
            <input name="slug" value={form.slug} onChange={handleChange} required
              className={inputCls} placeholder="yazi-basligi" />
          </Field>

          {/* Kategori + Tarih */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Kategori *">
              <select name="category" value={form.category} onChange={handleChange} className={inputCls}>
                {categories.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Tarih *">
              <input type="date" name="date" value={form.date} onChange={handleChange} required className={inputCls} />
            </Field>
          </div>

          {/* Özet */}
          <Field label="Özet *" hint="Kart üzerinde görünür.">
            <textarea name="summary" value={form.summary} onChange={handleChange} required rows={2}
              className={inputCls} placeholder="Kısa açıklama" />
          </Field>

          {/* Kapak Resmi */}
          <Field label="Kapak Resmi" hint="Kartlarda ve yazı başında görünür.">
            {coverImage ? (
              <div className="relative rounded-xl overflow-hidden border border-slate-700">
                <Image src={coverImage} alt="Kapak resmi" width={800} height={400} className="w-full h-48 object-cover" />
                <button type="button" onClick={() => setCoverImage(null)}
                  className="absolute top-2 right-2 p-1.5 bg-slate-900/80 rounded-full text-white hover:bg-red-900/80 transition-colors">
                  <TbX size={16} />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-2 h-32 border-2 border-dashed border-slate-700 rounded-xl cursor-pointer hover:border-emerald-600 transition-colors">
                {uploading ? (
                  <span className="text-slate-400 text-sm">Yükleniyor...</span>
                ) : (
                  <>
                    <TbPhoto size={28} className="text-slate-600" />
                    <span className="text-slate-500 text-sm">Resim seç veya sürükle</span>
                    <span className="text-slate-600 text-xs">PNG, JPG, WebP</span>
                  </>
                )}
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
              </label>
            )}
          </Field>

          {/* İçerik */}
          <Field label="İçerik *" hint="**Kalın başlık**, *Alt başlık*, - Madde olarak yazabilirsin.">
            <textarea name="content" value={form.content} onChange={handleChange} required rows={14}
              className={`${inputCls} font-mono text-sm`} placeholder="Yazı içeriği..." />
          </Field>

          {/* Etiketler */}
          <Field label="Etiketler" hint="Virgülle ayır: BIST, Fibonacci, Eğitim">
            <input name="tags" value={form.tags} onChange={handleChange}
              className={inputCls} placeholder="Etiket1, Etiket2" />
          </Field>

          {/* Sabitlenmiş */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" name="pinned" checked={form.pinned} onChange={handleChange}
              className="w-4 h-4 accent-emerald-500" />
            <span className="text-sm text-slate-300">Sayfanın üstüne sabitle</span>
          </label>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex items-center gap-3 pt-2">
            <button type="submit" disabled={saving || uploading}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors">
              {saving ? "Kaydediliyor..." : "Kaydet"}
            </button>
            <Link href="/admin/dashboard" className="px-6 py-2.5 text-slate-400 hover:text-white text-sm transition-colors">
              İptal
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}

const inputCls = "w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-600 transition-colors resize-none";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-1.5">
        {label}
        {hint && <span className="ml-2 text-xs text-slate-500 font-normal">{hint}</span>}
      </label>
      {children}
    </div>
  );
}
