-- ── Fix: custom_scans + custom_indicators RLS politikaları düzeltmesi ───────
-- Sorun: Eski politikalar Supabase JWT auth kullanıyordu, ama uygulama kendi
--         HMAC-SHA256 token sistemiyle çalışıyor (Supabase Auth DEĞİL).
--         Bu yüzden anon key ile yapılan tüm işlemler RLS tarafından bloke ediliyordu.
-- Çözüm: Kullanıcı/admin sahipliği API katmanında kontrol edildiği için
--         yalnızca service_role politikası yeterlidir.
--         Supabase Dashboard > SQL Editor'de bu scripti çalıştırın.

-- Eski, kırık politikaları kaldır
DROP POLICY IF EXISTS "custom_scans_owner"        ON custom_scans;
DROP POLICY IF EXISTS "custom_scan_results_owner" ON custom_scan_results;

-- custom_indicators: service_role politikasını zorla ekle
ALTER TABLE custom_indicators ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "custom_indicators_service" ON custom_indicators;
CREATE POLICY "custom_indicators_service" ON custom_indicators
  TO service_role USING (true) WITH CHECK (true);

-- Service role politikalarının var olduğundan emin ol (zaten varsa hata vermez)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'custom_scans' AND policyname = 'custom_scans_service'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "custom_scans_service" ON custom_scans
        TO service_role USING (true) WITH CHECK (true);
    $policy$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'custom_scan_results' AND policyname = 'custom_scan_results_service'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "custom_scan_results_service" ON custom_scan_results
        TO service_role USING (true) WITH CHECK (true);
    $policy$;
  END IF;
END $$;
