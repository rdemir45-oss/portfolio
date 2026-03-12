import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { isAdmin, UNAUTHORIZED } from "@/lib/admin-auth";
import { indicatorWriteSchema, indicatorUpdateSchema } from "@/lib/schemas";

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return UNAUTHORIZED;
  const id = req.nextUrl.searchParams.get("id");
  if (id) {
    const { data, error } = await supabase
      .from("indicators")
      .select("*")
      .eq("id", id)
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }
  const { data, error } = await supabase
    .from("indicators")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return UNAUTHORIZED;
  let raw: unknown;
  try { raw = await req.json(); } catch { return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 }); }
  const parsed = indicatorWriteSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Geçersiz veri." }, { status: 422 });
  }
  const { data, error } = await supabase.from("indicators").insert([parsed.data]).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PUT(req: NextRequest) {
  if (!isAdmin(req)) return UNAUTHORIZED;
  let raw: unknown;
  try { raw = await req.json(); } catch { return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 }); }
  const parsed = indicatorUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Geçersiz veri." }, { status: 422 }); 
  }
  const { id, ...fields } = parsed.data;
  const { data, error } = await supabase.from("indicators").update(fields).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  if (!isAdmin(req)) return UNAUTHORIZED;
  const id = req.nextUrl.searchParams.get("id");
  const { error } = await supabase.from("indicators").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
