import EmbedScanClient from "./EmbedScanClient";

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
  const embedKey = process.env.EMBED_READ_KEY ?? "";
  const valid = !!embedKey && !!key && key === embedKey;

  if (!valid) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
        <p style={{ fontSize: "24px", marginBottom: "8px" }}>🔒</p>
        <p>Geçersiz veya eksik anahtar.</p>
      </div>
    );
  }

  return <EmbedScanClient embedKey={key!} />;
}
