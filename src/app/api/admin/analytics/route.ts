import { NextRequest, NextResponse } from "next/server";
import { isAdmin, UNAUTHORIZED } from "@/lib/admin-auth";
import { getActiveSessions } from "@/lib/active-sessions";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return UNAUTHORIZED;

  const sessions = getActiveSessions();

  // Son 7 günün tarihlerini oluştur
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  const since = days[0];

  const [statsRes, logRes] = await Promise.all([
    supabaseAdmin
      .from("site_stats")
      .select("date, hour, visitors, pageviews")
      .gte("date", since)
      .order("date", { ascending: true })
      .order("hour", { ascending: true }),
    supabaseAdmin
      .from("visitor_log")
      .select("sid, username, first_page, first_seen_at, last_seen_at, page_count")
      .gte("first_seen_at", new Date().toISOString().slice(0, 10) + "T00:00:00Z")
      .order("last_seen_at", { ascending: false })
      .limit(200),
  ]);

  // Günlük toplam
  const dailyMap: Record<string, { visitors: number; pageviews: number }> = {};
  for (const day of days) dailyMap[day] = { visitors: 0, pageviews: 0 };
  for (const row of statsRes.data ?? []) {
    if (dailyMap[row.date]) {
      dailyMap[row.date].visitors += row.visitors;
      dailyMap[row.date].pageviews += row.pageviews;
    }
  }
  const daily = days.map((date) => ({ date, ...dailyMap[date] }));

  // Bugünkü saatlik dağılım (son 24 saat)
  const today = days[days.length - 1];
  const hourly: number[] = Array(24).fill(0);
  for (const row of statsRes.data ?? []) {
    if (row.date === today) hourly[row.hour] = row.pageviews;
  }

  return NextResponse.json({
    sessions,
    total: sessions.length,
    daily,
    hourly,
    visitorLog: logRes.data ?? [],
  });
}
