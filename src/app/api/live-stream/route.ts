import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
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
