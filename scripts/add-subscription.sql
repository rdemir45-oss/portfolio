-- Abonelik sistemi için scanner_users tablosuna yeni kolonlar ekle
ALTER TABLE scanner_users
  ADD COLUMN IF NOT EXISTS subscription_plan TEXT
    CHECK (subscription_plan IN ('weekly', 'monthly', 'yearly')),
  ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;

-- İsteğe bağlı: süresi dolmuş kullanıcıları listelemek için index
CREATE INDEX IF NOT EXISTS idx_scanner_users_subscription_expires_at
  ON scanner_users (subscription_expires_at);
