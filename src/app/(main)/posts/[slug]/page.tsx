import { posts as staticPosts } from "@/data/posts";
import { supabase } from "@/lib/supabase";
import type { DbPost } from "@/lib/supabase";
import { notFound } from "next/navigation";
import Link from "next/link";
import { TbArrowLeft, TbChartLine, TbBook, TbBell, TbPin } from "react-icons/tb";
import type { Metadata } from "next";
import Image from "next/image";

type Props = { params: Promise<{ slug: string }> };

async function getPost(slug: string): Promise<DbPost | null> {
  try {
    const { data } = await supabase.from("posts").select("*").eq("slug", slug).single();
    if (data) return data;
  } catch {}
  // Static fallback
  const s = staticPosts.find((p) => p.slug === slug);
  if (!s) return null;
  return { ...s, id: 0, pinned: s.pinned ?? false };
}

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  return staticPosts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};
  return {
    title: `${post.title} | TheBigShort`,
    description: post.summary,
  };
}

const categoryIcons: Record<string, React.ReactNode> = {
  "Teknik Analiz": <TbChartLine size={15} />,
  Eğitim: <TbBook size={15} />,
  Duyuru: <TbBell size={15} />,
};

const categoryColors: Record<string, string> = {
  "Teknik Analiz": "text-emerald-400 bg-emerald-950/40 border-emerald-800/60",
  Eğitim: "text-sky-400 bg-sky-950/40 border-sky-800/60",
  Duyuru: "text-amber-400 bg-amber-950/40 border-amber-800/60",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function renderContent(content: string) {
  return content.split("\n").map((line, i) => {
    if (line.startsWith("**") && line.endsWith("**")) {
      return (
        <h3 key={i} className="text-lg font-bold text-white mt-8 mb-3">
          {line.slice(2, -2)}
        </h3>
      );
    }
    if (line.startsWith("*") && line.endsWith("*")) {
      return (
        <h4 key={i} className="text-base font-semibold text-emerald-300 mt-5 mb-2">
          {line.slice(1, -1)}
        </h4>
      );
    }
    if (line.startsWith("- ")) {
      return (
        <li key={i} className="text-slate-300 leading-relaxed ml-4 list-disc">
          {line.slice(2)}
        </li>
      );
    }
    if (line.startsWith("```")) return null;
    if (line.trim() === "") return <div key={i} className="h-2" />;
    return (
      <p key={i} className="text-slate-300 leading-relaxed">
        {line}
      </p>
    );
  });
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const catColor = categoryColors[post.category] || "text-slate-400 bg-slate-800 border-slate-700";

  return (
    <main className="min-h-screen px-4 sm:px-6 pt-28 pb-20">
      <div className="max-w-3xl mx-auto">
        {/* Geri */}
        <Link
          href="/#announcements"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-emerald-400 transition-colors mb-8"
        >
          <TbArrowLeft size={16} />
          Tüm içerikler
        </Link>

        {/* Kategori & tarih */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${catColor}`}>
            {categoryIcons[post.category]}
            {post.category}
          </span>
          {post.pinned && (
            <span className="flex items-center gap-1 text-xs text-emerald-500">
              <TbPin size={13} className="rotate-45" />
              Sabitlenmiş
            </span>
          )}
          <span className="text-sm text-slate-500">{formatDate(post.date)}</span>
        </div>

        {/* Başlık */}
        <h1 className="text-2xl sm:text-4xl font-black text-white leading-tight mb-5">
          {post.title}
        </h1>

        {/* Kapak resmi */}
        {post.cover_image && (
          <div className="relative w-full h-64 sm:h-80 rounded-2xl overflow-hidden mb-8 border border-slate-800">
            <Image src={post.cover_image} alt={post.title} fill className="object-cover" />
          </div>
        )}

        {/* Özet */}
        <p className="text-slate-400 text-base leading-relaxed border-l-2 border-emerald-700 pl-4 mb-10">
          {post.summary}
        </p>

        {/* İçerik */}
        <div className="space-y-1">{renderContent(post.content)}</div>

        {/* Etiketler */}
        <div className="flex flex-wrap gap-2 mt-12 pt-8 border-t border-slate-800">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs text-slate-400 bg-slate-800/60 border border-slate-700/50 px-3 py-1 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Geri dön */}
        <div className="mt-10">
          <Link
            href="/#announcements"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-emerald-700 text-emerald-400 text-sm hover:bg-emerald-950/60 transition-colors"
          >
            <TbArrowLeft size={16} />
            Tüm içeriklere dön
          </Link>
        </div>
      </div>
    </main>
  );
}
