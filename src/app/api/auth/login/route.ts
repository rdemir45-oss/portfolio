import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import crypto from "crypto";

function verifyPassword(password: string, hash: string, salt: string): boolean {
  try {
    const candidate = crypto
      .pbkdf2Sync(password, salt, 100_000, 64, "sha512")
      .toString("hex");
    return crypto.timingSafeEqual(Buffer.from(candidate), Buffer.from(hash));
  } catch {
    return false;
  }
}

function createViewerToken(id: string, username: string, secret: string): string {
  const payload = Buffer.from(JSON.stringify({ id, username })).toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export async function POST(req: NextRequest) {
  let body: { username?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const username = (body.username ?? "").trim().toLowerCase();
  const password = body.password ?? "";

  if (!username || !password) {
    return NextResponse.json(
      { error: "Kullanıcı adı ve şifre gerekli." },
      { status: 401 }
    );
  }

  const { data: user } = await supabase
    .from("scanner_users")
    .select("id, username, password_hash, salt, status")
    .eq("username", username)
    .maybeSingle();

  if (!user || !verifyPassword(password, user.password_hash, user.salt)) {
    return NextResponse.json(
      { error: "Kullanıcı adı veya şifre hatalı." },
      { status: 401 }
    );
  }

  if (user.status === "pending") {
    return NextResponse.json(
      { error: "Hesabınız henüz onaylanmadı. Onaylandığında giriş yapabilirsiniz." },
      { status: 403 }
    );
  }

  if (user.status === "rejected") {
    return NextResponse.json(
      { error: "Hesabınız reddedildi." },
      { status: 403 }
    );
  }

  const secret = process.env.SCAN_SESSION_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Sunucu yapılandırma hatası." },
      { status: 500 }
    );
  }

  const token = createViewerToken(user.id, user.username, secret);

  const res = NextResponse.json({ ok: true });
  res.cookies.set("viewer_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 gün
    path: "/",
  });
  return res;
}
