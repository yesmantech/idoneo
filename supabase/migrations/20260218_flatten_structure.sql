-- 20260218_flatten_structure.sql
-- Reduces hierarchy from Category -> Role -> Quiz to Category -> Quiz.

-- 1. Add category_id to quizzes
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id);

-- 2. Migrate existing data: link quizzes to their parent category via the roles table
UPDATE public.quizzes q
SET category_id = r.category_id
FROM public.roles r
WHERE q.role_id = r.id;

-- [SAFETY] Handle orphaned quizzes (quizzes without a valid role or role without category)
-- Assign them to the first available category to satisfy NOT NULL constraint
UPDATE public.quizzes
SET category_id = (SELECT id FROM public.categories ORDER BY created_at LIMIT 1)
WHERE category_id IS NULL;

-- 3. Make category_id NOT NULL for future consistency
ALTER TABLE public.quizzes ALTER COLUMN category_id SET NOT NULL;

-- 4. Migrate role_resources to quiz_resources
-- [NEW] Table to store resources per quiz
CREATE TABLE IF NOT EXISTS public.quiz_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    type TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Migrate data from role_resources to quiz_resources
-- Since one role can have multiple quizzes, we might need to decide which quiz gets the resources.
-- Usually, the "active" or "latest" quiz for that role.
-- For simplicity, let's link to ALL quizzes that were previously linked to that role.
INSERT INTO public.quiz_resources (quiz_id, title, url, type, order_index, created_at)
SELECT q.id, rr.title, rr.url, rr.type, rr.order_index, rr.created_at
FROM public.role_resources rr
JOIN public.quizzes q ON rr.role_id = q.role_id
WHERE NOT EXISTS (
    SELECT 1 FROM public.quiz_resources qr 
    WHERE qr.quiz_id = q.id AND qr.url = rr.url AND qr.title = rr.title
);

-- 5. Final Cleanup: Drop obsolete tables and columns
-- Note: Drop role_resources ONLY if migration was successful
-- We check if there's any data in quiz_resources before dropping
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM public.quiz_resources) OR NOT EXISTS (SELECT 1 FROM public.role_resources) THEN
        DROP TABLE IF EXISTS public.role_resources;
        ALTER TABLE public.quizzes DROP COLUMN IF EXISTS role_id;
        DROP TABLE IF EXISTS public.roles;
    END IF;
END $$;

-- 6. Update view or functions if needed
-- (The get_role_candidate_count RPC might need to be renamed to get_quiz_candidate_count or similar)
-- But for now, let's focus on the structural removal.
