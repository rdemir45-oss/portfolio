/**
 * Viewer token doğrulama — tüm scan API route'larının kullandığı ortak yardımcı.
 *
 * Güvenlik kontrolleri (sırayla):
 * 1. Token varlığı + secret varlığı
 * 2. HMAC-SHA256 imza doğrulaması (timing-safe)
 * 3. Abonelik süresi (sub_exp) kontrolü — yoksa ya da geçmişse reddedilir
 *
 * Orta katman (middleware) yalnızca sayfa route'larını (pathname) korur.
 * API route'ları (/api/**) middleware'den GEÇMEZ — bu fonksiyon her route'ta
 * çağrılarak aynı güvenliği sağlar.
 */

import crypto from "crypto";

export interface ViewerUser {
  id: string;
  username: string;
}

export type ViewerAuthResult =
  | { ok: true; user: ViewerUser }
  | { ok: false; status: 401 | 403; error: string };

/**
 * viewer_token cookie'sini doğrular.
 *
 * @param token   - Cookie'den gelen ham token string'i
 * @param secret  - SCAN_SESSION_SECRET env değişkeni
 * @returns       ViewerAuthResult — ok:true ise user bilgisi, aksi 401/403 + hata mesajı
 */
export function verifyViewerToken(
  token: string | undefined,
  secret: string | undefined
): ViewerAuthResult {
  if (!token || !secret) {
    return { ok: false, status: 401, error: "Giriş gerekli." };
  }

  const dot = token.lastIndexOf(".");
  if (dot === -1) {
    return { ok: false, status: 401, error: "Geçersiz token formatı." };
  }

  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);

  // 1. HMAC imza doğrulaması (timing-safe — brute-force ile bypass önlenir)
  let sigValid = false;
  try {
    const expected = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("base64url");

    // Her iki buffer da aynı uzunluğa pad'lenir; farklı uzunlukta timingSafeEqual hata fırlatır
    if (expected.length === sig.length) {
      sigValid = crypto.timingSafeEqual(
        Buffer.from(expected, "utf8"),
        Buffer.from(sig, "utf8")
      );
    }
  } catch {
    return { ok: false, status: 401, error: "Token doğrulama hatası." };
  }

  if (!sigValid) {
    return { ok: false, status: 401, error: "Geçersiz kimlik bilgisi." };
  }

  // 2. Payload decode
  let decoded: Record<string, unknown>;
  try {
    decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf-8"));
  } catch {
    return { ok: false, status: 401, error: "Token çözümlenemedi." };
  }

  if (
    !decoded.id ||
    typeof decoded.id !== "string" ||
    !decoded.username ||
    typeof decoded.username !== "string"
  ) {
    return { ok: false, status: 401, error: "Eksik kimlik bilgisi." };
  }

  // 3. Abonelik süresi (sub_exp) — zorunlu alan; yoksa veya geçmişse reddet
  const now = Math.floor(Date.now() / 1000);
  if (typeof decoded.sub_exp !== "number") {
    // Eski format token'lar (sub_exp yok) artık kabul edilmiyor
    return { ok: false, status: 403, error: "Abonelik süresi doğrulanamadı. Lütfen tekrar giriş yapın." };
  }
  if (now >= decoded.sub_exp) {
    return { ok: false, status: 403, error: "Aboneliğinizin süresi dolmuştur." };
  }

  return {
    ok: true,
    user: { id: decoded.id, username: decoded.username },
  };
}
