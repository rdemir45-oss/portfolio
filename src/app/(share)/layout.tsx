export default function ShareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body style={{ margin: 0, background: "#050a0e" }}>{children}</body>
    </html>
  );
}
