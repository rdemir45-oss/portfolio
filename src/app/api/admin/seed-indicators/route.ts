import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";
import { isAdmin, UNAUTHORIZED } from "@/lib/admin-auth";

const indicators = [
  {
    slug: "harmonik-tarama-fibonacci",
    title: "RdAlgo Harmonik Tarama & Otomatik Fibonacci",
    platform: "TradingView",
    short_desc: "BIST 100 üzerinde otomatik harmonik formasyon taraması yapan ve gerçek zamanlı Fibonacci seviyeleri çizen profesyonel Pine Script v5 indikatörü.",
    description: `RdAlgo Harmonik Tarama & Otomatik Fibonacci Sistemi, teknik analizin en güçlü araçlarından biri olan harmonik formasyonları tamamen otomatik olarak tespit eden kapsamlı bir Pine Script v5 indikatörüdür.\n\nBIST 100 hisselerini tarayarak mevcut grafik üzerindeki tüm harmonik yapıları (Gartley, Butterfly, Bat, Crab, Shark vb.) gerçek zamanlı olarak işaretler.\n\n**Öne Çıkan Özellikler:**\n- BIST 100 genelinde harmonik formasyon taraması\n- Gerçek zamanlı ve geriye dönük otomatik çizimler\n- Otomatik Fibonacci düzeltme ve projeksiyon seviyeleri\n- Pine Script v5 ile yüksek performanslı yapı`,
    images: [],
    tags: ["Pine Script v5", "Harmonik", "Fibonacci", "Pattern"],
    badge: "Popüler",
    badge_color: "emerald",
    tradingview_url: "https://www.tradingview.com",
    sort_order: 1,
  },
  {
    slug: "mum-formasyonlari-tarayicisi",
    title: "RdAlgo Mum Formasyonları Tarayıcısı",
    platform: "TradingView",
    short_desc: "Onlarca mum formasyonunu otomatik tespit eden, grafik üzerinde işaretleyen ve tarama yapan Pine Script v5 indikatörü.",
    description: `RdAlgo Mum Formasyonları Tarayıcısı, mum formasyonlarını otomatik olarak tanıyan ve görselleştiren kapsamlı bir Pine Script v5 indikatörüdür.\n\n**Öne Çıkan Özellikler:**\n- Otomatik mum formasyonu tespiti ve grafik üzeri etiketleme\n- Tek, çift ve üçlü mum formasyonlarını destekler\n- Formasyon bazlı tarama ve anlık uyarı sistemi`,
    images: [],
    tags: ["Pine Script v5", "Mum Formasyonu", "Tarayıcı", "Pattern"],
    tradingview_url: "https://www.tradingview.com",
    sort_order: 2,
  },
  {
    slug: "otomatik-formasyon-tarama",
    title: "RdAlgo Otomatik Formasyon ve Tarama İndikatörü",
    platform: "TradingView",
    short_desc: "BIST hisselerinde OBO, üçgen, kanal, ikili tepe/dip ve Fibonacci formasyonlarını otomatik tespit eden, gerçek zamanlı kırılım taraması yapan Pine Script v5 indikatörü.",
    description: `RdAlgo Otomatik Formasyon ve Tarama İndikatörü, BIST hisselerinde teknik analizin temel taşlarını oluşturan formasyon yapılarını otomatik olarak tespit eden Pine Script v5 aracıdır.\n\n**Tespit Edilen Formasyonlar:**\n- Omuz-Baş-Omuz (OBO) ve Ters OBO\n- Yükselen, Alçalan ve Simetrik Üçgen\n- İkili Tepe (M) ve İkili Dip (W)\n- Fibonacci geri çekilme bölgeleri`,
    images: [],
    tags: ["Pine Script v5", "Formasyon", "Tarayıcı"],
    badge: "11 Boost",
    badge_color: "blue",
    tradingview_url: "https://www.tradingview.com",
    sort_order: 3,
  },
  {
    slug: "rd-algo-otomatik-formasyonlar",
    title: "RD Algo Otomatik Formasyonlar",
    platform: "TradingView",
    short_desc: "All-in-One otomatik formasyon ve harmonik pattern tespiti. Kapsamlı teknik analiz aracı.",
    description: "All-in-One otomatik formasyon ve harmonik pattern tespiti. Kapsamlı teknik analiz aracı.",
    images: [],
    tags: ["Pine Script v5", "All-in-One", "Harmonik", "Formasyon"],
    tradingview_url: "https://www.tradingview.com",
    sort_order: 4,
  },
  {
    slug: "rd45",
    title: "RD45",
    platform: "TradingView",
    short_desc: "Destek ve direnç seviyelerini otomatik hesaplayan indikatör. Yeşil seviyenin üstü alım, altı satım sinyali.",
    description: "Destek ve direnç seviyelerini otomatik hesaplayan indikatör. Yeşil seviyenin üstü alım, altı satım sinyali.",
    images: [],
    tags: ["Pine Script v5", "Destek/Direnç", "Sinyal"],
    tradingview_url: "https://www.tradingview.com",
    sort_order: 5,
  },
  {
    slug: "rd-oto-rsi-kompozit-trend",
    title: "RD OTO RSI / Kompozit Trend V1",
    platform: "TradingView",
    short_desc: "RSI ve fiyat kompozit grafiği ile trend yönünü belirler. Beyaz trendler kısa, renkli trendler uzun vadeli.",
    description: "RSI ve fiyat kompozit grafiği ile trend yönünü belirler. Beyaz trendler kısa, renkli trendler uzun vadeli.",
    images: [],
    tags: ["Pine Script v5", "RSI", "Kompozit", "Trend"],
    badge: "Yeni",
    badge_color: "purple",
    tradingview_url: "https://www.tradingview.com",
    sort_order: 6,
  },
  {
    slug: "rd-trend-formasyon-v1",
    title: "RD Trend Formasyon V1",
    platform: "TradingView",
    short_desc: "Kısa ve uzun vadeli trend yapılarını otomatik olarak çizen, dinamik destek/direnç çizgileri üreten Pine Script indikatörü.",
    description: `RD Trend Formasyon V1, fiyat hareketinin yapısını okuyarak trend kanallarını otomatik olarak grafik üzerine çizen bir Pine Script indikatörüdür.\n\n**Öne Çıkan Özellikler:**\n- Kısa vadeli trend için beyaz alt/üst trend çizgileri\n- Uzun vadeli trend için renkli dinamik kanallar\n- Trend kırılımlarını otomatik işaretleme`,
    images: [],
    tags: ["Pine Script", "Trend", "Kanal", "Destek/Direnç"],
    badge: "50 Boost",
    badge_color: "emerald",
    tradingview_url: "https://www.tradingview.com",
    sort_order: 7,
  },
  {
    slug: "rsi-on-aura-indiktor-tarama-v1",
    title: "RSI ON AURA İndikatör ve Tarama V1",
    platform: "TradingView",
    short_desc: "RSI üzerine dinamik destek/direnç bölgeleri çizen ve sabit seviyelerin ötesine geçen yenilikçi AURA tabanlı tarama indikatörü.",
    description: `RSI ON AURA, klasik RSI göstergesini bir üst seviyeye taşıyan yenilikçi bir Pine Script aracıdır.\n\n**Öne Çıkan Özellikler:**\n- RSI üzerine dinamik AURA destek/direnç bölgeleri\n- Sabit seviye yerine fiyat bazlı adaptif yapı\n- Çoklu hisse AURA tarama desteği`,
    images: [],
    tags: ["Pine Script", "RSI", "AURA", "Tarayıcı", "Dinamik"],
    badge: "378 Boost",
    badge_color: "blue",
    tradingview_url: "https://www.tradingview.com",
    sort_order: 8,
  },
  {
    slug: "rdtrend",
    title: "RDTREND",
    platform: "TradingView",
    short_desc: "Ana trend yönünü belirleyen ve işlem hatası marjını minimize etmek için tasarlanmış güçlü trend takip indikatörü.",
    description: `RDTREND, işlemlerdeki hata marjını en aza indirmek ve ana trend yönünü net biçimde ortaya koymak için geliştirilmiş Pine Script trend indikatörüdür.\n\n**Öne Çıkan Özellikler:**\n- Ana trend yönünü tek bakışta gösteren renk kodlaması\n- Trend güç ve zayıflık bölgelerinin görsel gösterimi\n- Her zaman dilimine uyarlanabilir yapı`,
    images: [],
    tags: ["Pine Script", "Trend", "Sinyal", "Ana Trend"],
    badge: "823 Boost",
    badge_color: "emerald",
    tradingview_url: "https://www.tradingview.com",
    sort_order: 9,
  },
  {
    slug: "thebigshort-trendpa",
    title: "TheBigShortTrendPa",
    platform: "TradingView",
    short_desc: "Basitleştirilmiş Price Action sistemi. Mor çizgi dip formasyon, kırmızı çizgi tepe formasyon seviyelerini göstererek kademeli fiyat seviyeleri sunar.",
    description: `TheBigShortTrendPa, price action analizini basitleştiren özgün bir Pine Script sistemidir.\n\nMor çizgi dip formasyon bölgesini, kırmızı çizgi tepe formasyon bölgesini temsil eder.\n\n**Öne Çıkan Özellikler:**\n- Mor çizgi: Dip formasyon / destek bölgesi\n- Kırmızı çizgi: Tepe formasyon / direnç bölgesi\n- Saf fiyat hareketi odaklı yapı`,
    images: [],
    tags: ["Pine Script", "Price Action", "Trend", "Destek/Direnç"],
    badge: "66 Boost",
    badge_color: "purple",
    tradingview_url: "https://www.tradingview.com",
    sort_order: 10,
  },
];

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return UNAUTHORIZED;
  const results = [];
  for (const ind of indicators) {
    const { error } = await supabase
      .from("indicators")
      .upsert(ind, { onConflict: "slug" });
    results.push({ slug: ind.slug, ok: !error, error: error?.message });
  }
  const failed = results.filter((r) => !r.ok);
  if (failed.length > 0) {
    return NextResponse.json({ success: false, failed }, { status: 500 });
  }
  return NextResponse.json({ success: true, count: results.length });
}
