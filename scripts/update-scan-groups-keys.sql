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
