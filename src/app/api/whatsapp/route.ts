import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { whatsappSchema } from "@/lib/schemas";

export async function POST(req: NextRequest) {
  // 3 talep / saat — spam koruması
  const ip = getClientIp(req);
  const rl = await rateLimit(`whatsapp:${ip}`, { limit: 3, windowSec: 60 * 60 });
  if (!rl.success) {
    return NextResponse.json(
      { error: "Çok fazla talep gönderdiniz. 1 saat sonra tekrar deneyin." },
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

  const parsed = whatsappSchema.safeParse(raw);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Geçersiz veri.";
    return NextResponse.json({ error: msg }, { status: 422 });
  }

  const { name, surname, phone } = parsed.data;

  const { error } = await supabase
    .from("whatsapp_requests")
    .insert([{ name, surname, phone }]);

  if (error) {
    return NextResponse.json({ error: "Talep kaydedilemedi. Lütfen tekrar deneyin." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
