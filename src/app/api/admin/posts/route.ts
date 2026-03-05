import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/admin/posts
export async function GET() {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .order("date", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/admin/posts
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { data, error } = await supabase.from("posts").insert([body]).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// PUT /api/admin/posts  (body: { id, ...fields })
export async function PUT(req: NextRequest) {
  const { id, ...fields } = await req.json();
  const { data, error } = await supabase.from("posts").update(fields).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE /api/admin/posts?id=xx
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  const { error } = await supabase.from("posts").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
