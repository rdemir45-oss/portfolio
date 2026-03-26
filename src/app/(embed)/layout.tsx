import "../globals.css";

// Embed sayfaları için bağımsız root layout — ana layout'taki Navbar/Footer uygulanmaz.
export default function EmbedLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" style={{ overflow: "hidden", height: "auto" }}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body style={{
        margin: 0,
        padding: 0,
        background: "#080a0c",
        color: "#e2e8f0",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        fontSize: "14px",
        lineHeight: "1.5",
        WebkitFontSmoothing: "antialiased",
        overflow: "hidden",
      }}>
        {children}
      </body>
    </html>
  );
}
