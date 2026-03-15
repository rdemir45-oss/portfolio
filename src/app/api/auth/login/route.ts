import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { loginSchema } from "@/lib/schemas";
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

function createViewerToken(
  id: string,
  username: string,
  secret: string,
  sub_exp: number | null
): string {
  const payload = Buffer.from(
    JSON.stringify(sub_exp !== null ? { id, username, sub_exp } : { id, username })
  ).toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export async function POST(req: NextRequest) {
  // 10 deneme / 15 dakika — brute-force koruması
  const ip = getClientIp(req);
  const rl = await rateLimit(`login:${ip}`, { limit: 10, windowSec: 60 * 15 });
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

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Geçersiz veri.";
    return NextResponse.json({ error: msg }, { status: 422 });
  }

  const { username, password } = parsed.data;

  const { data: user } = await supabase
    .from("scanner_users")
    .select("id, username, password_hash, salt, status, subscription_expires_at")
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

  // Abonelik süresi kontrolü
  if (user.subscription_expires_at) {
    const expiresAt = new Date(user.subscription_expires_at).getTime();
    if (Date.now() >= expiresAt) {
      return NextResponse.json(
        { error: "Abonelik süreniz dolmuştur. Yenileme için yönetici ile iletişime geçin." },
        { status: 403 }
      );
    }
  }

  const secret = process.env.SCAN_SESSION_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Sunucu yapılandırma hatası." },
      { status: 500 }
    );
  }

  const sub_exp = user.subscription_expires_at
    ? Math.floor(new Date(user.subscription_expires_at).getTime() / 1000)
    : null;

  const token = createViewerToken(user.id, user.username, secret, sub_exp);

  // maxAge: abonelik bitiş süresi varsa ona göre, yoksa 30 gün
  const maxAge = sub_exp
    ? Math.max(sub_exp - Math.floor(Date.now() / 1000), 60)
    : 60 * 60 * 24 * 30;

  const res = NextResponse.json({ ok: true });
  res.cookies.set("viewer_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge,
    path: "/",
  });
  return res;
}
