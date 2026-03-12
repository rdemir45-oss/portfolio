import EmbedScanClient from "./EmbedScanClient";

export function generateMetadata() {
  return {
    title: "BIST Teknik Analiz Taraması",
    robots: { index: false, follow: false },
  };
}

export default function EmbedPage() {
  return <EmbedScanClient />;
}
