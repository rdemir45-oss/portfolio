-- ── Custom Indicators: Admin tarafından yönetilen özel tarama indikatörleri ──
-- Amaç: Pinesistem (Railway) restart'larında kaybolmaması için script ve metadata
-- Supabase'de kalıcı olarak saklanır.

CREATE TABLE IF NOT EXISTS custom_indicators (
  code        text PRIMARY KEY,             -- benzersiz slug, örn: 'supertrend_short'
  name        text NOT NULL,                -- gösterim adı
  description text     DEFAULT '',
  script      text NOT NULL DEFAULT '',     -- Python script içeriği
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- Admin paneli dışında erişim kapatılıyor (RLS)
ALTER TABLE custom_indicators ENABLE ROW LEVEL SECURITY;
-- Anon / authenticated kullanıcılar okuyamaz veya yazamaz; yalnızca service_role (admin key) ile erişilir.
