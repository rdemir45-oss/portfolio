import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { isAdmin, UNAUTHORIZED } from "@/lib/admin-auth";

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const ALLOWED_EXT  = new Set(["jpg", "jpeg", "png", "webp", "gif"]);
const MAX_BYTES    = 5 * 1024 * 1024; // 5 MB

// Magic byte doğrulama — dosyanın gerçek türünü ilk birkaç byte'tan kontrol eder
const MAGIC_BYTES: { mime: string; bytes: number[] }[] = [
  { mime: "image/png",  bytes: [0x89, 0x50, 0x4E, 0x47] },         // \x89PNG
  { mime: "image/jpeg", bytes: [0xFF, 0xD8, 0xFF] },                // JPEG SOI
  { mime: "image/gif",  bytes: [0x47, 0x49, 0x46, 0x38] },          // GIF8
  { mime: "image/webp", bytes: [0x52, 0x49, 0x46, 0x46] },          // RIFF (WebP)
];

function verifyMagicBytes(buffer: ArrayBuffer, claimedMime: string): boolean {
  const view = new Uint8Array(buffer.slice(0, 12));
  for (const entry of MAGIC_BYTES) {
    if (entry.mime === claimedMime || (claimedMime === "image/jpeg" && entry.mime === "image/jpeg")) {
      if (entry.bytes.every((b, i) => view[i] === b)) return true;
    }
  }
  // WebP ek kontrol: byte 8-11 = "WEBP"
  if (claimedMime === "image/webp") {
    return view[8] === 0x57 && view[9] === 0x45 && view[10] === 0x42 && view[11] === 0x50;
  }
  return false;
}

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

  const bytes = await file.arrayBuffer();

  // Magic byte doğrulama — dosyanın gerçek içeriğini kontrol et
  if (!verifyMagicBytes(bytes, file.type)) {
    return NextResponse.json({ error: "Dosya içeriği belirtilen türle eşleşmiyor." }, { status: 415 });
  }

  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${rawExt}`;

  const { error } = await supabaseAdmin.storage
    .from("images")
    .upload(fileName, bytes, { contentType: file.type, upsert: false });

  if (error) return NextResponse.json({ error: "Dosya yüklenemedi." }, { status: 500 });

  const { data } = supabaseAdmin.storage.from("images").getPublicUrl(fileName);
  return NextResponse.json({ url: data.publicUrl });
}
