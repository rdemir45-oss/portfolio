import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const revalidate = 0;

const SCAN_API_URL = process.env.SCAN_API_URL ?? "";
const SCAN_API_KEY = process.env.SCAN_API_KEY ?? "";

const BEAR_KEYS = [
  "death_cross",
  "obo_break",
  "ikili_tepe_break",
  "rsi_desc_break",
  "triangle_break_down",
  "rsi_ob",
  "harmonic_short",
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function splitTriangle(categories: any[]): any[] {
  const triIdx = categories.findIndex((c) => c.key === "triangle_break");
  if (triIdx === -1) return categories;
  const tri = categories[triIdx];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stocks: any[] = tri.stocks ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const upStocks = stocks.filter((s: any) => (s?.formationData?.direction ?? 1) >= 0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const downStocks = stocks.filter((s: any) => (s?.formationData?.direction ?? 0) < 0);
  return [
    ...categories.slice(0, triIdx),
    {
      ...tri,
      key: "triangle_break_up",
      label: "Üçgen Yukarı Kıran",
      stocks: upStocks,
      count: upStocks.length,
    },
    {
      ...tri,
      key: "triangle_break_down",
      label: "Üçgen Aşağı Kıran",
      stocks: downStocks,
      count: downStocks.length,
    },
    ...categories.slice(triIdx + 1),
  ];
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;

  if (!SCAN_API_URL || !SCAN_API_KEY) {
    return new Response("Not configured", { status: 503 });
  }

  try {
    const res = await fetch(`${SCAN_API_URL}/api/scan/public`, {
      headers: { "X-API-Key": SCAN_API_KEY },
      cache: "no-store",
    });
    if (!res.ok) return new Response("Upstream error", { status: 502 });

    const data = await res.json();
    const categories = splitTriangle(data?.categories ?? []);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cat = categories.find((c: any) => c.key === key);
    if (!cat) return new Response("Not found", { status: 404 });

    const tickers: string[] = (cat.stocks ?? [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((r: any) => (typeof r === "string" ? r : r.ticker))
      .slice(0, 24);

    const isBull = !BEAR_KEYS.includes(key);
    const accentColor = isBull ? "#34d399" : "#f87171";
    const accentBg = isBull ? "rgba(6,78,59,0.5)" : "rgba(76,5,25,0.5)";
    const accentBorder = isBull ? "rgba(52,211,153,0.3)" : "rgba(248,113,113,0.3)";

    const date = new Date().toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    return new ImageResponse(
      (
        <div
          style={{
            width: "1200px",
            height: "630px",
            background: "linear-gradient(135deg, #050a0e 0%, #0a1628 70%, #050a0e 100%)",
            display: "flex",
            flexDirection: "column",
            padding: "48px 56px",
            fontFamily: "'Helvetica Neue', Arial, sans-serif",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "32px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  background: accentColor,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "24px",
                  fontWeight: 900,
                  color: "#050a0e",
                }}
              >
                R
              </div>
              <span
                style={{
                  color: accentColor,
                  fontSize: "24px",
                  fontWeight: 900,
                  letterSpacing: "0.08em",
                }}
              >
                RdAlgo
              </span>
            </div>
            <span style={{ color: "#475569", fontSize: "16px" }}>
              BIST · {date}
            </span>
          </div>

          {/* Category */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "20px",
              background: accentBg,
              borderRadius: "18px",
              padding: "22px 32px",
              border: `1px solid ${accentBorder}`,
              marginBottom: "28px",
            }}
          >
            <span style={{ fontSize: "52px", lineHeight: 1 }}>{cat.emoji}</span>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <span
                style={{
                  color: "#ffffff",
                  fontSize: "34px",
                  fontWeight: 900,
                  lineHeight: 1,
                }}
              >
                {cat.label}
              </span>
              <span
                style={{
                  color: accentColor,
                  fontSize: "18px",
                  fontWeight: 600,
                }}
              >
                {cat.count} hisse sinyal verdi
              </span>
            </div>
          </div>

          {/* Tickers */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", flex: 1 }}>
            {tickers.map((ticker: string) => (
              <div
                key={ticker}
                style={{
                  background: `${accentColor}18`,
                  border: `1px solid ${accentColor}40`,
                  borderRadius: "10px",
                  padding: "7px 16px",
                  color: accentColor,
                  fontSize: "18px",
                  fontWeight: 700,
                }}
              >
                #{ticker}
              </div>
            ))}
            {cat.count > 24 && (
              <div
                style={{
                  color: "#475569",
                  fontSize: "18px",
                  alignSelf: "center",
                  paddingLeft: "4px",
                }}
              >
                +{cat.count - 24} hisse
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "24px",
              paddingTop: "18px",
              borderTop: "1px solid #1e293b",
            }}
          >
            <span style={{ color: "#334155", fontSize: "15px" }}>
              recepdemirborsa.com
            </span>
            <div style={{ display: "flex", gap: "12px" }}>
              {["#bist", "#borsa", "#hisse"].map((tag) => (
                <span key={tag} style={{ color: "#475569", fontSize: "15px" }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    );
  } catch {
    return new Response("Error generating image", { status: 500 });
  }
}
