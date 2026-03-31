import OrionEmbedClient from "./OrionEmbedClient";

export function generateMetadata() {
  return {
    title: "BIST Teknik Analiz — Orion",
    robots: { index: false, follow: false },
  };
}

export default function OrionEmbedPage() {
  return <OrionEmbedClient />;
}
