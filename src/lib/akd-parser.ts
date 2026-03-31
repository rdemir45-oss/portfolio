import * as XLSX from "xlsx";

export interface AkdRow {
  hisse: string;
  kurum: string;
  lot: number;
  tip: "Alış" | "Satış";
}

export interface OneCikan {
  hisse: string;
  ilk2AliciOrani: number;
  digerSaticilarOrani: number;
  toplamAlis: number;
  toplamSatis: number;
}

export interface KurumBirinci {
  hisse: string;
  netLot: number;
  oran: number;
}

export interface Ilk2AliciBirlesik {
  hisse: string;
  kurumlar: { kurum: string; lot: number; oran: number }[];
  toplamAlis: number;
}

export interface AkdFilters {
  kurumlar?: string[];
  tip?: "Alış" | "Satış" | "Hepsi";
  hisseArama?: string;
  minLot?: number;
  maxLot?: number;
  oneCikanlar?: boolean;
  birincAliciKurum?: string;
}

export function parseAkdExcel(buffer: ArrayBuffer): AkdRow[] {
  const workbook = XLSX.read(buffer, { type: "array" });

  const sheetName = workbook.SheetNames.find(
    (n) => n.toLowerCase().includes("fiyat") && n.toLowerCase().includes("pencere")
  );
  if (!sheetName) {
    throw new Error("Excel dosyasında 'Fiyat Penceresi' sayfası bulunamadı.");
  }

  const sheet = workbook.Sheets[sheetName];
  const raw: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  if (raw.length < 4) {
    throw new Error("Veri yetersiz. 'Fiyat Penceresi' sayfasında en az 4 satır bekleniyor.");
  }

  // header = row index 2 (0-based), data starts from row 3
  const headers = (raw[2] ?? []).map((h) => String(h ?? ""));
  const dataRows = raw.slice(3);

  const result: AkdRow[] = [];

  for (const row of dataRows) {
    const hisse = String(row[0] ?? "").trim();
    if (!hisse) continue;

    // --- ALIŞ (sütun 1-11, çiftler: kurum + lot) ---
    for (let i = 1; i < 12; i += 2) {
      if (i + 1 >= headers.length) break;
      const kurum = String(row[i] ?? "").trim();
      const lot = toNumber(row[i + 1]);
      if (kurum && lot !== 0) {
        result.push({ hisse, kurum, lot: Math.abs(lot), tip: "Alış" });
      }
    }

    // --- Diğer Alıcılar ---
    for (let c = 0; c < headers.length; c++) {
      const h = headers[c].toUpperCase();
      if (h.includes("DİĞER") && (h.includes("ALIŞ") || h.includes("ALICI"))) {
        const lot = toNumber(row[c]);
        if (lot !== 0) {
          result.push({ hisse, kurum: "Diğer Alıcılar", lot: Math.abs(lot), tip: "Alış" });
        }
      }
    }

    // --- SATIŞ (sütun 13-23, çiftler: kurum + lot) ---
    for (let i = 13; i < 24; i += 2) {
      if (i + 1 >= headers.length) break;
      const kurum = String(row[i] ?? "").trim();
      const lot = toNumber(row[i + 1]);
      if (kurum && lot !== 0) {
        result.push({ hisse, kurum, lot: Math.abs(lot), tip: "Satış" });
      }
    }

    // --- Diğer Satıcılar ---
    for (let c = 0; c < headers.length; c++) {
      const h = headers[c].toUpperCase();
      if (h.includes("DİĞER") && (h.includes("SATIŞ") || h.includes("SATICI"))) {
        const lot = toNumber(row[c]);
        if (lot !== 0) {
          result.push({ hisse, kurum: "Diğer Satıcılar", lot: Math.abs(lot), tip: "Satış" });
        }
      }
    }
  }

  if (result.length === 0) {
    throw new Error("Excel dosyasından veri parse edilemedi. Dosya formatını kontrol edin.");
  }

  return result;
}

export function getOneCikanlar(data: AkdRow[]): OneCikan[] {
  const hisseler = uniqueValues(data, "hisse");
  const result: OneCikan[] = [];

  for (const hisse of hisseler) {
    const sub = data.filter((d) => d.hisse === hisse);

    // Alış tarafı
    const alisMap = groupSum(sub.filter((d) => d.tip === "Alış"));
    const toplamAlis = sumValues(alisMap);
    const top2Alis = [...alisMap.values()]
      .sort((a, b) => b - a)
      .slice(0, 2)
      .reduce((s, v) => s + v, 0);
    const alisOrani = toplamAlis > 0 ? top2Alis / toplamAlis : 0;

    // Satış tarafı
    const satisMap = groupSum(sub.filter((d) => d.tip === "Satış"));
    const toplamSatis = sumValues(satisMap);
    let digerSatis = 0;
    for (const [k, v] of satisMap) {
      if (k.toLowerCase().includes("diğer")) digerSatis += v;
    }
    const digerSatisOrani = toplamSatis > 0 ? digerSatis / toplamSatis : 0;

    if (alisOrani >= 0.55 && digerSatisOrani >= 0.40) {
      result.push({
        hisse,
        ilk2AliciOrani: alisOrani,
        digerSaticilarOrani: digerSatisOrani,
        toplamAlis,
        toplamSatis,
      });
    }
  }

  return result.sort((a, b) => b.ilk2AliciOrani - a.ilk2AliciOrani);
}

