import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { verifyViewerToken } from "@/lib/viewer-auth";

export const dynamic = "force-dynamic";

// GET — kullanıcıya atanan tüm taramaları + son sonuçları döndür
export async function GET(req: NextRequest) {
  const auth = verifyViewerToken(
    req.cookies.get("viewer_token")?.value,
    process.env.SCAN_SESSION_SECRET
  );
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const ip = getClientIp(req);
  const rl = await rateLimit(`assigned-scans:${ip}`, { limit: 30, windowSec: 60 });
  if (!rl.success) return NextResponse.json({ error: "Çok fazla istek." }, { status: 429 });

  // Kullanıcıya atanmış aktif taramaları çek
  const { data: scans, error } = await supabaseAdmin
    .from("admin_assigned_scans")
    .select("id, name, description, scan_type, rules, python_code, is_active, created_at, updated_at")
    .eq("user_id", auth.user.id)
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!scans || scans.length === 0) return NextResponse.json([]);

  // Her tarama için son çalıştırma sonucunu çek (tek sorgu, DISTINCT ON)
  const scanIds = scans.map((s) => s.id);
  const { data: results } = await supabaseAdmin
    .from("admin_assigned_scan_results")
    .select("id, scan_id, tickers, ran_at")
    .in("scan_id", scanIds)
    .eq("user_id", auth.user.id)
    .order("ran_at", { ascending: false });

  // Her scan için en son result'ı bul
  const lastResultMap: Record<string, { id: string; scan_id: string; tickers: string[]; ran_at: string }> = {};
  for (const r of results ?? []) {
    if (!lastResultMap[r.scan_id]) lastResultMap[r.scan_id] = r;
  }

  const output = scans.map((s) => ({
    ...s,
    last_result: lastResultMap[s.id] ?? null,
  }));

  return NextResponse.json(output);
}
