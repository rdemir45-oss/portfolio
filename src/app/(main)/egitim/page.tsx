"use client";

import { motion } from "framer-motion";
import { TbChartLine, TbArrowUp, TbArrowDown, TbMinus } from "react-icons/tb";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface Formation {
  id: string;
  emoji: string;
  name: string;
  signal: "bull" | "bear" | "neutral";
  short: string;
  desc: string;
  criteria: string[];
  key: string;
}

const FORMATIONS: Formation[] = [
  {
    id: "tobo",
    emoji: "📈",
    name: "TOBO — Ters Omuz-Baş-Omuz",
    signal: "bull",
    short: "Güçlü yukarı dönüş formasyonu",
    desc: "Üç dip noktasından oluşur: sol omuz, en derin nokta (baş) ve sağ omuz. Baş her iki omuzdan daha aşağıda olurken omuzlar benzer seviyelerdedir. Sol ve sağ tepler arasından geçen 'boyun çizgisi' yukarı kırıldığında formasyon tamamlanır ve hedef fiyat hesaplanabilir.",
    criteria: [
      "3 dip noktası (L – H – R) oluşmalı",
      "Baş (H) her iki omuzdan daha derin olmalı",
      "Omuzlar birbirine yakın seviyelerde (±%8 tolerans)",
      "Boyun çizgisi kapanışla yukarı kırılmalı",
      "Kırılım hacimle desteklenirse sinyal güçlenir",
    ],
    key: "tobo_break",
  },
  {
    id: "obo",
    emoji: "📉",
    name: "OBO — Omuz-Baş-Omuz",
    signal: "bear",
    short: "Güçlü aşağı dönüş formasyonu",
    desc: "Üç tepe noktasından oluşur: sol omuz, en yüksek nokta (baş) ve sağ omuz. Düşüş trendinin zirvesinde görülür. Boyun çizgisi aşağı kırıldığında formasyon tamamlanır; hedef fiyat = boyun − (baş − boyun).",
    criteria: [
      "3 tepe noktası (L – H – R) oluşmalı",
      "Baş (H) her iki omuzdan daha yüksekte olmalı",
      "Omuzlar birbirine yakın seviyelerde",
      "Boyun çizgisi kapanışla aşağı kırılmalı",
    ],
    key: "obo_break",
  },
  {
    id: "ikili_dip",
    emoji: "📈",
    name: "İkili Dip (W Formasyonu)",
    signal: "bull",
    short: "Çift dip, yukarı kırılım",
    desc: "Fiyat benzer seviyelerde iki dip yapar; aradaki tepe 'boyun' noktasıdır. İkinci dip yukarı döndükten sonra boyun seviyesi üzerine kapanışla formasyon tamamlanır. İsimlendirmesi grafikte 'W' harfine benzemesinden gelir.",
    criteria: [
      "İki dip noktası benzer seviyelerde (±%2.5 tolerans)",
      "İki dip arasındaki tepe boyun noktasını belirler",
      "Boyun seviyesi kapanışla yukarı kırılmalı",
    ],
    key: "ikili_dip_break",
  },
  {
    id: "ikili_tepe",
    emoji: "📉",
    name: "İkili Tepe (M Formasyonu)",
    signal: "bear",
    short: "Çift tepe, aşağı kırılım",
    desc: "Fiyat benzer seviyelerde iki tepe yapar; aradaki dip 'boyun' noktasıdır. İkinci tepe aşağı döndükten sonra boyun seviyesi altına kapanışla formasyon tamamlanır. Grafikte 'M' harfine benzer.",
    criteria: [
      "İki tepe noktası benzer seviyelerde (±%2.5 tolerans)",
      "İki tepe arasındaki dip boyun noktasını belirler",
      "Boyun seviyesi kapanışla aşağı kırılmalı",
    ],
    key: "ikili_tepe_break",
  },
  {
    id: "kanal",
    emoji: "📊",
    name: "Kanal Kırılımı",
    signal: "bull",
    short: "Yatay veya yükselen kanaldan çıkış",
    desc: "Fiyatın belirli bir süre hareket ettiği paralel trendler arasındaki kanalın üst sınırı kırıldığında sinyal verir. Uzun süre sıkışan fiyatın güçlü bir hareketle kanalı terk etmesi anlamına gelir.",
    criteria: [
      "Geçerli bir kanal (en az 2 tepe + 2 dip)",
      "Üst kanal çizgisi kapanışla kırılmalı",
      "Kırılım öncesi hacim düşük, kırılımda artış ideal",
    ],
    key: "channel_break",
  },
  {
    id: "ucgen",
    emoji: "📐",
    name: "Üçgen Kırılımı",
    signal: "bull",
    short: "Daralma sonrası güçlü çıkış",
    desc: "Fiyat giderek daralan bir üçgen içinde hareket eder (düşen tepeler + yükselen dipler). Üçgenin üst sınırı yukarı kırıldığında alım sinyali verir. Daralma ne kadar uzun sürerse kırılım o kadar güçlü olabilir.",
    criteria: [
      "En az 2 tepe ve 2 dip birbirine yaklaşmalı",
      "Üst trend çizgisi kapanışla kırılmalı",
      "Hacim kırılımda artmalı",
    ],
    key: "triangle_break",
  },
  {
    id: "trend_kirilim",
    emoji: "↗️",
    name: "Trend Kırılımı",
    signal: "bull",
    short: "Düşen trendin sona ermesi",
    desc: "Fiyatın daha düşük tepeler yaparak gittiği düşen trend çizgisi yukarı kırıldığında sinyal verir. Trendden çıkış, mevcut düşüş momentumunun zayıfladığına işaret eder.",
    criteria: [
      "En az 2 tepe noktası gereken düşen trend çizgisi",
      "Fiyat bu çizgiyi yukarı kapanışla kırmalı",
      "Öncesinde RSI uyumsuzluğu varsa sinyal güçlenir",
    ],
    key: "trend_break",
  },
  {
    id: "fibo",
    emoji: "🔢",
    name: "Fibonacci Setup",
    signal: "bull",
    short: "Fibonacci düzeltme tamamlandı",
    desc: "Güçlü bir yükseliş dalgası sonrası fiyat %38.2, %50 veya %61.8 Fibonacci seviyelerine geri çekilir. Bu seviyelerde oluşan destek ve dönüş, yeni bir yukarı dalganın başlangıcına işaret edebilir.",
    criteria: [
      "Net bir yukarı dalga (A→B) belirlenmiş olmalı",
      "Geri çekilme %38.2–%61.8 arasında olmalı",
      "Geri çekilme seviyesinde fiyat dönüş yapmalı",
    ],
    key: "fibo_setup",
  },
  {
    id: "golden_cross",
    emoji: "⭐",
    name: "Golden Cross",
    signal: "bull",
    short: "50 MA, 200 MA'yı yukarı keser",
    desc: "Kısa vadeli hareketli ortalama (50 günlük) uzun vadeli hareketli ortalamanın (200 günlük) üzerine çıktığında oluşur. Uzun vadeli yükseliş trendinin başlangıcını gösterebilir.",
    criteria: [
      "50 günlük MA, 200 günlük MA'yı yukarı kesmiş olmalı",
      "200 günlük MA yatay veya yukarı eğimli ideal",
    ],
    key: "golden_cross",
  },
  {
    id: "death_cross",
    emoji: "💀",
    name: "Death Cross",
    signal: "bear",
    short: "50 MA, 200 MA'yı aşağı keser",
    desc: "Kısa vadeli hareketli ortalama (50 günlük) uzun vadeli hareketli ortalamanın (200 günlük) altına geçtığında oluşur. Uzun vadeli düşüş trendinin başlangıcını gösterebilir.",
    criteria: [
      "50 günlük MA, 200 günlük MA'yı aşağı kesmiş olmalı",
    ],
    key: "death_cross",
  },
  {
    id: "rsi_os",
    emoji: "🔻",
    name: "RSI Aşırı Satım",
    signal: "bull",
    short: "RSI < 30 — potansiyel dip",
    desc: "RSI (Göreceli Güç Endeksi) 30'un altına düştüğünde hissenin aşırı satıldığına ve fiyatın olası bir dönüşe hazır olabileceğine işaret eder. Tek başına alım sinyali değildir; formasyon veya hacimle desteklenmelidir.",
    criteria: [
      "RSI 14 periyot altında 30'un altına düşmüş olmalı",
      "Diğer göstergelerle teyit önerilir",
    ],
    key: "rsi_os",
  },
  {
    id: "rsi_ob",
    emoji: "🔺",
    name: "RSI Aşırı Alım",
    signal: "bear",
    short: "RSI > 70 — potansiyel tepe",
    desc: "RSI 70'in üzerine çıktığında hissenin aşırı alındığına ve fiyatın bir geri çekilmeye hazır olabileceğine işaret eder. Güçlü trendlerde RSI uzun süre 70 üzerinde kalabilir.",
    criteria: [
      "RSI 14 periyot 70'in üzerinde",
      "Zirve oluşum teyidi için ek sinyal gerekebilir",
    ],
    key: "rsi_ob",
  },
  {
    id: "rsi_tobo",
    emoji: "📈",
    name: "RSI TOBO",
    signal: "bull",
    short: "RSI grafiğinde ters omuz-baş-omuz",
    desc: "Fiyat grafiğinde değil RSI indikatörünün grafiğinde oluşan TOBO formasyonudur. RSI aşırı satım bölgesinde (< 35) bir baş ve iki omuzla TOBO oluşturur. Boyun RSI 50 üzerine çıkmış ve sağ omuz oluşumundaysa sinyal üretilir.",
    criteria: [
      "RSI aşırı satım bölgesinde (baş < 35) dip yapmış olmalı",
      "Sol omuz ve baş arası en az 3 bar",
      "Sağ boyun RSI 50'nin üzerinde çıkmış olmalı",
      "Son bar sağ omuz oluşum aşamasında",
    ],
    key: "rsi_tobo",
  },
  {
    id: "rsi_pos_div",
    emoji: "🔄",
    name: "RSI Pozitif Uyumsuzluk",
    signal: "bull",
    short: "Fiyat dip yaparken RSI daha yüksek dip",
    desc: "Fiyat daha düşük bir dip yaparken RSI daha yüksek bir dip yaparsa 'pozitif uyumsuzluk' oluşur. Bunun anlamı satış baskısının azaldığıdır ve bir dönüşün habercisi olabilir.",
    criteria: [
      "İki dip arasında fiyat: ikinci dip < birinci dip",
      "İki dip arasında RSI: ikinci dip > birinci dip",
    ],
    key: "rsi_pos_div",
  },
  {
    id: "macd_cross",
    emoji: "〰️",
    name: "MACD Kesişim",
    signal: "bull",
    short: "MACD çizgisi sinyal çizgisini yukarı keser",
    desc: "MACD çizgisi (12-26 EMA farkı) sinyal çizgisini (9 günlük EMA) yukarı kestiğinde alım sinyali verir. Histogramın negatiften pozitife geçişiyle aynı anda meydana gelir.",
    criteria: [
      "MACD çizgisi sinyal çizgisini aşağıdan yukarı kesmeli",
      "Tercihen sıfır çizgisinin altında oluşan kesişim daha güvenilir",
    ],
    key: "macd_cross",
  },
  {
    id: "harmonik",
    emoji: "🔷",
    name: "Harmonik Formasyonlar",
    signal: "bull",
    short: "Fibonacci oranlarına dayalı fiyat desenleri",
    desc: "Gartley, Bat, Butterfly, Crab gibi harmonik formasyonlar belirli Fibonacci orantılarını karşılayan XABCD nokta kümelerinden oluşur. Potansiyel dönüş bölgesi (PRZ) hesaplanır. Uzman seviyesi bir tekniktir.",
    criteria: [
      "XABCD noktaları belirli Fibonacci oranlara uymalı",
      "PRZ bölgesinde formasyon teyidi aranmalı",
    ],
    key: "harmonic_long",
  },
  {
    id: "vol_spike",
    emoji: "🔥",
    name: "Hacim Patlaması",
    signal: "neutral",
    short: "Ortalamanın çok üzerinde hacim artışı",
    desc: "Günlük işlem hacmi son 20 günlük ortalamasının önemli ölçüde (%150–200+) üzerine çıktığında sinyal verir. Büyük alıcıların veya satıcıların piyasaya girdiğine işaret edebilir; fiyat hareketiyle birlikte değerlendirilmelidir.",
    criteria: [
      "Hacim son 20 gün ortalamasının belirgin üzerinde",
      "Fiyat yönü ile hacim birlikte değerlendirilmeli",
    ],
    key: "vol_spike",
  },
  {
    id: "bb_squeeze",
    emoji: "⚡",
    name: "Bollinger Sıkışması",
    signal: "neutral",
    short: "Volatilite minimum — büyük hareket yaklaşıyor",
    desc: "Bollinger Bantları olağandışı şekilde daraldığında (sıkışma) volatilitenin tarihi minimuma geldiğine işaret eder. Sıkışma ne kadar uzun sürerse ardından gelecek hareketin o kadar güçlü olabileceği beklenir.",
    criteria: [
      "Bollinger bant genişliği son 20 günün minimumuna yakın",
      "Kırılım yönü için fiyat hareketi izlenmeli",
    ],
    key: "bb_squeeze",
  },
];

