"use client";
import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { TbBrandTwitter, TbChartCandle, TbArrowRight } from "react-icons/tb";
import { SiTradingview } from "react-icons/si";
import Link from "next/link";
import { indicators } from "@/data/indicators";

export default function Indicators() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="indicators" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <p className="text-emerald-400 font-medium uppercase tracking-widest text-sm mb-2">
            İndikatörler & Yazılımlar
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Geliştirdiğim Araçlar
          </h2>
          <p className="text-slate-400 max-w-xl">
            TradingView ve Matriks platformları için yazdığım indikatörler,
            sinyal sistemleri ve analiz araçları. Detay için kartlara tıklayın.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {indicators.map((ind, i) => (
            <motion.div
              key={ind.slug}
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.08 * i }}
            >
              <Link
                href={`/indicators/${ind.slug}`}
                className="group relative flex flex-col h-full bg-[#0a1628]/80 border border-slate-800 rounded-2xl p-6 hover:border-emerald-700/70 transition-all hover:shadow-lg hover:shadow-emerald-950/30 cursor-pointer"
              >
                {/* Badge */}
                {ind.badge && (
                  <span
                    className={`absolute top-4 right-4 text-xs px-2.5 py-0.5 rounded-full border font-medium ${
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

                {/* Platform chip */}
                <div className="flex items-center gap-2 mb-4">
                  <span
                    className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${
                      ind.platform === "TradingView"
                        ? "bg-blue-950/60 text-blue-400 border border-blue-800"
                        : "bg-orange-950/60 text-orange-400 border border-orange-800"
                    }`}
                  >
                    {ind.platform === "TradingView" ? (
                      <SiTradingview size={12} />
                    ) : null}
                    {ind.platform}
                  </span>
                </div>

                <div className="text-emerald-400 mb-3 group-hover:scale-110 transition-transform origin-left">
                  <TbChartCandle size={28} />
                </div>

                <h3 className="font-bold text-base mb-2 text-white group-hover:text-emerald-300 transition-colors">
                  {ind.title}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-4 flex-1">
                  {ind.shortDesc}
                </p>

                <div className="flex flex-wrap gap-1.5 mb-4">
                  {ind.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-0.5 rounded bg-slate-800/80 text-slate-400"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-1.5 text-sm text-emerald-600 group-hover:text-emerald-400 transition-colors font-medium">
                  Detayları gör
                  <TbArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-10 text-center"
        >
          <a
            href="https://twitter.com/0TheBigShort1"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors"
          >
            <TbBrandTwitter size={18} />
            Tüm İndikatörler için Twitter&apos;ı Takip Edin
          </a>
        </motion.div>
      </div>
    </section>
  );
}

