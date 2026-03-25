"use client";
import { useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  TbBulb,
  TbBrandWhatsapp,
  TbCode,
  TbBell,
  TbLock,
  TbArrowRight,
  TbSparkles,
} from "react-icons/tb";
import WhatsappModal from "./WhatsappModal";

const steps = [
  {
    number: "01",
    title: "Stratejini Düşün",
    description:
      "RSI mi, formasyon mu, hacim mi? Kafandaki fikri şekillendirmeye başla. Kod bilgin olması gerekmiyor — sadece ne istediğini bil.",
    icon: TbBulb,
    color: "from-amber-500 to-yellow-400",
    glow: "shadow-amber-500/20",
    border: "border-amber-500/30",
    bg: "bg-amber-500/5",
    tag: "Başlangıç Noktası",
    tagColor: "text-amber-400 bg-amber-950/60 border-amber-800/60",
  },
  {
    number: "02",
    title: "Bize Anlat",
    description:
      "WhatsApp üzerinden stratejini bize ilet. Teknik kelimeler kullanmak zorunda değilsin — sana uygun dilde konuşuyoruz.",
    icon: TbBrandWhatsapp,
    color: "from-emerald-500 to-green-400",
    glow: "shadow-emerald-500/20",
    border: "border-emerald-500/30",
    bg: "bg-emerald-500/5",
    tag: "Ücretsiz Danışmanlık",
    tagColor: "text-emerald-400 bg-emerald-950/60 border-emerald-800/60",
  },
  {
    number: "03",
    title: "Taramayı Kuruyoruz",
    description:
      "Pine Script veya Python ile TradingView & Matriks'e uyumlu koda dönüştürüyoruz. 600+ BIST hissesini saniyeler içinde tarayan bir sistem hazırlıyoruz.",
    icon: TbCode,
    color: "from-sky-500 to-blue-400",
    glow: "shadow-sky-500/20",
    border: "border-sky-500/30",
    bg: "bg-sky-500/5",
    tag: "TradingView & Matriks Uyumlu",
    tagColor: "text-sky-400 bg-sky-950/60 border-sky-800/60",
  },
  {
    number: "04",
    title: "Anlık Bildirim Al",
    description:
      "Seçtiğin hisseler sinyal verince Telegram'a anında bildirim gelir. Ekrana bakman gerekmez — sistem seni her zaman haberdar eder.",
    icon: TbBell,
    color: "from-violet-500 to-purple-400",
    glow: "shadow-violet-500/20",
    border: "border-violet-500/30",
    bg: "bg-violet-500/5",
    tag: "7/24 Otomatik",
    tagColor: "text-violet-400 bg-violet-950/60 border-violet-800/60",
  },
  {
    number: "05",
    title: "Sadece Senin Stratejin",
    description:
      "Stratejin şifrelidir. Yalnızca sen ve izin verdiklerin görebilir. Rekabetçi avantajın korunur — kimseyle paylaşmak zorunda değilsin.",
    icon: TbLock,
    color: "from-rose-500 to-red-400",
    glow: "shadow-rose-500/20",
    border: "border-rose-500/30",
    bg: "bg-rose-500/5",
    tag: "Tam Gizlilik",
    tagColor: "text-rose-400 bg-rose-950/60 border-rose-800/60",
  },
];

