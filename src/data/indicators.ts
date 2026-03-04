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
      "Pine Script v5 ile yazılmış profesyonel Harmonik Pattern Tarayıcı & Otomatik Fibonacci indikatörü.",
    description:
      "Bu indikatör hakkında detaylı açıklama yakında eklenecek.",
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
      "Kapsamlı mum formasyonlarını otomatik olarak tarayan ve işaretleyen Pine Script v5 indikatörü.",
    description:
      "Bu indikatör hakkında detaylı açıklama yakında eklenecek.",
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
