import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import crypto from "crypto";
import type { ScanRuleGroup } from "@/lib/supabase";
import { validateScanCode } from "@/lib/scan-code-validator";

export const dynamic = "force-dynamic";

// ── Plan limitleri ────────────────────────────────────────────────────────────
const PLAN_LIMITS: Record<string, number> = {
  starter: 1,
  pro:     5,
  elite:   20,
};

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
    if (rr.value  !== undefined && (typeof rr.value  !== "number")) return false;
  }
  return true;
}

// GET — kullanıcının tüm taramaları
export async function GET(req: NextRequest) {
  const user = getUser(req);
  if (!user) return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from("custom_scans")
    .select("id, name, description, scan_type, rules, python_code, is_active, created_at, updated_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// POST — yeni tarama oluştur
export async function POST(req: NextRequest) {
  const user = getUser(req);
  if (!user) return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });

  // Plan limiti kontrolü
  const { data: userRow } = await supabaseAdmin
    .from("scanner_users")
    .select("plan")
    .eq("id", user.id)
    .maybeSingle();

  const plan  = userRow?.plan ?? "starter";
  const limit = PLAN_LIMITS[plan] ?? 1;

  const { count } = await supabaseAdmin
    .from("custom_scans")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  if ((count ?? 0) >= limit) {
    return NextResponse.json(
      { error: `${plan} planında en fazla ${limit} özel tarama oluşturabilirsiniz.` },
      { status: 403 }
    );
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const name = ((b.name ?? "") as string).toString().trim().slice(0, 60);
  const description = (b.description ?? "").toString().trim().slice(0, 200) || null;
  const scanType = b.scan_type === "python" ? "python" : "rules";

  if (!name) return NextResponse.json({ error: "Tarama adı gerekli." }, { status: 422 });

  if (scanType === "python") {
    // Python kodu modunda
    const pythonCode = typeof b.python_code === "string" ? b.python_code : "";
    const validation = validateScanCode(pythonCode);
    if (!validation.valid) return NextResponse.json({ error: validation.error }, { status: 422 });

    const { data, error } = await supabaseAdmin
      .from("custom_scans")
      .insert({
        user_id: user.id, name, description,
        scan_type: "python",
        python_code: pythonCode,
        rules: { operator: "AND", rules: [] },
      })
      .select("id, name, description, scan_type, rules, python_code, is_active, created_at, updated_at")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  }

  // Kural modu
  if (!validateRules(b.rules)) return NextResponse.json({ error: "Geçersiz kural yapısı." }, { status: 422 });

  const { data, error } = await supabaseAdmin
    .from("custom_scans")
    .insert({ user_id: user.id, name, description, scan_type: "rules", rules: b.rules })
    .select("id, name, description, scan_type, rules, python_code, is_active, created_at, updated_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
