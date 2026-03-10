import { TbBrandTwitter } from "react-icons/tb";

export default function Footer() {
  return (
    <footer className="py-8 px-6 border-t border-slate-800/60">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-emerald-400 font-black">RdAlgo</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 live-dot" />
        </div>
        <p className="text-slate-600 text-sm text-center">
          TradingView &amp; Matriks İndikatörleri &mdash; {new Date().getFullYear()}
        </p>
        <a
          href="https://twitter.com/0TheBigShort1"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-slate-400 hover:text-emerald-400 transition-colors text-sm"
        >
          <TbBrandTwitter size={18} />
          @0TheBigShort1
        </a>
      </div>
    </footer>
  );
}
