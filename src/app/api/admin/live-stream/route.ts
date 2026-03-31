import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { isAdmin, UNAUTHORIZED } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return UNAUTHORIZED;
  const { data, error } = await supabaseAdmin
    .from("live_streams")
    .select("*")
    .order("stream_at", { ascending: false })
    .limit(20);

  if (error) return NextResponse.json({ error: "Veri alınamadı." }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return UNAUTHORIZED;
  let body: { title?: string; stream_at?: string; description?: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const { title, stream_at, description } = body;
  if (!title?.trim() || !stream_at) {
    return NextResponse.json({ error: "Başlık ve tarih gerekli." }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("live_streams")
    .insert({ title: title.trim(), stream_at, description: description?.trim() ?? null, is_active: true })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: "Kayıt oluşturulamadı." }, { status: 500 });
  return NextResponse.json({ ok: true, id: data.id });
}

export async function DELETE(req: NextRequest) {
  if (!isAdmin(req)) return UNAUTHORIZED;
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID gerekli." }, { status: 400 });

  const { error } = await supabaseAdmin.from("live_streams").delete().eq("id", Number(id));
  if (error) return NextResponse.json({ error: "Silme işlemi başarısız." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
