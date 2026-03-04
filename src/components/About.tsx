"use client";
import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";

export default function About() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="about" className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <p className="text-indigo-400 font-medium uppercase tracking-widest text-sm mb-2">
            Hakkımda
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold mb-12">Kim Miyim?</h2>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Avatar placeholder */}
            <div className="flex justify-center">
              <div className="w-56 h-56 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-7xl font-bold text-white shadow-2xl">
                RD
              </div>
            </div>

            <div className="space-y-4 text-gray-300 leading-relaxed">
              <p>
                Merhaba! Ben Recep Demir, modern web teknolojilerine tutkuyla
                bağlı bir Full-Stack Developer&apos;ım.
              </p>
              <p>
                React, Next.js ve Node.js gibi teknolojilerle kullanıcı dostu
                arayüzler ve güçlü backend sistemleri geliştiriyorum. Aynı zamanda
                TypeScript kullanarak daha güvenli ve sürdürülebilir kod yazmaya
                önem veriyorum.
              </p>
              <p>
                Boş zamanlarımda açık kaynak projelere katkıda bulunuyor,
                yeni teknolojileri keşfediyor ve blog yazıları yazıyorum.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                {["Next.js", "TypeScript", "Node.js", "React", "PostgreSQL", "Docker"].map(
                  (tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 text-sm rounded-full bg-indigo-950/60 border border-indigo-800/50 text-indigo-300"
                    >
                      {tag}
                    </span>
                  )
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
