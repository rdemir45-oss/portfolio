import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import Navbar from "@/components/Navbar";
import PWAInstallBanner from "@/components/PWAInstallBanner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#050a0e",
};

export const metadata: Metadata = {
  title: "RdAlgo | TradingView & Matriks İndikatörleri",
  description: "TradingView ve Matriks platformları için profesyonel borsa indikatörleri ve algoritmik trading yazılımları.",
  keywords: "TradingView indikatör, Matriks indikatör, borsa, algoritmik trading, Pine Script",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "RdAlgo",
  },
  openGraph: {
    title: "RdAlgo | TradingView & Matriks İndikatörleri",
    description: "Profesyonel borsa indikatörleri ve algoritmik trading yazılımları.",
    type: "website",
  },
};

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="scroll-smooth">
      <body className={`${inter.variable} font-sans antialiased`} style={{ background: "#050a0e", color: "#e2e8f0" }}>
        <Navbar />
        {children}
        <PWAInstallBanner />
        <script
          dangerouslySetInnerHTML={{
            __html: `if ('serviceWorker' in navigator) { navigator.serviceWorker.register('/sw.js'); }`,
          }}
        />
      </body>
    </html>
  );
}
