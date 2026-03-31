import * as XLSX from "xlsx";

export interface KurumSeriRow {
  zamanMs: number;
  kumulatif: number;
}

export interface KurumSeri {
  kurum: string;
  sonLot: number;
  data: KurumSeriRow[];
}

export interface RawRow {
  zamanMs: number;
  alanKurum: string;
  satanKurum: string;
  adet: number;
}

export interface KurumHareketData {
  alicilar: KurumSeri[];
  saticilar: KurumSeri[];
  minZaman: number;
  maxZaman: number;
  toplamIslem: number;
  rawRows: RawRow[];
}

export function formatZaman(ms: number): string {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function parseTime(val: unknown): number | null {
  if (val == null || val === "") return null;

  // Excel serial number (fraction of day): 0.5 = 12:00:00
  if (typeof val === "number") {
    return Math.round(val * 24 * 60 * 60 * 1000);
  }

  // String: HH:MM:SS[.fff]
  if (typeof val === "string") {
    const match = val.trim().match(/(\d{1,2}):(\d{2})(?::(\d{2})(?:\.(\d+))?)?/);
    if (match) {
      const h = parseInt(match[1]);
      const m = parseInt(match[2]);
      const s = match[3] ? parseInt(match[3]) : 0;
      const ms = match[4] ? parseInt(match[4].padEnd(3, "0").slice(0, 3)) : 0;
      return h * 3600000 + m * 60000 + s * 1000 + ms;
    }
  }

  // Date object (cellDates: true)
  if (val instanceof Date) {
    return (
      val.getHours() * 3600000 +
      val.getMinutes() * 60000 +
      val.getSeconds() * 1000 +
      val.getMilliseconds()
    );
  }

  return null;
}

export function parseKurumHareket(buffer: ArrayBuffer): KurumHareketData {
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error("Excel dosyasında sayfa bulunamadı.");

  const sheet = workbook.Sheets[sheetName];
  const raw: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

  if (raw.length === 0) throw new Error("Veri bulunamadı.");

  // Column detection (case-insensitive partial match)
  const headers = Object.keys(raw[0]);
  const findCol = (keywords: string[]) =>
    headers.find((h) => keywords.some((kw) => h.toLowerCase().includes(kw.toLowerCase())));

  const saatCol = findCol(["saat", "zaman", "time"]);
  const alanCol = findCol(["alan", "alici", "buyer", "alış"]);
  const satanCol = findCol(["satan", "satici", "seller", "satış"]);
  const adetCol = findCol(["adet", "lot", "miktar", "qty", "quantity"]);

  if (!saatCol || !alanCol || !satanCol || !adetCol) {
    throw new Error(
      `Gerekli sütunlar bulunamadı. Bulunan sütunlar: ${headers.join(", ")}.\n` +
        `Beklenen sütunlar: Saat, Alan Kurum, Satan Kurum, Adet`
    );
  }

  interface RawRow {
    zamanMs: number;
    alanKurum: string;
    satanKurum: string;
    adet: number;
  }

  const rows: RawRow[] = [];

  for (const row of raw) {
    const zamanMs = parseTime(row[saatCol]);
    if (zamanMs === null) continue;

    const alanKurum = String(row[alanCol] ?? "").trim();
    const satanKurum = String(row[satanCol] ?? "").trim();
    const adetRaw = row[adetCol];
    const adet =
      typeof adetRaw === "number" ? adetRaw : parseFloat(String(adetRaw).replace(/[^\d.-]/g, ""));

    if (!alanKurum || !satanKurum || isNaN(adet) || adet <= 0) continue;

    rows.push({ zamanMs, alanKurum, satanKurum, adet });
  }

  if (rows.length === 0) throw new Error("Geçerli işlem satırı bulunamadı.");

  rows.sort((a, b) => a.zamanMs - b.zamanMs);

  // Net position per broker
  const netMap = new Map<string, number>();
  for (const row of rows) {
    netMap.set(row.alanKurum, (netMap.get(row.alanKurum) ?? 0) + row.adet);
    netMap.set(row.satanKurum, (netMap.get(row.satanKurum) ?? 0) - row.adet);
  }

  const sorted = [...netMap.entries()].sort((a, b) => b[1] - a[1]);
  const top10Alici = sorted.slice(0, 10).map(([k]) => k);
  const top10Satici = sorted
    .slice(-10)
    .reverse()
    .map(([k]) => k); // most negative first

  function buildSeries(kurum: string): KurumSeri {
    const events: { zamanMs: number; delta: number }[] = [];
    for (const row of rows) {
      if (row.alanKurum === kurum) events.push({ zamanMs: row.zamanMs, delta: row.adet });
      if (row.satanKurum === kurum) events.push({ zamanMs: row.zamanMs, delta: -row.adet });
    }
    events.sort((a, b) => a.zamanMs - b.zamanMs);

    let cum = 0;
    const data: KurumSeriRow[] = events.map((e) => {
      cum += e.delta;
      return { zamanMs: e.zamanMs, kumulatif: cum };
    });

    return { kurum, sonLot: cum, data };
  }

  const alicilar = top10Alici.map(buildSeries);
  const saticilar = top10Satici.map(buildSeries);

  const allTimes = rows.map((r) => r.zamanMs);
  const minZaman = Math.min(...allTimes);
  const maxZaman = Math.max(...allTimes);

  return { alicilar, saticilar, minZaman, maxZaman, toplamIslem: rows.length, rawRows: rows };
}
