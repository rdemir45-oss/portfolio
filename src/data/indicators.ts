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
      "BIST hisselerinde OBO, üçgen, kanal, ikili tepe/dip ve Fibonacci formasyonlarını otomatik tespit eden, gerçek zamanlı kırılım taraması yapan kapsamlı Pine Script v5 indikatörü.",
    description:
      `RdAlgo Otomatik Formasyon ve Tarama İndikatörü, Borsa İstanbul (BIST) hisselerinde teknik analizin temel taşlarını oluşturan formasyon yapılarını tamamen otomatik olarak tespit eden ve tarayan güçlü bir Pine Script v5 aracıdır.

Grafik üzerinde oluşan formasyonları insan gözüne gerek kalmadan tanır; kırılım anında sinyal üreterek fırsatı doğrudan önünüze getirir.

**Tespit Edilen Formasyonlar:**
- Omuz-Baş-Omuz (OBO) ve Ters Omuz-Baş-Omuz (TOBO)
- Yükselen, Alçalan ve Simetrik Üçgen
- Yükselen ve Düşen Kanal
- İkili Tepe (M) ve İkili Dip (W)
- Fibonacci geri çekilme bölgeleri ve kırılımları

**Öne Çıkan Özellikler:**
- **Kırılım Taraması:** Formasyonların yukarı veya aşağı yönlü kırılımlarını gerçek zamanlı yakalar
- **Çoklu Zaman Dilimi:** Kısa, orta ve uzun vadeli trendleri aynı anda analiz eder
- **Çoklu Hisse Taraması:** Grup veya özel liste halinde birden fazla hisseyi tarar, sinyal üretenleri tek tabloda gösterir
- **Görsel Çizimler:** Formasyon çizgileri, hedef (TP) seviyeleri, dinamik destek/direnç ve oto-trend çizgileri grafik üzerinde işlenir
- **Alarm Desteği:** Kırılım ve formasyon sinyalleri için TradingView alarm entegrasyonu
- **Gelişmiş Filtreleme:** Yalnızca belirli formasyon türlerini (yukarı kırılım, OBO/TOBO, Fibonacci vb.) seçerek odaklı tarama yapabilme`,
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
  {
    slug: "rd-trend-formasyon-v1",
    title: "RD Trend Formasyon V1",
    platform: "TradingView",
    shortDesc:
      "Kısa ve uzun vadeli trend yapılarını otomatik olarak çizen, dinamik destek/direnç çizgileri üreten Pine Script indikatörü.",
    description:
      `RD Trend Formasyon V1, fiyat hareketinin yapısını okuyarak kısa ve uzun vadeli trend kanallarını otomatik olarak grafik üzerine çizen bir Pine Script indikatörüdür.

Kısa vadeli trend yapısı için beyaz renkli alt ve üst trend çizgileri oluşturulur; bu sayede dar bant içindeki fiyat hareketi net biçimde izlenir. Daha geniş vadeli trendler için ise renkli trend kanalları devreye girerek büyük resmi görmenizi sağlar.

İndikatör, yalnızca çizgi çizmekle kalmaz; trend değişimlerini ve kanaldan çıkışları tespit ederek alım-satım kararlarınıza zemin oluşturur. Manuel trend çizimi ihtiyacını tamamen ortadan kaldıran bu araç, tüm zaman dilimlerinde etkin biçimde çalışır.

**Öne Çıkan Özellikler:**
- Kısa vadeli trend için beyaz alt/üst trend çizgileri
- Uzun vadeli trend yapısı için renkli dinamik kanallar
- Trend kırılımlarını otomatik işaretleme
- Tüm enstrümanlarda ve zaman dilimlerinde kullanılabilir
- Temiz ve sade grafik görünümü`,
    images: [],
    tags: ["Pine Script", "Trend", "Kanal", "Destek/Direnç"],
    badge: "50 Boost",
    badgeColor: "emerald",
    tradingviewUrl: "https://www.tradingview.com",
  },
  {
    slug: "rsi-on-aura-indiktor-tarama-v1",
    title: "RSI ON AURA İndikatör ve Tarama V1",
    platform: "TradingView",
    shortDesc:
      "RSI üzerine dinamik destek/direnç bölgeleri çizen ve sabit seviyelerin ötesine geçen yenilikçi AURA tabanlı tarama indikatörü.",
    description:
      `RSI ON AURA İndikatör ve Tarama V1, klasik RSI göstergesini bir üst seviyeye taşıyan yenilikçi bir Pine Script aracıdır. Geleneksel RSI'ın sabit aşırı alım/satım seviyelerinin aksine, AURA sistemi RSI üzerine dinamik destek ve direnç bölgeleri oluşturur.

Fiyat hareketine bağlı olarak sürekli güncellenen bu dinamik bölgeler, RSI'ın nerede destek bulduğunu ve nerede direnç gördüğünü gerçek zamanlı olarak gösterir. Böylece standart RSI yorumlamasındaki katılıktan kurtularak çok daha hassas al/sat sinyalleri üretebilirsiniz.

Tarama modülü sayesinde AURA sinyali üreten hisseleri liste veya grup halinde tarayabilir, kritik RSI bölge kırılımlarında anlık uyarı alabilirsiniz.

**Öne Çıkan Özellikler:**
- RSI üzerine dinamik AURA destek/direnç bölgeleri
- Sabit seviye yerine fiyat bazlı adaptif yapı
- Üst ve alt AURA bölgesi kırılım sinyalleri
- Çoklu hisse AURA tarama desteği
- TradingView alarm entegrasyonu`,
    images: [],
    tags: ["Pine Script", "RSI", "AURA", "Tarayıcı", "Dinamik"],
    badge: "378 Boost",
    badgeColor: "blue",
    tradingviewUrl: "https://www.tradingview.com",
  },
  {
    slug: "rdtrend",
    title: "RDTREND",
    platform: "TradingView",
    shortDesc:
      "Ana trend yönünü belirleyen ve işlem hatası marjını minimize etmek için tasarlanmış güçlü trend takip indikatörü.",
    description:
      `RDTREND, işlemlerdeki hata marjını en aza indirmek ve ana trend yönünü net biçimde ortaya koymak amacıyla geliştirilmiş kapsamlı bir Pine Script trend indikatörüdür.

Fiyatın hangi yönde ilerlediğini tek bakışta anlamayı sağlayan RDTREND, hem trend belirleyici hem de işlem yardımcısı olarak çift görev üstlenir. Trendin güçlendiği ve zayıfladığı bölgeler renk kodlamasıyla vurgulanarak alım-satım kararları için sağlam bir zemin oluşturulur.

Piyasanın karmaşık göründüğü dönemlerde dahi net yön sinyalleri üreten bu indikatör, 823 boost ile topluluğun en çok beğenilen araçlarından biri hâline gelmiştir.

**Öne Çıkan Özellikler:**
- Ana trend yönünü tek bakışta gösteren renk kodlaması
- İşlem hatasını azaltmaya yönelik optimize sinyal yapısı
- Trend güç ve zayıflık bölgelerinin görsel gösterimi
- Her zaman dilimine ve enstrümana uyarlanabilir yapı
- Sade arayüz, güçlü analitik altyapı`,
    images: [],
    tags: ["Pine Script", "Trend", "Sinyal", "Ana Trend"],
    badge: "823 Boost",
    badgeColor: "emerald",
    tradingviewUrl: "https://www.tradingview.com",
  },
  {
    slug: "thebigshort-trendpa",
    title: "TheBigShortTrendPa",
    platform: "TradingView",
    shortDesc:
      "Basitleştirilmiş Price Action sistemi. Mor çizgi dip formasyon, kırmızı çizgi tepe formasyon seviyelerini göstererek kademeli fiyat seviyeleri sunar.",
    description:
      `TheBigShortTrendPa, price action analizini basitleştiren ve yatırımcıya hissenin kademeli fiyat seviyelerini sezgisel biçimde sunan özgün bir Pine Script sistemidir.

İki ana çizgi üzerine kurulu sistemde **mor çizgi** dip formasyon bölgesini, **kırmızı çizgi** ise tepe formasyon bölgesini temsil eder. Mor çizginin altına inilmesi dip oluşum sinyali olarak yorumlanırken, kırmızı çizginin üzerine çıkılması tepe bölgesine girildiğine işaret eder.

Bu yapı sayesinde grafik yorum karmaşasından uzak, saf fiyat hareketine odaklı bir bakış açısı elde edilir. İster scalping ister swing trading yapın, TheBigShortTrendPa fiyatın nerede olduğunu ve nereye yönelebileceğini kristal netliğinde gösterir.

**Öne Çıkan Özellikler:**
- Mor çizgi: Dip formasyon / destek bölgesi göstergesi
- Kırmızı çizgi: Tepe formasyon / direnç bölgesi göstergesi
- Kademeli price action seviyeleri
- Karmaşık formüller yerine saf fiyat hareketi odaklı yapı
- Her seviyede yatırımcıya uygun sade tasarım`,
    images: [],
    tags: ["Pine Script", "Price Action", "Trend", "Destek/Direnç"],
    badge: "66 Boost",
    badgeColor: "purple",
    tradingviewUrl: "https://www.tradingview.com",
  },
];
