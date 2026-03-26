"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminInstallPage() {
  const router = useRouter();
  const [deferredPrompt, setDeferredPrompt] = useState<Event & { prompt: () => void; userChoice: Promise<{ outcome: string }> } | null>(null);
  const [installed, setInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const standalone = window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;

    setIsIOS(ios);
    setIsStandalone(standalone);

    // Zaten uygulama olarak açıldıysa direkt panele git
    if (standalone) {
      router.replace("/admin/dashboard");
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as Event & { prompt: () => void; userChoice: Promise<{ outcome: string }> });
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, [router]);

  async function handleInstall() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setDeferredPrompt(null);
  }

  function handleGoToPanel() {
    router.push("/admin/dashboard");
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      background: "linear-gradient(135deg, #050a0e 0%, #0a0f14 50%, #150508 100%)",
    }}>
      {/* İkon */}
      <div style={{
        width: 84,
        height: 84,
        borderRadius: 20,
        background: "linear-gradient(135deg, #7f1d1d, #dc2626)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 20,
        boxShadow: "0 0 40px rgba(220,38,38,0.35)",
      }}>
        <span style={{ fontSize: 40 }}>⚙️</span>
      </div>

      <h1 style={{ fontSize: 22, fontWeight: 900, color: "#f1f5f9", marginBottom: 6, textAlign: "center" }}>
        RdAlgo Admin
      </h1>
      <p style={{ fontSize: 13, color: "#64748b", marginBottom: 32, textAlign: "center" }}>
        Yönetim paneli — sadece yetkili kullanıcılar
      </p>

      {installed ? (
        <div style={{
          background: "#052e16",
          border: "1px solid #166534",
          borderRadius: 14,
          padding: "14px 20px",
          color: "#4ade80",
          fontSize: 14,
          textAlign: "center",
          marginBottom: 16,
        }}>
          ✅ Uygulama ana ekrana eklendi!
        </div>
      ) : isIOS ? (
        /* iOS: manuel talimat */
        <div style={{
          background: "#0a1628",
          border: "1px solid #1e3a5f",
          borderRadius: 16,
          padding: "20px",
          maxWidth: 320,
          marginBottom: 24,
        }}>
          <p style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.7, textAlign: "center" }}>
            Ana ekrana eklemek için:<br />
            <strong style={{ color: "#e2e8f0" }}>Safari</strong> ile bu sayfayı aç →<br />
            Alttaki <strong style={{ color: "#e2e8f0" }}>Paylaş</strong> ikonuna (<span style={{ fontSize: 16 }}>⎋</span>) bas →<br />
            <strong style={{ color: "#e2e8f0" }}>&quot;Ana Ekrana Ekle&quot;</strong> seçeneğine dokun
          </p>
        </div>
      ) : deferredPrompt ? (
        <button
          onClick={handleInstall}
          style={{
            background: "linear-gradient(135deg, #dc2626, #b91c1c)",
            color: "white",
            border: "none",
            borderRadius: 14,
            padding: "14px 32px",
            fontSize: 15,
            fontWeight: 700,
            cursor: "pointer",
            marginBottom: 16,
            boxShadow: "0 4px 20px rgba(220,38,38,0.4)",
          }}
        >
          📲 Ana Ekrana Ekle
        </button>
      ) : (
        <div style={{
          background: "#0a1628",
          border: "1px solid #1e293b",
          borderRadius: 14,
          padding: "14px 20px",
          color: "#64748b",
          fontSize: 13,
          textAlign: "center",
          marginBottom: 16,
          maxWidth: 280,
        }}>
          Tarayıcı menüsünden &quot;Ana Ekrana Ekle&quot; seçeneğini kullanabilirsiniz.
        </div>
      )}

      <button
        onClick={handleGoToPanel}
        style={{
          background: "transparent",
          color: "#dc2626",
          border: "1px solid #7f1d1d",
          borderRadius: 12,
          padding: "11px 28px",
          fontSize: 14,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Panele Git →
      </button>

      <p style={{ fontSize: 11, color: "#334155", marginTop: 32, textAlign: "center" }}>
        recepdemirborsa.com · Sadece yetkili erişim
      </p>
    </div>
  );
}
