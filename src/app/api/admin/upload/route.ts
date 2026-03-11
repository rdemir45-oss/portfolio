import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { isAdmin, UNAUTHORIZED } from "@/lib/admin-auth";

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const ALLOWED_EXT  = new Set(["jpg", "jpeg", "png", "webp", "gif"]);
const MAX_BYTES    = 5 * 1024 * 1024; // 5 MB

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return UNAUTHORIZED;

  const formData = await req.formData();
  const file = formData.get("file") as File;
  if (!file) return NextResponse.json({ error: "Dosya bulunamadı" }, { status: 400 });

  // Boyut kontrolü
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Dosya 5 MB sınırını aşıyor." }, { status: 413 });
  }

  // MIME türü kontrolü (client-side header, ek olarak uzantıya da bakıyoruz)
  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json({ error: "Sadece görsel dosyalar yüklenebilir (jpg, png, webp, gif)." }, { status: 415 });
  }

  // Uzantı kontrolü — client tarafından manipüle edilebilir dosya adına güvenmiyoruz
  const rawExt = (file.name.split(".").pop() ?? "").toLowerCase().replace(/[^a-z]/g, "");
  if (!ALLOWED_EXT.has(rawExt)) {
    return NextResponse.json({ error: "Geçersiz dosya uzantısı." }, { status: 415 });
  }

  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${rawExt}`;
  const bytes = await file.arrayBuffer();

  const { error } = await supabase.storage
    .from("images")
    .upload(fileName, bytes, { contentType: file.type, upsert: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data } = supabase.storage.from("images").getPublicUrl(fileName);
  return NextResponse.json({ url: data.publicUrl });
}
