import { NextRequest, NextResponse } from "next/server";
import { upsertSession } from "@/lib/active-sessions";
import { supabaseAdmin } from "@/lib/supabase";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let sid = req.cookies.get("anon_sid")?.value;
  const isNew = !sid;
  if (!sid) {
    sid = crypto.randomBytes(16).toString("hex");
  }

  const ip = getClientIp(req);
  const rl = await rateLimit(`analytics:${ip}`, { limit: 6, windowSec: 60 });
  if (!rl.success) return NextResponse.json({ ok: true });

  let body: { page?: unknown } = {};
  try { body = await req.json(); } catch {}
  const page = typeof body.page === "string" ? body.page.slice(0, 200) : "/";

  // viewer_token varsa kullanıcı adını çıkar (best-effort, imza kontrol etmeden)
  let username: string | undefined;
  try {
    const token = req.cookies.get("viewer_token")?.value;
    const secret = process.env.SCAN_SESSION_SECRET;
    if (token && secret) {
      const dot = token.lastIndexOf(".");
      if (dot !== -1) {
        const decoded = JSON.parse(Buffer.from(token.slice(0, dot), "base64url").toString("utf-8"));
        if (typeof decoded.username === "string") username = decoded.username;
      }
    }
  } catch {}

  const pageChanged = upsertSession(sid, page, username);

  // Supabase site_stats upsert — saatlik granülite
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const hour = now.getUTCHours();
  await supabaseAdmin.rpc("increment_site_stats", {
    p_date: dateStr,
    p_hour: hour,
    p_visitors: isNew ? 1 : 0,
    p_pageviews: pageChanged ? 1 : 0,  // sadece sayfa değişince say
  });

  const res = NextResponse.json({ ok: true });
  if (isNew) {
    res.cookies.set("anon_sid", sid, {
      httpOnly: true,
      maxAge: 60 * 60 * 24,
      path: "/",
      sameSite: "lax",
    });
  }
  return res;
}
