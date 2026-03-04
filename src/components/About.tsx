"use client";
import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { TbBrandTwitter, TbChartCandle, TbCode, TbZoomMoney } from "react-icons/tb";

const facts = [
  { icon: <TbChartCandle size={20} />, text: "Teknik analiz & price action odaklı geliştirme" },
  { icon: <TbCode size={20} />, text: "Pine Script v5 ve Matriks yazılım dilleri" },
  { icon: <TbZoomMoney size={20} />, text: "BIST, Forex ve Kripto piyasaları için araçlar" },
  { icon: <TbBrandTwitter size={20} />, text: "Twitter'da analiz ve indikatör paylaşımları" },
];

export default function About() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="about" className="py-16 sm:py-24 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <p className="text-emerald-400 font-medium uppercase tracking-widest text-sm mb-2">
            Hakkımda
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold mb-12">Kim Miyim?</h2>

          <div className="grid md:grid-cols-2 gap-8 sm:gap-12 items-center">
            <div>
              <div className="w-32 h-32 sm:w-48 sm:h-48 rounded-2xl mx-auto md:mx-0 flex items-center justify-center text-4xl sm:text-5xl font-black border border-emerald-800/50 shadow-2xl shadow-emerald-950/30"
                style={{ background: "linear-gradient(135deg, #064e3b, #0a1628)" }}>
                <span className="text-emerald-400">TBS</span>
              </div>
            </div>

            <div className="space-y-4 text-slate-300 leading-relaxed">
              <p>
                Merhaba! Ben <span className="text-emerald-400 font-semibold">@0TheBigShort1</span>, 
                borsa piyasalarına olan ilgim ve yazılım geliştirme tutkumu birleştirerek 
                TradingView ve Matriks platformları için özel indikatörler ve algoritmik trading araçları geliştiriyorum.
              </p>
              <p>
                Teknik analiz, Smart Money Concepts (SMC) ve price action üzerine
                yoğunlaşıyorum. Geliştirdiğim araçlar; BIST, Forex ve kripto
                piyasalarında trader&apos;lara zaman kazandırmak ve doğru karar vermelerine
                yardımcı olmak amacıyla tasarlanmıştır.
              </p>

              <ul className="pt-2 space-y-3">
                {facts.map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm">
                    <span className="text-emerald-400 flex-shrink-0">{f.icon}</span>
                    {f.text}
                  </li>
                ))}
              </ul>

              <div className="pt-4">
                <a
                  href="https://twitter.com/0TheBigShort1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-emerald-700 text-emerald-400 hover:bg-emerald-950/60 transition-colors text-sm font-medium"
                >
                  <TbBrandTwitter size={16} />
                  Twitter&apos;da Takip Et
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
