-- custom_indicators tablosuna son tarama sonuçlarını saklayan kolonlar ekle
-- Supabase Dashboard → SQL Editor'de çalıştırın.

ALTER TABLE custom_indicators
  ADD COLUMN IF NOT EXISTS last_scan_categories jsonb  DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS last_scanned_at      timestamptz;
