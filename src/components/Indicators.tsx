"use client";
import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { TbChartLine, TbChartCandle, TbBell, TbArrowUpRight, TbArrowDownRight, TbBrandTwitter } from "react-icons/tb";
import { SiTradingview } from "react-icons/si";

const indicators = [
  {
    icon: <TbChartCandle size={28} />,
    title: "Smart Money Concepts (SMC)",
    platform: "TradingView",
    description:
      "Order Block, Fair Value Gap, Break of Structure ve Change of Character tespiti. Kurumsal para hareketlerini otomatik olarak işaretler.",
    tags: ["Pine Script", "BIST", "Forex", "Crypto"],
    badge: "Popüler",
    badgeColor: "bg-emerald-900/60 text-emerald-400 border-emerald-700",
  },
  {
    icon: <TbBell size={28} />,
    title: "Multi-Timeframe Sinyal Sistemi",
    platform: "TradingView",
    description:
      "Çoklu zaman dilimini aynı anda analiz ederek güçlü alım/satım sinyalleri üretir. Webhook ile alarm desteği mevcuttur.",
    tags: ["Pine Script", "Multi-TF", "Alarm", "Webhook"],
    badge: "Yeni",
    badgeColor: "bg-blue-900/60 text-blue-400 border-blue-700",
  },
  {
    icon: <TbChartLine size={28} />,
    title: "Trend & Momentum Göstergesi",
    platform: "TradingView",
    description:
      "RSI, MACD ve hacim verilerini birleştiren özel momentum göstergesi. Trendin gücünü ve olası dönüş noktalarını tespit eder.",
    tags: ["Pine Script", "RSI", "MACD", "Hacim"],
    badge: null,
    badgeColor: "",
  },
  {
    icon: <TbArrowUpRight size={28} />,
    title: "BIST Hisse Tarayıcı",
    platform: "Matriks",
    description:
      "BIST'teki tüm hisseler arasında belirlenen kriterlere göre otomatik tarama yapan filtre sistemi. Günlük rapor oluşturur.",
    tags: ["Matriks", "BIST", "Tarayıcı", "Filtre"],
    badge: "Özel",
    badgeColor: "bg-orange-900/60 text-orange-400 border-orange-700",
  },
  {
    icon: <TbArrowDownRight size={28} />,
    title: "Destek & Direnç Tespiti",
    platform: "Matriks",
    description:
      "Fiyat aksiyonuna göre dinamik destek ve direnç seviyelerini otomatik hesaplar. Risk/ödül oranını ekrana yansıtır.",
    tags: ["Matriks", "S/R", "Risk/Ödül", "Price Action"],
    badge: null,
    badgeColor: "",
  },
  {
    icon: <TbChartCandle size={28} />,
    title: "Liquidation Heatmap",
    platform: "TradingView",
    description:
      "Piyasadaki yüksek kaldıraç bölgelerini ve olası likidite avı noktalarını görselleştirir. Kripto ve Forex için optimize edilmiştir.",
    tags: ["Pine Script", "Crypto", "Likidite", "Heatmap"],
    badge: "Beta",
    badgeColor: "bg-purple-900/60 text-purple-400 border-purple-700",
  },
];

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
            sinyal sistemleri ve analiz araçları. Detay veya erişim için
            Twitter&apos;dan ulaşabilirsiniz.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {indicators.map((ind, i) => (
            <motion.div
              key={ind.title}
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.08 * i }}
              className="group relative bg-[#0a1628]/80 border border-slate-800 rounded-2xl p-6 hover:border-emerald-800/70 transition-all hover:shadow-lg hover:shadow-emerald-950/30"
            >
              {/* Badge */}
              {ind.badge && (
                <span className={`absolute top-4 right-4 text-xs px-2.5 py-0.5 rounded-full border font-medium ${ind.badgeColor}`}>
                  {ind.badge}
                </span>
              )}

              {/* Platform chip */}
              <div className="flex items-center gap-2 mb-4">
                <span className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${
                  ind.platform === "TradingView"
                    ? "bg-blue-950/60 text-blue-400 border border-blue-800"
                    : "bg-orange-950/60 text-orange-400 border border-orange-800"
                }`}>
                  {ind.platform === "TradingView" ? <SiTradingview size={12} /> : null}
                  {ind.platform}
                </span>
              </div>

              <div className="text-emerald-400 mb-3 group-hover:scale-110 transition-transform origin-left">
                {ind.icon}
              </div>

              <h3 className="font-bold text-base mb-2 text-white group-hover:text-emerald-300 transition-colors">
                {ind.title}
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                {ind.description}
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

              <a
                href="https://twitter.com/0TheBigShort1"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-emerald-400 transition-colors"
              >
                <TbBrandTwitter size={15} />
                Bilgi & Erişim
              </a>
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
