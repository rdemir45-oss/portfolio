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

  // viewer_token varsa kullanıcı adını çıkar (imza doğrulaması ile)
  let username: string | undefined;
  try {
    const token = req.cookies.get("viewer_token")?.value;
    const secret = process.env.SCAN_SESSION_SECRET;
    if (token && secret) {
      const dot = token.lastIndexOf(".");
      if (dot !== -1) {
        const payload = token.slice(0, dot);
        const sig = token.slice(dot + 1);
        const expectedSig = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
        if (sig.length === expectedSig.length && crypto.timingSafeEqual(Buffer.from(sig, "utf8"), Buffer.from(expectedSig, "utf8"))) {
          const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf-8"));
          if (typeof decoded.username === "string") username = decoded.username;
        }
      }
    }
  } catch {}

  const pageChanged = upsertSession(sid, page, username);

  const now = new Date();
  const nowIso = now.toISOString();

  // visitor_log — giriş/çıkış takibi (atomic RPC)
  await supabaseAdmin.rpc("upsert_visitor_log", {
    p_sid: sid,
    p_username: username ?? null,
    p_page: page,
    p_is_new: isNew,
    p_page_changed: pageChanged,
    p_now: nowIso,
  });

  // site_stats upsert — saatlik granülite
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
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24,
      path: "/",
      sameSite: "lax",
    });
  }
  return res;
}
