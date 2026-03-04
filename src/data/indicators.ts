export interface Indicator {
  slug: string;
  title: string;
  platform: "TradingView" | "Matriks";
  shortDesc: string;
  description: string; // Detay sayfası için - sonra güncellenecek
  images: string[]; // Detay sayfası için - sonra eklenecek
  tags: string[];
  badge?: string;
  badgeColor?: string;
  tradingviewUrl?: string;
}

export const indicators: Indicator[] = [
  {
    slug: "harmonik-tarama-fibonacci",
    title: "RdAlgo Harmonik Tarama & Otomatik Fibonacci",
    platform: "TradingView",
    shortDesc:
      "BIST 100 üzerinde otomatik harmonik formasyon taraması yapan ve gerçek zamanlı Fibonacci seviyeleri çizen profesyonel Pine Script v5 indikatörü.",
    description:
      `RdAlgo Harmonik Tarama & Otomatik Fibonacci Sistemi, teknik analizin en güçlü araçlarından biri olan harmonik formasyonları tamamen otomatik olarak tespit eden kapsamlı bir Pine Script v5 indikatörüdür.

BIST 100 hisselerini tarayarak mevcut grafik üzerindeki tüm harmonik yapıları (Gartley, Butterfly, Bat, Crab, Shark vb.) gerçek zamanlı olarak işaretler. Yalnızca güncel formasyonlarla kalmaz; geriye dönük otomatik çizimler sayesinde geçmişteki harmonik yapılar da grafiğe yansıtılarak fiyat davranışını daha derin bir perspektiften analiz etmenizi sağlar.

Otomatik Fibonacci modülü, önemli dönüş noktalarını ve potansiyel hedef bölgelerini fiyat hareketiyle senkronize biçimde çizer. Düzeltme seviyeleri ve projeksiyon hedefleri anlık olarak güncellenerek manuel çizim ihtiyacını ortadan kaldırır.

**Öne Çıkan Özellikler:**
- BIST 100 genelinde harmonik formasyon taraması
- Gerçek zamanlı ve geriye dönük otomatik çizimler
- Birden fazla harmonik formasyon tipini aynı anda tespit etme
- Otomatik Fibonacci düzeltme ve projeksiyon seviyeleri
- Pine Script v5 ile yüksek performanslı ve optimize edilmiş yapı`,
    images: [],
    tags: ["Pine Script v5", "Harmonik", "Fibonacci", "Pattern"],
    badge: "Popüler",
    badgeColor: "emerald",
    tradingviewUrl: "https://www.tradingview.com",
  },
  {
    slug: "mum-formasyonlari-tarayicisi",
    title: "RdAlgo Mum Formasyonları Tarayıcısı",
    platform: "TradingView",
    shortDesc:
      "Onlarca mum formasyonunu otomatik tespit eden, grafik üzerinde işaretleyen ve tarama yapan Pine Script v5 indikatörü.",
    description:
      `RdAlgo Mum Formasyonları Tarayıcısı, Türk borsasının hızlı tempolu yapısına uygun olarak geliştirilmiş, mum formasyonlarını otomatik olarak tanıyan ve görselleştiren kapsamlı bir Pine Script v5 indikatörüdür.

Grafik üzerinde oluşan tüm önemli mum yapılarını (Doji, Hammer, Engulfing, Morning Star, Evening Star, Harami ve daha fazlası) gerçek zamanlı olarak tespit eder; her birini doğrudan grafik üzerinde etiketleyerek anlık okuma imkânı sunar. Formasyonun yönü, gücü ve güvenilirlik seviyesi gibi bilgiler işaret üzerinde görüntülenir.

Tarama modülü sayesinde yalnızca aktif grafikle sınırlı kalmaz; belirlediğiniz kriterler çerçevesinde formasyon oluşumlarına dair anlık uyarılar alabilirsiniz. Bu sayede fırsatları kaçırmadan, dakika kaybetmeden harekete geçebilirsiniz.

**Öne Çıkan Özellikler:**
- Otomatik mum formasyonu tespiti ve grafik üzeri etiketleme
- Tek, çift ve üçlü mum formasyonlarını destekler
- Formasyon bazlı tarama ve anlık uyarı sistemi
- Yönlü (bullish/bearish) ayrımıyla net sinyal üretimi
- Pine Script v5 ile hafif ve hızlı çalışan mimari`,
    images: [],
    tags: ["Pine Script v5", "Mum Formasyonu", "Tarayıcı", "Pattern"],
    tradingviewUrl: "https://www.tradingview.com",
  },
  {
    slug: "otomatik-formasyon-tarama",
    title: "RdAlgo Otomatik Formasyon ve Tarama İndikatörü",
    platform: "TradingView",
    shortDesc:
      "Fiyat formasyonlarını otomatik olarak tespit eden ve tarayan kapsamlı bir indikatör.",
    description:
      "Bu indikatör hakkında detaylı açıklama yakında eklenecek.",
    images: [],
    tags: ["Pine Script v5", "Formasyon", "Tarayıcı"],
    badge: "11 Boost",
    badgeColor: "blue",
    tradingviewUrl: "https://www.tradingview.com",
  },
  {
    slug: "rd-algo-otomatik-formasyonlar",
    title: "RD Algo Otomatik Formasyonlar",
    platform: "TradingView",
    shortDesc:
      "All-in-One otomatik formasyon ve harmonik pattern tespiti. Kapsamlı teknik analiz aracı.",
    description:
      "Bu indikatör hakkında detaylı açıklama yakında eklenecek.",
    images: [],
    tags: ["Pine Script v5", "All-in-One", "Harmonik", "Formasyon"],
    tradingviewUrl: "https://www.tradingview.com",
  },
  {
    slug: "rd45",
    title: "RD45",
    platform: "TradingView",
    shortDesc:
      "Destek ve direnç seviyelerini otomatik hesaplayan indikatör. Yeşil seviyenin üstü alım, altı satım sinyali.",
    description:
      "Bu indikatör hakkında detaylı açıklama yakında eklenecek.",
    images: [],
    tags: ["Pine Script v5", "Destek/Direnç", "Sinyal"],
    tradingviewUrl: "https://www.tradingview.com",
  },
  {
    slug: "rd-oto-rsi-kompozit-trend",
    title: "RD OTO RSI / Kompozit Trend V1",
    platform: "TradingView",
    shortDesc:
      "RSI ve fiyat kompozit grafiği ile trend yönünü belirler. Beyaz trendler kısa, renkli trendler uzun vadeli.",
    description:
      "Bu indikatör hakkında detaylı açıklama yakında eklenecek.",
    images: [],
    tags: ["Pine Script v5", "RSI", "Kompozit", "Trend"],
    badge: "Yeni",
    badgeColor: "purple",
    tradingviewUrl: "https://www.tradingview.com",
  },
];
