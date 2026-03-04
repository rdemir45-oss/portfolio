"use client";
import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef, useState } from "react";
import { TbBrandTwitter, TbSend, TbMailFilled } from "react-icons/tb";

export default function Contact() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <section
      id="contact"
      className="py-24 px-6"
      style={{ background: "linear-gradient(180deg, #050a0e 0%, #071a12 50%, #050a0e 100%)" }}
    >
      <div className="max-w-5xl mx-auto">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <p className="text-emerald-400 font-medium uppercase tracking-widest text-sm mb-2">
            İletişim
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold mb-12">
            Ulaşın
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Info */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="space-y-6"
          >
            <p className="text-slate-400 leading-relaxed">
              İndikatörlerim hakkında soru sormak, erişim talep etmek veya özel
              geliştirme için benimle iletişime geçebilirsiniz.
            </p>

            {/* Twitter card */}
            <a
              href="https://twitter.com/0TheBigShort1"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-5 rounded-2xl bg-[#0a1628]/80 border border-slate-700 hover:border-emerald-700 transition-colors group"
            >
              <div className="p-3 rounded-xl bg-slate-800 group-hover:bg-emerald-950/60 transition-colors">
                <TbBrandTwitter size={24} className="text-slate-300 group-hover:text-emerald-400 transition-colors" />
              </div>
              <div>
                <div className="font-semibold text-white">Twitter / X</div>
                <div className="text-emerald-400 text-sm">@0TheBigShort1</div>
                <div className="text-slate-500 text-xs mt-0.5">En hızlı iletişim yolu</div>
              </div>
            </a>

            <div className="flex items-center gap-4 p-5 rounded-2xl bg-[#0a1628]/80 border border-slate-800">
              <div className="p-3 rounded-xl bg-slate-800">
                <TbMailFilled size={24} className="text-slate-400" />
              </div>
              <div>
                <div className="font-semibold text-white">E-Posta</div>
                <div className="text-slate-400 text-sm">Aşağıdaki formu doldurun</div>
              </div>
            </div>
          </motion.div>

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {sent ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-[#0a1628]/80 rounded-2xl border border-emerald-800">
                <div className="text-4xl mb-4">📈</div>
                <h3 className="text-xl font-bold mb-2 text-emerald-400">Mesajınız Alındı!</h3>
                <p className="text-slate-400">
                  En kısa sürede geri döneceğim. Twitter DM daha hızlı olabilir.
                </p>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="space-y-4 bg-[#0a1628]/80 border border-slate-800 rounded-2xl p-6"
              >
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">İsim</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Adınız"
                    className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-600 transition-colors text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">E-posta</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="ornek@email.com"
                    className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-600 transition-colors text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">Mesaj</label>
                  <textarea
                    required
                    rows={4}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="Hangi indikatör hakkında bilgi almak istiyorsunuz?"
                    className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-600 transition-colors resize-none text-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-xl transition-colors"
                >
                  <TbSend size={16} />
                  Gönder
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
