-- Migration: Add Archive System
-- Allows soft-delete of categories, roles, and quizzes

-- 1. Add is_archived to categories
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;

-- 2. Add is_archived to roles
ALTER TABLE public.roles 
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;

-- 3. Add is_archived to quizzes
ALTER TABLE public.quizzes 
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;

-- 4. Create indexes for efficient filtering
CREATE INDEX IF NOT EXISTS idx_categories_is_archived ON public.categories(is_archived);
CREATE INDEX IF NOT EXISTS idx_roles_is_archived ON public.roles(is_archived);
CREATE INDEX IF NOT EXISTS idx_quizzes_is_archived ON public.quizzes(is_archived);

-- 5. Comment on columns
COMMENT ON COLUMN public.categories.is_archived IS 'Soft-delete flag. Archived categories are hidden from public view.';
COMMENT ON COLUMN public.roles.is_archived IS 'Soft-delete flag. Archived roles are hidden from public view.';
COMMENT ON COLUMN public.quizzes.is_archived IS 'Soft-delete flag. Archived quizzes are hidden from public view.';
