import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { createAdminToken } from "@/lib/admin-auth";
import { adminLoginSchema } from "@/lib/schemas";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  // 10 deneme / 15 dakika — brute-force koruması
  const ip = getClientIp(req);
  const rl = await rateLimit(`admin-login:${ip}`, { limit: 10, windowSec: 60 * 15 });
  if (!rl.success) {
    return NextResponse.json(
      { error: "Çok fazla giriş denemesi. 15 dakika sonra tekrar deneyin." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) },
      }
    );
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const parsed = adminLoginSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const { password } = parsed.data;
  const secret = process.env.ADMIN_SECRET;

  // Timing-safe comparison to prevent secret enumeration via timing attacks
  if (!secret || !crypto.timingSafeEqual(Buffer.from(password), Buffer.from(secret))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = createAdminToken(secret);
  const res = NextResponse.json({ ok: true });
  res.cookies.set("admin_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 7 gün
    path: "/",
    sameSite: "lax",
  });
  return res;
}
