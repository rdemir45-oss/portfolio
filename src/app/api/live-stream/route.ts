import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = await rateLimit(`live-stream:${ip}`, { limit: 30, windowSec: 60 });
  if (!rl.success) return NextResponse.json({ stream: null }, { status: 429 });

  const { data, error } = await supabase
    .from("live_streams")
    .select("id, title, stream_at, description")
    .eq("is_active", true)
    .gte("stream_at", new Date().toISOString())
    .order("stream_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) return NextResponse.json({ stream: null });
  return NextResponse.json({ stream: data ?? null });
}
