// Embed sayfaları için bağımsız root layout — ana layout'taki Navbar/Footer uygulanmaz.
export default function EmbedLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body style={{
        margin: 0,
        padding: 0,
        background: "#0f1117",
        color: "#e2e8f0",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        fontSize: "14px",
        lineHeight: "1.5",
      }}>
        {children}
      </body>
    </html>
  );
}
