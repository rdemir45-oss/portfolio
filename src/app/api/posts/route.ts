import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  // 60 istek / dakika — scraping koruması
  const ip = getClientIp(req);
  const rl = await rateLimit(`posts:${ip}`, { limit: 60, windowSec: 60 });
  if (!rl.success) {
    return NextResponse.json([], { status: 429 });
  }

  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .order("pinned", { ascending: false })
    .order("date", { ascending: false });

  if (error) return NextResponse.json([], { status: 500 });
  return NextResponse.json(data ?? []);
}
