
-- 20260218_flatten_structure.sql
-- Reduces hierarchy from Category -> Role -> Quiz to Category -> Quiz.

-- 1. Add category_id to quizzes
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id);

-- 2. Migrate existing data: link quizzes to their parent category via the roles table
UPDATE public.quizzes q
SET category_id = r.category_id
FROM public.roles r
WHERE q.role_id = r.id;

-- 3. Make category_id NOT NULL for future consistency
-- (Assuming all existing quizzes were linked to a role that had a category)
ALTER TABLE public.quizzes ALTER COLUMN category_id SET NOT NULL;

-- 4. Update the get_admin_profiles RPC if it depends on roles (checked previously, it doesn't seem to)
-- However, let's check other views/functions that might use roles.

-- 5. Note: We keep the roles table and role_id for now to avoid breaking existing queries 
-- until the frontend is fully updated.
