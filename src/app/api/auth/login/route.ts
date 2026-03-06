import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";


export async function POST(req: NextRequest) {
  const { password } = await req.json();
  const secret = process.env.SCAN_PASSWORD;

  if (!secret || !password) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Zamanlamalı saldırılara karşı sabit zamanlı karşılaştırma
  const expected = Buffer.from(secret);
  const provided = Buffer.from(password);
  const valid =
    provided.length === expected.length &&
    crypto.timingSafeEqual(expected, provided);

  if (!valid) {
    return NextResponse.json({ error: "Yanlış şifre." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("viewer_token", secret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 gün
    path: "/",
  });
  return res;
}
