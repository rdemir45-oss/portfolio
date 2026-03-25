-- ═══════════════════════════════════════════════════════════════════════════
-- RLS (Row Level Security) Politikaları — Tarama Formülü Güvenliği
-- ═══════════════════════════════════════════════════════════════════════════
--
-- AMAÇ:
-- NEXT_PUBLIC_SUPABASE_ANON_KEY tarayıcı bundle'ında herkese açıktır.
-- Saldırgan bu key ile doğrudan Supabase REST API'sine ulaşabilir:
--   curl https://<prj>.supabase.co/rest/v1/custom_scans?select=python_code \
--        -H "apikey: <ANON_KEY>"
-- RLS etkinleştirilmezse tüm özel tarama formülleri sıfır auth ile okunur.
--
-- ÇÖZÜM:
-- Uygulama her zaman SUPABASE_SERVICE_ROLE_KEY (service_role) ile bağlanır.
-- Service role RLS'yi atlar → uygulama etkilenmez.
-- Anon key ile yapılan direkt sorgular → RLS BLOCKS → sıfır satır döner.
--
-- UYGULAMA:
-- Supabase Dashboard → SQL Editor'de çalıştır.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1. custom_scans ────────────────────────────────────────────────────────
-- Kullanıcıların kendi oluşturduğu tarama formülleri (python_code, rules)
ALTER TABLE custom_scans ENABLE ROW LEVEL SECURITY;

-- Anon ve authenticated rol üzerinden doğrudan erişimi tamamen kapat.
-- Service role (uygulama) RLS'yi atlar — uygulama çalışmaya devam eder.
DROP POLICY IF EXISTS "custom_scans_block_direct_access" ON custom_scans;
CREATE POLICY "custom_scans_block_direct_access"
  ON custom_scans
  FOR ALL
  USING (false);

-- ─── 2. admin_assigned_scans ────────────────────────────────────────────────
-- Admin'in kullanıcılara atadığı özel formüller (python_code, rules)
ALTER TABLE admin_assigned_scans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_assigned_scans_block_direct_access" ON admin_assigned_scans;
CREATE POLICY "admin_assigned_scans_block_direct_access"
  ON admin_assigned_scans
  FOR ALL
  USING (false);

-- ─── 3. admin_assigned_scan_results ─────────────────────────────────────────
-- Admin tarama çıktıları (ticker listesi — formül değil ama hisseler gizli)
ALTER TABLE admin_assigned_scan_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_assigned_scan_results_block_direct_access" ON admin_assigned_scan_results;
CREATE POLICY "admin_assigned_scan_results_block_direct_access"
  ON admin_assigned_scan_results
  FOR ALL
  USING (false);

-- ─── 4. custom_indicators ───────────────────────────────────────────────────
-- Pine Script / Python indikatör kodları (script kolonu = ticari sır)
ALTER TABLE custom_indicators ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "custom_indicators_block_direct_access" ON custom_indicators;
CREATE POLICY "custom_indicators_block_direct_access"
  ON custom_indicators
  FOR ALL
  USING (false);

-- ─── 5. custom_scan_results ─────────────────────────────────────────────────
-- Kullanıcı özel tarama sonuçları
-- Bu tablo varsa koruma altına al (yoksa IF EXISTS ile hata vermez)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'custom_scan_results'
  ) THEN
    EXECUTE 'ALTER TABLE custom_scan_results ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "custom_scan_results_block" ON custom_scan_results';
    EXECUTE 'CREATE POLICY "custom_scan_results_block" ON custom_scan_results FOR ALL USING (false)';
  END IF;
END $$;

-- ─── 6. scanner_users ───────────────────────────────────────────────────────
-- Kullanıcı profilleri (subscription_plan, subscription_expires_at gizli)
ALTER TABLE scanner_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "scanner_users_block_direct_access" ON scanner_users;
CREATE POLICY "scanner_users_block_direct_access"
  ON scanner_users
  FOR ALL
  USING (false);

-- ─── Doğrulama sorgusu ──────────────────────────────────────────────────────
-- Bu sorgu anon role'un hiç satır görmediğini doğrular (service role bypass ile uygulama çalışır)
-- SELECT tablename, rowsecurity FROM pg_tables
-- WHERE schemaname = 'public'
-- AND tablename IN ('custom_scans','admin_assigned_scans','custom_indicators','scanner_users','admin_assigned_scan_results');
-- Sonuç: tüm tablolarda rowsecurity = true olmalı.
