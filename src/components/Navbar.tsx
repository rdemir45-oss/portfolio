"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { HiMenuAlt3, HiX } from "react-icons/hi";

const links = [
  { href: "/#nedir", label: "Ne İşe Yarar?" },
  { href: "/#indicators", label: "İndikatörler" },
  // { href: "/#paketler", label: "Paketler" },
  { href: "/#platforms", label: "Platformlar" },
  { href: "/hisse-teknik-analizi", label: "Hisse Teknik Analizi" },
  { href: "/egitim", label: "Eğitim" },
  { href: "/#announcements", label: "Analiz & Eğitim" },
  { href: "/#about", label: "Hakkımda" },
  { href: "/#contact", label: "İletişim" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Ana sayfadayken anchor linkleri #section olarak kullan (smooth scroll için)
  function resolveHref(href: string) {
    if (href.startsWith("/#") && pathname === "/") {
      return href.slice(1); // "/#indicators" → "#indicators"
    }
    return href;
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#050a0e]/90 backdrop-blur-md shadow-lg shadow-emerald-950/20 border-b border-emerald-900/20"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <a href="#" className="flex items-center gap-2">
          <span className="text-emerald-400 font-black text-xl tracking-tight">
            RdAlgo
          </span>
          <span className="live-dot w-2 h-2 rounded-full bg-emerald-400 inline-block" />
        </a>

        {/* Desktop */}
        <nav className="hidden md:flex gap-8 items-center">
          {links.map((l) =>
            l.label === "Ne İşe Yarar?" ? (
              <a
                key={l.href}
                href={resolveHref(l.href)}
                className="text-sm font-semibold px-3 py-1 rounded-full bg-orange-500 hover:bg-orange-400 text-white transition-colors shadow-md shadow-orange-900/40"
              >
                {l.label}
              </a>
            ) : (
              <a
                key={l.href}
                href={resolveHref(l.href)}
                className="text-sm text-slate-400 hover:text-emerald-400 transition-colors"
              >
                {l.label}
              </a>
            )
          )}
        </nav>

        <a
          href="https://twitter.com/0TheBigShort1"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden md:flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-700 text-emerald-400 text-sm hover:bg-emerald-950/60 transition-colors"
        >
          @0TheBigShort1
        </a>

        <button
          className="md:hidden text-slate-300 hover:text-white"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <HiX size={24} /> : <HiMenuAlt3 size={24} />}
        </button>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-[#050a0e]/95 backdrop-blur-md px-6 pb-4"
          >
            {links.map((l) =>
              l.label === "Ne İşe Yarar?" ? (
                <a
                  key={l.href}
                  href={resolveHref(l.href)}
                  onClick={() => setMenuOpen(false)}
                  className="block py-3 font-semibold text-orange-400 border-b border-slate-800 last:border-0"
                >
                  {l.label}
                </a>
              ) : (
                <a
                  key={l.href}
                  href={resolveHref(l.href)}
                  onClick={() => setMenuOpen(false)}
                  className="block py-3 text-slate-300 hover:text-emerald-400 transition-colors border-b border-slate-800 last:border-0"
                >
                  {l.label}
                </a>
              )
            )}
            <a
              href="https://twitter.com/0TheBigShort1"
              target="_blank"
              rel="noopener noreferrer"
              className="block py-3 text-emerald-400 font-medium"
            >
              Twitter: @0TheBigShort1
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

