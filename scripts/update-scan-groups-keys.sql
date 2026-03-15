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
-- 2) SuperTrend grubu — mevcut keys'i tamamen yenisiyle değiştir
--    (supertrend_up, supertrend_down, supertrend_bull üç key)
--
--  • supertrend_up   = SuperTrend Yukarı Kıran   (Diğer'de görünen kategori)
--  • supertrend_down = SuperTrend Aşağı Kıran
--  • supertrend_bull = Mevcut Alımda Olanlar       (ST sinyal hâlâ aktif/alım üstü)
--
--  ⚠️  Dış scan API'den gelen gerçek key adları farklıysa bu değerleri güncelleyin.
--     /api/scan yanıtındaki categories[].key alanından doğrulayabilirsiniz.
-- ═══════════════════════════════════════════════════════════════════════════════

UPDATE scan_groups
SET keys = '[
  {"id": "supertrend_up",   "label": "SuperTrend Yukarı Kıran"},
  {"id": "supertrend_down", "label": "SuperTrend Aşağı Kıran"},
  {"id": "supertrend_bull", "label": "Mevcut Alımda Olanlar"}
]'::jsonb
WHERE label ILIKE '%supertrend%';
