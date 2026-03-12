"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  TbPlus, TbTrash, TbEdit, TbPlayerPlay, TbCheck, TbX,
  TbChevronDown, TbChevronUp, TbExternalLink, TbAlertCircle,
  TbLoader2, TbSearch,
} from "react-icons/tb";
import type { DbCustomScan, ScanRule, ScanRuleGroup, RuleIndicator, RuleCondition } from "@/lib/supabase";
import { useRouter } from "next/navigation";

// ── Seçenek listeleri ─────────────────────────────────────────────────────────

const INDICATOR_OPTIONS: { value: RuleIndicator; label: string }[] = [
  { value: "RSI",          label: "RSI — Göreceli Güç Endeksi" },
  { value: "EMA",          label: "EMA — Üssel Hareketli Ortalama" },
  { value: "SMA",          label: "SMA — Basit Hareketli Ortalama" },
  { value: "MACD",         label: "MACD — Momentum" },
  { value: "VOLUME",       label: "Hacim" },
  { value: "PRICE_CHANGE", label: "Fiyat Değişimi (%)" },
  { value: "BOLLINGER",    label: "Bollinger Bandı" },
  { value: "STOCH",        label: "Stokastik Osilatör" },
];

const CONDITION_OPTIONS: Record<RuleIndicator, { value: RuleCondition; label: string }[]> = {
  RSI:          [
    { value: "lt",  label: "küçüktür (<)" },
    { value: "gt",  label: "büyüktür (>)" },
    { value: "lte", label: "küçük eşit (≤)" },
    { value: "gte", label: "büyük eşit (≥)" },
  ],
  EMA:          [
    { value: "price_above",  label: "Fiyat üzerinde" },
    { value: "price_below",  label: "Fiyat altında" },
    { value: "cross_above",  label: "Kısa periyot yukarı kesiyor" },
    { value: "cross_below",  label: "Kısa periyot aşağı kesiyor" },
  ],
  SMA:          [
    { value: "price_above", label: "Fiyat üzerinde" },
    { value: "price_below", label: "Fiyat altında" },
  ],
  MACD:         [
    { value: "cross_above", label: "MACD yukarı kesiyor (alım)" },
    { value: "cross_below", label: "MACD aşağı kesiyor (satım)" },
  ],
  VOLUME:       [
    { value: "spike", label: "Hacim patlaması (ortalamadan X kat fazla)" },
    { value: "gt",    label: "Hacim belirli değerden büyük" },
  ],
  PRICE_CHANGE: [
    { value: "gt", label: "Yüzde artış büyüktür (%)" },
    { value: "lt", label: "Yüzde düşüş küçüktür (%)" },
  ],
  BOLLINGER:    [
    { value: "squeeze",     label: "Bant sıkışması" },
    { value: "price_above", label: "Fiyat üst bandın üzerinde" },
    { value: "price_below", label: "Fiyat alt bandın altında" },
  ],
  STOCH:        [
    { value: "lt", label: "Aşırı satım (< 20)" },
    { value: "gt", label: "Aşırı alım (> 80)" },
  ],
};

const NEEDS_PERIOD   = new Set<RuleIndicator>(["RSI","EMA","SMA","STOCH","VOLUME"]);
const NEEDS_PERIOD2  = new Set<RuleCondition>(["cross_above","cross_below"]);
const NEEDS_VALUE    = new Set<RuleIndicator>(["RSI","PRICE_CHANGE","VOLUME","STOCH"]);
const NEEDS_MULT     = new Set<RuleCondition>(["spike"]);

// ── Boş kural factory ────────────────────────────────────────────────────────
function emptyRule(): ScanRule {
  return { indicator: "RSI", condition: "lt", period: 14, value: 30 };
}

