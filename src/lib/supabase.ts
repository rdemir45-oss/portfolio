import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
