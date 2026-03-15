# CLAUDE.md — RdAlgo Portfolio Projesi

Bu dosya, AI asistanların (Claude, Copilot vb.) proje hakkında bağlamını hızlıca kurması için hazırlanmıştır.

---

## Projenin Amacı

**recepdemirborsa.com** — RdAlgo markası altında yayın yapan kişisel portföy ve ürün sitesi.

Ana işlevler:
- TradingView ve Matriks indikatörlerini tanıtma
- Blog yazıları (Teknik Analiz, Eğitim, Duyuru)
- Hisse teknik analizi platformu — üyelik sistemi ile korunan alan
- Canlı yayın takvimi
- Admin paneli (içerik, üye, yayın yönetimi)
- İletişim formu + WhatsApp grubu talep formu

---

## Teknoloji Stack'i

| Katman | Teknoloji |
|---|---|
| Framework | Next.js 16 (App Router) |
| Dil | TypeScript (strict) |
| Stil | Tailwind CSS v4 |
| Animasyon | Framer Motion |
| Veritabanı | Supabase (PostgreSQL) |
| Rate limiting | Upstash Redis + @upstash/ratelimit |
| Validasyon | Zod |
| İkonlar | react-icons (Tabler = `Tb*`, Heroicons = `Hi*`) |
| Deploy | Railway (`standalone` output) |
| Node | v20 (nvm) |

---

## Klasör Yapısı

```
src/
  app/
    (main)/           → Kullanıcıya görünen public sayfalar (Navbar içerir)
      page.tsx        → Ana sayfa (landing)
      admin/          → Admin paneli (/admin/**)
        dashboard/    → Tüm yönetim sekmeleri (posts, indicators, members, streams…)
        login/        → Admin giriş
        scan-groups/  → Tarama grubu yönetimi
      hisse-teknik-analizi/  → Üyelik korumalı alan
        login/        → Scanner kullanıcı girişi
        register/     → Üyelik talebi
        taramalarim/  → Özel tarama yönetimi
      egitim/         → Eğitim sayfası
      indicators/     → İndikatör detay sayfaları [slug]
      posts/          → Blog yazısı detay sayfaları [slug]
    (embed)/          → Embed iframe sayfaları (Navbar yok)
    api/
      admin/          → Admin-only endpoint'ler (isAdmin() guard)
      auth/           → login, register, logout
      user/           → Kullanıcı profile, change-password, custom-scans
      scan/           → Hisse tarama API
      scan-groups/    → Tarama grubu API
      alerts/         → Bildirim sistemi
      telegram/       → Telegram webhook
      contact/        → İletişim formu
      whatsapp/       → WhatsApp talep formu
      posts/          → Public post API
      live-stream/    → Canlı yayın bilgisi
  components/         → Paylaşılan UI bileşenleri (sadece (main) layout kullanır)
  lib/
    supabase.ts       → Supabase client + tüm DB tipleri (DbPost, DbScannerUser vb.)
    admin-auth.ts     → HMAC-SHA256 admin token üretimi ve doğrulaması
    rate-limit.ts     → Upstash / in-memory rate limiter
    schemas.ts        → Zod şemaları (tüm endpoint validasyonları burada)
    scan-code-validator.ts → Tarama kodu doğrulama
  middleware.ts       → Edge middleware — admin ve scanner koruması
```

---

## Auth Mimarisi

### Admin (`/admin/**`)
- `ADMIN_SECRET` env var'ı ile HMAC-SHA256 imzalı token
- Token payload: `{ exp }` (7 gün)
- Cookie: `admin_token` (httpOnly)
- Doğrulama: `src/lib/admin-auth.ts → isAdmin(req)`

### Scanner Kullanıcılar (`/hisse-teknik-analizi/**`)
- `SCAN_SESSION_SECRET` env var'ı ile HMAC-SHA256 imzalı token
- Token payload: `{ id, username, sub_exp? }` — `sub_exp` abonelik bitiş unix timestamp'i
- Cookie: `viewer_token` (httpOnly)
- Middleware edge'de hem imza hem `sub_exp` kontrolü yapar
- Süresi dolan kullanıcı → `/hisse-teknik-analizi/login?expired=1` yönlendirmesi

