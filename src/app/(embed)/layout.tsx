// Bu layout kasıtlı olarak boş — embed sayfaları root layout'tan (Navbar vb.) bağımsız çalışır.
export default function EmbedLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
