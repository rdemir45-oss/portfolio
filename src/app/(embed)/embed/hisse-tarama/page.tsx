import { headers } from "next/headers";
import EmbedScanClient from "./EmbedScanClient";

export function generateMetadata() {
  return {
    title: "BIST Teknik Analiz Taraması",
    robots: { index: false, follow: false },
  };
}

export default async function EmbedPage() {
  const headersList = await headers();
  const referer = headersList.get("referer") ?? "";

  let refererHost = "";
  try { refererHost = new URL(referer).hostname; } catch { /* no referer */ }

  const allowed = refererHost === "www.orionstrateji.com" || refererHost === "orionstrateji.com";

  if (!allowed) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
        <p style={{ fontSize: "24px", marginBottom: "8px" }}>🔒</p>
        <p>Bu içerik yalnızca yetkili sitede görüntülenebilir.</p>
      </div>
    );
  }

  return <EmbedScanClient />;
}