### Abonelik Sistemi
- Supabase `scanner_users` tablosunda `subscription_plan` (weekly/monthly/yearly) ve `subscription_expires_at` kolonları
- Yeni abonelik atayınca sunucu tarafında süre hesaplanır: weekly=7, monthly=30, yearly=365 gün
- Login sırasında hem DB'de hem token'da kontrol edilir

---

## Kodlama Kuralları

### Genel
- Dil: TypeScript strict, `any` kullanma
- Her API route `zod` ile input doğrulaması yapmalı (şema `lib/schemas.ts`'e)
- Her public endpoint `rateLimit()` ile korunmalı (`lib/rate-limit.ts`)
- Admin endpoint'ler `isAdmin(req)` ile başlar, `false` dönerse `return UNAUTHORIZED`
- `try/catch` sadece gerçekten hata olabilecek yerlerde (JSON.parse, crypto vb.)

### İsimlendirme
- Bileşenler: PascalCase (`ScannerLogin`, `AdminDashboard`)
- Fonksiyonlar/değişkenler: camelCase
- DB kolon isimleri: snake_case (Supabase standardı)
- DB tip isimleri: `Db` prefix'li (`DbPost`, `DbScannerUser`)
- API route dosyaları: `route.ts` — HTTP method adıyla export (`GET`, `POST`, `PATCH`, `DELETE`)

### Stil (Tailwind)
- Arka plan rengi: `#050a0e` (ana), `#0a1628` (card), `#0a1e15` (onaylı)
- Renk paleti: emerald (onay/primary), sky (bilgi), violet (premium), amber (uyarı/elite), rose (hata/red)
- Border: `border-slate-800`, hover: `border-slate-700`
- Rounded: `rounded-xl` veya `rounded-2xl` (büyük card)
- Badge pattern: `text-X-400 bg-X-950/40 border border-X-800/60 rounded-full px-2 py-0.5 text-xs`

### Next.js Özel Kurallar
- `useSearchParams` kullanan her bileşen `<Suspense>` ile sarılmalı (build hatası önlemek için)
- Server component'lerde `"use client"` yok; client component'lerde her zaman en üste yaz
- Route grupları `(main)` ve `(embed)` farklı layout kullanır — bileşen eklerken dikkat et

---

## Önemli Env Değişkenleri

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
ADMIN_SECRET              # Admin token imzalama
SCAN_SESSION_SECRET       # Scanner token imzalama
UPSTASH_REDIS_REST_URL    # Rate limiting (opsiyonel, yoksa in-memory)
UPSTASH_REDIS_REST_TOKEN
```

---

## Sık Kullanılan Komutlar

```bash
# Geliştirme
export PATH="$HOME/.nvm/versions/node/v20.20.0/bin:$PATH"
npm run dev

# Tip kontrolü
node_modules/.bin/tsc --noEmit

# Deploy (Railway otomatik yapar — git push yeterli)
git add -A && git commit -m "feat: ..." && git push
```

---

## "Beni Hatırla" Komutu

Kullanıcı **"beni hatırla"** veya **"bunu kaydet"** dediğinde şunları yap:

1. Bu `CLAUDE.md` dosyasını güncelle — yeni öğrenilen bilgiyi ilgili bölüme ekle
2. `/memories/repo/` altında repo-spesifik bir not varsa onu da güncelle
3. Kalıcı tercihler (kodlama stili, kişisel tercih) ise `/memories/` user memory'ye yaz
4. Değişikliği commit et: `git commit -m "docs: CLAUDE.md güncellendi"`

---

## Bilinen Sorunlar / Dikkat Edilecekler

- `src/app/(main)/hisse-teknik-analizi/register/page.tsx` içinde duplicate default export var — dokunma
- `.next/` cache bazen eski tip hatalarına yol açar; `tsc --noEmit` hataları yeni değişikliklerden değilse görmezden gel
- Supabase şema değişikliklerini `scripts/` altına SQL olarak kaydet, Railway'e push yapmadan önce Supabase SQL editöründen çalıştır
