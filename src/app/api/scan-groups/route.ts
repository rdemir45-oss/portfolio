import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

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

  const { data, error } = await supabase
    .from("scan_groups")
    .select("*")
    .order("display_order", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
