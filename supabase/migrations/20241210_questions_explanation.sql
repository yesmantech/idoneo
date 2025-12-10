-- Migration: Add Explanation to Questions
ALTER TABLE public.questions 
ADD COLUMN IF NOT EXISTS explanation TEXT DEFAULT NULL;

-- Note: No RLS changes needed as questions are already public-read or authenticated-read.
