import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

function getUserFromToken(token: string): { id: string; username: string } | null {
  const dot = token.lastIndexOf(".");
  if (dot === -1) return null;
  try {
    const payload = token.slice(0, dot);
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf-8"));
    if (!decoded.id || !decoded.username) return null;
    return { id: decoded.id, username: decoded.username };
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get("viewer_token")?.value;
  if (!token) return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });

  const user = getUserFromToken(token);
  if (!user) return NextResponse.json({ error: "Geçersiz token." }, { status: 401 });

  // Rate limiting: 30 istek / dakika per kullanıcı
  const rl = await rateLimit(`scan-groups:${user.id}`, { limit: 30, windowSec: 60 });
  if (!rl.success) {
    return NextResponse.json(
      { error: "Çok fazla istek. Lütfen bekleyin." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
    );
  }

  const { data, error } = await supabase
    .from("scan_groups")
    // Yalnızca UI için gereken alanlar — strateji meta verisi gizlenir
    .select("id, label, description, emoji, icon, color, keys, display_order, is_bull")
    .order("display_order", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Cache: CDN / tarayıcı önbelleklemesini engelle (her zaman sunucudan gelsin)
  return NextResponse.json(data ?? [], {
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
