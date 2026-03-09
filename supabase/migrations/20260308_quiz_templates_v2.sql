-- Multi-Template Support: allow multiple templates per quiz + name column
-- Alters the existing quiz_templates table

-- 1. Add name column
ALTER TABLE quiz_templates ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT 'Prova personalizzata';

-- 2. Drop the unique constraint (user_id, quiz_id) to allow multiple templates per quiz
ALTER TABLE quiz_templates DROP CONSTRAINT IF EXISTS quiz_templates_user_id_quiz_id_key;

-- 3. Keep the existing index for fast user+quiz lookups (already handles multiple rows)
-- idx_quiz_templates_user_quiz already exists from previous migration
