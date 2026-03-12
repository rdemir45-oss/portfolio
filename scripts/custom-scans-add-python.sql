-- Migration: custom_scans tablosuna python_code kolonu ekle
-- Supabase Dashboard → SQL Editor'de çalıştır

ALTER TABLE custom_scans
  ADD COLUMN IF NOT EXISTS python_code  text,
  ADD COLUMN IF NOT EXISTS scan_type    text NOT NULL DEFAULT 'rules'
    CHECK (scan_type IN ('rules', 'python'));
