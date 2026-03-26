import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { contactSchema } from "@/lib/schemas";

export async function POST(req: NextRequest) {
  // 5 mesaj / saat
  const ip = getClientIp(req);
  const rl = await rateLimit(`contact:${ip}`, { limit: 5, windowSec: 60 * 60 });
  if (!rl.success) {
    return NextResponse.json(
      { error: "Çok fazla mesaj gönderdiniz. 1 saat sonra tekrar deneyin." },
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

  const parsed = contactSchema.safeParse(raw);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Geçersiz veri.";
    return NextResponse.json({ error: message }, { status: 422 });
  }

  const { name, email, message } = parsed.data;

  const { error } = await supabase
    .from("messages")
    .insert([{ name, email, message, read: false }]);

  if (error) {
    return NextResponse.json({ error: "Mesaj gönderilemedi. Lütfen tekrar deneyin." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
