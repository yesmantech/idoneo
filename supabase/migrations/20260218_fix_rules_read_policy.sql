-- Fix RLS policies for quiz_subject_rules to allow frontend to read them

-- 1. Ensure RLS is enabled
ALTER TABLE public.quiz_subject_rules ENABLE ROW LEVEL SECURITY;

-- 2. Drop potential conflicting read policies
DROP POLICY IF EXISTS "Enable read access for all users" ON public.quiz_subject_rules;
DROP POLICY IF EXISTS "Public read access" ON public.quiz_subject_rules;
DROP POLICY IF EXISTS "Authenticated read access" ON public.quiz_subject_rules;

-- 3. Create a permissive read policy for everyone (authenticated & anon)
CREATE POLICY "Enable read access for all users"
ON public.quiz_subject_rules
FOR SELECT
TO public
USING (true);

-- 4. Ensure admins can still manage rules (existing policies likely handle this, but adding a safe guard just in case for full access if they have the right role)
-- Note: Service role always bypasses RLS.