// ── Kural satırı bileşeni ─────────────────────────────────────────────────────
function RuleRow({
  rule, index, onChange, onRemove, canRemove,
}: {
  rule: ScanRule;
  index: number;
  onChange: (r: ScanRule) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const conditions = CONDITION_OPTIONS[rule.indicator] ?? [];
  const needsPeriod  = NEEDS_PERIOD.has(rule.indicator);
  const needsPeriod2 = NEEDS_PERIOD2.has(rule.condition);
  const needsValue   = NEEDS_VALUE.has(rule.indicator) && !NEEDS_MULT.has(rule.condition);
  const needsMult    = NEEDS_MULT.has(rule.condition);

  const changeIndicator = (ind: RuleIndicator) => {
    const conds = CONDITION_OPTIONS[ind];
    onChange({ indicator: ind, condition: conds[0].value, period: 14, value: ind === "PRICE_CHANGE" ? 3 : 30 });
  };

  return (
    <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg bg-white/5 border border-white/10">
      <span className="text-xs text-slate-500 font-mono w-5">{index + 1}</span>

      {/* İndikatör seç */}
      <select
        value={rule.indicator}
        onChange={(e) => changeIndicator(e.target.value as RuleIndicator)}
        className="flex-1 min-w-[180px] bg-[#0f1420] border border-white/15 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
      >
        {INDICATOR_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      {/* Periyot */}
      {needsPeriod && (
        <div className="flex items-center gap-1">
          <span className="text-xs text-slate-500">Periyot</span>
          <input
            type="number" min={1} max={200}
            value={rule.period ?? 14}
            onChange={(e) => onChange({ ...rule, period: Number(e.target.value) })}
            className="w-16 bg-[#0f1420] border border-white/15 rounded-lg px-2 py-1.5 text-sm text-slate-200 text-center focus:outline-none focus:border-blue-500"
          />
        </div>
      )}

      {/* Koşul seç */}
      <select
        value={rule.condition}
        onChange={(e) => onChange({ ...rule, condition: e.target.value as RuleCondition })}
        className="flex-1 min-w-[180px] bg-[#0f1420] border border-white/15 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
      >
        {conditions.map((c) => (
          <option key={c.value} value={c.value}>{c.label}</option>
        ))}
      </select>

      {/* İkinci periyot (EMA cross) */}
      {needsPeriod2 && (
        <div className="flex items-center gap-1">
          <span className="text-xs text-slate-500">2. Periyot</span>
          <input
            type="number" min={1} max={200}
            value={rule.period2 ?? 50}
            onChange={(e) => onChange({ ...rule, period2: Number(e.target.value) })}
            className="w-16 bg-[#0f1420] border border-white/15 rounded-lg px-2 py-1.5 text-sm text-slate-200 text-center focus:outline-none focus:border-blue-500"
          />
        </div>
      )}

      {/* Değer */}
      {needsValue && (
        <div className="flex items-center gap-1">
          <span className="text-xs text-slate-500">Değer</span>
          <input
            type="number"
            value={rule.value ?? 30}
            onChange={(e) => onChange({ ...rule, value: Number(e.target.value) })}
            className="w-20 bg-[#0f1420] border border-white/15 rounded-lg px-2 py-1.5 text-sm text-slate-200 text-center focus:outline-none focus:border-blue-500"
          />
        </div>
      )}

      {/* Çarpan (volume spike) */}
      {needsMult && (
        <div className="flex items-center gap-1">
          <span className="text-xs text-slate-500">Kat</span>
          <input
            type="number" min={1} max={20} step={0.5}
            value={rule.multiplier ?? 2}
            onChange={(e) => onChange({ ...rule, multiplier: Number(e.target.value) })}
            className="w-16 bg-[#0f1420] border border-white/15 rounded-lg px-2 py-1.5 text-sm text-slate-200 text-center focus:outline-none focus:border-blue-500"
          />
        </div>
      )}

      {canRemove && (
        <button onClick={onRemove} className="p-1.5 text-slate-600 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors">
          <TbX size={15} />
        </button>
      )}
    </div>
  );
}

// ── Modal: Tarama oluştur / düzenle ──────────────────────────────────────────
function ScanModal({
  scan, onClose, onSaved,
}: {
  scan: DbCustomScan | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName]     = useState(scan?.name ?? "");
  const [desc, setDesc]     = useState(scan?.description ?? "");
  const [operator, setOp]   = useState<"AND" | "OR">(scan?.rules.operator ?? "AND");
  const [rules, setRules]   = useState<ScanRule[]>(scan?.rules.rules ?? [emptyRule()]);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  const addRule = () => {
    if (rules.length >= 10) return;
    setRules([...rules, emptyRule()]);
  };

  const updateRule = (i: number, r: ScanRule) => {
    const next = [...rules]; next[i] = r; setRules(next);
  };

  const removeRule = (i: number) => setRules(rules.filter((_, idx) => idx !== i));

  const save = async () => {
    if (!name.trim()) { setError("Tarama adı gerekli."); return; }
    setSaving(true); setError(null);
    const ruleGroup: ScanRuleGroup = { operator, rules };
    const body = { name: name.trim(), description: desc.trim() || null, rules: ruleGroup };

    const url    = scan ? `/api/user/custom-scans/${scan.id}` : "/api/user/custom-scans";
    const method = scan ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) { setError(json.error ?? "Hata oluştu."); return; }
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={onClose}>
      <div
        className="w-full max-w-2xl bg-[#0d1117] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="text-base font-bold text-white">
            {scan ? "Taramayı Düzenle" : "Yeni Özel Tarama"}
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <TbX size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Ad */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Tarama Adı</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Örn: RSI Aşırı Satım + EMA50 Üzeri"
              maxLength={60}
              className="w-full bg-[#0f1420] border border-white/15 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Açıklama */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Açıklama (isteğe bağlı)</label>
            <input
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Bu tarama ne için?"
              maxLength={200}
              className="w-full bg-[#0f1420] border border-white/15 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Operatör */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2">Kurallar arası bağlantı</label>
            <div className="flex gap-3">
              {(["AND", "OR"] as const).map((op) => (
                <button
                  key={op}
                  onClick={() => setOp(op)}
                  className={`px-5 py-1.5 rounded-lg text-sm font-bold border transition-colors ${
                    operator === op
                      ? "bg-blue-600 border-blue-500 text-white"
                      : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
                  }`}
                >
                  {op === "AND" ? "VE (AND) — Tümü sağlanmalı" : "VEYA (OR) — Biri yeterli"}
                </button>
              ))}
            </div>
          </div>

          {/* Kurallar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-400">Kurallar ({rules.length}/10)</label>
            </div>
            <div className="space-y-2">
              {rules.map((rule, i) => (
                <RuleRow
                  key={i} rule={rule} index={i}
                  onChange={(r) => updateRule(i, r)}
                  onRemove={() => removeRule(i)}
                  canRemove={rules.length > 1}
                />
              ))}
            </div>
            {rules.length < 10 && (
              <button
                onClick={addRule}
                className="mt-3 flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                <TbPlus size={15} /> Kural Ekle
              </button>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              <TbAlertCircle size={16} /> {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-white/10 bg-white/[0.02]">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white border border-white/10 hover:bg-white/5 transition-colors">
            İptal
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 transition-colors"
          >
            {saving ? <TbLoader2 size={15} className="animate-spin" /> : <TbCheck size={15} />}
            {scan ? "Güncelle" : "Oluştur"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Sonuç paneli ─────────────────────────────────────────────────────────────
function ResultPanel({ scanId }: { scanId: string }) {
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState<{ tickers: string[]; ranAt: string } | null>(null);
  const [error, setError]       = useState<string | null>(null);

  const run = async () => {
    setLoading(true); setError(null); setResult(null);
    const res  = await fetch(`/api/user/custom-scans/${scanId}/run`, { method: "POST" });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) { setError(json.error ?? "Hata oluştu."); return; }
    setResult(json);
  };

  return (
    <div className="mt-3 pt-3 border-t border-white/5">
      <button
        onClick={run}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-emerald-600/90 hover:bg-emerald-500 text-white disabled:opacity-50 transition-colors"
      >
        {loading
          ? <><TbLoader2 size={14} className="animate-spin" /> Taranıyor...</>
          : <><TbPlayerPlay size={14} /> Taramayı Çalıştır</>
        }
      </button>

      {error && (
        <p className="mt-2 text-xs text-red-400 flex items-center gap-1">
          <TbAlertCircle size={13} /> {error}
        </p>
      )}

      {result && (
        <div className="mt-3">
          <p className="text-xs text-slate-500 mb-2">
            {result.tickers.length === 0
              ? "Koşulları sağlayan hisse bulunamadı."
              : `${result.tickers.length} hisse bulundu`}
          </p>
          {result.tickers.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {result.tickers.map((ticker) => (
                <a
                  key={ticker}
                  href={`https://tr.tradingview.com/chart/?symbol=BIST%3A${ticker}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-mono font-bold hover:bg-emerald-500/20 transition-colors"
                >
                  {ticker} <TbExternalLink size={11} />
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Tarama kartı ─────────────────────────────────────────────────────────────
function ScanCard({
  scan, onEdit, onDelete,
}: {
  scan: DbCustomScan;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [open,     setOpen]     = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`"${scan.name}" taramasını silmek istediğinize emin misiniz?`)) return;
    setDeleting(true);
    await fetch(`/api/user/custom-scans/${scan.id}`, { method: "DELETE" });
    onDelete();
  };

  return (
    <div className="bg-[#0d1117] border border-white/10 rounded-xl overflow-hidden">
      {/* Başlık satırı */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <TbSearch size={14} className="text-blue-400 shrink-0" />
            <span className="font-semibold text-sm text-white truncate">{scan.name}</span>
            <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${
              scan.is_active
                ? "bg-emerald-500/15 text-emerald-400"
                : "bg-slate-500/15 text-slate-500"
            }`}>
              {scan.is_active ? "Aktif" : "Pasif"}
            </span>
          </div>
          {scan.description && (
            <p className="text-xs text-slate-500 mt-0.5 ml-[22px] truncate">{scan.description}</p>
          )}
        </div>
        <div className="flex items-center gap-1 ml-3 shrink-0">
          <button onClick={onEdit} className="p-2 text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors">
            <TbEdit size={15} />
          </button>
          <button onClick={handleDelete} disabled={deleting} className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
            <TbTrash size={15} />
          </button>
          <button onClick={() => setOpen(!open)} className="p-2 text-slate-500 hover:text-white rounded-lg transition-colors">
            {open ? <TbChevronUp size={15} /> : <TbChevronDown size={15} />}
          </button>
        </div>
      </div>

      {/* Kural özeti */}
      <div className="px-5 pb-1 flex flex-wrap gap-1.5">
        {scan.rules.rules.map((r, i) => (
          <span key={i} className="text-xs px-2 py-0.5 rounded-md bg-white/5 text-slate-400 border border-white/8 font-mono">
            {r.indicator}{r.period ? `(${r.period})` : ""} {r.condition.replace(/_/g," ")} {r.value ?? r.multiplier ?? ""}
          </span>
        ))}
        <span className="text-xs px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold">
          {scan.rules.operator}
        </span>
      </div>

      {/* Çalıştır paneli */}
      {open && (
        <div className="px-5 pb-5">
          <ResultPanel scanId={scan.id} />
        </div>
      )}
    </div>
  );
}

// ── Ana bileşen ───────────────────────────────────────────────────────────────
export default function CustomScanManager() {
  const router                    = useRouter();
  const [scans,    setScans]      = useState<DbCustomScan[]>([]);
  const [loading,  setLoading]    = useState(true);
  const [modal,    setModal]      = useState<{ open: boolean; scan: DbCustomScan | null }>({ open: false, scan: null });
  const [planInfo, setPlanInfo]   = useState<{ plan: string; limit: number } | null>(null);

  const PLAN_LIMITS: Record<string, number> = { starter: 1, pro: 5, elite: 20 };

  const load = useCallback(async () => {
    setLoading(true);
    const [scansRes, profileRes] = await Promise.all([
      fetch("/api/user/custom-scans"),
      fetch("/api/user/profile"),
    ]);
    if (scansRes.status === 401) { router.push("/hisse-teknik-analizi/login"); return; }
    const profileJson = profileRes.ok ? await profileRes.json() : {};
    // Admin değilse ana tarama sayfasına yönlendir
    if (profileJson.isAdmin !== true) { router.push("/hisse-teknik-analizi"); return; }
    const scansData = await scansRes.json();
    setScans(Array.isArray(scansData) ? scansData : []);
    const plan = profileJson.plan ?? "starter";
    setPlanInfo({ plan, limit: PLAN_LIMITS[plan] ?? 1 });
    setLoading(false);
  }, [router]);

  useEffect(() => { load(); }, [load]);

  const canCreate = !planInfo || scans.length < planInfo.limit;

  return (
    <div className="max-w-2xl mx-auto px-4">
      {/* Başlık */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Özel Taramalarım</h1>
          {planInfo && (
            <p className="text-xs text-slate-500 mt-0.5">
              {scans.length} / {planInfo.limit} tarama
              <span className="ml-2 capitalize text-slate-600">({planInfo.plan} plan)</span>
            </p>
          )}
        </div>
        <button
          onClick={() => setModal({ open: true, scan: null })}
          disabled={!canCreate}
          title={!canCreate ? `${planInfo?.plan} planında maksimum ${planInfo?.limit} tarama oluşturabilirsiniz.` : undefined}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <TbPlus size={16} /> Yeni Tarama
        </button>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-600">
          <TbLoader2 size={24} className="animate-spin" />
        </div>
      ) : scans.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-white/10 rounded-2xl">
          <TbSearch size={32} className="mx-auto text-slate-700 mb-3" />
          <p className="text-slate-500 text-sm">Henüz özel tarama oluşturmadınız.</p>
          <button
            onClick={() => setModal({ open: true, scan: null })}
            className="mt-4 text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            İlk taramanı oluştur →
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {scans.map((scan) => (
            <ScanCard
              key={scan.id}
              scan={scan}
              onEdit={() => setModal({ open: true, scan })}
              onDelete={load}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {modal.open && (
        <ScanModal
          scan={modal.scan}
          onClose={() => setModal({ open: false, scan: null })}
          onSaved={() => { setModal({ open: false, scan: null }); load(); }}
        />
      )}
    </div>
  );
}
