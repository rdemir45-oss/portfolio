-- ═══════════════════════════════════════════════════════════════════════════════
-- 1) RSI Düşen Trend Kırılımı → Bearish grubundan çıkar, RSI Analizleri'ne ekle
-- ═══════════════════════════════════════════════════════════════════════════════

UPDATE scan_groups
SET keys = (
  SELECT jsonb_agg(k)
  FROM jsonb_array_elements(keys) AS k
  WHERE k->>'id' != 'rsi_desc_break'
)
WHERE id = 'bearish'
  AND keys @> '[{"id":"rsi_desc_break"}]';

UPDATE scan_groups
SET keys = keys || '[{"id":"rsi_desc_break","label":"RSI Düşen Trend Kırılım"}]'::jsonb
WHERE id = 'rsi'
  AND NOT (keys @> '[{"id":"rsi_desc_break"}]');

-- ═══════════════════════════════════════════════════════════════════════════════
-- 2) SuperTrend grubu — gerçek API key adı `supertrend_crossup` olarak doğrulandı
--    (/api/scan/public yanıtından alındı)
--    “Aşağı kıran” ve “mevcut alımda” key'leri henüz API'de tanımlı değil;
--    daha sonra eklenirse bu SQL'i güncelleyerek çalıştırın.
-- ═══════════════════════════════════════════════════════════════════════════════

UPDATE scan_groups
SET keys = '[{"id": "supertrend_crossup", "label": "SuperTrend Yukarı Kıran"}]'::jsonb
WHERE label ILIKE '%supertrend%';

-- ═══════════════════════════════════════════════════════════════════════════════
-- 3) Bullish formasyonlar: triangle_break → triangle_break_up (sanal key)
--    Satış sinyalleri:     triangle_break_down ekle
--    API tek key (triangle_break) döndürür; backend ikiye böler.
-- ═══════════════════════════════════════════════════════════════════════════════

-- Bullish grubunda triangle_break → triangle_break_up
UPDATE scan_groups
SET keys = (
  SELECT jsonb_agg(
    CASE
      WHEN k->>'id' = 'triangle_break'
      THEN '{"id":"triangle_break_up","label":"Üçgen Yukarı Kıran"}'::jsonb
      ELSE k
    END
  )
  FROM jsonb_array_elements(keys) AS k
)
WHERE is_bull = true
  AND keys @> '[{"id":"triangle_break"}]';

-- Bearish grubuna triangle_break_down ekle
UPDATE scan_groups
SET keys = keys || '[{"id":"triangle_break_down","label":"Üçgen Aşağı Kıran"}]'::jsonb
WHERE is_bull = false
  AND label ILIKE '%sat%'
  AND NOT (keys @> '[{"id":"triangle_break_down"}]');
