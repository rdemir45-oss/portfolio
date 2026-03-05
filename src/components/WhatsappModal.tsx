"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TbX, TbBrandWhatsapp, TbCheck } from "react-icons/tb";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function WhatsappModal({ open, onClose }: Props) {
  const [form, setForm] = useState({ name: "", surname: "", phone: "" });
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError("");
    const res = await fetch("/api/whatsapp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setDone(true);
    } else {
      const data = await res.json();
      setError(data.error || "Bir hata oluştu, tekrar deneyin.");
    }
    setSending(false);
  }

  function handleClose() {
    onClose();
    setTimeout(() => { setDone(false); setForm({ name: "", surname: "", phone: "" }); setError(""); }, 300);
  }

  const inputCls = "w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-600 transition-colors text-sm";

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full max-w-md bg-[#0a1628] border border-slate-700 rounded-2xl p-6 shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-950/60 border border-green-800/60 rounded-xl">
                    <TbBrandWhatsapp size={22} className="text-green-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">WhatsApp Grubuna Katıl</h2>
                    <p className="text-xs text-slate-500">Bilgilerin kaydedilecek, en kısa sürede ekleneceksin.</p>
                  </div>
                </div>
                <button onClick={handleClose} className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-xl transition-colors">
                  <TbX size={18} />
                </button>
              </div>

              {done ? (
                <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
                  <div className="w-14 h-14 bg-green-950/60 border border-green-800/60 rounded-full flex items-center justify-center">
                    <TbCheck size={28} className="text-green-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Kaydın Alındı!</h3>
                  <p className="text-slate-400 text-sm max-w-xs">
                    Bilgilerin başarıyla kaydedildi. En kısa sürede WhatsApp grubuna ekleneceksin.
                  </p>
                  <button onClick={handleClose} className="mt-4 px-6 py-2.5 bg-green-700 hover:bg-green-600 text-white font-semibold rounded-xl transition-colors text-sm">
                    Tamam
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1.5 font-medium">İsim *</label>
                      <input
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        required
                        placeholder="Adınız"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1.5 font-medium">Soyisim *</label>
                      <input
                        name="surname"
                        value={form.surname}
                        onChange={handleChange}
                        required
                        placeholder="Soyadınız"
                        className={inputCls}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5 font-medium">Telefon Numarası *</label>
                    <input
                      name="phone"
                      type="tel"
                      value={form.phone}
                      onChange={handleChange}
                      required
                      placeholder="05XX XXX XX XX"
                      className={inputCls}
                    />
                  </div>
                  {error && <p className="text-red-400 text-sm">{error}</p>}
                  <button
                    type="submit"
                    disabled={sending}
                    className="w-full flex items-center justify-center gap-2 bg-green-700 hover:bg-green-600 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors"
                  >
                    <TbBrandWhatsapp size={18} />
                    {sending ? "Kaydediliyor..." : "Gruba Katılmak İstiyorum"}
                  </button>
                  <p className="text-xs text-slate-600 text-center">
                    Bilgilerin yalnızca grup katılımı için kullanılacaktır.
                  </p>
                </form>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
