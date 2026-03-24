import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { isAdmin, UNAUTHORIZED } from "@/lib/admin-auth";
import { adminScanWriteSchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";

// GET — admin'in atadığı tüm taramaları listele (username join ile)
export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return UNAUTHORIZED;

  // Kullanıcı adını da çek (scanner_users ile manuel join)
  const { data: scans, error } = await supabaseAdmin
    .from("admin_assigned_scans")
    .select("id, user_id, name, description, scan_type, rules, python_code, is_active, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (!scans || scans.length === 0) return NextResponse.json([]);

  // Tüm user_id'leri topla, tek sorguda kullanıcı adlarını çek
  const userIds = [...new Set(scans.map((s) => s.user_id))];
  const { data: users } = await supabaseAdmin
    .from("scanner_users")
    .select("id, username")
    .in("id", userIds);

  const usernameMap: Record<string, string> = {};
  for (const u of users ?? []) usernameMap[u.id] = u.username;

  const result = scans.map((s) => ({ ...s, username: usernameMap[s.user_id] ?? s.user_id }));

  return NextResponse.json(result);
}

// POST — yeni tarama oluştur ve kullanıcıya ata
export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return UNAUTHORIZED;

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const parsed = adminScanWriteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Geçersiz veri." }, { status: 422 });
  }

  const { user_id, name, description, scan_type, rules, python_code, is_active } = parsed.data;

  // Kullanıcının var olduğunu ve approved olduğunu doğrula
  const { data: userRow } = await supabaseAdmin
    .from("scanner_users")
    .select("id, status")
    .eq("id", user_id)
    .maybeSingle();

  if (!userRow) return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });
  if (userRow.status !== "approved") {
    return NextResponse.json({ error: "Sadece onaylı kullanıcılara tarama atanabilir." }, { status: 400 });
  }

  // scan_type doğrulaması
  if (scan_type === "rules" && (!rules || !rules.rules?.length)) {
    return NextResponse.json({ error: "Kural tabanlı tarama için en az bir kural gerekli." }, { status: 422 });
  }
  if (scan_type === "python" && !python_code?.trim()) {
    return NextResponse.json({ error: "Python tabanlı tarama için kod gerekli." }, { status: 422 });
  }

  const { data, error } = await supabaseAdmin
    .from("admin_assigned_scans")
    .insert({
      user_id,
      name: name.trim(),
      description: description?.trim() ?? null,
      scan_type,
      rules: scan_type === "rules" ? rules : null,
      python_code: scan_type === "python" ? python_code?.trim() : null,
      is_active: is_active ?? true,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data, { status: 201 });
}
