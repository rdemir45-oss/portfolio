import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  // 3 talep / saat — spam koruması
  const ip = getClientIp(req);
  const rl = rateLimit(`whatsapp:${ip}`, { limit: 3, windowSec: 60 * 60 });
  if (!rl.success) {
    return NextResponse.json(
      { error: "Çok fazla talep gönderdiniz. 1 saat sonra tekrar deneyin." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) },
      }
    );
  }

  let body: { name?: string; surname?: string; phone?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const { name, surname, phone } = body;

  if (!name || !surname || !phone) {
    return NextResponse.json({ error: "Tüm alanlar zorunludur." }, { status: 400 });
  }

  const { error } = await supabase
    .from("whatsapp_requests")
    .insert([{ name, surname, phone }]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
