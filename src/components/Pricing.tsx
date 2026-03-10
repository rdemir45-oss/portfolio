"use client";

import { motion } from "framer-motion";
import { TbCheck, TbX, TbCrown, TbRocket, TbStar } from "react-icons/tb";

const PLANS = [
  {
    id: "starter",
    icon: <TbStar size={24} />,
    name: "Starter",
    price: "₺299",
    period: "/ay",
    tagline: "Başlangıç için ideal",
    color: "slate",
    features: [
      { label: "Hisse Tarama Ekranı", included: true },
      { label: "25+ Sinyal Kategorisi", included: true },
      { label: "Haftalık Canlı Yayın", included: false },
      { label: "Telegram Özel Bildirim", included: false },
      { label: "TradingView İndikatörleri (1 adet)", included: true },
      { label: "Matriks İndikatörleri", included: false },
      { label: "Öncelikli Destek", included: false },
    ],
    cta: "Başla",
    popular: false,
  },
  {
    id: "pro",
    icon: <TbRocket size={24} />,
    name: "Pro",
    price: "₺599",
    period: "/ay",
    tagline: "En çok tercih edilen",
    color: "emerald",
    features: [
      { label: "Hisse Tarama Ekranı", included: true },
      { label: "25+ Sinyal Kategorisi", included: true },
      { label: "Haftalık Canlı Yayın", included: true },
      { label: "Telegram Özel Bildirim", included: true },
      { label: "TradingView İndikatörleri (3 adet)", included: true },
      { label: "Matriks İndikatörleri", included: false },
      { label: "Öncelikli Destek", included: false },
    ],
    cta: "Pro'ya Geç",
    popular: true,
  },
  {
    id: "elite",
    icon: <TbCrown size={24} />,
    name: "Elite",
    price: "₺999",
    period: "/ay",
    tagline: "Tam donanım, sıfır kompromis",
    color: "amber",
    features: [
      { label: "Hisse Tarama Ekranı", included: true },
      { label: "25+ Sinyal Kategorisi", included: true },
      { label: "Haftalık Canlı Yayın", included: true },
      { label: "Telegram Özel Bildirim", included: true },
      { label: "TradingView İndikatörleri (tümü)", included: true },
      { label: "Matriks İndikatörleri", included: true },
      { label: "Öncelikli Destek", included: true },
    ],
    cta: "Elite'e Geç",
    popular: false,
  },
];

const colorMap: Record<string, {
  border: string;
  bg: string;
  icon: string;
  badge: string;
  cta: string;
  ctaHover: string;
  glow: string;
}> = {
  slate: {
    border: "border-slate-700/60",
    bg: "bg-slate-900/50",
    icon: "text-slate-400",
    badge: "bg-slate-700 text-slate-200",
    cta: "bg-slate-700 hover:bg-slate-600 text-white",
    ctaHover: "",
    glow: "",
  },
  emerald: {
    border: "border-emerald-600/60",
    bg: "bg-emerald-950/30",
    icon: "text-emerald-400",
    badge: "bg-emerald-500 text-white",
    cta: "bg-emerald-600 hover:bg-emerald-500 text-white",
    ctaHover: "",
    glow: "shadow-[0_0_40px_-8px_rgba(16,185,129,0.35)]",
  },
  amber: {
    border: "border-amber-600/50",
    bg: "bg-amber-950/20",
    icon: "text-amber-400",
    badge: "bg-amber-500 text-white",
    cta: "bg-amber-500 hover:bg-amber-400 text-white",
    ctaHover: "",
    glow: "",
  },
};

export default function Pricing() {
  return (
    <section id="paketler" className="py-24 px-4 sm:px-6 relative overflow-hidden bg-[#050a0e]">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />

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
            <TbCrown className="text-emerald-400" size={16} />
            <span className="text-emerald-400 text-xs font-semibold tracking-widest uppercase">
              Paketler
            </span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-4 leading-tight">
            Seviyene Göre{" "}
            <span className="text-emerald-400">Doğru Paketi Seç</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            İhtiyacına göre başla, istediğin zaman yükselt.
          </p>
        </motion.div>

        {/* Kart grid */}
        <div className="grid sm:grid-cols-3 gap-6">
          {PLANS.map((plan, i) => {
            const c = colorMap[plan.color];
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: i * 0.1 }}
                className={`relative rounded-3xl border ${c.border} ${c.bg} ${c.glow} p-7 flex flex-col`}
              >
                {/* Popüler rozeti */}
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="bg-emerald-500 text-white text-xs font-bold px-4 py-1 rounded-full shadow-md">
                      En Popüler
                    </span>
                  </div>
                )}

                {/* İkon + İsim */}
                <div className={`mb-4 ${c.icon}`}>{plan.icon}</div>
                <p className="text-xs font-semibold tracking-widest text-slate-500 uppercase mb-1">
                  {plan.tagline}
                </p>
                <h3 className="text-xl font-black text-white mb-4">{plan.name}</h3>

                {/* Fiyat */}
                <div className="flex items-end gap-1 mb-7">
                  <span className="text-4xl font-black text-white">{plan.price}</span>
                  <span className="text-slate-500 text-sm mb-1">{plan.period}</span>
                </div>

                {/* Özellik listesi */}
                <ul className="flex flex-col gap-3 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f.label} className="flex items-center gap-3">
                      {f.included ? (
                        <TbCheck size={17} className="text-emerald-400 shrink-0" />
                      ) : (
                        <TbX size={17} className="text-slate-700 shrink-0" />
                      )}
                      <span
                        className={`text-sm ${
                          f.included ? "text-slate-300" : "text-slate-600"
                        }`}
                      >
                        {f.label}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA butonu */}
                <a
                  href="/#contact"
                  className={`w-full text-center py-3 rounded-2xl font-bold text-sm transition-colors ${c.cta}`}
                >
                  {plan.cta}
                </a>
              </motion.div>
            );
          })}
        </div>

        {/* Alt not */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center text-slate-600 text-sm mt-10"
        >
          Tüm paketler aylık olarak faturalandırılır · İstediğin zaman iptal edebilirsin ·
          Sorularınız için{" "}
          <a href="/#contact" className="text-emerald-500 hover:text-emerald-400 underline underline-offset-2">
            iletişime geçin
          </a>
        </motion.p>
      </div>
    </section>
  );
}
