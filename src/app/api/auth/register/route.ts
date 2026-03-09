import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import crypto from "crypto";

function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, 100_000, 64, "sha512")
    .toString("hex");
  return { hash, salt };
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
      { status: 400 }
    );
  }

  if (!/^[a-z0-9_]{3,30}$/.test(username)) {
    return NextResponse.json(
      {
        error:
          "Kullanıcı adı 3-30 karakter olmalı; sadece harf, rakam ve _ içerebilir.",
      },
      { status: 400 }
    );
  }

  if (password.length < 6) {
    return NextResponse.json(
      { error: "Şifre en az 6 karakter olmalı." },
      { status: 400 }
    );
  }

  const { data: existing } = await supabase
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

  const { error } = await supabase.from("scanner_users").insert({
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
