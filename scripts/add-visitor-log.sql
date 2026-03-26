-- Günlük ziyaretçi giriş/çıkış kaydı
-- Supabase SQL Editor'ünde çalıştır

-- 1. Tablo
CREATE TABLE IF NOT EXISTS visitor_log (
  sid           TEXT        PRIMARY KEY,
  username      TEXT,
  first_page    TEXT,
  first_seen_at TIMESTAMPTZ NOT NULL,
  last_seen_at  TIMESTAMPTZ NOT NULL,
  page_count    INTEGER     NOT NULL DEFAULT 1
);

ALTER TABLE visitor_log ENABLE ROW LEVEL SECURITY;

-- 2. Atomic upsert fonksiyonu
CREATE OR REPLACE FUNCTION upsert_visitor_log(
  p_sid         TEXT,
  p_username    TEXT,
  p_page        TEXT,
  p_is_new      BOOLEAN,
  p_page_changed BOOLEAN,
  p_now         TIMESTAMPTZ
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_is_new THEN
    INSERT INTO visitor_log (sid, username, first_page, first_seen_at, last_seen_at, page_count)
    VALUES (p_sid, p_username, p_page, p_now, p_now, 1)
    ON CONFLICT (sid) DO NOTHING;
  ELSE
    UPDATE visitor_log SET
      last_seen_at = p_now,
      username     = COALESCE(p_username, username),
      page_count   = page_count + CASE WHEN p_page_changed THEN 1 ELSE 0 END
    WHERE sid = p_sid;
  END IF;
END;
$$;
