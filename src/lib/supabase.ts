import { createClient } from "@supabase/supabase-js";

const rawSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const isValidHttpUrl = (url: string) => { try { const u = new URL(url); return u.protocol === "http:" || u.protocol === "https:"; } catch { return false; } };
const supabaseUrl = isValidHttpUrl(rawSupabaseUrl) ? rawSupabaseUrl : "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-taraflı API route'larında kullanılır — RLS'yi atlar.
// Railway'e SUPABASE_SERVICE_ROLE_KEY env değişkeni eklenmeli.
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : supabase; // Anahtar yoksa anon client'a düşer (geliştirme ortamı)

export type PostCategory = "Teknik Analiz" | "Eğitim" | "Duyuru";

export interface DbPost {
  id: number;
  slug: string;
  title: string;
  category: PostCategory;
  date: string;
  summary: string;
  content: string;
  tags: string[];
  pinned: boolean;
  cover_image?: string | null;
  created_at?: string;
}

export interface DbIndicator {
  id: number;
  slug: string;
  title: string;
  platform: "TradingView" | "Matriks";
  short_desc: string;
  description: string;
  cover_image?: string | null;
  images: string[];
  tags: string[];
  badge?: string | null;
  badge_color?: string | null;
  tradingview_url?: string | null;
  sort_order: number;
  created_at?: string;
}

export interface DbMessage {
  id: number;
  name: string;
  email: string;
  message: string;
  read: boolean;
  created_at: string;
}

export interface DbWhatsappRequest {
  id: number;
  name: string;
  surname: string;
  phone: string;
  created_at: string;
}

export type SubscriptionPlan = "weekly" | "monthly" | "yearly";

export interface DbScannerUser {
  id: string;
  username: string;
  phone?: string | null;
  status: "pending" | "approved" | "rejected";
  plan: "starter" | "pro" | "elite";
  subscription_plan?: SubscriptionPlan | null;
  subscription_expires_at?: string | null;
  created_at: string;
}

export interface DbLiveStream {
  id: number;
  title: string;
  stream_at: string;
  description?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface DbScanGroupKey {
  id: string;
  label: string;
}

export type ScanGroupColor = "emerald" | "sky" | "violet" | "amber" | "rose";

export interface DbScanGroup {
  id: string;
  label: string;
  description: string;
  emoji: string;
  icon: string;
  color: ScanGroupColor;
  keys: DbScanGroupKey[];
  display_order: number;
  is_bull: boolean;
  created_at?: string;
}

export interface DbCustomIndicator {
  code: string;
  name: string;
  description: string;
  script: string;
  created_at?: string;
  updated_at?: string;
}

// ── Kullanıcıya özel tarama sistemi ─────────────────────────────────────────

export type RuleIndicator =
  | "RSI" | "EMA" | "SMA" | "MACD" | "VOLUME" | "PRICE_CHANGE"
  | "BOLLINGER" | "STOCH";

export type RuleCondition =
  | "lt" | "gt" | "lte" | "gte" | "cross_above" | "cross_below"
  | "price_above" | "price_below" | "squeeze" | "spike";

export interface ScanRule {
  indicator: RuleIndicator;
  condition: RuleCondition;
  period?: number;
  period2?: number;
  value?: number;
  multiplier?: number;
}

export interface ScanRuleGroup {
  operator: "AND" | "OR";
  rules: ScanRule[];
}

export interface DbCustomScan {
  id: string;
  user_id: string;
  name: string;
  description?: string | null;
  scan_type: "rules" | "python";
  rules: ScanRuleGroup;
  python_code?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbCustomScanResult {
  id: string;
  scan_id: string;
  user_id: string;
  tickers: string[];
  ran_at: string;
}
