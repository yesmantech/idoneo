-- ================================================
-- Migration: 20260221124235_set_nazionale_fallback.sql
-- Description: Update existing bandi with null region to 'nazionale'
-- ================================================

UPDATE bandi
SET region = 'nazionale'
WHERE region IS NULL OR region = '';
