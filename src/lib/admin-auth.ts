import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const TOKEN_EXPIRY_SEC = 60 * 60 * 24 * 7; // 7 gün

/**
 * HMAC-SHA256 imzalı admin oturum token'ı üretir.
 * Cookie'de ham ADMIN_SECRET yerine imzalı token saklanır.
 */
export function createAdminToken(secret: string): string {
  const exp = Math.floor(Date.now() / 1000) + TOKEN_EXPIRY_SEC;
  const payload = Buffer.from(JSON.stringify({ exp })).toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

/**
 * Token'ı doğrular: imza + süre kontrolü.
 * timingSafeEqual ile zamanlama saldırılarına karşı koruma sağlar.
 */
export function isAdmin(req: NextRequest): boolean {
  const token = req.cookies.get("admin_token")?.value;
  const secret = process.env.ADMIN_SECRET;
  if (!token || !secret) return false;

  const dot = token.lastIndexOf(".");
  if (dot === -1) return false;

  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);

  // İmza doğrulama (timing-safe)
  const expectedSig = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  try {
    const givenBuf = Buffer.from(sig, "base64url");
    const expectedBuf = Buffer.from(expectedSig, "base64url");
    if (givenBuf.length !== expectedBuf.length) return false;
    if (!crypto.timingSafeEqual(givenBuf, expectedBuf)) return false;
  } catch {
    return false;
  }

  // Süre kontrolü
  try {
    const { exp } = JSON.parse(Buffer.from(payload, "base64url").toString());
    return typeof exp === "number" && Math.floor(Date.now() / 1000) < exp;
  } catch {
    return false;
  }
}

export const UNAUTHORIZED = NextResponse.json(
  { error: "Yetkisiz erişim." },
  { status: 401 }
);
