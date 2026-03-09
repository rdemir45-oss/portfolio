"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { FiTwitter, FiArrowDown } from "react-icons/fi";
import { TbChartCandleFilled, TbBrandWhatsapp } from "react-icons/tb";
import WhatsappModal from "./WhatsappModal";

/* Decorative fake candlestick bars */
const bars = [
  { h: 60, body: 36, up: true },
  { h: 90, body: 55, up: false },
  { h: 50, body: 30, up: true },
  { h: 110, body: 70, up: true },
  { h: 75, body: 45, up: false },
  { h: 95, body: 60, up: true },
  { h: 65, body: 40, up: false },
  { h: 130, body: 80, up: true },
  { h: 80, body: 50, up: true },
  { h: 55, body: 33, up: false },
  { h: 100, body: 62, up: true },
  { h: 70, body: 42, up: false },
];

export default function Hero() {
  const [whatsappOpen, setWhatsappOpen] = useState(false);

  return (
    <section
      id="hero"
      className="min-h-screen flex flex-col items-center justify-center relative px-6 overflow-hidden"
      style={{ background: "linear-gradient(135deg, #050a0e 0%, #071a12 60%, #050a0e 100%)" }}
    >
      {/* Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />

      {/* Decorative candlesticks */}
      <div className="absolute bottom-16 left-0 right-0 flex items-end justify-center gap-3 opacity-10 pointer-events-none px-8 overflow-hidden">
        {bars.map((b, i) => (
          <div key={i} className="flex flex-col items-center gap-0.5" style={{ height: b.h }}>
            <div className="w-px flex-1" style={{ background: b.up ? "#10b981" : "#ef4444" }} />
            <div
              className="w-5 rounded-sm"
              style={{ height: b.body, background: b.up ? "#10b981" : "#ef4444" }}
            />
            <div className="w-px flex-1" style={{ background: b.up ? "#10b981" : "#ef4444" }} />
          </div>
        ))}
      </div>

      <div className="relative z-10 text-center max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-center gap-2 mb-6"
        >
          <TbChartCandleFilled className="text-emerald-400" size={22} />
          <span className="text-emerald-400 font-medium tracking-widest uppercase text-sm">
            TradingView &amp; Matriks İndikatörleri
          </span>
          <TbChartCandleFilled className="text-emerald-400" size={22} />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl sm:text-7xl font-extrabold mb-4 tracking-tight"
        >
          <span className="text-white">The</span>
          <span className="text-emerald-400"> Big </span>
          <span className="text-white">Short</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-xl sm:text-2xl text-slate-400 mb-6"
        >
          Borsa için Algoritmik İndikatörler &amp; Trading Yazılımları
        </motion.p>

        {/* Çarpıcı ana mesaj */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="bg-gradient-to-br from-emerald-950/60 to-slate-900/60 border border-emerald-800/40 rounded-2xl px-4 sm:px-6 py-5 sm:py-6 max-w-2xl mx-auto mb-8 text-left space-y-5"
        >
          <div className="flex items-start gap-3">
            <span className="mt-1 shrink-0 w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
            <p className="text-slate-200 leading-relaxed">
              <span className="text-white font-semibold">Formasyonları ve sinyalleri biliyorsunuz</span> —
              peki BIST&#39;teki 600+ hisseyi tek tek incelemek için saatlerinizi harcıyor musunuz?{" "}
              <span className="text-emerald-400 font-semibold">RdAlgo sistemleri</span> ile aradığınız setup&#39;ı
              saniyeler içinde bulun; trende hazır olun, fırsatı kaçırmayın.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="mt-1 shrink-0 w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
            <p className="text-slate-200 leading-relaxed">
              <span className="text-white font-semibold">Kendi stratejiniz var ama kodlamayı bilmiyor musunuz?</span>{" "}
              Hiç sorun değil.{" "}
              <span className="text-emerald-400 font-semibold">RdAlgo ile iletişime geçin</span>,
              stratejinizi birlikte kodlayalım — kafanızdaki fikri çalışan bir algoritmaya dönüştürelim.
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mb-6"
        >
          <button
            onClick={() => setWhatsappOpen(true)}
            className="group relative inline-flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-green-950/60 border border-green-700/60 hover:border-green-500 hover:bg-green-950/80 transition-all"
          >
            {/* Pulse ring */}
            <span className="absolute -inset-px rounded-2xl border border-green-500/40 animate-ping opacity-75 group-hover:opacity-0" />
            <div className="p-1.5 bg-green-800/60 rounded-xl">
              <TbBrandWhatsapp size={20} className="text-green-400" />
            </div>
            <div className="text-left">
              <div className="text-white font-semibold text-sm leading-tight">Ücretsiz Bilgi Alın</div>
              <div className="text-green-400/80 text-xs">Numaranızı bırakın, sizi arayalım →</div>
            </div>
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.55 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10"
        >
          <a
            href="#indicators"
            className="px-8 py-3 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors"
          >
            İndikatörleri İncele
          </a>
          <a
            href="https://twitter.com/0TheBigShort1"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-8 py-3 rounded-full border border-slate-700 hover:border-emerald-600 text-slate-300 hover:text-white font-semibold transition-colors"
          >
            <FiTwitter size={18} />
            @0TheBigShort1
          </a>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-sm"
        >
          {[
            { label: "İndikatör", value: "10+" },
            { label: "Platform", value: "2" },
            { label: "Piyasa", value: "BIST & Global" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-2xl font-bold text-emerald-400">{s.value}</div>
              <div className="text-slate-500">{s.label}</div>
            </div>
          ))}
        </motion.div>
      </div>

      <motion.a
        href="#indicators"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8 text-slate-600 hover:text-emerald-400 transition-colors animate-bounce"
      >
        <FiArrowDown size={24} />
      </motion.a>

      <WhatsappModal open={whatsappOpen} onClose={() => setWhatsappOpen(false)} />
    </section>
  );
}
