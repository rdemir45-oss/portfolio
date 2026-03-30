import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { AkdRow, OneCikan, KurumBirinci } from "./akd-parser";
import { getOneCikanlar, getKurumBirinciler, getFilteredData } from "./akd-parser";
import type { AkdFilters } from "./akd-parser";

export interface PdfOptions {
  filters: AkdFilters;
  birincAliciKurumlar?: string[];
}

const WATERMARK = "YATIRIM TAVSİYESİ DEĞİLDİR";

function addWatermark(doc: jsPDF) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.saveGraphicsState();
  doc.setFontSize(40);
  doc.setTextColor(180, 180, 180);
  const d = doc as unknown as Record<string, unknown>;
  if (typeof d["setGState"] === "function" && typeof d["GState"] === "function") {
    const GState = d["GState"] as new (opts: Record<string, number>) => unknown;
    (d["setGState"] as (gs: unknown) => void)(new GState({ opacity: 0.12 }));
  }
  doc.text(WATERMARK, pageWidth / 2, pageHeight / 2, {
    align: "center",
    angle: 30,
  });
  doc.restoreGraphicsState();
}

function addPageFooter(doc: jsPDF, text: string) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text(text, pageWidth / 2, pageHeight - 10, { align: "center" });
}

function formatDate(): string {
  const now = new Date();
  const d = String(now.getDate()).padStart(2, "0");
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const y = now.getFullYear();
  return `${d}.${m}.${y}`;
}

function formatPercent(val: number): string {
  return (val * 100).toFixed(2) + "%";
}

function formatLot(val: number): string {
  return Math.round(val).toLocaleString("tr-TR");
}

