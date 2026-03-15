-- scanner_users tablosuna telefon numarası kolonu ekle
ALTER TABLE scanner_users ADD COLUMN IF NOT EXISTS phone TEXT;
