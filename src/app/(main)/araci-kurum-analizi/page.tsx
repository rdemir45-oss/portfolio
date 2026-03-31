"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TbUpload,
  TbFileSpreadsheet,
  TbDownload,
  TbFilter,
  TbX,
  TbChevronDown,
  TbChevronUp,
  TbAlertTriangle,
} from "react-icons/tb";
import type { AkdRow, AkdFilters } from "@/lib/akd-parser";
import { parseAkdExcel, getUniqueKurumlar, getUniqueHisseler, getFilteredData, getOneCikanlar, getKurumBirinciler, getIlk2AliciBirlesik } from "@/lib/akd-parser";
import { generatePdf } from "@/lib/akd-pdf";

export default function AraciKurumAnaliziPage() {
  const [data, setData] = useState<AkdRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filters
  const [tipFilter, setTipFilter] = useState<"Hepsi" | "Alış" | "Satış">("Hepsi");
  const [hisseArama, setHisseArama] = useState("");
  const [selectedKurumlar, setSelectedKurumlar] = useState<string[]>([]);
  const [minLot, setMinLot] = useState("");
  const [maxLot, setMaxLot] = useState("");
  const [birincAliciKurum, setBirincAliciKurum] = useState("");
  const [showKurumDropdown, setShowKurumDropdown] = useState(false);
  const [kurumSearch, setKurumSearch] = useState("");
  const [showFilters, setShowFilters] = useState(true);

  // İlk 2 Alıcı Birleşik filter
  const [ilk2AliciKurumlar, setIlk2AliciKurumlar] = useState<string[]>([]);
  const [showIlk2Dropdown, setShowIlk2Dropdown] = useState(false);
  const [ilk2Search, setIlk2Search] = useState("");

  // 1. Alıcı Kurum dropdown
  const [showBirincDropdown, setShowBirincDropdown] = useState(false);
  const [birincSearch, setBirincSearch] = useState("");

  // Font cache
  const [fontData, setFontData] = useState<ArrayBuffer | null>(null);

  const handleFile = useCallback(async (file: File) => {
    const validExts = [".xlsx", ".xls"];
    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    if (!validExts.includes(ext)) {
      setError("Sadece .xlsx veya .xls dosyaları desteklenir.");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setError("Dosya boyutu 50 MB sınırını aşıyor.");
      return;
    }

    setLoading(true);
    setError(null);
    setData(null);
    setFileName(file.name);

    try {
      const buffer = await file.arrayBuffer();
      const parsed = parseAkdExcel(buffer);
      setData(parsed);
      // Reset filters
      setTipFilter("Hepsi");
      setHisseArama("");
      setSelectedKurumlar([]);
      setMinLot("");
      setMaxLot("");
      setBirincAliciKurum("");
      setIlk2AliciKurumlar([]);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Dosya işlenirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      e.target.value = "";
    },
    [handleFile]
  );

  const filters: AkdFilters = {
    tip: tipFilter,
    hisseArama: hisseArama || undefined,
    kurumlar: selectedKurumlar.length > 0 ? selectedKurumlar : undefined,
    minLot: minLot ? Number(minLot) : undefined,
    maxLot: maxLot ? Number(maxLot) : undefined,
  };

  const filtered = data ? getFilteredData(data, filters) : [];
  const kurumlar = data ? getUniqueKurumlar(data) : [];
  const hisseler = data ? getUniqueHisseler(data) : [];
  const oneCikanlar = data ? getOneCikanlar(data) : [];

  const birinciler = data && birincAliciKurum
    ? getKurumBirinciler(data, birincAliciKurum)
    : [];

  const ilk2Birlesik = data && ilk2AliciKurumlar.length >= 2
    ? getIlk2AliciBirlesik(data, ilk2AliciKurumlar)
    : [];

  const filteredKurumlar = kurumlar.filter((k) =>
    k.toLowerCase().includes(kurumSearch.toLowerCase())
  );

  const filteredBirincKurumlar = kurumlar.filter((k) =>
    k.toLowerCase().includes(birincSearch.toLowerCase())
  );

  const filteredIlk2Kurumlar = kurumlar.filter((k) =>
    k.toLowerCase().includes(ilk2Search.toLowerCase())
  );

  const stats = {
    toplamHisse: hisseler.length,
    toplamKurum: kurumlar.length,
    toplamKayit: data?.length ?? 0,
    filtrelenmisKayit: filtered.length,
    oneCikanSayisi: oneCikanlar.length,
    birincAliciSayisi: birinciler.length,
    ilk2BirlesikSayisi: ilk2Birlesik.length,
  };

  const handleDownloadPdf = async () => {
    if (!data) return;
    setPdfLoading(true);
    try {
      // Load font if not cached
      let font = fontData;
      if (!font) {
        const res = await fetch("/fonts/Roboto-Regular.ttf");
        if (res.ok) {
          font = await res.arrayBuffer();
          setFontData(font);
        }
      }

      await new Promise((r) => setTimeout(r, 50));
      const birincKurumlar = birincAliciKurum
        ? [birincAliciKurum]
        : ["bank of america", "tera"];
      const blob = generatePdf(data, {
        filters,
        birincAliciKurumlar: birincKurumlar,
        ilk2AliciKurumlar: ilk2AliciKurumlar.length >= 2 ? ilk2AliciKurumlar : undefined,
        fontData: font ?? undefined,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `AKD_Raporu_${new Date().toISOString().slice(0, 10)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("PDF oluşturulurken bir hata oluştu.");
    } finally {
      setPdfLoading(false);
    }
  };

  const toggleKurum = (kurum: string) => {
    setSelectedKurumlar((prev) =>
      prev.includes(kurum) ? prev.filter((k) => k !== kurum) : [...prev, kurum]
    );
  };

  const clearFilters = () => {
    setTipFilter("Hepsi");
    setHisseArama("");
    setSelectedKurumlar([]);
    setMinLot("");
    setMaxLot("");
    setBirincAliciKurum("");
    setIlk2AliciKurumlar([]);
  };

  return (
    <main className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            Aracı Kurum Dağılımı <span className="text-emerald-400">Analizi</span>
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Excel dosyanızı yükleyin, aracı kurum alış/satış dağılımını filtreleyin
            ve sonuçları PDF olarak indirin.
          </p>
        </motion.div>

        {/* Upload Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div
            onDrop={onDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => fileInputRef.current?.click()}
            className={`
              relative cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-200
              ${
                dragOver
                  ? "border-emerald-400 bg-emerald-950/20"
                  : "border-slate-700 hover:border-slate-500 bg-[#0a1628]"
              }
              ${loading ? "pointer-events-none opacity-60" : ""}
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={onFileChange}
              className="hidden"
            />
            {loading ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-300">Dosya işleniyor...</p>
              </div>
            ) : (
              <>
                <TbUpload className="mx-auto text-4xl text-slate-400 mb-3" />
                <p className="text-lg text-slate-300 mb-1">
                  Excel dosyanızı sürükleyip bırakın veya tıklayın
                </p>
                <p className="text-sm text-slate-500">.xlsx veya .xls — maks. 50 MB</p>
                {fileName && data && (
                  <div className="mt-4 flex items-center justify-center gap-2 text-emerald-400">
                    <TbFileSpreadsheet className="text-xl" />
                    <span className="text-sm">{fileName}</span>
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 flex items-center gap-2 rounded-xl bg-rose-950/40 border border-rose-800/60 px-4 py-3 text-rose-400"
            >
              <TbAlertTriangle className="text-xl shrink-0" />
              <span className="text-sm">{error}</span>
              <button onClick={() => setError(null)} className="ml-auto">
                <TbX />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filters + Stats + Download */}
        <AnimatePresence>
          {data && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-8 space-y-6"
            >
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard label="Toplam Hisse" value={stats.toplamHisse} />
                <StatCard label="Toplam Kurum" value={stats.toplamKurum} />
                <StatCard label="Toplam Kayıt" value={stats.toplamKayit} />
                <StatCard label="Filtrelenen" value={stats.filtrelenmisKayit} color="emerald" />
              </div>

              {/* Filters Panel */}
              <div className="rounded-2xl bg-[#0a1628] border border-slate-800 overflow-hidden">
                <button
                  onClick={() => setShowFilters((p) => !p)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-800/30 transition-colors"
                >
                  <span className="flex items-center gap-2 text-lg font-semibold">
                    <TbFilter className="text-emerald-400" />
                    Filtreler
                    {(selectedKurumlar.length > 0 ||
                      tipFilter !== "Hepsi" ||
                      hisseArama ||
                      minLot ||
                      maxLot ||
                      birincAliciKurum ||
                      ilk2AliciKurumlar.length > 0) && (
                      <span className="text-xs bg-emerald-950/40 text-emerald-400 border border-emerald-800/60 rounded-full px-2 py-0.5">
                        Aktif
                      </span>
                    )}
                  </span>
                  {showFilters ? <TbChevronUp /> : <TbChevronDown />}
                </button>

                <AnimatePresence>
                  {showFilters && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 space-y-4">
                        {/* Row 1: Tip + Hisse Arama */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm text-slate-400 mb-1.5">İşlem Tipi</label>
                            <div className="flex gap-2">
                              {(["Hepsi", "Alış", "Satış"] as const).map((t) => (
                                <button
                                  key={t}
                                  onClick={() => setTipFilter(t)}
                                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    tipFilter === t
                                      ? "bg-emerald-600 text-white"
                                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                                  }`}
                                >
                                  {t}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm text-slate-400 mb-1.5">
                              Hisse Ara
                            </label>
                            <input
                              type="text"
                              value={hisseArama}
                              onChange={(e) => setHisseArama(e.target.value)}
                              placeholder="Örn: THYAO, SISE..."
                              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                            />
                          </div>
                        </div>

                        {/* Row 2: Kurum Seçimi */}
                        <div>
                          <label className="block text-sm text-slate-400 mb-1.5">
                            Kurum Seçimi{" "}
                            {selectedKurumlar.length > 0 && (
                              <span className="text-emerald-400">({selectedKurumlar.length})</span>
                            )}
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={kurumSearch}
                              onChange={(e) => {
                                setKurumSearch(e.target.value);
                                setShowKurumDropdown(true);
                              }}
                              onFocus={() => setShowKurumDropdown(true)}
                              placeholder="Kurum ara ve seç..."
                              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                            />
                            {showKurumDropdown && filteredKurumlar.length > 0 && (
                              <div className="absolute z-20 mt-1 w-full max-h-48 overflow-y-auto rounded-lg bg-slate-800 border border-slate-700 shadow-xl">
                                {filteredKurumlar.map((k) => (
                                  <button
                                    key={k}
                                    onClick={() => {
                                      toggleKurum(k);
                                      setKurumSearch("");
                                    }}
                                    className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-700 transition-colors ${
                                      selectedKurumlar.includes(k)
                                        ? "text-emerald-400 bg-emerald-950/20"
                                        : "text-slate-300"
                                    }`}
                                  >
                                    {selectedKurumlar.includes(k) ? "✓ " : ""}
                                    {k}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                          {selectedKurumlar.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {selectedKurumlar.map((k) => (
                                <span
                                  key={k}
                                  className="inline-flex items-center gap-1 text-xs bg-emerald-950/40 text-emerald-400 border border-emerald-800/60 rounded-full px-2 py-0.5"
                                >
                                  {k}
                                  <button
                                    onClick={() => toggleKurum(k)}
                                    className="hover:text-white"
                                  >
                                    <TbX className="text-xs" />
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Row 3: Lot Aralığı */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm text-slate-400 mb-1.5">
                              Min Lot
                            </label>
                            <input
                              type="number"
                              value={minLot}
                              onChange={(e) => setMinLot(e.target.value)}
                              placeholder="0"
                              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-slate-400 mb-1.5">
                              Max Lot
                            </label>
                            <input
                              type="number"
                              value={maxLot}
                              onChange={(e) => setMaxLot(e.target.value)}
                              placeholder="∞"
                              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                            />
                          </div>
                        </div>

                        {/* Row 4: 1. Alıcı Kurum (dropdown) */}
                        <div>
                          <label className="block text-sm text-slate-400 mb-1.5">
                            1. Alıcı Kurum{" "}
                            {birincAliciKurum && (
                              <span className="text-sky-400">— {birincAliciKurum}</span>
                            )}
                          </label>
                          <div className="relative">
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={birincSearch}
                                onChange={(e) => {
                                  setBirincSearch(e.target.value);
                                  setShowBirincDropdown(true);
                                }}
                                onFocus={() => setShowBirincDropdown(true)}
                                placeholder="Kurum ara — hangi kurumun 1. alıcı olduğunu bul..."
                                className="flex-1 rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                              />
                              {birincAliciKurum && (
                                <button
                                  onClick={() => {
                                    setBirincAliciKurum("");
                                    setBirincSearch("");
                                  }}
                                  className="px-3 py-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                                >
                                  <TbX />
                                </button>
                              )}
                            </div>
                            {showBirincDropdown && filteredBirincKurumlar.length > 0 && (
                              <div className="absolute z-20 mt-1 w-full max-h-48 overflow-y-auto rounded-lg bg-slate-800 border border-slate-700 shadow-xl">
                                {filteredBirincKurumlar.map((k) => (
                                  <button
                                    key={k}
                                    onClick={() => {
                                      setBirincAliciKurum(k);
                                      setBirincSearch("");
                                      setShowBirincDropdown(false);
                                    }}
                                    className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-700 transition-colors ${
                                      birincAliciKurum === k
                                        ? "text-sky-400 bg-sky-950/20"
                                        : "text-slate-300"
                                    }`}
                                  >
                                    {birincAliciKurum === k ? "✓ " : ""}
                                    {k}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Row 5: İlk 2 Alıcı Birleşik (multi-select) */}
                        <div>
                          <label className="block text-sm text-slate-400 mb-1.5">
                            İlk 2 Alıcı Birleşik{" "}
                            {ilk2AliciKurumlar.length > 0 && (
                              <span className="text-violet-400">({ilk2AliciKurumlar.length} kurum seçili)</span>
                            )}
                          </label>
                          <p className="text-xs text-slate-500 mb-2">
                            2 kurum seçin — her ikisinin de ilk 2 alıcı olduğu hisseleri bulur
                          </p>
                          <div className="relative">
                            <input
                              type="text"
                              value={ilk2Search}
                              onChange={(e) => {
                                setIlk2Search(e.target.value);
                                setShowIlk2Dropdown(true);
                              }}
                              onFocus={() => setShowIlk2Dropdown(true)}
                              placeholder="Kurum ara ve seç (2 kurum)..."
                              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
                            />
                            {showIlk2Dropdown && filteredIlk2Kurumlar.length > 0 && (
                              <div className="absolute z-20 mt-1 w-full max-h-48 overflow-y-auto rounded-lg bg-slate-800 border border-slate-700 shadow-xl">
                                {filteredIlk2Kurumlar.map((k) => {
                                  const selected = ilk2AliciKurumlar.includes(k);
                                  const disabled = !selected && ilk2AliciKurumlar.length >= 2;
                                  return (
                                    <button
                                      key={k}
                                      disabled={disabled}
                                      onClick={() => {
                                        if (selected) {
                                          setIlk2AliciKurumlar((prev) => prev.filter((x) => x !== k));
                                        } else {
                                          setIlk2AliciKurumlar((prev) => [...prev, k]);
                                        }
                                        setIlk2Search("");
                                      }}
                                      className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                                        disabled
                                          ? "text-slate-600 cursor-not-allowed"
                                          : selected
                                          ? "text-violet-400 bg-violet-950/20 hover:bg-slate-700"
                                          : "text-slate-300 hover:bg-slate-700"
                                      }`}
                                    >
                                      {selected ? "✓ " : ""}
                                      {k}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                          {ilk2AliciKurumlar.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {ilk2AliciKurumlar.map((k) => (
                                <span
                                  key={k}
                                  className="inline-flex items-center gap-1 text-xs bg-violet-950/40 text-violet-400 border border-violet-800/60 rounded-full px-2 py-0.5"
                                >
                                  {k}
                                  <button
                                    onClick={() =>
                                      setIlk2AliciKurumlar((prev) => prev.filter((x) => x !== k))
                                    }
                                    className="hover:text-white"
                                  >
                                    <TbX className="text-xs" />
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Summary Info */}
                        {(oneCikanlar.length > 0 || birinciler.length > 0 || ilk2Birlesik.length > 0) && (
                          <div className="flex flex-wrap gap-3 pt-2 border-t border-slate-800">
                            {oneCikanlar.length > 0 && (
                              <span className="text-xs text-sky-400 bg-sky-950/40 border border-sky-800/60 rounded-full px-3 py-1">
                                Öne Çıkan: {oneCikanlar.length} hisse
                              </span>
                            )}
                            {birincAliciKurum && birinciler.length > 0 && (
                              <span className="text-xs text-sky-400 bg-sky-950/40 border border-sky-800/60 rounded-full px-3 py-1">
                                {birincAliciKurum} 1. Alıcı: {birinciler.length} hisse
                              </span>
                            )}
                            {ilk2AliciKurumlar.length >= 2 && (
                              <span className="text-xs text-violet-400 bg-violet-950/40 border border-violet-800/60 rounded-full px-3 py-1">
                                {ilk2AliciKurumlar.join(" & ")} İlk 2 Alıcı: {ilk2Birlesik.length} hisse
                              </span>
                            )}
                          </div>
                        )}

                        {/* Filter Actions */}
                        <div className="flex justify-end gap-3 pt-2">
                          <button
                            onClick={clearFilters}
                            className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
                          >
                            Filtreleri Temizle
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Download Button */}
              <motion.button
                onClick={handleDownloadPdf}
                disabled={pdfLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`
                  w-full flex items-center justify-center gap-3 rounded-xl py-4 text-lg font-semibold transition-all
                  ${
                    pdfLoading
                      ? "bg-emerald-800/50 text-emerald-300 cursor-wait"
                      : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30"
                  }
                `}
              >
                {pdfLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    PDF Oluşturuluyor...
                  </>
                ) : (
                  <>
                    <TbDownload className="text-xl" />
                    PDF Raporu İndir
                  </>
                )}
              </motion.button>

              {/* Info */}
              <p className="text-center text-xs text-slate-500">
                Verileriniz tarayıcınızda işlenir, sunucuya gönderilmez.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Click outside to close dropdowns */}
      {(showKurumDropdown || showBirincDropdown || showIlk2Dropdown) && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => {
            setShowKurumDropdown(false);
            setShowBirincDropdown(false);
            setShowIlk2Dropdown(false);
          }}
        />
      )}
    </main>
  );
}

function StatCard({
  label,
  value,
  color = "slate",
}: {
  label: string;
  value: number;
  color?: "slate" | "emerald";
}) {
  return (
    <div className="rounded-xl bg-[#0a1628] border border-slate-800 px-4 py-3">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p
        className={`text-xl font-bold ${
          color === "emerald" ? "text-emerald-400" : "text-slate-200"
        }`}
      >
        {value.toLocaleString("tr-TR")}
      </p>
    </div>
  );
}
