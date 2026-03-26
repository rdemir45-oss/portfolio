-- Aktif kullanıcı takibi için last_seen_at kolonu
-- Supabase SQL Editor'ünde çalıştır

ALTER TABLE scanner_users
  ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_scanner_users_last_seen
  ON scanner_users (last_seen_at DESC NULLS LAST);
