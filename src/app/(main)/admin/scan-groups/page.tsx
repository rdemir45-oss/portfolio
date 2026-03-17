"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  TbPlus,
  TbEdit,
  TbTrash,
  TbCheck,
  TbX,
  TbArrowUp,
  TbArrowDown,
  TbDatabaseImport,
  TbChartCandle,
  TbActivity,
  TbWaveSine,
  TbTriangle,
  TbChartBar,
  TbChartLine,
  TbFlame,
  TbArrowLeft,
  TbSearch,
} from "react-icons/tb";
import { HiTrendingDown, HiTrendingUp } from "react-icons/hi";
import type { DbScanGroup, DbScanGroupKey, ScanGroupColor } from "@/lib/supabase";

// ─── Tüm bilinen sinyal anahtarları kataloğu ──────────────────────────────────
const ALL_KNOWN_KEYS: { id: string; label: string; group: string }[] = [
  // Bullish Formasyonlar
  { id: "strong_up",        label: "Güçlü Yükseliş",              group: "Bullish Formasyonlar" },
  { id: "golden_cross",     label: "Altın Kesişim",               group: "Bullish Formasyonlar" },
  { id: "tobo_break",       label: "TOBO (Ters Baş-Omuz)",        group: "Bullish Formasyonlar" },
  { id: "channel_break",    label: "Kanal Kırılımı",              group: "Bullish Formasyonlar" },
  { id: "channel_break_up", label: "Kanal Kırılımı (Yukarı)",     group: "Bullish Formasyonlar" },
  { id: "triangle_break",   label: "Üçgen Kırılımı",              group: "Bullish Formasyonlar" },
  { id: "triangle_break_up",label: "Üçgen Kırılımı (Yukarı)",     group: "Bullish Formasyonlar" },
  { id: "trend_break",      label: "Trend Kırılımı",              group: "Bullish Formasyonlar" },
  { id: "trend_break_up",   label: "Trend Kırılımı (Yukarı)",     group: "Bullish Formasyonlar" },
  { id: "ikili_dip_break",  label: "İkili Dip (W)",               group: "Bullish Formasyonlar" },
  { id: "price_desc_break", label: "Düşen Trend Kırılımı",        group: "Bullish Formasyonlar" },
  { id: "hbreak",           label: "Yatay Direnç Kırılımı",       group: "Bullish Formasyonlar" },
  { id: "fibo_setup",       label: "Fibonacci Setup",             group: "Bullish Formasyonlar" },
  // RSI
  { id: "rsi_os",           label: "Aşırı Satım (< 30)",          group: "RSI Analizleri" },
  { id: "rsi_ob",           label: "Aşırı Alım (> 70)",           group: "RSI Analizleri" },
  { id: "rsi_asc_break",    label: "RSI Alt Trend Kırılım",       group: "RSI Analizleri" },
  { id: "rsi_tobo",         label: "RSI TOBO",                    group: "RSI Analizleri" },
  { id: "rsi_pos_div",      label: "RSI Pozitif Uyumsuzluk",      group: "RSI Analizleri" },
  { id: "rsi_desc_break",   label: "RSI Düşen Trend Kırılım",     group: "RSI Analizleri" },
  { id: "rsi_hdts",         label: "RSI Yüksek Düşük Tren Str.",  group: "RSI Analizleri" },
  // MACD
  { id: "macd_cross",       label: "MACD Kesişim Yukarı",         group: "MACD Analizleri" },
  { id: "macd_bear",        label: "MACD Bearish Kesişim",        group: "MACD Analizleri" },
  { id: "macd_bull",        label: "MACD Bullish Kesişim",        group: "MACD Analizleri" },
  { id: "macd_neg",         label: "MACD Negatif Diverjans",      group: "MACD Analizleri" },
  { id: "macd_pos",         label: "MACD Pozitif Diverjans",      group: "MACD Analizleri" },
  // Harmonik
  { id: "harmonic_long",    label: "Harmonik Long",               group: "Harmonik Formasyonlar" },
  { id: "harmonic_short",   label: "Harmonik Short",              group: "Harmonik Formasyonlar" },
  // Hacim
  { id: "vol_spike",        label: "Hacim Patlaması",             group: "Hacim & Göstergeler" },
  { id: "bb_squeeze",       label: "Bollinger Sıkışması",         group: "Hacim & Göstergeler" },
  { id: "vol_dry",          label: "Hacim Kuruması",              group: "Hacim & Göstergeler" },
  // Bearish
  { id: "death_cross",      label: "Ölüm Kesişimi",               group: "Satış Sinyalleri" },
  { id: "obo_break",        label: "OBO (Baş-Omuz)",              group: "Satış Sinyalleri" },
  { id: "ikili_tepe_break", label: "İkili Tepe (M)",              group: "Satış Sinyalleri" },
  // Bearish / RSI — geçiş döneminde bearish'ten rsi'ye taşınan
  { id: "rsi_desc_break",      label: "RSI Düşen Trend Kırılım",     group: "RSI Analizleri" },
  // Supertrend — gerçek API key adı supertrend_crossup olarak doğrulandı
  { id: "supertrend_crossup",    label: "SuperTrend Yukarı Kıran",       group: "Supertrend" },
  { id: "supertrend",            label: "Supertrend (Genel)",            group: "Supertrend" },
  { id: "supertrend_up",         label: "SuperTrend Yukarı",             group: "Supertrend" },
  { id: "supertrend_down",       label: "SuperTrend Aşağı Kıran",        group: "Supertrend" },
  { id: "supertrend_bull",       label: "Mevcut Alımda Olanlar",         group: "Supertrend" },
  { id: "supertrend_bear",       label: "Supertrend Satış Sinyali",      group: "Supertrend" },
  { id: "supertrend_bear_cross", label: "SuperTrend Aşağı Kesim (Özel)",group: "Supertrend" },
];

