"use client";
import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { SiTradingview } from "react-icons/si";
import { TbCode, TbChartBar, TbAlarm, TbWorld } from "react-icons/tb";

const platforms = [
  {
    icon: <SiTradingview size={40} />,
    name: "TradingView",
    language: "Pine Script v5",
    color: "emerald",
    description:
      "Dünya genelinde milyonlarca trader tarafından kullanılan TradingView platformu için Pine Script v5 diliyle indikatörler ve stratejiler geliştiriyorum.",
    features: [
      { icon: <TbCode size={16} />, text: "Pine Script v5 (En güncel)" },
      { icon: <TbChartBar size={16} />, text: "Hisse, Forex, Crypto, Emtia" },
      { icon: <TbAlarm size={16} />, text: "Webhook & Alarm desteği" },
      { icon: <TbWorld size={16} />, text: "Global piyasalar" },
    ],
    link: "https://www.tradingview.com",
  },
  {
    icon: (
      <span className="text-4xl font-black text-orange-400">M</span>
    ),
    name: "Matriks",
    language: "MatriksIQ / Filtre",
    color: "orange",
    description:
      "Türk yatırımcıların yoğun kullandığı Matriks platformu için BIST odaklı indikatörler, tarayıcılar ve analiz araçları yazıyorum.",
    features: [
      { icon: <TbCode size={16} />, text: "MatriksIQ & Filtre dili" },
      { icon: <TbChartBar size={16} />, text: "BIST 100 / Tüm Hisseler" },
      { icon: <TbAlarm size={16} />, text: "Gerçek zamanlı veri" },
      { icon: <TbWorld size={16} />, text: "Türkiye piyasası odaklı" },
    ],
    link: "https://www.matriksdata.com",
  },
];

export default function Platforms() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      id="platforms"
      className="py-24 px-6"
      style={{ background: "linear-gradient(180deg, #050a0e 0%, #071a12 50%, #050a0e 100%)" }}
    >
      <div className="max-w-5xl mx-auto">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <p className="text-emerald-400 font-medium uppercase tracking-widest text-sm mb-2">
            Platformlar
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold">
            Hangi Platformlar?
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {platforms.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.15 * i }}
              className={`relative bg-[#0a1628]/80 border rounded-2xl p-8 ${
                p.color === "emerald"
                  ? "border-emerald-900/50 hover:border-emerald-700/70"
                  : "border-orange-900/50 hover:border-orange-700/70"
              } transition-all`}
            >
              <div className="flex items-center gap-4 mb-5">
                <div className={`p-3 rounded-xl ${
                  p.color === "emerald" ? "bg-emerald-950/80 text-emerald-400" : "bg-orange-950/80 text-orange-400"
                }`}>
                  {p.icon}
                </div>
                <div>
                  <h3 className="text-xl font-bold">{p.name}</h3>
                  <span className={`text-xs font-mono px-2 py-0.5 rounded ${
                    p.color === "emerald"
                      ? "bg-emerald-950/60 text-emerald-500"
                      : "bg-orange-950/60 text-orange-500"
                  }`}>
                    {p.language}
                  </span>
                </div>
              </div>

              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                {p.description}
              </p>

              <ul className="space-y-2.5">
                {p.features.map((f, fi) => (
                  <li key={fi} className="flex items-center gap-2.5 text-sm text-slate-300">
                    <span className={p.color === "emerald" ? "text-emerald-500" : "text-orange-500"}>
                      {f.icon}
                    </span>
                    {f.text}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
