"use client";

import { motion } from "framer-motion";
import {
  TbChartCandle,
  TbBell,
  TbRobot,
  TbChartLine,
  TbCode,
  TbRefresh,
  TbArrowRight,
} from "react-icons/tb";
import { HiTrendingUp } from "react-icons/hi";

const FEATURES = [
  {
    icon: <TbRobot size={28} />,
    color: "emerald",
    title: "600+ Hisseyi Dakikalar İçinde Tara",
    desc: "BIST'teki tüm hisseleri elle incelemeniz gerekmiyor. Sistem otomatik olarak formasyonları, RSI/MACD sinyallerini ve harmonik desenleri bulur; siz sadece hazır listeye bakarsınız.",
  },
  {
    icon: <TbBell size={28} />,
    color: "sky",
    title: "Fırsatı Kaçırmadan Telegram'a Bildirim Al",
    desc: "Seçtiğiniz sinyal kategorilerinde hisse çıkınca anında Telegram mesajı alırsınız — ekran başında beklemenize gerek yok.",
  },
  {
    icon: <TbChartCandle size={28} />,
    color: "violet",
    title: "Profesyonel TradingView & Matriks İndikatörleri",
    desc: "Yalnızca BIST'e optimize edilmiş, gerçek piyasa koşullarında test edilmiş indikatörler. Kendi stratejinizi güçlendirmek için hazır araçlar.",
  },
  {
    icon: <TbCode size={28} />,
    color: "amber",
    title: "Stratejinizi Kodlayalım",
    desc: "Kafanızda bir alım-satım fikri mi var? Pine Script veya Python ile algoritmaya dönüştürüyoruz. Backtest, optimizasyon ve canlı kullanım için.",
  },
];

const STATS = [
  { value: "600+", label: "BIST Hissesi Taranıyor" },
  { value: "25+", label: "Sinyal Kategorisi" },
  { value: "7/24", label: "Otomatik Çalışır" },
];

const colorMap: Record<string, { border: string; bg: string; icon: string; title: string }> = {
  emerald: {
    border: "border-emerald-800/50",
    bg: "bg-emerald-950/20",
    icon: "text-emerald-400",
    title: "text-emerald-300",
  },
  sky: {
    border: "border-sky-800/50",
    bg: "bg-sky-950/20",
    icon: "text-sky-400",
    title: "text-sky-300",
  },
  violet: {
    border: "border-violet-800/50",
    bg: "bg-violet-950/20",
    icon: "text-violet-400",
    title: "text-violet-300",
  },
  amber: {
    border: "border-amber-800/50",
    bg: "bg-amber-950/20",
    icon: "text-amber-400",
    title: "text-amber-300",
  },
};

export default function SiteFeatures() {
  return (
    <section id="nedir" className="py-24 px-4 sm:px-6 relative overflow-hidden bg-[#050a0e]">
      {/* Arka plan glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Başlık */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 bg-emerald-950/50 border border-emerald-800/50 rounded-full px-4 py-1.5 mb-5">
            <HiTrendingUp className="text-emerald-400" size={16} />
            <span className="text-emerald-400 text-xs font-semibold tracking-widest uppercase">
              Ne İşe Yarar?
            </span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-4 leading-tight">
            Analizi Siz Yapın,{" "}
            <span className="text-emerald-400">Taramayı Bize Bırakın</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
            Günde saatlerce grafik izlemek yerine —{" "}
            <span className="text-white font-medium">
              algoritma sizin için çalışsın, siz sadece kararı verin.
            </span>
          </p>
        </motion.div>

        {/* İstatistikler */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-14"
        >
          {STATS.map((s) => (
            <div
              key={s.label}
              className="bg-[#0a1628]/80 border border-slate-800 rounded-2xl p-5 text-center"
            >
              <p className="text-3xl font-black text-emerald-400 mb-1">{s.value}</p>
              <p className="text-xs text-slate-500">{s.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Özellik kartları */}
        <div className="grid sm:grid-cols-2 gap-4 mb-14">
          {FEATURES.map((f, i) => {
            const c = colorMap[f.color];
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className={`rounded-2xl border ${c.border} ${c.bg} p-6`}
              >
                <div className={`mb-4 ${c.icon}`}>{f.icon}</div>
                <h3 className={`text-base font-bold mb-2 ${c.title}`}>{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Vurgu bloğu */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="rounded-3xl border border-emerald-800/40 bg-gradient-to-br from-emerald-950/40 to-slate-900/60 p-8 sm:p-10 flex flex-col sm:flex-row items-center gap-8"
        >
          <div className="flex-1 text-center sm:text-left">
            <p className="text-xs font-semibold tracking-widest text-emerald-500 uppercase mb-3">
              Kısacası
            </p>
            <h3 className="text-2xl sm:text-3xl font-black text-white mb-3 leading-snug">
              İyi bir trader{" "}
              <span className="text-emerald-400">hızlı hareket eder.</span>
              <br />
              Bu sistem sizi hızlı yapar.
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xl">
              BIST'te fırsat her an çıkar, ama her anı takip etmek imkânsız.
              Otomatik tarama + anlık Telegram bildirimleri ile doğru anda
              doğru hissenin başındayken. Ücretsiz üye olun, ayarları yapın —
              gerisini sistem halleder.
            </p>
          </div>
          <div className="shrink-0 flex flex-col gap-3 w-full sm:w-auto">
            <a
              href="/hisse-teknik-analizi/register"
              className="flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-colors"
            >
              <TbRefresh size={18} />
              Taramayı Başlat
            </a>
            <a
              href="#indicators"
              className="flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl border border-slate-700 hover:border-emerald-700 text-slate-300 hover:text-white text-sm font-semibold transition-colors"
            >
              İndikatörleri İncele
              <TbArrowRight size={16} />
            </a>
            <p className="text-xs text-slate-600 text-center">
              <TbChartLine size={12} className="inline mr-1" />
              Yatırım tavsiyesi değildir.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
