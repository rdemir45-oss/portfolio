import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async headers() {
    const securityHeaders = [
      // Clickjacking koruması — site başka yerlere iframe edilemez
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      // MIME sniffing koruması
      { key: "X-Content-Type-Options", value: "nosniff" },
      // Referrer bilgisini kısıtla
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      // Tarayıcı özelliklerini kısıtla
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
      // Kısmi CSP — script/style unsafe-inline Next.js gereği bırakıldı
      {
        key: "Content-Security-Policy",
        value: [
          "base-uri 'self'",
          "object-src 'none'",
          "form-action 'self'",
          "frame-ancestors 'self'",
        ].join("; "),
      },
    ];

    return [
      {
        // Tüm sayfalara güvenlik header'ları
        source: "/((?!embed).*)",
        headers: securityHeaders,
      },
      {
        // Embed sayfası: iframe'e izin ver, diğer güvenlik header'ları geçerli
        source: "/embed/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "ALLOWALL" },
          { key: "Content-Security-Policy", value: "frame-ancestors *; object-src 'none'; base-uri 'self';" },
        ],
      },
      {
        source: "/api/embed/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, OPTIONS" },
        ],
      },
    ];
  },
};

export default nextConfig;

