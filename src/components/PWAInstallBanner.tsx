"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Zaten standalone modda açılmışsa (yani uygulama kurulu) gösterme
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    // Daha önce kapatıldıysa gösterme
    if (localStorage.getItem("pwa-banner-dismissed") === "1") return;

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;
    if (ios) {
      // iOS'ta beforeinstallprompt yoktur; sadece Safari'de çalışır
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      if (isSafari) {
        setIsIOS(true);
        setVisible(true);
      }
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const dismiss = () => {
    localStorage.setItem("pwa-banner-dismissed", "1");
    setVisible(false);
  };

  const install = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setVisible(false);
    }
    setDeferredPrompt(null);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-20 left-3 right-3 sm:left-auto sm:right-4 sm:bottom-4 sm:w-80 z-50 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="bg-[#0a1628] border border-emerald-800/60 rounded-2xl p-4 shadow-2xl shadow-black/60">
        <div className="flex items-start gap-3">
          {/* İkon */}
          <div className="shrink-0 w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-800/50 flex items-center justify-center text-lg">
            📲
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white">Uygulamayı Yükle</p>
            {isIOS ? (
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                Safari&apos;de{" "}
                <span className="inline-block text-emerald-400 font-semibold">Paylaş ↑</span>{" "}
                butonuna dokunun, ardından{" "}
                <span className="text-emerald-400 font-semibold">Ana Ekrana Ekle</span>
                &apos;yi seçin.
              </p>
            ) : (
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                RdAlgo&apos;yu ana ekranınıza ekleyin, uygulama gibi açılır.
              </p>
            )}
          </div>
          {/* Kapat */}
          <button
            onClick={dismiss}
            className="shrink-0 text-slate-600 hover:text-slate-400 transition-colors p-0.5"
            aria-label="Kapat"
          >
            ✕
          </button>
        </div>

        {!isIOS && (
          <div className="flex gap-2 mt-3">
            <button
              onClick={install}
              className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors"
            >
              Yükle
            </button>
            <button
              onClick={dismiss}
              className="px-3 py-2 rounded-xl border border-slate-700 text-slate-400 hover:text-slate-300 text-xs transition-colors"
            >
              Şimdi Değil
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
