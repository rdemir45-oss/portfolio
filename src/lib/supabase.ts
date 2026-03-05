import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder";

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
  created_at?: string;
}
