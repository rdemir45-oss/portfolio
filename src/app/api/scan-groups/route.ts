import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { rateLimit } from "@/lib/rate-limit";
import { verifyViewerToken } from "@/lib/viewer-auth";

export async function GET(req: NextRequest) {
  const auth = verifyViewerToken(
    req.cookies.get("viewer_token")?.value,
    process.env.SCAN_SESSION_SECRET
  );
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  // Rate limiting: 30 istek / dakika per kullanıcı
  const rl = await rateLimit(`scan-groups:${auth.user.id}`, { limit: 30, windowSec: 60 });
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
