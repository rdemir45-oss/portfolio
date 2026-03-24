-- Admin tarafından kullanıcılara atanan özel taramalar
-- Supabase SQL Editor'da çalıştır

-- ── 1. Ana tablo: Admin'in yazdığı, kullanıcıya atanan taramalar ──────────────
CREATE TABLE IF NOT EXISTS admin_assigned_scans (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES scanner_users(id) ON DELETE CASCADE,
  name        text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
  description text CHECK (char_length(description) <= 300),
  scan_type   text NOT NULL CHECK (scan_type IN ('rules', 'python')),
  rules       jsonb,                    -- ScanRuleGroup (scan_type=rules ise dolu)
  python_code text,                     -- Python kodu (scan_type=python ise dolu)
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ── 2. Sonuç tablosu: Her "Çalıştır" işlemi kalıcı olarak kaydedilir ────────
CREATE TABLE IF NOT EXISTS admin_assigned_scan_results (
  id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id  uuid NOT NULL REFERENCES admin_assigned_scans(id) ON DELETE CASCADE,
  user_id  uuid NOT NULL,
  tickers  text[] NOT NULL DEFAULT '{}',
  ran_at   timestamptz NOT NULL DEFAULT now()
);

-- ── 3. RLS (Row Level Security) ──────────────────────────────────────────────
-- Supabase anon/service key: supabaseAdmin service role tüm satırlara erişebilir.
-- Kullanıcı tarafı (anon key ile istek yapılsa bile) sadece kendi satırlarına ulaşır.
-- NOT: Next.js API route'larında supabaseAdmin (service role) kullanıldığından
--      uygulama tarafında RLS bypass yapılır; bu RLS sadece doğrudan Supabase erişimini korur.

ALTER TABLE admin_assigned_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_assigned_scan_results ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar sadece kendi taramalarını görebilir (anon key ile)
CREATE POLICY "users_select_own_assigned_scans"
  ON admin_assigned_scans FOR SELECT
  USING (user_id::text = auth.uid()::text);

-- Kullanıcılar sadece kendi sonuçlarını görebilir
CREATE POLICY "users_select_own_assigned_scan_results"
  ON admin_assigned_scan_results FOR SELECT
  USING (user_id::text = auth.uid()::text);

-- ── 4. İndeksler ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_admin_assigned_scans_user_id
  ON admin_assigned_scans(user_id);

CREATE INDEX IF NOT EXISTS idx_admin_assigned_scan_results_scan_id
  ON admin_assigned_scan_results(scan_id);

CREATE INDEX IF NOT EXISTS idx_admin_assigned_scan_results_user_id
  ON admin_assigned_scan_results(user_id);

-- ── 5. updated_at otomatik güncelle ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_admin_assigned_scans_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_admin_assigned_scans_updated_at ON admin_assigned_scans;
CREATE TRIGGER trg_admin_assigned_scans_updated_at
  BEFORE UPDATE ON admin_assigned_scans
  FOR EACH ROW EXECUTE FUNCTION update_admin_assigned_scans_updated_at();
