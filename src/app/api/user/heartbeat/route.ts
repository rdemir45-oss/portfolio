import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyViewerToken } from "@/lib/viewer-auth";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = verifyViewerToken(
    req.cookies.get("viewer_token")?.value,
    process.env.SCAN_SESSION_SECRET
  );
  if (!auth.ok) return NextResponse.json({ ok: false }, { status: auth.status });

  const ip = getClientIp(req);
  const rl = await rateLimit(`heartbeat:${ip}`, { limit: 5, windowSec: 60 });
  if (!rl.success) return NextResponse.json({ ok: true });

  await supabaseAdmin
    .from("scanner_users")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("id", auth.user.id);

  return NextResponse.json({ ok: true });
}
