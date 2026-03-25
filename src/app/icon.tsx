import { ImageResponse } from "next/og";

export const size = { width: 192, height: 192 };
export const contentType = "image/png";

export default function Icon({ searchParams }: { searchParams?: { size?: string } }) {
  const s = searchParams?.size === "512" ? 512 : 192;

  return new ImageResponse(
    (
      <div
        style={{
          width: s,
          height: s,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#050a0e",
          borderRadius: s * 0.22,
        }}
      >
        {/* Yeşil arka vurgu */}
        <div
          style={{
            position: "absolute",
            width: s * 0.7,
            height: s * 0.7,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(16,185,129,0.18) 0%, transparent 70%)",
          }}
        />
        {/* "Rd" yazısı */}
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
              color: "#10b981",
              letterSpacing: "-0.04em",
              fontFamily: "sans-serif",
            }}
          >
            Rd
          </span>
          <span
            style={{
              fontSize: s * 0.13,
              fontWeight: 700,
              color: "rgba(100,200,150,0.7)",
              letterSpacing: "0.18em",
              fontFamily: "sans-serif",
              marginTop: s * 0.02,
            }}
          >
            ALGO
          </span>
        </div>
      </div>
    ),
    { width: s, height: s }
  );
}
