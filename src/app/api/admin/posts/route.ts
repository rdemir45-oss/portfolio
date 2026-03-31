import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { isAdmin, UNAUTHORIZED } from "@/lib/admin-auth";
import { postWriteSchema, postUpdateSchema } from "@/lib/schemas";

// GET /api/admin/posts  or  /api/admin/posts?id=xx
export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return UNAUTHORIZED;
  const id = req.nextUrl.searchParams.get("id");
  if (id) {
    const { data, error } = await supabaseAdmin.from("posts").select("*").eq("id", id).single();
    if (error) return NextResponse.json({ error: "Veri alınamadı." }, { status: 500 });
    return NextResponse.json(data);
  }
  const { data, error } = await supabaseAdmin
    .from("posts")
    .select("*")
    .order("date", { ascending: false });
  if (error) return NextResponse.json({ error: "Veri alınamadı." }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/admin/posts
export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return UNAUTHORIZED;
  let raw: unknown;
  try { raw = await req.json(); } catch { return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 }); }
  const parsed = postWriteSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Geçersiz veri." }, { status: 422 });
  }
  const { data, error } = await supabaseAdmin.from("posts").insert([parsed.data]).select().single();
  if (error) return NextResponse.json({ error: "Kayıt oluşturulamadı." }, { status: 500 });
  return NextResponse.json(data);
}

// PUT /api/admin/posts  (body: { id, ...fields })
export async function PUT(req: NextRequest) {
  if (!isAdmin(req)) return UNAUTHORIZED;
  let raw: unknown;
  try { raw = await req.json(); } catch { return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 }); }
  const parsed = postUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Geçersiz veri." }, { status: 422 }); 
  }
  const { id, ...fields } = parsed.data;
  const { data, error } = await supabaseAdmin.from("posts").update(fields).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: "Güncelleme başarısız." }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE /api/admin/posts?id=xx
export async function DELETE(req: NextRequest) {
  if (!isAdmin(req)) return UNAUTHORIZED;
  const id = req.nextUrl.searchParams.get("id");
  if (!id || isNaN(Number(id))) {
    return NextResponse.json({ error: "Geçersiz ID." }, { status: 400 });
  }
  const { error } = await supabaseAdmin.from("posts").delete().eq("id", Number(id));
  if (error) return NextResponse.json({ error: "Silme işlemi başarısız." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
