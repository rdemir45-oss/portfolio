import { NextResponse } from "next/server";

const SCAN_API_URL = process.env.SCAN_API_URL ?? "";
const SCAN_API_KEY = process.env.SCAN_API_KEY ?? "";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  if (!SCAN_API_URL || !SCAN_API_KEY) {
    return NextResponse.json(
      { error: "Tarama servisi yapılandırılmamış." },
      { status: 503 }
    );
  }

  try {
    const res = await fetch(`${SCAN_API_URL}/api/scan/public`, {
      headers: { "X-API-Key": SCAN_API_KEY },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Tarama servisi yanıt vermedi." },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Tarama servisine bağlanılamadı." },
      { status: 502 }
    );
  }
}
