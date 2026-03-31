import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { isAdmin, UNAUTHORIZED } from "@/lib/admin-auth";

const posts = [
  {
    slug: "bist-direnc-destek-mart-2026",
    title: "BIST 100 Mart 2026 Kritik Destek & Direnç Seviyeleri",
    category: "Teknik Analiz",
    date: "2026-03-05",
    summary:
      "Mart ayına girerken BIST 100 endeksinde izlenmesi gereken kritik teknik seviyeler, fibonacci bölgeleri ve olası senaryo analizleri.",
    content: `BIST 100 endeksi Mart ayına hareketli bir tempo ile girdi. Bu yazıda güncel teknik seviyeleri ele alıyoruz.

**Kritik Destek Seviyeleri**
- 9.800 bölgesi: Kısa vadeli güçlü destek
- 9.450 bölgesi: Fibonacci %38.2 desteği
- 9.100 bölgesi: Orta vade kritik destek

**Kritik Direnç Seviyeleri**
- 10.250 bölgesi: İlk önemli direnç
- 10.750 bölgesi: Fibonacci %61.8 direnci
- 11.200 bölgesi: Güçlü tarihsel direnç

**Senaryo Analizi**
Endeksin 10.250 üzerinde kalıcılık sağlaması durumunda 10.750 hedeflenebilir. Aksi halde 9.800 desteği test edilebilir. Hacim verisi ve küresel piyasalar yakından takip edilmeli.`,
    tags: ["BIST 100", "Destek", "Direnç", "Fibonacci"],
    pinned: true,
    cover_image: null,
  },
  {
    slug: "harmonik-pattern-nedir",
    title: "Harmonik Formasyonlar Nedir? Gartley, Bat ve Butterfly",
    category: "Eğitim",
    date: "2026-03-01",
    summary:
      "Teknik analizin en güçlü araçlarından harmonik formasyonların temelleri, nasıl çizildiği ve nasıl yorumlanacağı hakkında kapsamlı rehber.",
    content: `Harmonik formasyonlar, fiyat hareketlerindeki geometrik yapıları ve Fibonacci oranlarını kullanarak potansiyel dönüş noktalarını tespit etmeye yarayan gelişmiş teknik analiz araçlarıdır.

**Neden Önemli?**
Harmonik formasyonlar, sıradan teknik analizin ötesinde fiyatın olası döneceği bölgeyi matematiksel olarak tanımlar. Bu sayede hem giriş hem de hedef noktaları çok daha net belirlenir.

**Temel Formasyonlar**

*Gartley Formasyonu*
En klasik harmonik formasyon. XA hareketinin %61.8 düzeltmesiyle başlar ve D noktasında %78.6 seviyesinde tamamlanır.

*Bat Formasyonu*
Gartley'e benzer ancak daha derin düzeltme yapar. D noktası XA'nın %88.6 seviyesinde oluşur.

*Butterfly Formasyonu*
Fiyat, başlangıç noktasının ötesine geçer. D noktası XA'nın %127 veya %161.8 uzantısında oluşur.

**Nasıl Trade Edilir?**
D noktası bölgesinde fiyat aksiyonu onayı bekleyin. Stop loss, D noktasının az altında (bullish) veya üstünde (bearish) konumlandırılır. Hedefler için AB=CD projeksiyonu kullanılır.`,
    tags: ["Harmonik", "Gartley", "Bat", "Butterfly", "Fibonacci"],
    pinned: false,
    cover_image: null,
  },
  {
    slug: "rdalgo-yeni-versiyon-duyurusu",
    title: "RdAlgo Harmonik Tarama v2.0 Yayında!",
    category: "Duyuru",
    date: "2026-02-28",
    summary:
      "RdAlgo Harmonik Tarama indikatörünün yeni versiyonu çok daha hızlı tarama motoru, yeni formasyon tipleri ve geliştirilmiş uyarı sistemiyle yayınlandı.",
    content: `RdAlgo Harmonik Tarama & Otomatik Fibonacci indikatörünün v2.0 versiyonu TradingView'da yayına girdi.

**Yenilikler**

*Yeni Formasyon Tipleri*
- Shark formasyonu eklendi
- 5-0 formasyonu eklendi
- Cypher formasyonu eklendi

*Performans İyileştirmeleri*
Tarama motoru tamamen yeniden yazıldı. Önceki versiyona göre %40 daha hızlı çalışıyor.

*Geliştirilmiş Uyarı Sistemi*
Formasyon tamamlanma anında anlık bildirim alabilirsiniz. Ayrıca formasyon oluşum aşamasında da erken uyarı seçeneği eklendi.

*Yeni Arayüz*
Dashboard tamamen yenilendi. Grafik üzerindeki etiketler daha okunaklı hale getirildi.

**Nasıl Güncellersiniz?**
TradingView'da indikatörü açın, sağ tıklayın ve "Güncelle"ye basın. Mevcut ayarlarınız korunacaktır.`,
    tags: ["RdAlgo", "Güncelleme", "TradingView", "v2.0"],
    pinned: true,
    cover_image: null,
  },
  {
    slug: "pine-script-baslangic",
    title: "Pine Script ile İndikatör Yazımına Giriş",
    category: "Eğitim",
    date: "2026-02-20",
    summary:
      "TradingView'ın Pine Script dili ile sıfırdan indikatör yazımını öğrenmek isteyenler için adım adım başlangıç rehberi.",
    content: `Pine Script, TradingView platformuna özel geliştirilmiş, öğrenmesi kolay ancak son derece güçlü bir programlama dilidir.

**Neden Pine Script?**
- TradingView'a entegre, kurulum gerektirmez
- Milyonlarca trader'ın kullandığı paylaşım ekosistemi
- v5 ile profesyonel düzeyde indikatör geliştirme imkânı

**İlk İndikatörünüz**
\`\`\`
//@version=5
indicator("İlk İndikatörüm", overlay=true)
length = input.int(14, "Periyot")
ma = ta.sma(close, length)
plot(ma, color=color.emerald, linewidth=2)
\`\`\`

**Temel Kavramlar**
- close, open, high, low: Fiyat serileri
- ta.sma(), ta.ema(): Hareketli ortalama fonksiyonları
- input.int(), input.float(): Kullanıcı girişleri
- plot(): Grafik üzerine çizim

**Sonraki Adımlar**
Temel syntax öğrendikten sonra strateji yazmaya, backtest almaya ve uyarı (alert) sistemleri kurmaya geçebilirsiniz.`,
    tags: ["Pine Script", "TradingView", "Kodlama", "Başlangıç"],
    pinned: false,
    cover_image: null,
  },
];

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return UNAUTHORIZED;
  const results = [];
  for (const post of posts) {
    const { error } = await supabaseAdmin
      .from("posts")
      .upsert(post, { onConflict: "slug" });
    results.push({ slug: post.slug, ok: !error, error: error?.message });
  }
  const failed = results.filter((r) => !r.ok);
  if (failed.length > 0) {
    return NextResponse.json({ success: false, failed }, { status: 500 });
  }
  return NextResponse.json({ success: true, count: results.length });
}
