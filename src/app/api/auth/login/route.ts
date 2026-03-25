import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
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
  sub_exp: number  // 0 = abonelik yok / süresi dolmuş; > 0 = geçerli bitiş zamanı
): string {
  const payload = Buffer.from(
    JSON.stringify({ id, username, sub_exp })
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

  const { data: user, error: userError } = await supabaseAdmin
    .from("scanner_users")
    .select("id, username, password_hash, salt, status, subscription_expires_at")
    .eq("username", username)
    .maybeSingle();

  // subscription_expires_at kolonu henüz yoksa (migrasyon bekleniyor) temel sorguya düş
  let resolvedUser = user;
  if (userError) {
    const { data: fallbackUser } = await supabaseAdmin
      .from("scanner_users")
      .select("id, username, password_hash, salt, status")
      .eq("username", username)
      .maybeSingle();
    resolvedUser = fallbackUser ? { ...fallbackUser, subscription_expires_at: null } : null;
  }

  if (!resolvedUser || !verifyPassword(password, resolvedUser.password_hash, resolvedUser.salt)) {
    return NextResponse.json(
      { error: "Kullanıcı adı veya şifre hatalı." },
      { status: 401 }
    );
  }

  if (resolvedUser.status === "pending") {
    return NextResponse.json(
      { error: "Hesabınız henüz onaylanmadı. Onaylandığında giriş yapabilirsiniz." },
      { status: 403 }
    );
  }

  if (resolvedUser.status === "rejected") {
    return NextResponse.json(
      { error: "Hesabınız reddedildi." },
      { status: 403 }
    );
  }

  // Abonelik süresi kontrolünü LOGIN'de yapmıyoruz.
  // Kullanıcı her zaman giriş yapabilmeli; abonelik kontrolü scanner sayfalarında (API route'larında) yapılır.
  // Bu sayede süresi dolmuş kullanıcılar sisteme girebilir, admin ile iletişim kurabilir.

  const secret = process.env.SCAN_SESSION_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Sunucu yapılandırma hatası." },
      { status: 500 }
    );
  }

  // sub_exp: abonelik bitiş zamanı (Unix saniye)
  // null ise 0 kullanıyoruz → token HMAC açısından geçerli ama scanner API'leri "süresi dolmuş" döndürür.
  // Bu sayede null-aboneli kullanıcılar giriş yapabilir; scanner sayfasına girince düzgün hata görür.
  const sub_exp = resolvedUser.subscription_expires_at
    ? Math.floor(new Date(resolvedUser.subscription_expires_at).getTime() / 1000)
    : 0;

  const token = createViewerToken(resolvedUser.id, resolvedUser.username, secret, sub_exp);

  // maxAge: abonelik varsa bitiş süresine kadar, yoksa 30 gün (profil / admin erişimi için)
  const nowSec = Math.floor(Date.now() / 1000);
  const maxAge = sub_exp > nowSec
    ? sub_exp - nowSec
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
