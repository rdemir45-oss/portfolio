-- ============================================================
-- Supabase Row Level Security (RLS) Politikaları
-- Supabase Dashboard → SQL Editor'da çalıştırın.
-- ============================================================
-- Bu script tüm tabloları önce temizler, sonra yeniden yapılandırır.
-- ANON key ile yalnızca açıkça izin verilen okuma işlemleri mümkün olur.
-- Yazma işlemleri her zaman SERVICE_ROLE key gerektirir (backend API routes).
-- ============================================================

-- ─────────────────────── posts ───────────────────────────────
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Eski politikaları temizle
DROP POLICY IF EXISTS "posts_public_read"  ON posts;
DROP POLICY IF EXISTS "posts_service_write" ON posts;

-- Herkese açık okuma (yayınlanmış postlar — public site)
CREATE POLICY "posts_public_read"
  ON posts FOR SELECT
  USING (true);

-- Yazma yalnızca SERVICE_ROLE (backend API routes)
CREATE POLICY "posts_service_write"
  ON posts FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ─────────────────────── indicators ─────────────────────────
ALTER TABLE indicators ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "indicators_public_read"  ON indicators;
DROP POLICY IF EXISTS "indicators_service_write" ON indicators;

CREATE POLICY "indicators_public_read"
  ON indicators FOR SELECT
  USING (true);

CREATE POLICY "indicators_service_write"
  ON indicators FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ─────────────────────── messages ────────────────────────────
-- Sadece backend (admin API) okuyabilir ve yazabilir.
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "messages_service_only" ON messages;

-- INSERT: public (contact form backend, service_role ile çağrılır)
-- SELECT/UPDATE/DELETE: yalnızca service_role (admin panel)
CREATE POLICY "messages_service_only"
  ON messages FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ─────────────────────── whatsapp_requests ───────────────────
ALTER TABLE whatsapp_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "whatsapp_service_only" ON whatsapp_requests;

CREATE POLICY "whatsapp_service_only"
  ON whatsapp_requests FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ─────────────────────── scanner_users ───────────────────────
-- Kullanıcı kimlik doğrulama tablosu — hiçbir zaman herkese açık olmamalı.
ALTER TABLE scanner_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "scanner_users_service_only" ON scanner_users;

CREATE POLICY "scanner_users_service_only"
  ON scanner_users FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ─────────────────────── live_streams ────────────────────────
ALTER TABLE live_streams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "live_streams_public_read"   ON live_streams;
DROP POLICY IF EXISTS "live_streams_service_write"  ON live_streams;

-- is_active olanlar herkese açık (banner countdown)
CREATE POLICY "live_streams_public_read"
  ON live_streams FOR SELECT
  USING (true);

CREATE POLICY "live_streams_service_write"
  ON live_streams FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ─────────────────────── scan_groups (varsa) ─────────────────
-- Bu tablo varsa aşağıdaki satırları açın:
-- ALTER TABLE scan_groups ENABLE ROW LEVEL SECURITY;
-- DROP POLICY IF EXISTS "scan_groups_public_read"  ON scan_groups;
-- CREATE POLICY "scan_groups_public_read"
--   ON scan_groups FOR SELECT USING (true);
-- CREATE POLICY "scan_groups_service_write"
--   ON scan_groups FOR ALL
--   USING (auth.role() = 'service_role')
--   WITH CHECK (auth.role() = 'service_role');

-- ============================================================
-- ÖNEMLİ: Backend API routes'larında (admin ve public)
-- SUPABASE_SERVICE_ROLE_KEY kullanıldığından emin olun.
-- NEXT_PUBLIC_SUPABASE_ANON_KEY yalnızca salt-okunur public
-- veri için kullanılmalıdır (posts, indicators, live_streams).
-- ============================================================
