import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  // 5 mesaj / saat
  const ip = getClientIp(req);
  const rl = rateLimit(`contact:${ip}`, { limit: 5, windowSec: 60 * 60 });
  if (!rl.success) {
    return NextResponse.json(
      { error: "Çok fazla mesaj gönderdiniz. 1 saat sonra tekrar deneyin." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) },
      }
    );
  }

  const { name, email, message } = await req.json();

  if (!name || !email || !message) {
    return NextResponse.json({ error: "Tüm alanlar zorunludur." }, { status: 400 });
  }

  const { error } = await supabase
    .from("messages")
    .insert([{ name, email, message, read: false }]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
