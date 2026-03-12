import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import crypto from "crypto";
import type { ScanRuleGroup } from "@/lib/supabase";
import { validateScanCode } from "@/lib/scan-code-validator";

export const dynamic = "force-dynamic";

function getUserFromToken(token: string, secret: string) {
  const dot = token.lastIndexOf(".");
  if (dot === -1) return null;
  try {
    const payload  = token.slice(0, dot);
    const sig      = token.slice(dot + 1);
    const expected = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
    if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) return null;
    const decoded  = JSON.parse(Buffer.from(payload, "base64url").toString("utf-8"));
    if (!decoded.id || !decoded.username) return null;
    return { id: decoded.id as string, username: decoded.username as string };
  } catch { return null; }
}

function getUser(req: NextRequest) {
  const token  = req.cookies.get("viewer_token")?.value;
  const secret = process.env.SCAN_SESSION_SECRET;
  if (!token || !secret) return null;
  return getUserFromToken(token, secret);
}

function validateRules(rules: unknown): rules is ScanRuleGroup {
  if (!rules || typeof rules !== "object") return false;
  const r = rules as Record<string, unknown>;
  if (r.operator !== "AND" && r.operator !== "OR") return false;
  if (!Array.isArray(r.rules) || r.rules.length === 0 || r.rules.length > 10) return false;
  const validIndicators = new Set(["RSI","EMA","SMA","MACD","VOLUME","PRICE_CHANGE","BOLLINGER","STOCH"]);
  const validConditions = new Set(["lt","gt","lte","gte","cross_above","cross_below","price_above","price_below","squeeze","spike"]);
  for (const rule of r.rules as unknown[]) {
    if (!rule || typeof rule !== "object") return false;
    const rr = rule as Record<string, unknown>;
    if (!validIndicators.has(rr.indicator as string)) return false;
    if (!validConditions.has(rr.condition as string)) return false;
    if (rr.period !== undefined && (typeof rr.period !== "number" || rr.period < 1 || rr.period > 200)) return false;
    if (rr.value  !== undefined && (typeof rr.value !== "number")) return false;
  }
  return true;
}

// PATCH — taramayı güncelle
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getUser(req);
  if (!user) return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });

  const { id } = await params;

  // Sahiplik kontrolü
  const { data: existing } = await supabase
    .from("custom_scans")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!existing) return NextResponse.json({ error: "Tarama bulunamadı." }, { status: 404 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const updates: Record<string, unknown> = {};

  if (b.name !== undefined) {
    const name = (b.name as string | null | undefined ?? "").toString().trim().slice(0, 60);
    if (!name) return NextResponse.json({ error: "Tarama adı boş olamaz." }, { status: 422 });
    updates.name = name;
  }
  if (b.description !== undefined) updates.description = b.description?.toString().trim().slice(0, 200) || null;
  if (b.is_active !== undefined)   updates.is_active   = Boolean(b.is_active);

  if (b.scan_type !== undefined) {
    const scanType = b.scan_type === "python" ? "python" : "rules";
    updates.scan_type = scanType;

    if (scanType === "python") {
      const pythonCode = typeof b.python_code === "string" ? b.python_code : "";
      const validation = validateScanCode(pythonCode);
      if (!validation.valid) return NextResponse.json({ error: validation.error }, { status: 422 });
      updates.python_code = pythonCode;
    } else {
      if (b.rules !== undefined) {
        if (!validateRules(b.rules)) return NextResponse.json({ error: "Geçersiz kural yapısı." }, { status: 422 });
        updates.rules = b.rules;
      }
      updates.python_code = null;
    }
  } else {
    if (b.python_code !== undefined && b.python_code !== null) {
      const pythonCode = typeof b.python_code === "string" ? b.python_code : "";
      const validation = validateScanCode(pythonCode);
      if (!validation.valid) return NextResponse.json({ error: validation.error }, { status: 422 });
      updates.python_code = pythonCode;
    }
    if (b.rules !== undefined) {
      if (!validateRules(b.rules)) return NextResponse.json({ error: "Geçersiz kural yapısı." }, { status: 422 });
      updates.rules = b.rules;
    }
  }

  const { data, error } = await supabase
    .from("custom_scans")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id, name, description, scan_type, rules, python_code, is_active, created_at, updated_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE — taramayı sil
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getUser(req);
  if (!user) return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });

  const { id } = await params;

  const { error } = await supabase
    .from("custom_scans")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