export function generatePdf(data: AkdRow[], options: PdfOptions): Blob {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const dateStr = formatDate();

  // ===== Sayfa 1: Risk Bildirimi =====
  doc.setFontSize(20);
  doc.setTextColor(192, 57, 43);
  doc.text("R\u0130SK B\u0130LD\u0130R\u0130M\u0130", pageWidth / 2, 40, { align: "center" });

  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  const riskLines = [
    "Bu analizlerde yer alan yatirim bilgi, yorum ve tavsiyeler yatirim",
    "danismanligi kapsaminda degildir. Bu tavsiyeler genel nitelikte olup,",
    "ozel olarak sizin mali durumunuz ile risk ve getiri tercihlerinize",
    "uygun olarak hazirlanmamistir.",
    "",
    "Bu nedenle, sadece burada yer alan bilgilere dayanilarak yatirim",
    "karari verilmesi beklentilerinize uygun sonuclar dogurmayabilir.",
    "",
    "Yapilan tum yorumlar analizler ve oneriler, analistlerin deneyim ve",
    "bilgisi dahilinde yapabilecegi en iyi ve en dogru arastirmalarin",
    "butunuyle iyi niyetli bir urunudur.",
    "",
    "Yorumlar ve bilgiler birer AL veya SAT onerisi teskil etmezler.",
    "",
    "Daha once paylasilan piyasa analizlerinin, bilgilerin ve onerilerin",
    "gecmiste basarili olmus olmasi ileri yonelik kesin basari anlamina",
    "gelmemektedir, bu veriler neticesinde pozisyon almak yatirimcinin",
    "kendi kararidir.",
  ];

  // Draw border box
  doc.setDrawColor(230, 126, 34);
  doc.setLineWidth(0.8);
  doc.roundedRect(25, 55, pageWidth - 50, 110, 3, 3);
  doc.setFillColor(254, 249, 231);
  doc.roundedRect(25, 55, pageWidth - 50, 110, 3, 3, "F");
  doc.setDrawColor(230, 126, 34);
  doc.roundedRect(25, 55, pageWidth - 50, 110, 3, 3, "S");

  let yPos = 68;
  for (const line of riskLines) {
    doc.text(line, pageWidth / 2, yPos, { align: "center" });
    yPos += 6;
  }

  doc.setFontSize(10);
  doc.setTextColor(127, 140, 141);
  doc.text(`Rapor Tarihi: ${dateStr}`, pageWidth / 2, 280, { align: "center" });
  addWatermark(doc);

  // ===== Sayfa 2: Kapak =====
  doc.addPage();
  doc.setFontSize(26);
  doc.setTextColor(40, 40, 40);
  doc.text("Gunluk Araci Kurum Dagilimi Raporu", pageWidth / 2, 90, { align: "center" });

  doc.setFontSize(14);
  doc.setTextColor(100, 100, 100);
  doc.text("Araci kurumlarin alis/satis dagilimi", pageWidth / 2, 110, { align: "center" });
  doc.text("ve ozet analizler", pageWidth / 2, 120, { align: "center" });

  doc.setFontSize(10);
  doc.text(`Rapor Tarihi: ${dateStr}`, pageWidth / 2, 200, { align: "center" });
  addWatermark(doc);

  // ===== Sayfa 3: Öne Çıkan Hisseler =====
  const oneCikanlar = getOneCikanlar(data);
  doc.addPage();
  doc.setFontSize(16);
  doc.setTextColor(40, 40, 40);
  doc.text("Bolum 1: One Cikan Hisseler", pageWidth / 2, 20, { align: "center" });

  if (oneCikanlar.length > 0) {
    const tableData = oneCikanlar.map((o: OneCikan) => [
      o.hisse,
      formatPercent(o.ilk2AliciOrani),
      formatPercent(o.digerSaticilarOrani),
    ]);
    autoTable(doc, {
      head: [["Hisse", "Ilk 2 Alici Orani", "Diger Saticilar Orani"]],
      body: tableData,
      startY: 30,
      theme: "grid",
      headStyles: { fillColor: [75, 139, 190], textColor: 255, fontStyle: "bold" },
      styles: { halign: "center", fontSize: 9 },
      didDrawPage: () => addWatermark(doc),
    });
  } else {
    doc.setFontSize(12);
    doc.text("Bu donemde one cikan hisse bulunamadi.", pageWidth / 2, 60, { align: "center" });
    addWatermark(doc);
  }

  // ===== Kurum 1. Alıcı Bölümleri =====
  const defaultKurumlar = ["bank of america", "tera"];
  const kurumListesi = options.birincAliciKurumlar?.length
    ? options.birincAliciKurumlar
    : defaultKurumlar;

  let bolumNo = 2;
  for (const kurum of kurumListesi) {
    const birinciler = getKurumBirinciler(data, kurum);
    doc.addPage();
    doc.setFontSize(16);
    doc.setTextColor(40, 40, 40);
    doc.text(`Bolum ${bolumNo}: ${kurum.toUpperCase()} 1. Alici Oldugu Hisseler`, pageWidth / 2, 20, {
      align: "center",
    });

    if (birinciler.length > 0) {
      const rows = birinciler.map((b: KurumBirinci) => [
        b.hisse,
        formatLot(b.netLot),
        formatPercent(b.oran),
      ]);

      // Paginate: max 30 rows per page
      const pageSize = 30;
      for (let i = 0; i < rows.length; i += pageSize) {
        if (i > 0) {
          doc.addPage();
          doc.setFontSize(16);
          doc.setTextColor(40, 40, 40);
          doc.text(
            `Bolum ${bolumNo}: ${kurum.toUpperCase()} 1. Alici (devam)`,
            pageWidth / 2,
            20,
            { align: "center" }
          );
        }
        autoTable(doc, {
          head: [["Hisse", "Net Lot", "Oran (%)"]],
          body: rows.slice(i, i + pageSize),
          startY: 30,
          theme: "grid",
          headStyles: { fillColor: [26, 82, 118], textColor: 255, fontStyle: "bold" },
          styles: { halign: "center", fontSize: 9 },
          didDrawPage: () => addWatermark(doc),
        });
      }
    } else {
      doc.setFontSize(12);
      doc.text(
        `Bu donemde ${kurum.toUpperCase()}'nin 1. alici oldugu hisse bulunamadi.`,
        pageWidth / 2,
        60,
        { align: "center" }
      );
      addWatermark(doc);
    }
    bolumNo++;
  }

  // ===== Filtrelenmiş Veri Bölümü =====
  const filtered = getFilteredData(data, options.filters);
  if (filtered.length > 0) {
    doc.addPage();
    doc.setFontSize(16);
    doc.setTextColor(40, 40, 40);
    doc.text(`Bolum ${bolumNo}: Filtreli Sonuclar`, pageWidth / 2, 20, { align: "center" });

    // Group by hisse
    const hisseMap = new Map<string, { alis: Map<string, number>; satis: Map<string, number> }>();
    for (const row of filtered) {
      if (!hisseMap.has(row.hisse)) {
        hisseMap.set(row.hisse, { alis: new Map(), satis: new Map() });
      }
      const entry = hisseMap.get(row.hisse)!;
      const target = row.tip === "Alış" ? entry.alis : entry.satis;
      target.set(row.kurum, (target.get(row.kurum) ?? 0) + row.lot);
    }

    const tableRows: string[][] = [];
    for (const [hisse, { alis, satis }] of hisseMap) {
      const allKurumlar = new Set([...alis.keys(), ...satis.keys()]);
      for (const kurum of allKurumlar) {
        const alisLot = alis.get(kurum) ?? 0;
        const satisLot = satis.get(kurum) ?? 0;
        if (alisLot > 0 || satisLot > 0) {
          tableRows.push([
            hisse,
            kurum,
            alisLot > 0 ? formatLot(alisLot) : "-",
            satisLot > 0 ? formatLot(satisLot) : "-",
          ]);
        }
      }
    }

    const pageSize = 30;
    for (let i = 0; i < tableRows.length; i += pageSize) {
      if (i > 0) {
        doc.addPage();
        doc.setFontSize(16);
        doc.setTextColor(40, 40, 40);
        doc.text(`Bolum ${bolumNo}: Filtreli Sonuclar (devam)`, pageWidth / 2, 20, {
          align: "center",
        });
      }
      autoTable(doc, {
        head: [["Hisse", "Kurum", "Alis Lot", "Satis Lot"]],
        body: tableRows.slice(i, i + pageSize),
        startY: 30,
        theme: "grid",
        headStyles: { fillColor: [39, 174, 96], textColor: 255, fontStyle: "bold" },
        styles: { halign: "center", fontSize: 8 },
        didDrawPage: () => addWatermark(doc),
      });
    }
  }

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addPageFooter(doc, `Sayfa ${i} / ${totalPages} — ${dateStr}`);
  }

  return doc.output("blob");
}
