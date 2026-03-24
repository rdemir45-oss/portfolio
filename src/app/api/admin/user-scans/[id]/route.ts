import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { isAdmin, UNAUTHORIZED } from "@/lib/admin-auth";
import { adminScanUpdateSchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";

// PATCH — taramayı güncelle
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdmin(req)) return UNAUTHORIZED;

  const { id } = await params;

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const parsed = adminScanUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Geçersiz veri." }, { status: 422 });
  }

  const updates: Record<string, unknown> = {};
  const d = parsed.data;

  if (d.name        !== undefined) updates.name        = d.name.trim();
  if (d.description !== undefined) updates.description = d.description?.trim() ?? null;
  if (d.scan_type   !== undefined) updates.scan_type   = d.scan_type;
  if (d.is_active   !== undefined) updates.is_active   = d.is_active;

  if (d.scan_type === "rules") {
    updates.rules       = d.rules ?? null;
    updates.python_code = null;
  } else if (d.scan_type === "python") {
    updates.python_code = d.python_code?.trim() ?? null;
    updates.rules       = null;
  } else {
    if (d.rules       !== undefined) updates.rules       = d.rules;
    if (d.python_code !== undefined) updates.python_code = d.python_code?.trim() ?? null;
  }

  // Taramanın var olduğunu doğrula
  const { data: existing } = await supabaseAdmin
    .from("admin_assigned_scans")
    .select("id")
    .eq("id", id)
    .maybeSingle();

  if (!existing) return NextResponse.json({ error: "Tarama bulunamadı." }, { status: 404 });

  const { data, error } = await supabaseAdmin
    .from("admin_assigned_scans")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

// DELETE — taramayı sil
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdmin(req)) return UNAUTHORIZED;

  const { id } = await params;

  const { error } = await supabaseAdmin
    .from("admin_assigned_scans")
    .delete()
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
