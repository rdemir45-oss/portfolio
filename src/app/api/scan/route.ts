import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { injectTriangleSplit } from "@/lib/scan-transform";

const SCAN_API_URL          = process.env.SCAN_API_URL ?? "";
const SCAN_API_KEY          = process.env.SCAN_API_KEY ?? "";
const SCAN_SESSION_SECRET   = process.env.SCAN_SESSION_SECRET ?? "";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function isValidViewerToken(token: string): boolean {
  if (!SCAN_SESSION_SECRET) return false;
  const dot = token.lastIndexOf(".");
  if (dot === -1) return false;
  try {
    const payload  = token.slice(0, dot);
    const sig      = token.slice(dot + 1);
    const expected = crypto.createHmac("sha256", SCAN_SESSION_SECRET).update(payload).digest("base64url");
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  // Sadece giriş yapmış kullanıcılar tarama sonuçlarına erişebilir
  const token = req.cookies.get("viewer_token")?.value;
  if (!token || !isValidViewerToken(token)) {
    return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });
  }

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
    return NextResponse.json(injectTriangleSplit(data));
  } catch {
    return NextResponse.json(
      { error: "Tarama servisine bağlanılamadı." },
      { status: 502 }
    );
  }
}

