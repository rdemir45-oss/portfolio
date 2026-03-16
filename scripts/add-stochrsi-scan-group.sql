-- ═══════════════════════════════════════════════════════════════════════════════
-- StochRSI Taramaları grubu ekle
-- Scan API'nin stoch_rsi_os ve stoch_rsi_crossup key'lerini döndürmesi gerekir.
-- API güncellendikten sonra bu SQL'i çalıştır.
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO scan_groups (id, label, description, icon, color, is_bull, emoji, keys)
VALUES (
  'stochrsi',
  'Stokastik RSI',
  'StochRSI aşırı satım ve kesişim sinyalleri',
  'activity',
  'sky',
  true,
  '📊',
  '[
    {"id":"stoch_rsi_os",      "label":"StochRSI Aşırı Satım (K<20)"},
    {"id":"stoch_rsi_crossup", "label":"StochRSI K, D''yi Yukarı Kesti"}
  ]'::jsonb
)
ON CONFLICT (id) DO UPDATE
  SET label       = EXCLUDED.label,
      description = EXCLUDED.description,
      icon        = EXCLUDED.icon,
      color       = EXCLUDED.color,
      is_bull     = EXCLUDED.is_bull,
      emoji       = EXCLUDED.emoji,
      keys        = EXCLUDED.keys;
