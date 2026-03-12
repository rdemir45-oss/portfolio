import { headers } from "next/headers";
import EmbedScanClient from "./EmbedScanClient";

// iframe içinde açılmasına izin ver
export async function generateMetadata() {
  return {
    title: "BIST Teknik Analiz Taraması",
    robots: { index: false, follow: false },
  };
}

export default async function EmbedPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string }>;
}) {
  const { key } = await searchParams;

  // Sunucu tarafında temel key kontrolü — boşsa hata sayfası göster
  const embedKey = process.env.EMBED_READ_KEY ?? "";
  const valid = !!embedKey && !!key && key === embedKey;

  return (
    <html lang="tr">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex,nofollow" />
        {/* iframe içinde açılmasına izin ver */}
        <style>{`
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            background: #050a0e;
            color: #f1f5f9;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            font-size: 14px;
            line-height: 1.5;
          }
          a { color: inherit; text-decoration: none; }
          button { cursor: pointer; border: none; background: none; font-family: inherit; }
        `}</style>
      </head>
      <body>
        {valid ? (
          <EmbedScanClient embedKey={key!} />
        ) : (
          <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
            <p style={{ fontSize: "24px", marginBottom: "8px" }}>🔒</p>
            <p>Geçersiz veya eksik anahtar.</p>
          </div>
        )}
      </body>
    </html>
  );
}
