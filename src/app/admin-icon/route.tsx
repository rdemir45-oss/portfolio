import { ImageResponse } from "next/og";

export const runtime = "edge";

export function GET() {
  const s = 192;

  return new ImageResponse(
    (
      <div
        style={{
          width: s,
          height: s,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0505",
          borderRadius: s * 0.22,
        }}
      >
        {/* Kırmızı arka vurgu */}
        <div
          style={{
            position: "absolute",
            width: s * 0.7,
            height: s * 0.7,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(220,38,38,0.25) 0%, transparent 70%)",
          }}
        />
        {/* "Rd" yazısı — kırmızı tema */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            lineHeight: 1,
          }}
        >
          <span
            style={{
              fontSize: s * 0.42,
              fontWeight: 900,
              color: "#dc2626",
              letterSpacing: "-0.04em",
              fontFamily: "sans-serif",
            }}
          >
            RD
          </span>
          <span
            style={{
              fontSize: s * 0.13,
              fontWeight: 700,
              color: "rgba(220,80,80,0.75)",
              letterSpacing: "0.18em",
              fontFamily: "sans-serif",
              marginTop: s * 0.02,
            }}
          >
            ADMIN
          </span>
        </div>
      </div>
    ),
    { width: s, height: s }
  );
}
