import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { isAdmin, UNAUTHORIZED } from "@/lib/admin-auth";

const SUBSCRIPTION_DURATIONS: Record<string, number> = {
  weekly: 7 * 24 * 60 * 60 * 1000,
  monthly: 30 * 24 * 60 * 60 * 1000,
  yearly: 365 * 24 * 60 * 60 * 1000,
};

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return UNAUTHORIZED;

  // subscription kolonları varsa onlarla, yoksa (migrasyon henüz çalıştırılmadıysa) temel kolonlarla döner
  let { data, error } = await supabase
    .from("scanner_users")
    .select("id, username, status, plan, subscription_plan, subscription_expires_at, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    const fallback = await supabase
      .from("scanner_users")
      .select("id, username, status, plan, created_at")
      .order("created_at", { ascending: false });
    if (fallback.error) return NextResponse.json({ error: fallback.error.message }, { status: 500 });
    data = fallback.data;
  }

  return NextResponse.json(data ?? []);
}

export async function PATCH(req: NextRequest) {
  if (!isAdmin(req)) return UNAUTHORIZED;
  const id = req.nextUrl.searchParams.get("id");
  let body: { status?: string; plan?: string; subscription_plan?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const updates: Record<string, string | null> = {};

  if (body.status) {
    if (!["approved", "rejected", "pending"].includes(body.status)) {
      return NextResponse.json({ error: "Geçersiz durum." }, { status: 400 });
    }
    updates.status = body.status;
  }

  if (body.plan) {
    if (!["starter", "pro", "elite"].includes(body.plan)) {
      return NextResponse.json({ error: "Geçersiz paket." }, { status: 400 });
    }
    updates.plan = body.plan;
  }

  if (body.subscription_plan !== undefined) {
    if (body.subscription_plan === null || body.subscription_plan === "") {
      // Abonelik kaldır
      updates.subscription_plan = null;
      updates.subscription_expires_at = null;
    } else {
      if (!["weekly", "monthly", "yearly"].includes(body.subscription_plan)) {
        return NextResponse.json({ error: "Geçersiz abonelik planı." }, { status: 400 });
      }
      const duration = SUBSCRIPTION_DURATIONS[body.subscription_plan];
      updates.subscription_plan = body.subscription_plan;
      updates.subscription_expires_at = new Date(Date.now() + duration).toISOString();
    }
  }

  if (!id || Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const { error } = await supabase
    .from("scanner_users")
    .update(updates)
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  if (!isAdmin(req)) return UNAUTHORIZED;
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID gerekli." }, { status: 400 });

  const { error } = await supabase
    .from("scanner_users")
    .delete()
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
