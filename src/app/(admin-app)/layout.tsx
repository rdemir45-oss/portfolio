import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "RdAlgo Admin",
  description: "RdAlgo yönetim paneli",
  manifest: "/admin-manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "RdAlgo Admin",
  },
  icons: {
    apple: "/admin-icon",
  },
};

export default function AdminAppLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="RdAlgo Admin" />
        <link rel="apple-touch-icon" href="/admin-icon" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#dc2626" />
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          html, body { background: #050a0e; color: #e2e8f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; height: 100%; }
        `}</style>
      </head>
      <body>
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `if ('serviceWorker' in navigator) { navigator.serviceWorker.register('/sw.js'); }`,
          }}
        />
      </body>
    </html>
  );
}
