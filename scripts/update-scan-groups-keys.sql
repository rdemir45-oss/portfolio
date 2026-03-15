-- ─── RSI Düşen Trend Kırılımı → RSI Analizleri grubuna ekle ───────────────────
-- rsi_desc_break zaten bearish grubunda olabilir; önce oradan çıkar, sonra rsi grubuna ekle

-- 1) Bearish grubundan çıkar (varsa)
UPDATE scan_groups
SET keys = (
  SELECT jsonb_agg(k)
  FROM jsonb_array_elements(keys) AS k
  WHERE k->>'id' != 'rsi_desc_break'
)
WHERE id = 'bearish'
  AND keys @> '[{"id":"rsi_desc_break"}]';

-- 2) RSI grubuna ekle (yoksa)
UPDATE scan_groups
SET keys = keys || '[{"id":"rsi_desc_break","label":"RSI Düşen Trend Kırılım"}]'::jsonb
WHERE id = 'rsi'
  AND NOT (keys @> '[{"id":"rsi_desc_break"}]');

-- ─── SuperTrend Yukarı → SuperTrend grubuna ekle ──────────────────────────────
-- NOT: Aşağıdaki WHERE koşulunda SuperTrend grubunun gerçek `id`'sini kullanın.
-- Admin paneli → Tarama Grupları açılınca URL'deki veya grup adından anlaşılır.
-- Genellikle id = 'supertrend' ya da 'supertrend_indicator' olur.
-- Uygun `id`'yi tespit edip hangi satırın güncelleneceğini doğrulayın:

-- Önce mevcut SuperTrend grubunun id'sini listeleyin:
-- SELECT id, label FROM scan_groups WHERE label ILIKE '%supertrend%';

-- Sonra uygun id ile güncelleyin (supertrend_up key adı kesin değilse dış servise bakın):
UPDATE scan_groups
SET keys = keys || '[{"id":"supertrend_up","label":"SuperTrend Yukarı"}]'::jsonb
WHERE label ILIKE '%supertrend%'
  AND NOT (keys @> '[{"id":"supertrend_up"}]');
