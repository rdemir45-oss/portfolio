import { z } from "zod";

// ─────────────────────────── Public endpoints ────────────────────────────

export const contactSchema = z.object({
  name: z.string().trim().min(2, "İsim en az 2 karakter olmalı").max(100),
  email: z.string().trim().email("Geçerli bir e-posta adresi giriniz"),
  message: z.string().trim().min(10, "Mesaj en az 10 karakter olmalı").max(2000),
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

export type ContactInput = z.infer<typeof contactSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