// ─── Icon kataloğu ────────────────────────────────────────────────────────────
const ICONS: { id: string; label: string; node: React.ReactNode }[] = [
  { id: "candle",       label: "Mum",           node: <TbChartCandle size={15} /> },
  { id: "activity",     label: "Aktivite",      node: <TbActivity size={15} /> },
  { id: "wave",         label: "Dalga",         node: <TbWaveSine size={15} /> },
  { id: "triangle",     label: "Üçgen",         node: <TbTriangle size={15} /> },
  { id: "bar",          label: "Bar",           node: <TbChartBar size={15} /> },
  { id: "chart",        label: "Çizgi",         node: <TbChartLine size={15} /> },
  { id: "flame",        label: "Alev",          node: <TbFlame size={15} /> },
  { id: "trending_up",  label: "Yukarı",        node: <HiTrendingUp size={15} /> },
  { id: "trending_down",label: "Aşağı",         node: <HiTrendingDown size={15} /> },
];

// ─── Renk kataloğu ────────────────────────────────────────────────────────────
const COLORS: { id: ScanGroupColor; dot: string; label: string }[] = [
  { id: "emerald", dot: "bg-emerald-500", label: "Yeşil"  },
  { id: "sky",     dot: "bg-sky-500",     label: "Mavi"   },
  { id: "violet",  dot: "bg-violet-500",  label: "Mor"    },
  { id: "amber",   dot: "bg-amber-500",   label: "Turuncu"},
  { id: "rose",    dot: "bg-rose-500",    label: "Kırmızı"},
];

const colorBorder: Record<ScanGroupColor, string> = {
  emerald: "border-emerald-700/60",
  sky:     "border-sky-700/60",
  violet:  "border-violet-700/60",
  amber:   "border-amber-700/60",
  rose:    "border-rose-700/60",
};
const colorText: Record<ScanGroupColor, string> = {
  emerald: "text-emerald-400",
  sky:     "text-sky-400",
  violet:  "text-violet-400",
  amber:   "text-amber-400",
  rose:    "text-rose-400",
};
const colorBg: Record<ScanGroupColor, string> = {
  emerald: "bg-emerald-950/25",
  sky:     "bg-sky-950/25",
  violet:  "bg-violet-950/25",
  amber:   "bg-amber-950/25",
  rose:    "bg-rose-950/25",
};

