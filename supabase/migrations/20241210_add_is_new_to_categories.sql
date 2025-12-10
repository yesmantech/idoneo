-- Add is_new column to categories for badge toggle
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS is_new BOOLEAN DEFAULT false;
