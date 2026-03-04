"use client";
import { motion } from "framer-motion";
import { HiArrowDown } from "react-icons/hi";
import { FiGithub, FiLinkedin, FiMail } from "react-icons/fi";

export default function Hero() {
  return (
    <section
      id="hero"
      className="min-h-screen flex flex-col items-center justify-center relative px-6 overflow-hidden"
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/30 via-gray-950 to-gray-950 pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 text-center max-w-3xl">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-indigo-400 font-medium mb-4 tracking-widest uppercase text-sm"
        >
          Merhaba, ben
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl sm:text-7xl font-extrabold mb-4 tracking-tight"
        >
          Recep Demir
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-xl sm:text-2xl text-gray-400 mb-8"
        >
          Full-Stack Developer &amp; UI Enthusiast
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-gray-400 max-w-xl mx-auto mb-10 leading-relaxed"
        >
          Modern web teknolojileri ile kullanıcı dostu, hızlı ve ölçeklenebilir
          uygulamalar geliştiriyorum.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
        >
          <a
            href="#projects"
            className="px-8 py-3 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors"
          >
            Projeleri Gör
          </a>
          <a
            href="#contact"
            className="px-8 py-3 rounded-full border border-gray-700 hover:border-indigo-500 text-gray-300 hover:text-white font-semibold transition-colors"
          >
            İletişime Geç
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex items-center justify-center gap-6"
        >
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-white transition-colors"
          >
            <FiGithub size={22} />
          </a>
          <a
            href="https://linkedin.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-white transition-colors"
          >
            <FiLinkedin size={22} />
          </a>
          <a
            href="mailto:recep@example.com"
            className="text-gray-400 hover:text-white transition-colors"
          >
            <FiMail size={22} />
          </a>
        </motion.div>
      </div>

      <motion.a
        href="#about"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8 text-gray-500 hover:text-indigo-400 transition-colors animate-bounce"
      >
        <HiArrowDown size={24} />
      </motion.a>
    </section>
  );
}
