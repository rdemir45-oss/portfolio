// Embed sayfaları için bağımsız root layout — ana layout'taki Navbar/Footer uygulanmaz.
export default function EmbedLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body style={{ margin: 0, padding: 0, background: "#050a0e", color: "#f1f5f9", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
