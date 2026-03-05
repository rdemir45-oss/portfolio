import { indicators } from "@/data/indicators";
import { createClient } from "@/lib/supabase";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { TbArrowLeft, TbBrandTwitter, TbExternalLink } from "react-icons/tb";
import { SiTradingview } from "react-icons/si";

export const dynamic = "force-dynamic";

async function getIndicator(slug: string) {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("indicators")
      .select("*")
      .eq("slug", slug)
      .single();
    if (!error && data) {
      return {
        slug: data.slug,
        title: data.title,
        platform: data.platform as "TradingView" | "Matriks",
        shortDesc: data.short_desc,
        description: data.description,
        images: data.images ?? [],
        tags: data.tags ?? [],
        badge: data.badge ?? undefined,
        badgeColor: data.badge_color ?? undefined,
        tradingviewUrl: data.tradingview_url ?? undefined,
        cover_image: data.cover_image ?? undefined,
      };
    }
  } catch {}
  const ind = indicators.find((i) => i.slug === slug);
  if (!ind) return null;
  return { ...ind, cover_image: undefined };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ind = await getIndicator(slug);
  if (!ind) return {};
  return {
    title: `${ind.title} | TheBigShort`,
    description: ind.shortDesc,
  };
}

export default async function IndicatorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ind = await getIndicator(slug);
  if (!ind) notFound();

  return (
    <main className="min-h-screen pt-24 pb-20 px-4 sm:px-6" style={{ background: "#050a0e" }}>
      <div className="max-w-4xl mx-auto">
        {/* Back */}
        <Link
          href="/#indicators"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-emerald-400 transition-colors text-sm mb-10"
        >
          <TbArrowLeft size={16} />
          Tüm İndikatörler
        </Link>

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <span
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${
                ind.platform === "TradingView"
                  ? "bg-blue-950/60 text-blue-400 border border-blue-800"
                  : "bg-orange-950/60 text-orange-400 border border-orange-800"
              }`}
            >
              {ind.platform === "TradingView" && <SiTradingview size={12} />}
              {ind.platform}
            </span>
            {ind.badge && (
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${
                  ind.badgeColor === "emerald"
                    ? "bg-emerald-900/60 text-emerald-400 border-emerald-700"
                    : ind.badgeColor === "blue"
                    ? "bg-blue-900/60 text-blue-400 border-blue-700"
                    : ind.badgeColor === "purple"
                    ? "bg-purple-900/60 text-purple-400 border-purple-700"
                    : "bg-slate-800 text-slate-300 border-slate-700"
                }`}
              >
                {ind.badge}
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold mb-4">{ind.title}</h1>
          <p className="text-slate-400 text-base sm:text-lg leading-relaxed">{ind.shortDesc}</p>
          <div className="flex flex-wrap gap-2 mt-4">
            {ind.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Cover Image */}
        {"cover_image" in ind && ind.cover_image && (
          <div className="relative w-full h-64 sm:h-80 rounded-2xl overflow-hidden border border-slate-800 mb-10">
            <Image src={ind.cover_image} alt={ind.title} fill className="object-cover" />
          </div>
        )}

        {/* Images */}
        {ind.images.length > 0 ? (
          <div className="space-y-4 mb-10">
            {ind.images.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={src}
                alt={`${ind.title} ekran görüntüsü ${i + 1}`}
                className="w-full rounded-2xl border border-slate-800"
              />
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-56 rounded-2xl border border-dashed border-slate-700 mb-10 text-slate-600 text-sm">
            Görseller yakında eklenecek
          </div>
        )}

        {/* Description */}
        <div className="bg-[#0a1628]/80 border border-slate-800 rounded-2xl p-5 sm:p-8 mb-8">
          <h2 className="text-xl font-bold mb-4 text-emerald-400">Açıklama</h2>
          {ind.description === "Bu indikatör hakkında detaylı açıklama yakında eklenecek." ? (
            <p className="text-slate-500 italic">Detaylı açıklama yakında eklenecek...</p>
          ) : (
            <div className="text-slate-300 leading-relaxed whitespace-pre-wrap">
              {ind.description}
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-4">
          {ind.tradingviewUrl && (
            <a
              href={ind.tradingviewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-blue-700 hover:bg-blue-600 text-white font-semibold transition-colors"
            >
              <TbExternalLink size={18} />
              TradingView&apos;de Görüntüle
            </a>
          )}
          <a
            href="https://twitter.com/0TheBigShort1"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-emerald-700 text-emerald-400 hover:bg-emerald-950/60 font-semibold transition-colors"
          >
            <TbBrandTwitter size={18} />
            Erişim için Twitter
          </a>
        </div>
      </div>
    </main>
  );
}
