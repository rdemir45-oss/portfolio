import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { isAdmin, UNAUTHORIZED } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return UNAUTHORIZED;
  const { data, error } = await supabaseAdmin
    .from("messages")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: "Veri alınamadı." }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// PATCH ?id=xx  →  okundu olarak işaretle
export async function PATCH(req: NextRequest) {
  if (!isAdmin(req)) return UNAUTHORIZED;
  const id = req.nextUrl.searchParams.get("id");
  const { error } = await supabaseAdmin.from("messages").update({ read: true }).eq("id", id);
  if (error) return NextResponse.json({ error: "Güncelleme başarısız." }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  if (!isAdmin(req)) return UNAUTHORIZED;
  const id = req.nextUrl.searchParams.get("id");
  const { error } = await supabaseAdmin.from("messages").delete().eq("id", id);
  if (error) return NextResponse.json({ error: "Silme işlemi başarısız." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