export function getKurumBirinciler(data: AkdRow[], kurumAdi: string): KurumBirinci[] {
  const hisseler = uniqueValues(data, "hisse");
  const result: KurumBirinci[] = [];
  const searchTerm = kurumAdi.toLowerCase().trim();

  for (const hisse of hisseler) {
    const sub = data.filter((d) => d.hisse === hisse && d.tip === "Alış");
    if (sub.length === 0) continue;

    const grouped = groupSum(sub);
    const sorted = [...grouped.entries()].sort((a, b) => b[1] - a[1]);
    if (sorted.length === 0) continue;

    const [topKurum, topLot] = sorted[0];
    if (topKurum.toLowerCase().trim().includes(searchTerm)) {
      const toplam = sumValues(grouped);
      result.push({
        hisse,
        netLot: Math.round(topLot),
        oran: toplam > 0 ? topLot / toplam : 0,
      });
    }
  }

  return result.sort((a, b) => b.oran - a.oran);
}

export function getIlk2AliciBirlesik(data: AkdRow[], kurumAdlari: string[]): Ilk2AliciBirlesik[] {
  if (kurumAdlari.length < 2) return [];
  const hisseler = uniqueValues(data, "hisse");
  const result: Ilk2AliciBirlesik[] = [];
  const searchTerms = kurumAdlari.map((k) => k.toLowerCase().trim());

  for (const hisse of hisseler) {
    const sub = data.filter((d) => d.hisse === hisse && d.tip === "Alış");
    if (sub.length === 0) continue;

    const grouped = groupSum(sub);
    const sorted = [...grouped.entries()].sort((a, b) => b[1] - a[1]);
    const top2 = sorted.slice(0, 2).map(([k]) => k.toLowerCase().trim());

    const allFound = searchTerms.every((term) =>
      top2.some((t) => t.includes(term))
    );

    if (allFound) {
      const toplam = sumValues(grouped);
      const kurumlar = searchTerms.map((term) => {
        const entry = sorted.find(([k]) => k.toLowerCase().trim().includes(term));
        const lot = entry ? entry[1] : 0;
        return {
          kurum: entry ? entry[0] : term,
          lot: Math.round(lot),
          oran: toplam > 0 ? lot / toplam : 0,
        };
      });
      result.push({ hisse, kurumlar, toplamAlis: toplam });
    }
  }

  return result.sort((a, b) => {
    const aTotal = a.kurumlar.reduce((s, k) => s + k.oran, 0);
    const bTotal = b.kurumlar.reduce((s, k) => s + k.oran, 0);
    return bTotal - aTotal;
  });
}

export interface KurumOranSonuc {
  hisse: string;
  lot: number;
  oran: number; // 0-1
  toplamAlis: number;
}

export function getKurumMinOranFiltresi(
  data: AkdRow[],
  kurumAdi: string,
  minOranYuzde: number // 0-100
): KurumOranSonuc[] {
  const hisseler = uniqueValues(data, "hisse");
  const result: KurumOranSonuc[] = [];
  const searchTerm = kurumAdi.toLowerCase().trim();
  const minOran = minOranYuzde / 100;

  for (const hisse of hisseler) {
    const sub = data.filter((d) => d.hisse === hisse && d.tip === "Alış");
    if (sub.length === 0) continue;

    const grouped = groupSum(sub);
    const toplam = sumValues(grouped);
    if (toplam === 0) continue;

    let kurumLot = 0;
    for (const [k, v] of grouped) {
      if (k.toLowerCase().trim().includes(searchTerm)) {
        kurumLot += v;
      }
    }
    const oran = kurumLot / toplam;
    if (oran >= minOran) {
      result.push({ hisse, lot: Math.round(kurumLot), oran, toplamAlis: toplam });
    }
  }

  return result.sort((a, b) => b.oran - a.oran);
}

export function getFilteredData(data: AkdRow[], filters: AkdFilters): AkdRow[] {
  let result = data;

  if (filters.tip && filters.tip !== "Hepsi") {
    result = result.filter((d) => d.tip === filters.tip);
  }

  if (filters.hisseArama) {
    const search = filters.hisseArama.toUpperCase();
    result = result.filter((d) => d.hisse.toUpperCase().includes(search));
  }

  if (filters.kurumlar && filters.kurumlar.length > 0) {
    const set = new Set(filters.kurumlar.map((k) => k.toLowerCase()));
    result = result.filter((d) => set.has(d.kurum.toLowerCase()));
  }

  if (filters.minLot !== undefined && filters.minLot > 0) {
    result = result.filter((d) => d.lot >= filters.minLot!);
  }

  if (filters.maxLot !== undefined && filters.maxLot > 0) {
    result = result.filter((d) => d.lot <= filters.maxLot!);
  }

  return result;
}

export function getUniqueKurumlar(data: AkdRow[]): string[] {
  return [...new Set(data.map((d) => d.kurum))].sort();
}

export function getUniqueHisseler(data: AkdRow[]): string[] {
  return [...new Set(data.map((d) => d.hisse))].sort();
}

// --- helpers ---

function toNumber(val: unknown): number {
  if (typeof val === "number") return val;
  if (typeof val === "string") {
    const n = parseFloat(val.replace(/[^\d.-]/g, ""));
    return isNaN(n) ? 0 : n;
  }
  return 0;
}

function groupSum(rows: AkdRow[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const r of rows) {
    map.set(r.kurum, (map.get(r.kurum) ?? 0) + r.lot);
  }
  return map;
}

function sumValues(map: Map<string, number>): number {
  let s = 0;
  for (const v of map.values()) s += v;
  return s;
}

function uniqueValues(data: AkdRow[], key: keyof AkdRow): string[] {
  return [...new Set(data.map((d) => String(d[key])))];
}
