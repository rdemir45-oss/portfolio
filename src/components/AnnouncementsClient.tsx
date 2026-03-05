"use client";
import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef, useState } from "react";
import { TbPin, TbArrowRight, TbChartLine, TbBook, TbBell } from "react-icons/tb";
import Link from "next/link";
import type { DbPost, PostCategory } from "@/lib/supabase";

const categoryConfig: Record<
  PostCategory | "Tümü",
  { color: string; bg: string; border: string; icon: React.ReactNode }
> = {
  Tümü: { color: "text-slate-300", bg: "bg-slate-800/60", border: "border-slate-700", icon: null },
  "Teknik Analiz": { color: "text-emerald-400", bg: "bg-emerald-950/40", border: "border-emerald-800/60", icon: <TbChartLine size={14} /> },
  Eğitim: { color: "text-sky-400", bg: "bg-sky-950/40", border: "border-sky-800/60", icon: <TbBook size={14} /> },
  Duyuru: { color: "text-amber-400", bg: "bg-amber-950/40", border: "border-amber-800/60", icon: <TbBell size={14} /> },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
}

export default function AnnouncementsClient({ posts }: { posts: DbPost[] }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const [active, setActive] = useState<PostCategory | "Tümü">("Tümü");

  const filtered = active === "Tümü" ? posts : posts.filter((p) => p.category === active);
  const categories: (PostCategory | "Tümü")[] = ["Tümü", "Teknik Analiz", "Eğitim", "Duyuru"];

  return (
    <section id="announcements" className="py-16 sm:py-24 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-10"
        >
          <p className="text-emerald-400 font-medium uppercase tracking-widest text-sm mb-2">
            Analiz & Eğitim & Duyurular
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Güncel İçerikler</h2>
          <p className="text-slate-400 max-w-xl">
            Teknik analiz paylaşımları, eğitim yazıları ve indikatör duyuruları.
          </p>
        </motion.div>

        {/* Filtre */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="flex flex-wrap gap-2 mb-8"
        >
          {categories.map((cat) => {
            const cfg = categoryConfig[cat];
            const isActive = active === cat;
            return (
              <button
                key={cat}
                onClick={() => setActive(cat)}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${isActive
                    ? `${cfg.bg} ${cfg.border} ${cfg.color}`
                    : "bg-transparent border-slate-800 text-slate-500 hover:border-slate-600 hover:text-slate-300"
                  }`}
              >
                {cfg.icon}{cat}
              </button>
            );
          })}
        </motion.div>

        {/* Kartlar */}
        {filtered.length === 0 ? (
          <p className="text-slate-500 text-center py-16">Bu kategoride henüz içerik yok.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-5">
            {filtered.map((post, i) => {
              const cfg = categoryConfig[post.category];
              return (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 40 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.08 * i }}
                >
                  <Link
                    href={`/posts/${post.slug}`}
                    className="group flex flex-col h-full bg-[#0a1628]/80 border border-slate-800 rounded-2xl p-6 hover:border-emerald-700/70 transition-all hover:shadow-lg hover:shadow-emerald-950/30"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.border} ${cfg.color}`}>
                        {cfg.icon}{post.category}
                      </span>
                      <div className="flex items-center gap-2">
                        {post.pinned && <TbPin size={15} className="text-emerald-500 rotate-45" />}
                        <span className="text-xs text-slate-500">{formatDate(post.date)}</span>
                      </div>
                    </div>
                    <h3 className="text-base font-bold text-white mb-2 group-hover:text-emerald-300 transition-colors leading-snug">
                      {post.title}
                    </h3>
                    <p className="text-slate-400 text-sm leading-relaxed flex-1 mb-4">{post.summary}</p>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {post.tags.slice(0, 4).map((tag) => (
                        <span key={tag} className="text-xs text-slate-500 bg-slate-800/60 border border-slate-700/50 px-2 py-0.5 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-1 text-emerald-500 text-sm font-medium mt-auto group-hover:gap-2 transition-all">
                      Devamını oku <TbArrowRight size={16} />
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
