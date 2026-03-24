"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  TbPlus, TbTrash, TbEdit, TbPlayerPlay, TbCheck, TbX,
  TbChevronDown, TbChevronUp, TbCode, TbListCheck, TbLoader2,
  TbUser, TbSearch,
} from "react-icons/tb";
import type { DbScannerUser, ScanRule, ScanRuleGroup, RuleIndicator, RuleCondition } from "@/lib/supabase";
import { validateScanCode } from "@/lib/scan-code-validator";

// ── Seçenek listeleri (CustomScanManager ile aynı) ─────────────────────────────
const INDICATOR_OPTIONS: { value: RuleIndicator; label: string }[] = [
  { value: "RSI",          label: "RSI" },
  { value: "EMA",          label: "EMA" },
  { value: "SMA",          label: "SMA" },
  { value: "MACD",         label: "MACD" },
  { value: "VOLUME",       label: "Hacim" },
  { value: "PRICE_CHANGE", label: "Fiyat Değişimi (%)" },
  { value: "BOLLINGER",    label: "Bollinger" },
  { value: "STOCH",        label: "Stokastik" },
];

const CONDITION_OPTIONS: Record<RuleIndicator, { value: RuleCondition; label: string }[]> = {
  RSI:          [{ value: "lt", label: "< (küçüktür)" }, { value: "gt", label: "> (büyüktür)" }, { value: "lte", label: "≤" }, { value: "gte", label: "≥" }],
  EMA:          [{ value: "price_above", label: "Fiyat üzerinde" }, { value: "price_below", label: "Fiyat altında" }, { value: "cross_above", label: "Kısa yukarı kesiyor" }, { value: "cross_below", label: "Kısa aşağı kesiyor" }],
  SMA:          [{ value: "price_above", label: "Fiyat üzerinde" }, { value: "price_below", label: "Fiyat altında" }],
  MACD:         [{ value: "cross_above", label: "MACD yukarı kesiyor" }, { value: "cross_below", label: "MACD aşağı kesiyor" }],
  VOLUME:       [{ value: "spike", label: "Hacim patlaması (X kat)" }, { value: "gt", label: "Hacim > değer" }],
  PRICE_CHANGE: [{ value: "gt", label: "Artış > %" }, { value: "lt", label: "Düşüş < %" }],
  BOLLINGER:    [{ value: "squeeze", label: "Bant sıkışması" }, { value: "price_above", label: "Fiyat üst bandın üzerinde" }, { value: "price_below", label: "Fiyat alt bandın altında" }],
  STOCH:        [{ value: "lt", label: "Aşırı satım (< 20)" }, { value: "gt", label: "Aşırı alım (> 80)" }],
};

const NEEDS_PERIOD  = new Set<RuleIndicator>(["RSI","EMA","SMA","STOCH","VOLUME"]);
const NEEDS_PERIOD2 = new Set<RuleCondition>(["cross_above","cross_below"]);
const NEEDS_VALUE   = new Set<RuleIndicator>(["RSI","PRICE_CHANGE","VOLUME","STOCH"]);
const NEEDS_MULT    = new Set<RuleCondition>(["spike"]);

function emptyRule(): ScanRule { return { indicator: "RSI", condition: "lt", period: 14, value: 30 }; }

type AssignedScan = {
  id: string;
  user_id: string;
  username?: string;
  name: string;
  description?: string | null;
  scan_type: "rules" | "python";
  rules?: ScanRuleGroup | null;
  python_code?: string | null;
  is_active: boolean;
  created_at: string;
};

const emptyForm = () => ({
  user_id: "",
  name: "",
  description: "",
  scan_type: "rules" as "rules" | "python",
  rules: { operator: "AND" as "AND" | "OR", rules: [emptyRule()] } as ScanRuleGroup,
  python_code: "",
  is_active: true,
});

