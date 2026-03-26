-- Günlük trafik istatistikleri tablosu + atomic upsert fonksiyonu
-- Supabase SQL Editor'ünde çalıştır

-- 1. Tablo
CREATE TABLE IF NOT EXISTS site_stats (
  date      DATE        NOT NULL,
  hour      SMALLINT    NOT NULL CHECK (hour >= 0 AND hour <= 23),
  visitors  INTEGER     NOT NULL DEFAULT 0,
  pageviews INTEGER     NOT NULL DEFAULT 0,
  PRIMARY KEY (date, hour)
);

-- RLS: public erişim yok, sadece service_role
ALTER TABLE site_stats ENABLE ROW LEVEL SECURITY;

-- 2. Atomic upsert fonksiyonu (race condition önler)
CREATE OR REPLACE FUNCTION increment_site_stats(
  p_date      DATE,
  p_hour      SMALLINT,
  p_visitors  INTEGER,
  p_pageviews INTEGER
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO site_stats (date, hour, visitors, pageviews)
  VALUES (p_date, p_hour, p_visitors, p_pageviews)
  ON CONFLICT (date, hour) DO UPDATE
    SET visitors  = site_stats.visitors  + EXCLUDED.visitors,
        pageviews = site_stats.pageviews + EXCLUDED.pageviews;
END;
$$;