const signalColors = {
  bull: {
    badge: "bg-emerald-950/50 border-emerald-700/60 text-emerald-400",
    icon: "text-emerald-400",
    border: "border-emerald-800/40",
    bg: "bg-emerald-950/10",
    dot: "bg-emerald-500",
    label: "Yükseliş",
  },
  bear: {
    badge: "bg-rose-950/50 border-rose-700/60 text-rose-400",
    icon: "text-rose-400",
    border: "border-rose-800/40",
    bg: "bg-rose-950/10",
    dot: "bg-rose-500",
    label: "Düşüş",
  },
  neutral: {
    badge: "bg-amber-950/50 border-amber-700/60 text-amber-400",
    icon: "text-amber-400",
    border: "border-amber-800/40",
    bg: "bg-amber-950/10",
    dot: "bg-amber-500",
    label: "Nötr",
  },
};

function SignalIcon({ signal }: { signal: "bull" | "bear" | "neutral" }) {
  if (signal === "bull")    return <TbArrowUp size={13} className="text-emerald-400" />;
  if (signal === "bear")    return <TbArrowDown size={13} className="text-rose-400" />;
  return <TbMinus size={13} className="text-amber-400" />;
}

export default function EgitimPage() {
  const bullCount    = FORMATIONS.filter((f) => f.signal === "bull").length;
  const bearCount    = FORMATIONS.filter((f) => f.signal === "bear").length;
  const neutralCount = FORMATIONS.filter((f) => f.signal === "neutral").length;

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#050a0e] pt-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
          {/* Başlık */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-14 text-center"
          >
            <div className="inline-flex items-center gap-2 bg-emerald-950/50 border border-emerald-800/50 rounded-full px-4 py-1.5 mb-5">
              <TbChartLine className="text-emerald-400" size={15} />
              <span className="text-emerald-400 text-xs font-semibold tracking-widest uppercase">
                Eğitim Kütüphanesi
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-white mb-4">
              Formasyon &{" "}
              <span className="text-emerald-400">Sinyal Rehberi</span>
            </h1>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Sistemin kullandığı her tarama sinyalinin ne anlama geldiğini, nasıl oluştuğunu
              ve nelere dikkat edilmesi gerektiğini buradan öğrenebilirsiniz.
            </p>

            {/* Özet */}
            <div className="flex items-center justify-center gap-4 mt-8 flex-wrap">
              <Chip color="emerald" count={bullCount} label="Yükseliş Sinyali" />
              <Chip color="rose"    count={bearCount}    label="Düşüş Sinyali" />
              <Chip color="amber"   count={neutralCount} label="Nötr Sinyal" />
            </div>
          </motion.div>

          {/* Formasyon kartları */}
          <div className="grid sm:grid-cols-2 gap-4">
            {FORMATIONS.map((f, i) => {
              const c = signalColors[f.signal];
              return (
                <motion.div
                  key={f.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={`rounded-2xl border ${c.border} bg-[#0a1628]/70 overflow-hidden`}
                >
                  {/* Kart başlık */}
                  <div className={`px-5 py-4 border-b ${c.border} ${c.bg}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl leading-none">{f.emoji}</span>
                        <div>
                          <h2 className="text-sm font-bold text-white leading-snug">{f.name}</h2>
                          <p className="text-xs text-slate-500 mt-0.5">{f.short}</p>
                        </div>
                      </div>
                      <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border shrink-0 ${c.badge}`}>
                        <SignalIcon signal={f.signal} />
                        {c.label}
                      </span>
                    </div>
                  </div>

                  {/* Açıklama */}
                  <div className="px-5 py-4 space-y-3">
                    <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>

                    {/* Kriterler */}
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">
                        Koşullar
                      </p>
                      <ul className="space-y-1.5">
                        {f.criteria.map((crit) => (
                          <li key={crit} className="flex items-start gap-2 text-xs text-slate-400">
                            <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${c.dot}`} />
                            {crit}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Tarama anahtarı */}
                    <div className="pt-1">
                      <span className="text-[10px] font-mono text-slate-700 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        {f.key}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Alt uyarı */}
          <p className="mt-12 text-xs text-slate-700 border-l-2 border-slate-800 pl-3">
            Bu sayfa yalnızca eğitim amaçlıdır. Formasyonlar kesin alım-satım sinyali değildir.
            Tüm yatırım kararları yatırımcının kendi sorumluluğundadır.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}

function Chip({ color, count, label }: { color: "emerald" | "rose" | "amber"; count: number; label: string }) {
  const cls = {
    emerald: "bg-emerald-950/50 border-emerald-800/50 text-emerald-400",
    rose:    "bg-rose-950/50 border-rose-800/50 text-rose-400",
    amber:   "bg-amber-950/50 border-amber-800/50 text-amber-400",
  }[color];
  return (
    <span className={`flex items-center gap-1.5 border rounded-full px-3 py-1 text-xs font-semibold ${cls}`}>
      <span className="font-black">{count}</span> {label}
    </span>
  );
}
