import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { registerSchema } from "@/lib/schemas";
import crypto from "crypto";

function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, 100_000, 64, "sha512")
    .toString("hex");
  return { hash, salt };
}

export async function POST(req: NextRequest) {
  // 5 kayıt talebi / saat — spam koruması
  const ip = getClientIp(req);
  const rl = await rateLimit(`register:${ip}`, { limit: 5, windowSec: 60 * 60 });
  if (!rl.success) {
    return NextResponse.json(
      { error: "Çok fazla kayıt denemesi. 1 saat sonra tekrar deneyin." },
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

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Geçersiz veri.";
    return NextResponse.json({ error: msg }, { status: 422 });
  }

  const { username, password } = parsed.data;

  const { data: existing } = await supabaseAdmin
    .from("scanner_users")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "Bu kullanıcı adı zaten alınmış." },
      { status: 409 }
    );
  }

  const { hash, salt } = hashPassword(password);

  const { error } = await supabaseAdmin.from("scanner_users").insert({
    username,
    password_hash: hash,
    salt,
    status: "pending",
  });

  if (error) {
    return NextResponse.json(
      { error: "Kayıt oluşturulamadı. Lütfen tekrar deneyin." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
