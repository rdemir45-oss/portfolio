import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import crypto from "crypto";

function getUserFromToken(token: string, secret: string): { id: string; username: string } | null {
  const dot = token.lastIndexOf(".");
  if (dot === -1) return null;
  try {
    const payload = token.slice(0, dot);
    const sig = token.slice(dot + 1);
    const expected = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
    if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) return null;
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf-8"));
    if (!decoded.id || !decoded.username) return null;
    return { id: decoded.id, username: decoded.username };
  } catch {
    return null;
  }
}

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

function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, 100_000, 64, "sha512")
    .toString("hex");
  return { hash, salt };
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = await rateLimit(`change-password:${ip}`, { limit: 5, windowSec: 60 * 15 });
  if (!rl.success) {
    return NextResponse.json(
      { error: "Çok fazla deneme. 15 dakika sonra tekrar deneyin." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) },
      }
    );
  }

  const token = req.cookies.get("viewer_token")?.value;
  if (!token) return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });

  const secret = process.env.SCAN_SESSION_SECRET;
  if (!secret) return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });

  const user = getUserFromToken(token, secret);
  if (!user) return NextResponse.json({ error: "Geçersiz token." }, { status: 401 });

  let body: { currentPassword?: string; newPassword?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const currentPassword = (body.currentPassword ?? "").toString();
  const newPassword = (body.newPassword ?? "").toString();

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "Tüm alanlar zorunludur." }, { status: 400 });
  }

  if (newPassword.length < 6 || newPassword.length > 200) {
    return NextResponse.json(
      { error: "Yeni şifre 6-200 karakter arasında olmalıdır." },
      { status: 422 }
    );
  }

  // Fetch current hash+salt
  const { data: row, error: fetchErr } = await supabaseAdmin
    .from("scanner_users")
    .select("password_hash, salt")
    .eq("id", user.id)
    .maybeSingle();

  if (fetchErr || !row) {
    return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });
  }

  if (!verifyPassword(currentPassword, row.password_hash, row.salt)) {
    return NextResponse.json({ error: "Mevcut şifre hatalı." }, { status: 401 });
  }

  const { hash: newHash, salt: newSalt } = hashPassword(newPassword);

  const { error: updateErr } = await supabaseAdmin
    .from("scanner_users")
    .update({ password_hash: newHash, salt: newSalt })
    .eq("id", user.id);

  if (updateErr) {
    return NextResponse.json({ error: "Şifre güncellenemedi." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
