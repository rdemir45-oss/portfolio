import { z } from "zod";

// ─────────────────────────── Public endpoints ────────────────────────────

export const contactSchema = z.object({
  name: z.string().trim().min(2, "İsim en az 2 karakter olmalı").max(100),
  email: z.string().trim().email("Geçerli bir e-posta adresi giriniz"),
  message: z.string().trim().min(10, "Mesaj en az 10 karakter olmalı").max(2000),
});

export const whatsappSchema = z.object({
  name: z.string().trim().min(2, "İsim en az 2 karakter olmalı").max(100),
  surname: z.string().trim().min(2, "Soyisim en az 2 karakter olmalı").max(100),
  phone: z
    .string()
    .trim()
    .min(7, "Telefon numarası geçersiz")
    .max(20, "Telefon numarası geçersiz")
    .regex(/^[0-9\s\+\-\(\)]+$/, "Geçerli bir telefon numarası giriniz"),
});

export const loginSchema = z.object({
  username: z.string().trim().min(1, "Kullanıcı adı gerekli").max(50),
  password: z.string().min(1, "Şifre gerekli").max(200),
});

export const registerSchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Kullanıcı adı en az 3 karakter olmalı")
    .max(30, "Kullanıcı adı en fazla 30 karakter olabilir")
    .regex(/^[a-z0-9_]+$/, "Sadece küçük harf, rakam ve _ kullanılabilir"),
  password: z.string().min(6, "Şifre en az 6 karakter olmalı").max(200),
});

// ─────────────────────────── Admin endpoints ─────────────────────────────

export const adminLoginSchema = z.object({
  password: z.string().min(1, "Şifre gerekli").max(200),
});

export const postWriteSchema = z.object({
  slug: z.string().trim().min(1).max(200).optional(),
  title: z.string().trim().min(1, "Başlık gerekli").max(300),
  category: z.string().trim().max(50).optional(),
  date: z.string().optional(),
  summary: z.string().trim().max(500).optional(),
  content: z.string().optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  pinned: z.boolean().optional(),
  cover_image: z.string().url().or(z.literal("")).optional(),
});

export const postUpdateSchema = postWriteSchema.partial().extend({
  id: z.number().int(),
});

export const indicatorWriteSchema = z.object({
  slug: z.string().trim().min(1).max(200).optional(),
  title: z.string().trim().min(1, "Başlık gerekli").max(300),
  platform: z.string().trim().max(100).optional(),
  short_desc: z.string().trim().max(500).optional(),
  description: z.string().optional(),
  images: z.array(z.string()).max(20).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  badge: z.string().trim().max(50).optional(),
  badge_color: z.string().trim().max(50).optional(),
  tradingview_url: z.string().url().or(z.literal("")).optional(),
  sort_order: z.number().optional(),
});

export const indicatorUpdateSchema = indicatorWriteSchema.partial().extend({
  id: z.number().int(),
});

// ── Admin: kullanıcıya özel tarama yaz/güncelle ──────────────────────────────
const scanRuleSchema = z.object({
  indicator: z.enum(["RSI", "EMA", "SMA", "MACD", "VOLUME", "PRICE_CHANGE", "BOLLINGER", "STOCH"]),
  condition: z.enum(["lt", "gt", "lte", "gte", "cross_above", "cross_below", "price_above", "price_below", "squeeze", "spike"]),
  period:     z.number().int().min(1).max(200).optional(),
  period2:    z.number().int().min(1).max(200).optional(),
  value:      z.number().optional(),
  multiplier: z.number().optional(),
});

const scanRuleGroupSchema = z.object({
  operator: z.enum(["AND", "OR"]),
  rules:    z.array(scanRuleSchema).min(1).max(10),
});

export const adminScanWriteSchema = z.object({
  user_id:     z.string().uuid(),
  name:        z.string().trim().min(1).max(80),
  description: z.string().trim().max(300).optional(),
  scan_type:   z.enum(["rules", "python"]),
  rules:       scanRuleGroupSchema.optional(),
  python_code: z.string().max(5000).optional(),
  is_active:   z.boolean().optional().default(true),
});

export const adminScanUpdateSchema = adminScanWriteSchema.partial().omit({ user_id: true });

// ── Admin: scanner-users PATCH ────────────────────────────────────────────────
export const scannerUserPatchSchema = z.object({
  action: z.enum(["reset-password", "clear-ratelimit"]).optional(),
  ip: z.string().trim().max(45).optional(),
  status: z.enum(["approved", "rejected", "pending"]).optional(),
  plan: z.enum(["starter", "pro", "elite"]).optional(),
  subscription_plan: z.enum(["weekly", "monthly", "yearly"]).nullable().optional(),
});

// ── Admin: live-stream POST ───────────────────────────────────────────────────
export const liveStreamWriteSchema = z.object({
  title: z.string().trim().min(1, "Başlık gerekli").max(200),
  stream_at: z.string().min(1, "Tarih gerekli"),
  description: z.string().trim().max(1000).nullable().optional(),
});

// ── Admin: custom-indicators POST ─────────────────────────────────────────────
export const customIndicatorWriteSchema = z.object({
  code: z.string().trim().min(1, "code zorunludur").max(100),
  name: z.string().trim().min(1, "name zorunludur").max(200),
  description: z.string().trim().max(1000).optional().default(""),
  script: z.string().max(10000).optional().default(""),
});

// ── Admin: scan-groups POST/PATCH ─────────────────────────────────────────────
const scanGroupKeySchema = z.object({
  id: z.string().min(1).max(100),
  label: z.string().min(1).max(200),
});

export const scanGroupWriteSchema = z.object({
  id: z.string().regex(/^[a-z][a-z0-9_]{0,49}$/),
  label: z.string().trim().min(1).max(200),
  description: z.string().trim().max(500).optional().default(""),
  emoji: z.string().max(10).optional().default("📊"),
  icon: z.string().max(50).optional().default("chart"),
  color: z.enum(["emerald", "sky", "violet", "amber", "rose"]).optional().default("emerald"),
  keys: z.array(scanGroupKeySchema).max(50).optional().default([]),
  display_order: z.number().int().min(0).max(999).optional().default(0),
  is_bull: z.boolean().optional().default(true),
});

export const scanGroupUpdateSchema = z.object({
  label: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(500).optional(),
  emoji: z.string().max(10).optional(),
  icon: z.string().max(50).optional(),
  color: z.enum(["emerald", "sky", "violet", "amber", "rose"]).optional(),
  keys: z.array(scanGroupKeySchema).max(50).optional(),
  display_order: z.number().int().min(0).max(999).optional(),
  is_bull: z.boolean().optional(),
});

// ── User: profile POST ────────────────────────────────────────────────────────
export const userProfileUpdateSchema = z.object({
  telegramChatId: z.string().trim().max(20).optional().default(""),
  alertCategories: z.array(z.string().regex(/^[a-z][a-z0-9_]{1,49}$/)).max(100).optional().default([]),
  alertsEnabled: z.boolean().optional().default(false),
});

export type ContactInput = z.infer<typeof contactSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type AdminScanWriteInput = z.infer<typeof adminScanWriteSchema>;
export type AdminScanUpdateInput = z.infer<typeof adminScanUpdateSchema>;