// ─── Form tipi ────────────────────────────────────────────────────────────────
type GroupForm = {
  id: string;
  label: string;
  description: string;
  emoji: string;
  icon: string;
  color: ScanGroupColor;
  display_order: number;
  is_bull: boolean;
  keys: DbScanGroupKey[];
};

const emptyForm = (order = 0): GroupForm => ({
  id: "",
  label: "",
  description: "",
  emoji: "📊",
  icon: "chart",
  color: "emerald",
  display_order: order,
  is_bull: true,
  keys: [],
});

function groupToForm(g: DbScanGroup): GroupForm {
  return {
    id: g.id,
    label: g.label,
    description: g.description,
    emoji: g.emoji,
    icon: g.icon,
    color: g.color,
    display_order: g.display_order,
    is_bull: g.is_bull,
    keys: g.keys ? [...g.keys] : [],
  };
}

// ─── Sinyal Anahtar Seçici ────────────────────────────────────────────────────
function KeyPicker({
  currentKeys,
  onAdd,
  onClose,
}: {
  currentKeys: DbScanGroupKey[];
  onAdd: (k: DbScanGroupKey) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const currentIds = new Set(currentKeys.map((k) => k.id));

  const filtered = ALL_KNOWN_KEYS.filter(
    (k) =>
      !currentIds.has(k.id) &&
      (search === "" ||
        k.id.includes(search.toLowerCase()) ||
        k.label.toLowerCase().includes(search.toLowerCase()) ||
        k.group.toLowerCase().includes(search.toLowerCase()))
  );

  // Grup bazında grupla
  const byGroup = filtered.reduce<Record<string, typeof filtered>>((acc, k) => {
    (acc[k.group] ??= []).push(k);
    return acc;
  }, {});

  return (
    <div className="border border-emerald-800/50 bg-[#060f1e] rounded-xl overflow-hidden">
      {/* Arama */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-800">
        <TbSearch size={13} className="text-slate-600 shrink-0" />
        <input
          autoFocus
          type="text"
          placeholder="İsim veya ID ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent text-xs text-white placeholder-slate-600 focus:outline-none"
        />
        <button onClick={onClose} className="text-slate-600 hover:text-slate-300 transition-colors">
          <TbX size={13} />
        </button>
      </div>

      {/* Liste */}
      <div className="max-h-60 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="text-xs text-slate-600 italic text-center py-4">
            {search ? "Eşleşen tarama bulunamadı" : "Tüm taramalar zaten eklendi"}
          </p>
        ) : (
          Object.entries(byGroup).map(([grp, keys]) => (
            <div key={grp}>
              <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-3 pt-2.5 pb-1">{grp}</p>
              {keys.map((k) => (
                <button
                  key={k.id}
                  onClick={() => { onAdd({ id: k.id, label: k.label }); }}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-emerald-950/30 text-left transition-colors group"
                >
                  <TbPlus size={11} className="text-emerald-700 group-hover:text-emerald-400 shrink-0 transition-colors" />
                  <span className="text-xs font-mono text-slate-500 group-hover:text-slate-300 transition-colors w-36 shrink-0">{k.id}</span>
                  <span className="text-xs text-slate-400 group-hover:text-white transition-colors truncate">{k.label}</span>
                </button>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Form bileşeni ────────────────────────────────────────────────────────────
function GroupFormPanel({
  form,
  onChange,
  onSave,
  onCancel,
  saving,
  isNew,
}: {
  form: GroupForm;
  onChange: (f: GroupForm) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  isNew: boolean;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);

  function setField<K extends keyof GroupForm>(k: K, v: GroupForm[K]) {
    onChange({ ...form, [k]: v });
  }

  function addKeyFromPicker(k: DbScanGroupKey) {
    onChange({ ...form, keys: [...form.keys, k] });
  }

  function addManualKey() {
    onChange({ ...form, keys: [...form.keys, { id: "", label: "" }] });
  }

  function updateKey(i: number, field: "id" | "label", v: string) {
    const next = [...form.keys];
    next[i] = { ...next[i], [field]: v };
    onChange({ ...form, keys: next });
  }

  function removeKey(i: number) {
    onChange({ ...form, keys: form.keys.filter((_, idx) => idx !== i) });
  }

  function moveKey(i: number, dir: -1 | 1) {
    const next = [...form.keys];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    onChange({ ...form, keys: [...next] }); // yeni referans → React yeniden render
  }

  const inputCls = "w-full bg-[#060f1e] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-600 transition-colors";

  return (
    <div className="bg-[#0a1628] border border-slate-700 rounded-2xl p-5 space-y-5">
      {/* Kimlik & Temel Bilgiler */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            Grup ID {isNew && <span className="text-slate-600">(değiştirilemez)</span>}
          </label>
          <input
            disabled={!isNew}
            type="text"
            placeholder="ornek_grup"
            value={form.id}
            onChange={(e) => setField("id", e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
            className={inputCls + (isNew ? "" : " opacity-50 cursor-not-allowed")}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Grup Adı</label>
          <input type="text" placeholder="RSI Analizleri" value={form.label}
            onChange={(e) => setField("label", e.target.value)} className={inputCls} />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Açıklama</label>
          <input type="text" placeholder="Kısa açıklama" value={form.description}
            onChange={(e) => setField("description", e.target.value)} className={inputCls} />
        </div>
      </div>

      {/* Emoji, ikon, renk, sıra */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Emoji</label>
          <input type="text" value={form.emoji}
            onChange={(e) => setField("emoji", e.target.value)}
            className={inputCls} maxLength={4} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Sıra</label>
          <input type="number" value={form.display_order}
            onChange={(e) => setField("display_order", Number(e.target.value))}
            className={inputCls} />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Yön</label>
          <div className="flex gap-2">
            <button
              onClick={() => setField("is_bull", true)}
              className={`flex-1 py-2 rounded-xl border text-xs font-semibold transition-colors ${
                form.is_bull
                  ? "bg-emerald-950/50 border-emerald-700 text-emerald-400"
                  : "border-slate-700 text-slate-500 hover:border-slate-600"
              }`}
            >
              📈 Bullish
            </button>
            <button
              onClick={() => setField("is_bull", false)}
              className={`flex-1 py-2 rounded-xl border text-xs font-semibold transition-colors ${
                !form.is_bull
                  ? "bg-rose-950/50 border-rose-700 text-rose-400"
                  : "border-slate-700 text-slate-500 hover:border-slate-600"
              }`}
            >
              📉 Bearish
            </button>
          </div>
        </div>
      </div>

      {/* Renk seçici */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Renk</label>
        <div className="flex gap-2 flex-wrap">
          {COLORS.map((c) => (
            <button
              key={c.id}
              onClick={() => setField("color", c.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors ${
                form.color === c.id
                  ? `${colorBorder[c.id]} ${colorText[c.id]} ${colorBg[c.id]}`
                  : "border-slate-700 text-slate-500 hover:border-slate-600"
              }`}
            >
              <span className={`w-3 h-3 rounded-full ${c.dot}`} />
              {c.label}
              {form.color === c.id && <TbCheck size={11} />}
            </button>
          ))}
        </div>
      </div>

      {/* İkon seçici */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">İkon</label>
        <div className="flex gap-2 flex-wrap">
          {ICONS.map((ic) => (
            <button
              key={ic.id}
              onClick={() => setField("icon", ic.id)}
              title={ic.label}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs transition-colors ${
                form.icon === ic.id
                  ? "border-emerald-700 text-emerald-400 bg-emerald-950/30"
                  : "border-slate-700 text-slate-500 hover:border-slate-600 hover:text-slate-300"
              }`}
            >
              {ic.node}
              <span>{ic.label}</span>
              {form.icon === ic.id && <TbCheck size={10} />}
            </button>
          ))}
        </div>
      </div>

      {/* Sinyal anahtarları */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            Sinyal Anahtarları ({form.keys.length})
          </label>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPickerOpen((v) => !v)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs transition-colors ${
                pickerOpen
                  ? "bg-emerald-900/40 border-emerald-700 text-emerald-300"
                  : "bg-emerald-950/40 border-emerald-800/60 text-emerald-400 hover:bg-emerald-900/40"
              }`}
            >
              <TbPlus size={12} />
              Tarama Seç
            </button>
            <button
              onClick={addManualKey}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-700 text-slate-500 text-xs hover:text-slate-300 hover:border-slate-600 transition-colors"
              title="Listede olmayan özel anahtar ekle"
            >
              Manuel
            </button>
          </div>
        </div>

        {/* Picker */}
        {pickerOpen && (
          <KeyPicker
            currentKeys={form.keys}
            onAdd={(k) => { addKeyFromPicker(k); }}
            onClose={() => setPickerOpen(false)}
          />
        )}

        {form.keys.length === 0 && !pickerOpen ? (
          <p className="text-xs text-slate-600 italic py-2">
            Henüz sinyal eklenmedi. &quot;Tarama Seç&quot;e tıklayın.
          </p>
        ) : (
          <div className="space-y-1.5 overflow-y-auto pr-1" style={{ maxHeight: "400px" }}>
            {form.keys.map((k, i) => (
              <div key={k.id || `new-${i}`} className="flex items-center gap-2 py-0.5">
                <span className="text-slate-700 shrink-0 select-none text-xs w-4 text-right">{i + 1}</span>
                <input
                  type="text"
                  placeholder="anahtar_id"
                  value={k.id}
                  onChange={(e) => updateKey(i, "id", e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                  className="w-36 bg-[#060f1e] border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-emerald-700 transition-colors"
                />
                <input
                  type="text"
                  placeholder="Türkçe Etiketi"
                  value={k.label}
                  onChange={(e) => updateKey(i, "label", e.target.value)}
                  className="flex-1 bg-[#060f1e] border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-700 transition-colors"
                />
                <div className="flex gap-0.5">
                  <button
                    onClick={() => moveKey(i, -1)}
                    disabled={i === 0}
                    className="p-1 rounded text-slate-600 hover:text-emerald-400 hover:bg-emerald-950/30 disabled:opacity-20 transition-colors"
                    title="Yukarı taşı"
                  >
                    <TbArrowUp size={13} />
                  </button>
                  <button
                    onClick={() => moveKey(i, 1)}
                    disabled={i === form.keys.length - 1}
                    className="p-1 rounded text-slate-600 hover:text-emerald-400 hover:bg-emerald-950/30 disabled:opacity-20 transition-colors"
                    title="Aşağı taşı"
                  >
                    <TbArrowDown size={13} />
                  </button>
                  <button
                    onClick={() => removeKey(i)}
                    className="p-1 rounded text-slate-600 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                    title="Sil"
                  >
                    <TbX size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Kaydet / İptal */}
      <div className="flex items-center gap-3 pt-2 border-t border-slate-800">
        <button
          onClick={onSave}
          disabled={saving || !form.label || (isNew && !form.id)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors disabled:opacity-50"
        >
          <TbCheck size={15} />
          {saving ? "Kaydediliyor..." : isNew ? "Grup Oluştur" : "Değişiklikleri Kaydet"}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white text-sm transition-colors"
        >
          İptal
        </button>
      </div>
    </div>
  );
}

// ─── Group kart bileşeni ──────────────────────────────────────────────────────
function GroupCard({
  group,
  onEdit,
  onDelete,
  onMove,
  isFirst,
  isLast,
  deleting,
}: {
  group: DbScanGroup;
  onEdit: () => void;
  onDelete: () => void;
  onMove: (dir: -1 | 1) => void;
  isFirst: boolean;
  isLast: boolean;
  deleting: boolean;
}) {
  const c = group.color as ScanGroupColor;
  const iconObj = ICONS.find((i) => i.id === group.icon);
  return (
    <div className={`rounded-2xl border overflow-hidden ${colorBorder[c]}`}>
      <div className={`flex items-center gap-4 px-5 py-4 ${colorBg[c]}`}>
        {/* İkon + emoji */}
        <div className={`flex items-center justify-center w-9 h-9 rounded-xl border ${colorBorder[c]} ${colorBg[c]} ${colorText[c]} shrink-0`}>
          {iconObj ? iconObj.node : <TbChartLine size={15} />}
        </div>

        {/* Bilgi */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base leading-none">{group.emoji}</span>
            <p className={`text-sm font-bold ${colorText[c]}`}>{group.label}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full border ${colorBorder[c]} ${colorText[c]} opacity-70`}>
              {group.keys?.length ?? 0} sinyal
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              group.is_bull ? "bg-emerald-950/50 text-emerald-500" : "bg-rose-950/50 text-rose-500"
            }`}>
              {group.is_bull ? "Bullish" : "Bearish"}
            </span>
          </div>
          {group.description && (
            <p className="text-xs text-slate-500 mt-0.5 truncate">{group.description}</p>
          )}
        </div>

        {/* Aksiyonlar */}
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => onMove(-1)} disabled={isFirst}
            className="p-1.5 text-slate-600 hover:text-slate-300 disabled:opacity-20 transition-colors" title="Yukarı taşı">
            <TbArrowUp size={14} />
          </button>
          <button onClick={() => onMove(1)} disabled={isLast}
            className="p-1.5 text-slate-600 hover:text-slate-300 disabled:opacity-20 transition-colors" title="Aşağı taşı">
            <TbArrowDown size={14} />
          </button>
          <button onClick={onEdit}
            className="p-1.5 text-slate-500 hover:text-emerald-400 hover:bg-emerald-950/40 rounded-lg transition-colors">
            <TbEdit size={15} />
          </button>
          <button onClick={onDelete} disabled={deleting}
            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors disabled:opacity-50">
            <TbTrash size={15} />
          </button>
        </div>
      </div>

      {/* Anahtar listesi */}
      {group.keys && group.keys.length > 0 && (
        <div className="px-5 py-2.5 bg-slate-900/30 border-t border-slate-800/40">
          <div className="flex flex-wrap gap-1.5">
            {group.keys.map((k) => (
              <span key={k.id}
                className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-lg border border-slate-700/60 text-slate-400 bg-slate-800/40">
                <span className="text-slate-600 font-normal">{k.id}</span>
                {k.label && <span className="text-slate-500">· {k.label}</span>}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Ana sayfa ────────────────────────────────────────────────────────────────
export default function ScanGroupsPage() {
  const [groups, setGroups] = useState<DbScanGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<GroupForm | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [newForm, setNewForm] = useState<GroupForm>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const router = useRouter();

  async function fetchGroups() {
    setLoading(true);
    const res = await fetch("/api/admin/scan-groups");
    if (res.ok) setGroups(await res.json());
    setLoading(false);
  }

  useEffect(() => { fetchGroups(); }, []);

  function showMsg(type: "ok" | "err", text: string) {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  }

  async function handleSeed() {
    if (!confirm("Varsayılan 6 grup Supabase'e yüklensin mi? Mevcut grupların üzerine yazılmaz (upsert).")) return;
    setSeeding(true);
    const res = await fetch("/api/admin/scan-groups?seed=1", { method: "POST" });
    const d = await res.json();
    if (res.ok) {
      showMsg("ok", `${d.count} grup başarıyla yüklendi.`);
      fetchGroups();
    } else {
      showMsg("err", d.error ?? "Hata oluştu.");
    }
    setSeeding(false);
  }

  function startEdit(g: DbScanGroup) {
    setEditingId(g.id);
    setEditForm(groupToForm(g));
    setNewOpen(false);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm(null);
  }

  async function saveEdit() {
    if (!editForm || !editingId) return;
    setSaving(true);
    const res = await fetch(`/api/admin/scan-groups?id=${editingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    const d = await res.json();
    if (res.ok) {
      showMsg("ok", "Grup güncellendi.");
      cancelEdit();
      fetchGroups();
    } else {
      showMsg("err", d.error ?? "Güncelleme başarısız.");
    }
    setSaving(false);
  }

  function startNew() {
    setNewForm(emptyForm(groups.length));
    setNewOpen(true);
    setEditingId(null);
    setEditForm(null);
  }

  async function saveNew() {
    setSaving(true);
    const res = await fetch("/api/admin/scan-groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newForm),
    });
    const d = await res.json();
    if (res.ok) {
      showMsg("ok", "Yeni grup oluşturuldu.");
      setNewOpen(false);
      setNewForm(emptyForm());
      fetchGroups();
    } else {
      showMsg("err", d.error ?? "Oluşturma başarısız.");
    }
    setSaving(false);
  }

  async function handleDelete(id: string, label: string) {
    if (!confirm(`"${label}" grubu silinsin mi?`)) return;
    setDeletingId(id);
    const res = await fetch(`/api/admin/scan-groups?id=${id}`, { method: "DELETE" });
    const d = await res.json();
    if (res.ok) {
      showMsg("ok", "Grup silindi.");
      fetchGroups();
    } else {
      showMsg("err", d.error ?? "Silme başarısız.");
    }
    setDeletingId(null);
  }

  async function handleMove(group: DbScanGroup, dir: -1 | 1) {
    const sorted = [...groups].sort((a, b) => a.display_order - b.display_order);
    const idx = sorted.findIndex((g) => g.id === group.id);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const other = sorted[swapIdx];

    await Promise.all([
      fetch(`/api/admin/scan-groups?id=${group.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ display_order: other.display_order }),
      }),
      fetch(`/api/admin/scan-groups?id=${other.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ display_order: group.display_order }),
      }),
    ]);
    fetchGroups();
  }

  const sortedGroups = [...groups].sort((a, b) => a.display_order - b.display_order);

  return (
    <main className="min-h-screen px-4 sm:px-8 pt-10 pb-20">
      <div className="max-w-4xl mx-auto">
        {/* Başlık */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/dashboard"
              className="p-2 rounded-xl border border-slate-700 text-slate-500 hover:text-white hover:border-slate-600 transition-colors"
            >
              <TbArrowLeft size={16} />
            </Link>
            <div>
              <h1 className="text-2xl font-black text-white">Tarama Grupları</h1>
              <p className="text-slate-400 text-sm mt-0.5">
                Hisse tarama sinyallerinin nasıl gruplandığını buradan yönetin.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {groups.length === 0 && !loading && (
              <button
                onClick={handleSeed}
                disabled={seeding}
                className="flex items-center gap-2 px-4 py-2 border border-slate-700 hover:border-amber-700 text-slate-400 hover:text-amber-400 text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
              >
                <TbDatabaseImport size={15} />
                {seeding ? "Yükleniyor..." : "Varsayılanları Yükle"}
              </button>
            )}
            {groups.length > 0 && (
              <button
                onClick={handleSeed}
                disabled={seeding}
                className="flex items-center gap-2 px-4 py-2 border border-slate-700 hover:border-amber-700 text-slate-400 hover:text-amber-400 text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
                title="Mevcut grupları silmeden varsayılanları tekrar yükler (upsert)"
              >
                <TbDatabaseImport size={15} />
                {seeding ? "Yükleniyor..." : "Varsayılanları Sıfırla"}
              </button>
            )}
            <button
              onClick={startNew}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              <TbPlus size={15} />
              Yeni Grup
            </button>
          </div>
        </div>

        {/* Durum mesajı */}
        {msg && (
          <div className={`mb-4 px-4 py-2.5 rounded-xl border text-sm font-semibold ${
            msg.type === "ok"
              ? "bg-emerald-950/40 border-emerald-800 text-emerald-400"
              : "bg-rose-950/40 border-rose-800 text-rose-400"
          }`}>
            {msg.type === "ok" ? "✅ " : "❌ "}{msg.text}
          </div>
        )}

        {/* Supabase SQL notu */}
        <div className="mb-6 rounded-xl border border-amber-900/50 bg-amber-950/20 p-4">
          <p className="text-xs font-semibold text-amber-400 mb-1">⚠️ İlk Kurulum</p>
          <p className="text-xs text-amber-700 leading-relaxed">
            Bu özellik için Supabase&apos;de{" "}
            <code className="font-mono bg-amber-950/50 px-1 py-0.5 rounded text-amber-400">scan_groups</code>{" "}
            tablosunun oluşturulması gerekir. Eğer tablo yoksa gruplar kaydedilmez.
            Tablo SQL&apos;ini{" "}
            <button
              onClick={() => router.push("/admin/scan-groups/setup")}
              className="underline hover:text-amber-400 transition-colors"
            >
              kurulum sayfasında
            </button>{" "}
            bulabilirsiniz.
          </p>
          <details className="mt-2">
            <summary className="text-xs text-amber-600 cursor-pointer hover:text-amber-400 transition-colors">SQL&apos;i göster</summary>
            <pre className="mt-2 text-[11px] font-mono text-amber-700 bg-amber-950/30 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap">{`CREATE TABLE IF NOT EXISTS public.scan_groups (
  id text PRIMARY KEY,
  label text NOT NULL,
  description text NOT NULL DEFAULT '',
  emoji text NOT NULL DEFAULT '📊',
  icon text NOT NULL DEFAULT 'chart',
  color text NOT NULL DEFAULT 'emerald',
  keys jsonb NOT NULL DEFAULT '[]',
  display_order integer NOT NULL DEFAULT 0,
  is_bull boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);`}</pre>
          </details>
        </div>

        {/* Yükleniyor */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 rounded-2xl bg-slate-800/40 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Yeni grup formu */}
            {newOpen && (
              <div className="mb-2">
                <p className="text-xs font-semibold text-emerald-400 uppercase tracking-widest mb-2">Yeni Grup</p>
                <GroupFormPanel
                  form={newForm}
                  onChange={setNewForm}
                  onSave={saveNew}
                  onCancel={() => setNewOpen(false)}
                  saving={saving}
                  isNew
                />
              </div>
            )}

            {/* Boş durum */}
            {sortedGroups.length === 0 && !newOpen && (
              <div className="text-center py-16 border border-dashed border-slate-700 rounded-2xl">
                <p className="text-slate-500 mb-3">Henüz grup yok.</p>
                <p className="text-slate-600 text-sm mb-4">
                  &quot;Varsayılanları Yükle&quot; ile 6 hazır grup ekleyebilirsiniz.
                </p>
                <button
                  onClick={startNew}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-semibold rounded-xl transition-colors"
                >
                  <TbPlus size={14} />
                  Grup Ekle
                </button>
              </div>
            )}

            {/* Grup listesi */}
            {sortedGroups.map((g, i) => (
              <div key={g.id}>
                {editingId === g.id && editForm ? (
                  <div>
                    <p className="text-xs font-semibold text-emerald-400 uppercase tracking-widest mb-2">
                      Düzenleniyor: {g.label}
                    </p>
                    <GroupFormPanel
                      form={editForm}
                      onChange={setEditForm}
                      onSave={saveEdit}
                      onCancel={cancelEdit}
                      saving={saving}
                      isNew={false}
                    />
                  </div>
                ) : (
                  <GroupCard
                    group={g}
                    onEdit={() => startEdit(g)}
                    onDelete={() => handleDelete(g.id, g.label)}
                    onMove={(dir) => handleMove(g, dir)}
                    isFirst={i === 0}
                    isLast={i === sortedGroups.length - 1}
                    deleting={deletingId === g.id}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
