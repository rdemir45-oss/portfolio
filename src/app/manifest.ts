import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "RdAlgo — BIST Tarama",
    short_name: "RdAlgo",
    description: "TradingView ve Matriks platformları için BIST hisse teknik analiz tarama sistemi.",
    start_url: "/hisse-teknik-analizi",
    display: "standalone",
    orientation: "portrait",
    background_color: "#050a0e",
    theme_color: "#050a0e",
    lang: "tr",
    icons: [
      {
        src: "/icon",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon?size=512",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
    shortcuts: [
      {
        name: "Hisse Tarama",
        url: "/hisse-teknik-analizi",
        description: "BIST hisse teknik analiz taraması",
      },
    ],
  };
}
