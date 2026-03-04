export default function Footer() {
  return (
    <footer className="py-8 px-6 border-t border-gray-800">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-gray-500 text-sm">
          © {new Date().getFullYear()} Recep Demir. Tüm hakları saklıdır.
        </p>
        <p className="text-gray-600 text-sm">
          Next.js + Tailwind CSS ile yapıldı &middot; Railway üzerinde çalışıyor
        </p>
      </div>
    </footer>
  );
}