function StepCard({ step, index }: { step: (typeof steps)[0]; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const Icon = step.icon;
  const isEven = index % 2 === 0;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: isEven ? -60 : 60 }}
      animate={isInView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.7, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="relative flex items-start gap-6 sm:gap-10 group"
    >
      {/* Left: Number + connector */}
      <div className="flex flex-col items-center flex-shrink-0 select-none">
        {/* Number circle */}
        <div
          className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center border ${step.border} ${step.bg} shadow-2xl ${step.glow} transition-all duration-500 group-hover:scale-110`}
        >
          {/* Glow ring */}
          <div
            className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${step.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}
          />
          <span
            className={`text-xl sm:text-2xl font-black bg-gradient-to-br ${step.color} bg-clip-text text-transparent`}
          >
            {step.number}
          </span>
        </div>

        {/* Connector line (except last) */}
        {index < steps.length - 1 && (
          <motion.div
            initial={{ scaleY: 0 }}
            animate={isInView ? { scaleY: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="w-px mt-3 h-16 sm:h-20 origin-top"
            style={{
              background:
                "linear-gradient(to bottom, #10b98140, transparent)",
            }}
          />
        )}
      </div>

      {/* Right: Content card */}
      <div
        className={`flex-1 mb-8 sm:mb-14 p-6 sm:p-8 rounded-2xl border ${step.border} ${step.bg} backdrop-blur-sm shadow-xl ${step.glow} hover:shadow-2xl transition-all duration-500 group-hover:border-opacity-60`}
      >
        {/* Tag */}
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${step.tagColor} mb-4`}
        >
          {step.tag}
        </span>

        <div className="flex items-start gap-4">
          {/* Icon */}
          <div
            className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br ${step.color} shadow-lg`}
          >
            <Icon size={20} className="text-white" />
          </div>

          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 leading-tight">
              {step.title}
            </h3>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              {step.description}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function CustomStrategyFlow() {
  const [whatsappOpen, setWhatsappOpen] = useState(false);
  const headingRef = useRef(null);
  const headingInView = useInView(headingRef, { once: true, margin: "-60px" });
  const ctaRef = useRef(null);
  const ctaInView = useInView(ctaRef, { once: true, margin: "-60px" });

  return (
    <section
      id="ozel-strateji"
      className="relative py-24 px-6 overflow-hidden"
      style={{ background: "linear-gradient(180deg, #050a0e 0%, #061218 50%, #050a0e 100%)" }}
    >
      {/* Background glows */}
      <div className="absolute top-32 left-1/4 w-96 h-96 rounded-full bg-emerald-500/4 blur-3xl pointer-events-none" />
      <div className="absolute bottom-32 right-1/4 w-80 h-80 rounded-full bg-violet-500/4 blur-3xl pointer-events-none" />

      <div className="max-w-3xl mx-auto">
        {/* Section heading */}
        <motion.div
          ref={headingRef}
          initial={{ opacity: 0, y: 40 }}
          animate={headingInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="text-center mb-20"
        >
          {/* Label */}
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-800/60 bg-emerald-950/40 text-emerald-400 text-xs font-semibold mb-6">
            <TbSparkles size={13} />
            Kişiselleştirilmiş Algoritma
          </span>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight mb-5">
            Kendi Stratejini{" "}
            <span className="bg-gradient-to-r from-emerald-400 via-emerald-300 to-green-300 bg-clip-text text-transparent">
              Tasarla
            </span>
            <br />
            <span className="text-3xl sm:text-4xl lg:text-5xl text-slate-300 font-bold">
              Biz Kodlayalım — Sonuçlar Sana Gelsin
            </span>
          </h2>

          <p className="text-slate-400 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
            600+ hisseyi tek tek incelemek zorunda değilsin. Stratejin ne olursa olsun —
            kodlayacağız, taratacağız, anlık bildirim kuracağız.{" "}
            <strong className="text-emerald-400">Ve tamamen sana özel kalacak.</strong>
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {steps.map((step, i) => (
            <StepCard key={step.number} step={step} index={i} />
          ))}
        </div>

        {/* CTA */}
        <motion.div
          ref={ctaRef}
          initial={{ opacity: 0, y: 40 }}
          animate={ctaInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="mt-4 text-center"
        >
          {/* Trust signals */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
            {[
              { icon: TbLock, text: "Stratejin gizli kalır" },
              { icon: TbBrandWhatsapp, text: "Ücretsiz danışmanlık" },
              { icon: TbBell, text: "Anlık Telegram bildirimi" },
            ].map(({ icon: Icon, text }) => (
              <div
                key={text}
                className="flex items-center gap-2 text-slate-500 text-sm"
              >
                <Icon size={15} className="text-emerald-500" />
                <span>{text}</span>
              </div>
            ))}
          </div>

          <button
            onClick={() => setWhatsappOpen(true)}
            className="group inline-flex items-center justify-center gap-3 px-10 py-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white font-bold text-base sm:text-lg shadow-2xl shadow-emerald-900/50 hover:shadow-emerald-800/60 transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] w-full sm:w-auto min-w-[320px]"
          >
            <TbBrandWhatsapp size={22} className="flex-shrink-0" />
            <span>Stratejini Bize Anlat — Ücretsiz Bilgi Al</span>
            <TbArrowRight
              size={18}
              className="flex-shrink-0 group-hover:translate-x-1 transition-transform duration-300"
            />
          </button>

          <p className="text-slate-600 text-xs mt-4">
            Formu doldurun, sizi WhatsApp grubuna ekleyelim.
          </p>
        </motion.div>
      </div>

      <WhatsappModal
        open={whatsappOpen}
        onClose={() => setWhatsappOpen(false)}
      />
    </section>
  );
}
