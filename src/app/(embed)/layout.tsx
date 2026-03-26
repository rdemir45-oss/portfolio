import "../globals.css";

// Embed sayfaları için bağımsız root layout — ana layout'taki Navbar/Footer uygulanmaz.
export default function EmbedLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        {/* Embed içinde tüm scrollbar'ları tamamen gizle — globals.css override */}
        <style>{`
          html, body, * { scrollbar-width: none !important; -ms-overflow-style: none !important; }
          html::-webkit-scrollbar, body::-webkit-scrollbar, *::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; }
          html, body { margin: 0; padding: 0; overflow: hidden; }
        `}</style>
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
      }}>
        {children}
      </body>
    </html>
  );
}
