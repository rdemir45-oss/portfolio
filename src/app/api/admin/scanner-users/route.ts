import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { isAdmin, UNAUTHORIZED } from "@/lib/admin-auth";
import { clearRateLimit } from "@/lib/rate-limit";
import crypto from "crypto";

const SUBSCRIPTION_DURATIONS: Record<string, number> = {
  weekly: 7 * 24 * 60 * 60 * 1000,
  monthly: 30 * 24 * 60 * 60 * 1000,
  yearly: 365 * 24 * 60 * 60 * 1000,
};

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return UNAUTHORIZED;

  const { data, error } = await supabaseAdmin
    .from("scanner_users")
    .select("id, username, status, plan, subscription_plan, subscription_expires_at, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    // subscription kolonları henüz yoksa (migrasyon çalıştırılmamış) fallback
    const fallback = await supabaseAdmin
      .from("scanner_users")
      .select("id, username, status, plan, created_at")
      .order("created_at", { ascending: false });
    if (fallback.error) return NextResponse.json({ error: fallback.error.message }, { status: 500 });
    return NextResponse.json(fallback.data ?? []);
  }

  return NextResponse.json(data ?? []);
}

export async function PATCH(req: NextRequest) {
  if (!isAdmin(req)) return UNAUTHORIZED;
  const id = req.nextUrl.searchParams.get("id");
  let body: { status?: string; plan?: string; subscription_plan?: string; action?: string; ip?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  // ── Şifre sıfırlama ──────────────────────────────────────────────────────
  if (body.action === "reset-password") {
    if (!id) return NextResponse.json({ error: "ID gerekli." }, { status: 400 });
    const tempPassword = crypto.randomBytes(5).toString("hex"); // 10 karakter hex
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto.pbkdf2Sync(tempPassword, salt, 100_000, 64, "sha512").toString("hex");
    const { error } = await supabaseAdmin
      .from("scanner_users")
      .update({ password_hash: hash, salt })
      .eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, tempPassword });
  }

  // ── Rate limit sıfırlama ─────────────────────────────────────────────────
  if (body.action === "clear-ratelimit") {
    const ip = body.ip?.trim();
    if (!ip) return NextResponse.json({ error: "IP gerekli." }, { status: 400 });
    await clearRateLimit(`login:${ip}`);
    return NextResponse.json({ ok: true });
  }

  const updates: Record<string, string | null> = {};

  if (body.status) {
    if (!["approved", "rejected", "pending"].includes(body.status)) {
      return NextResponse.json({ error: "Geçersiz durum." }, { status: 400 });
    }
    updates.status = body.status;

    // "approved" yapılınca: eğer mevcut aboneliği yoksa veya süresi dolmuşsa
    // otomatik olarak 1 aylık abonelik başlat.
    if (body.status === "approved" && id) {
      const { data: existing } = await supabaseAdmin
        .from("scanner_users")
        .select("subscription_expires_at")
        .eq("id", id)
        .maybeSingle();

      const hasActiveSubscription =
        existing?.subscription_expires_at &&
        new Date(existing.subscription_expires_at).getTime() > Date.now();

      if (!hasActiveSubscription) {
        updates.subscription_plan = "monthly";
        updates.subscription_expires_at = new Date(
          Date.now() + SUBSCRIPTION_DURATIONS.monthly
        ).toISOString();
      }
    }
  }

  if (body.plan) {
    if (!["starter", "pro", "elite"].includes(body.plan)) {
      return NextResponse.json({ error: "Geçersiz paket." }, { status: 400 });
    }
    updates.plan = body.plan;
  }

  if (body.subscription_plan !== undefined) {
    if (body.subscription_plan === null || body.subscription_plan === "") {
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

  const { error } = await supabaseAdmin
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

  const { error } = await supabaseAdmin
    .from("scanner_users")
    .delete()
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
