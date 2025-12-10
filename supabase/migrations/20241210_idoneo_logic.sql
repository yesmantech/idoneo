-- Migration: Add Idoneo Logic Columns

-- 1. Add Configuration to Quizzes
ALTER TABLE public.quizzes 
ADD COLUMN IF NOT EXISTS use_custom_pass_threshold BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS min_correct_for_pass INTEGER DEFAULT NULL;

-- 2. Add Result Data to Quiz Attempts
ALTER TABLE public.quiz_attempts 
ADD COLUMN IF NOT EXISTS is_idoneo BOOLEAN DEFAULT NULL,
ADD COLUMN IF NOT EXISTS pass_threshold INTEGER DEFAULT NULL;

-- 3. Update RLS (Policies usually allow update of own rows, but verify)
-- Assuming existing policies cover updates.
