import { supabase } from "@/lib/supabase";
import { posts as staticPosts } from "@/data/posts";
import AnnouncementsClient from "./AnnouncementsClient";
import type { DbPost } from "@/lib/supabase";

export default async function Announcements() {
  // Supabase'den çek, hata olursa statik veriye düş
  let dbPosts: DbPost[] = [];
  try {
    const { data } = await supabase
      .from("posts")
      .select("*")
      .order("pinned", { ascending: false })
      .order("date", { ascending: false });
    dbPosts = data ?? [];
  } catch {
    // Supabase ayarlanmamışsa statik veriyi kullan
  }

  // Supabase boşsa statik demo verilerini göster
  const posts: DbPost[] =
    dbPosts.length > 0
      ? dbPosts
      : staticPosts.map((p, i) => ({ ...p, id: i + 1, pinned: p.pinned ?? false }));

  return <AnnouncementsClient posts={posts} />;
}