// ── Kural satırı ───────────────────────────────────────────────────────────────
function RuleRow({ rule, index, onChange, onRemove, canRemove }: {
  rule: ScanRule; index: number;
  onChange: (r: ScanRule) => void; onRemove: () => void; canRemove: boolean;
}) {
  const conditions  = CONDITION_OPTIONS[rule.indicator] ?? [];
  const needsPeriod = NEEDS_PERIOD.has(rule.indicator);
  const needsP2     = NEEDS_PERIOD2.has(rule.condition);
  const needsValue  = NEEDS_VALUE.has(rule.indicator) && !NEEDS_MULT.has(rule.condition);
  const needsMult   = NEEDS_MULT.has(rule.condition);

  const changeInd = (ind: RuleIndicator) => {
    const cond = CONDITION_OPTIONS[ind];
    onChange({ indicator: ind, condition: cond[0].value, period: 14, value: ind === "PRICE_CHANGE" ? 3 : 30 });
  };

  const sel = "bg-[#0a1628] border border-slate-700 text-white text-sm rounded-lg px-2 py-1.5 focus:outline-none focus:border-violet-600";
  const inp = "bg-[#0a1628] border border-slate-700 text-white text-sm rounded-lg px-2 py-1.5 focus:outline-none focus:border-violet-600 w-20";

  return (
    <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg bg-white/5 border border-white/10">
      <span className="text-xs text-slate-500 font-mono w-5">{index + 1}</span>
      <select value={rule.indicator} onChange={e => changeInd(e.target.value as RuleIndicator)} className={sel}>
        {INDICATOR_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <select value={rule.condition} onChange={e => onChange({ ...rule, condition: e.target.value as RuleCondition })} className={sel}>
        {conditions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {needsPeriod && (
        <input type="number" placeholder="Periyot" value={rule.period ?? 14} min={1} max={200}
          onChange={e => onChange({ ...rule, period: Number(e.target.value) })} className={inp} />
      )}
      {needsP2 && (
        <input type="number" placeholder="P2" value={rule.period2 ?? 50} min={1} max={200}
          onChange={e => onChange({ ...rule, period2: Number(e.target.value) })} className={inp} />
      )}
      {needsValue && (
        <input type="number" placeholder="Değer" value={rule.value ?? 30}
          onChange={e => onChange({ ...rule, value: Number(e.target.value) })} className={inp} />
      )}
      {needsMult && (
        <input type="number" placeholder="X kat" value={rule.multiplier ?? 2} min={1} step={0.1}
          onChange={e => onChange({ ...rule, multiplier: Number(e.target.value) })} className={inp} />
      )}
      {canRemove && (
        <button onClick={onRemove} className="ml-auto p-1 text-slate-500 hover:text-rose-400 rounded transition-colors">
          <TbX size={15} />
        </button>
      )}
    </div>
  );
}

// ── Ana bileşen ─────────────────────────────────────────────────────────────────
export default function UserScansTab({ scannerUsers }: { scannerUsers: DbScannerUser[] }) {
  const [scans, setScans]         = useState<AssignedScan[]>([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [deleting, setDeleting]   = useState<string | null>(null);
  const [error, setError]         = useState("");
  const [showForm, setShowForm]   = useState(false);
  const [editId, setEditId]       = useState<string | null>(null);
  const [form, setForm]           = useState(emptyForm());
  const [codeError, setCodeError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const approvedUsers = scannerUsers.filter(u => u.status === "approved");

  const fetchScans = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/user-scans");
    if (res.ok) setScans(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchScans(); }, [fetchScans]);

  function openCreate() {
    setEditId(null);
    setForm(emptyForm());
    setError(""); setCodeError("");
    setShowForm(true);
  }

  function openEdit(scan: AssignedScan) {
    setEditId(scan.id);
    setForm({
      user_id: scan.user_id,
      name: scan.name,
      description: scan.description ?? "",
      scan_type: scan.scan_type,
      rules: scan.rules ?? { operator: "AND", rules: [emptyRule()] },
      python_code: scan.python_code ?? "",
      is_active: scan.is_active,
    });
    setError(""); setCodeError("");
    setShowForm(true);
  }

  async function handleSave() {
    setError(""); setCodeError("");
    if (!form.user_id) { setError("Kullanıcı seçiniz."); return; }
    if (!form.name.trim()) { setError("Tarama adı gerekli."); return; }
    if (form.scan_type === "python") {
      const v = validateScanCode(form.python_code);
      if (!v.valid) { setCodeError(v.error ?? "Kod geçersiz."); return; }
    }

    setSaving(true);
    const payload = {
      ...(editId ? {} : { user_id: form.user_id }),
      name: form.name,
      description: form.description || undefined,
      scan_type: form.scan_type,
      rules: form.scan_type === "rules" ? form.rules : undefined,
      python_code: form.scan_type === "python" ? form.python_code : undefined,
      is_active: form.is_active,
    };

    const url    = editId ? `/api/admin/user-scans/${editId}` : "/api/admin/user-scans";
    const method = editId ? "PATCH" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });

    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "Kayıt başarısız.");
      setSaving(false);
      return;
    }

    setShowForm(false);
    setEditId(null);
    setSaving(false);
    await fetchScans();
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`"${name}" taramasını silmek istediğinize emin misiniz?`)) return;
    setDeleting(id);
    await fetch(`/api/admin/user-scans/${id}`, { method: "DELETE" });
    await fetchScans();
    setDeleting(null);
  }

  function updateRule(idx: number, rule: ScanRule) {
    setForm(f => ({ ...f, rules: { ...f.rules, rules: f.rules.rules.map((r, i) => i === idx ? rule : r) } }));
  }
  function addRule() {
    if (form.rules.rules.length >= 10) return;
    setForm(f => ({ ...f, rules: { ...f.rules, rules: [...f.rules.rules, emptyRule()] } }));
  }
  function removeRule(idx: number) {
    setForm(f => ({ ...f, rules: { ...f.rules, rules: f.rules.rules.filter((_, i) => i !== idx) } }));
  }

  // Scans kullanıcıya göre grupla
  const byUser: Record<string, AssignedScan[]> = {};
  for (const sc of scans) {
    const key = sc.username ?? sc.user_id;
    if (!byUser[key]) byUser[key] = [];
    byUser[key].push(sc);
  }

  const inp = "w-full bg-[#050a0e] border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-violet-600 transition-colors";

  return (
    <div>
      {/* Başlık */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-white">Kullanıcıya Özel Taramalar</h2>
          <p className="text-xs text-slate-500 mt-0.5">Her tarama yalnızca atandığı kullanıcı tarafından çalıştırılabilir.</p>
        </div>
        <button onClick={showForm ? () => { setShowForm(false); setEditId(null); } : openCreate}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${showForm ? "border-slate-700 text-slate-400 hover:text-white" : "border-violet-700 bg-violet-950/30 text-violet-400 hover:bg-violet-950/50"}`}>
          {showForm ? <TbX size={15} /> : <TbPlus size={15} />}
          {showForm ? "İptal" : "Yeni Tarama"}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="mb-8 p-5 border border-violet-800/50 bg-violet-950/10 rounded-2xl space-y-4">
          <h3 className="text-sm font-semibold text-violet-300">{editId ? "Taramayı Düzenle" : "Yeni Tarama Oluştur"}</h3>

          {/* Kullanıcı seç (sadece oluştururken) */}
          {!editId && (
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Kullanıcı *</label>
              {approvedUsers.length === 0 ? (
                <p className="text-xs text-amber-400">Henüz onaylı kullanıcı yok.</p>
              ) : (
                <select value={form.user_id} onChange={e => setForm(f => ({ ...f, user_id: e.target.value }))}
                  className={inp}>
                  <option value="">— Kullanıcı seçin —</option>
                  {approvedUsers.map(u => (
                    <option key={u.id} value={u.id}>{u.username} ({u.plan})</option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* İsim */}
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Tarama Adı *</label>
            <input type="text" placeholder="örn: Altın Kesişim Sinyali" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inp} maxLength={80} />
          </div>

          {/* Açıklama */}
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Açıklama</label>
            <input type="text" placeholder="Kısa açıklama (opsiyonel)" value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={inp} maxLength={300} />
          </div>

          {/* Tip seç */}
          <div className="flex gap-2">
            <button onClick={() => setForm(f => ({ ...f, scan_type: "rules" }))}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border transition-colors ${form.scan_type === "rules" ? "border-violet-600 bg-violet-950/40 text-violet-300" : "border-slate-700 text-slate-500"}`}>
              <TbListCheck size={14} /> Kural Tabanlı
            </button>
            <button onClick={() => setForm(f => ({ ...f, scan_type: "python" }))}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border transition-colors ${form.scan_type === "python" ? "border-violet-600 bg-violet-950/40 text-violet-300" : "border-slate-700 text-slate-500"}`}>
              <TbCode size={14} /> Python Kodu
            </button>
          </div>

          {/* Kural editörü */}
          {form.scan_type === "rules" && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Operatör:</span>
                {(["AND","OR"] as const).map(op => (
                  <button key={op} onClick={() => setForm(f => ({ ...f, rules: { ...f.rules, operator: op } }))}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-colors ${form.rules.operator === op ? "border-violet-600 bg-violet-950/40 text-violet-300" : "border-slate-700 text-slate-500"}`}>
                    {op}
                  </button>
                ))}
              </div>
              <div className="space-y-2">
                {form.rules.rules.map((rule, i) => (
                  <RuleRow key={i} rule={rule} index={i}
                    onChange={r => updateRule(i, r)}
                    onRemove={() => removeRule(i)}
                    canRemove={form.rules.rules.length > 1} />
                ))}
              </div>
              {form.rules.rules.length < 10 && (
                <button onClick={addRule}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-violet-400 transition-colors">
                  <TbPlus size={13} /> Kural Ekle
                </button>
              )}
            </div>
          )}

          {/* Python editörü */}
          {form.scan_type === "python" && (
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Python Kodu</label>
              <textarea value={form.python_code}
                onChange={e => { setForm(f => ({ ...f, python_code: e.target.value })); setCodeError(""); }}
                rows={14} placeholder="# Python tarama kodu..."
                className="w-full bg-[#050a0e] border border-slate-700 rounded-xl px-3 py-2 text-xs text-emerald-300 font-mono placeholder-slate-700 focus:outline-none focus:border-violet-600 transition-colors resize-y" />
              {codeError && <p className="text-xs text-rose-400 mt-1">{codeError}</p>}
            </div>
          )}

          {/* Aktif/Pasif */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={form.is_active}
              onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
              className="w-4 h-4 accent-violet-500" />
            <span className="text-sm text-slate-300">Aktif (kullanıcı çalıştırabilir)</span>
          </label>

          {error && <p className="text-sm text-rose-400">{error}</p>}

          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-violet-700 hover:bg-violet-600 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50">
            {saving ? <TbLoader2 size={15} className="animate-spin" /> : <TbCheck size={15} />}
            {saving ? "Kaydediliyor..." : editId ? "Güncelle" : "Oluştur & Ata"}
          </button>
        </div>
      )}

      {/* Liste */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <TbLoader2 size={24} className="animate-spin text-violet-400" />
        </div>
      ) : scans.length === 0 ? (
        <div className="text-center py-16">
          <TbSearch size={32} className="mx-auto text-slate-700 mb-3" />
          <p className="text-slate-500 text-sm">Henüz atanmış tarama yok.</p>
          <p className="text-slate-600 text-xs mt-1">Yukarıdaki butonu kullanarak ilk taramayı oluşturabilirsiniz.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(byUser).map(([username, userScans]) => (
            <div key={username}>
              {/* Kullanıcı başlığı */}
              <div className="flex items-center gap-2 mb-3">
                <TbUser size={14} className="text-violet-400" />
                <span className="text-sm font-semibold text-violet-300">{username}</span>
                <span className="text-xs text-slate-600">({userScans.length} tarama)</span>
              </div>

              <div className="space-y-2 pl-4 border-l border-violet-900/50">
                {userScans.map((sc) => (
                  <div key={sc.id} className={`border rounded-xl transition-colors ${sc.is_active ? "bg-[#0a1628] border-slate-800" : "bg-slate-900/30 border-slate-800/50 opacity-60"}`}>
                    {/* Kart başlık satırı */}
                    <div className="flex items-center gap-3 p-4">
                      <button onClick={() => setExpandedId(expandedId === sc.id ? null : sc.id)}
                        className="flex-1 flex items-center gap-3 text-left min-w-0">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-white truncate">{sc.name}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium shrink-0 ${sc.scan_type === "python" ? "text-violet-400 bg-violet-950/40 border-violet-800/60" : "text-sky-400 bg-sky-950/40 border-sky-800/60"}`}>
                              {sc.scan_type === "python" ? "Python" : "Kurallar"}
                            </span>
                            {!sc.is_active && (
                              <span className="text-xs px-2 py-0.5 rounded-full border text-slate-500 bg-slate-800/40 border-slate-700/60 shrink-0">Pasif</span>
                            )}
                          </div>
                          {sc.description && <p className="text-xs text-slate-500 mt-0.5 truncate">{sc.description}</p>}
                        </div>
                        {expandedId === sc.id
                          ? <TbChevronUp size={15} className="text-slate-500 shrink-0" />
                          : <TbChevronDown size={15} className="text-slate-500 shrink-0" />}
                      </button>

                      {/* Eylemler */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => openEdit(sc)}
                          className="p-1.5 text-slate-500 hover:text-violet-400 hover:bg-violet-950/40 rounded-lg transition-colors">
                          <TbEdit size={15} />
                        </button>
                        <button onClick={() => handleDelete(sc.id, sc.name)} disabled={deleting === sc.id}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors disabled:opacity-50">
                          {deleting === sc.id ? <TbLoader2 size={15} className="animate-spin" /> : <TbTrash size={15} />}
                        </button>
                      </div>
                    </div>

                    {/* Genişletilmiş detay */}
                    {expandedId === sc.id && (
                      <div className="px-4 pb-4 border-t border-slate-800/50 pt-3 space-y-2">
                        {sc.scan_type === "rules" && sc.rules && (
                          <div>
                            <p className="text-xs text-slate-500 mb-1.5">Kurallar ({sc.rules.operator})</p>
                            <div className="space-y-1">
                              {sc.rules.rules.map((r, i) => (
                                <div key={i} className="text-xs text-slate-400 font-mono bg-slate-900/50 px-2 py-1 rounded">
                                  {r.indicator} {r.condition} {r.period ? `(${r.period})` : ""} {r.value !== undefined ? r.value : ""}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {sc.scan_type === "python" && (
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Python kodu</p>
                            <pre className="text-xs text-emerald-300/70 font-mono bg-slate-900/50 p-2 rounded overflow-x-auto max-h-32 overflow-y-auto">
                              {sc.python_code?.slice(0, 400)}{(sc.python_code?.length ?? 0) > 400 ? "…" : ""}
                            </pre>
                          </div>
                        )}
                        <p className="text-xs text-slate-600">
                          Oluşturuldu: {new Date(sc.created_at).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
