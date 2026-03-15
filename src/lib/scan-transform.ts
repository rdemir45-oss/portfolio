/**
 * scan-transform.ts
 * API yanıtını frontend'e göndermeden önce dönüştüren yardımcı fonksiyonlar.
 *
 * triangle_break kategorisi tek bir API key'i altında gelir ancak
 * her hissede formationData.direction alanı bulunur:
 *   direction >= 0  → Üçgen Yukarı Kıran (triangle_break_up)
 *   direction <  0  → Üçgen Aşağı Kıran  (triangle_break_down)
 *
 * Bu fonksiyon orijinal triangle_break kategorisini ikiye bölüp
 * sanal triangle_break_up ve triangle_break_down kategorilerini yanıta ekler;
 * orijinal triangle_break kategorisin kaldırır.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RawScanResponse = Record<string, any>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function injectTriangleSplit(data: RawScanResponse): RawScanResponse {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cats: any[] | undefined = data?.categories;
  if (!Array.isArray(cats)) return data;

  const triIdx = cats.findIndex((c) => c.key === "triangle_break");
  if (triIdx === -1) return data;

  const tri = cats[triIdx];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stocks: any[] = tri.stocks ?? [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const upStocks   = stocks.filter((s: any) => (s?.formationData?.direction ?? 1) >= 0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const downStocks = stocks.filter((s: any) => (s?.formationData?.direction ?? 0) <  0);

  const upCat = {
    ...tri,
    key:    "triangle_break_up",
    label:  "Üçgen Yukarı Kıran",
    stocks: upStocks,
    count:  upStocks.length,
  };

  const downCat = {
    ...tri,
    key:    "triangle_break_down",
    label:  "Üçgen Aşağı Kıran",
    stocks: downStocks,
    count:  downStocks.length,
  };

  // Orijinal triangle_break yerine iki sanal kategori koy
  const newCats = [...cats];
  newCats.splice(triIdx, 1, upCat, downCat);

  return { ...data, categories: newCats };
}
