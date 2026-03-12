-- ── Custom Scans: Kullanıcıya özel tarama sistemi ───────────────────────────

-- Kullanıcının oluşturduğu taramalar
CREATE TABLE IF NOT EXISTS custom_scans (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     text NOT NULL,           -- scanner_users.id
  name        text NOT NULL,
  description text,
  rules       jsonb NOT NULL,          -- kural motoru JSON
  is_active   boolean DEFAULT true,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- Tarama sonuçlarını cache'le (her çalıştırmada güncellenir)
CREATE TABLE IF NOT EXISTS custom_scan_results (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id    uuid REFERENCES custom_scans(id) ON DELETE CASCADE,
  user_id    text NOT NULL,
  tickers    text[] DEFAULT '{}',
  ran_at     timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE custom_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_scan_results ENABLE ROW LEVEL SECURITY;

-- Kullanıcı sadece kendi taramalarını görebilir / değiştirebilir
CREATE POLICY "custom_scans_owner" ON custom_scans
  USING (user_id = current_setting('request.jwt.claims', true)::jsonb->>'sub')
  WITH CHECK (user_id = current_setting('request.jwt.claims', true)::jsonb->>'sub');

CREATE POLICY "custom_scan_results_owner" ON custom_scan_results
  USING (user_id = current_setting('request.jwt.claims', true)::jsonb->>'sub');

-- Service role tüm satırlara erişebilir (Next.js API)
CREATE POLICY "custom_scans_service" ON custom_scans
  TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "custom_scan_results_service" ON custom_scan_results
  TO service_role USING (true) WITH CHECK (true);

-- updated_at otomatik güncelle
CREATE OR REPLACE FUNCTION update_custom_scans_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER custom_scans_updated_at
  BEFORE UPDATE ON custom_scans
  FOR EACH ROW EXECUTE FUNCTION update_custom_scans_updated_at();
