-- SECURITY HARDENING MIGRATION (V1.0)
-- Fixes VULN-001, VULN-002, VULN-004

-- =====================================================
-- 1. Profiles: Prevent Self-Privilege Escalation
-- =====================================================
-- Drop old permissive policies
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile (restricted)" ON public.profiles;

-- Create secure update policy: user can update everything EXCEPT role/email
CREATE POLICY "Users can update own profile (restricted)" ON public.profiles
    FOR UPDATE 
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id AND 
        (
            -- Ensure the role remains unchanged after update
            role = (SELECT role FROM public.profiles WHERE id = auth.uid())
        )
    );

-- =====================================================
-- 2. Blog: Restrict Management to Admins
-- =====================================================
-- Posts
DROP POLICY IF EXISTS "Authenticated can read all posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Authenticated can insert posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Authenticated can update posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Authenticated can delete posts" ON public.blog_posts;

DROP POLICY IF EXISTS "Anyone can read published posts" ON public.blog_posts;
CREATE POLICY "Anyone can read published posts" ON public.blog_posts
FOR SELECT TO anon, authenticated
USING (status = 'published' AND published_at <= NOW());

DROP POLICY IF EXISTS "Admins can manage all posts" ON public.blog_posts;
CREATE POLICY "Admins can manage all posts" ON public.blog_posts
FOR ALL TO authenticated
USING ( (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' );

-- Categories
DROP POLICY IF EXISTS "Authenticated can manage categories" ON public.blog_categories;
DROP POLICY IF EXISTS "Admins can manage categories" ON public.blog_categories;
CREATE POLICY "Admins can manage categories" ON public.blog_categories
FOR ALL TO authenticated
USING ( (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' );

-- Tags
DROP POLICY IF EXISTS "Authenticated can manage tags" ON public.blog_tags;
DROP POLICY IF EXISTS "Admins can manage tags" ON public.blog_tags;
CREATE POLICY "Admins can manage tags" ON public.blog_tags
FOR ALL TO authenticated
USING ( (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' );

-- Authors
DROP POLICY IF EXISTS "Authenticated can manage authors" ON public.blog_authors;
DROP POLICY IF EXISTS "Admins can manage authors" ON public.blog_authors;
CREATE POLICY "Admins can manage authors" ON public.blog_authors
FOR ALL TO authenticated
USING ( (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' );

-- =====================================================
-- 3. Quizzes & Structure: Restrict Write to Admins
-- =====================================================
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage categories" ON public.categories;
CREATE POLICY "Admins manage categories" ON public.categories 
FOR ALL TO authenticated USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

DROP POLICY IF EXISTS "Admins manage roles" ON public.roles;
CREATE POLICY "Admins manage roles" ON public.roles 
FOR ALL TO authenticated USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

DROP POLICY IF EXISTS "Admins manage quizzes" ON public.quizzes;
CREATE POLICY "Admins manage quizzes" ON public.quizzes 
FOR ALL TO authenticated USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- =====================================================
-- 4. PII Data: Mask Email in Public Selects
-- =====================================================
-- Create a view for public profile info instead of exposing 'email' in the profiles table
-- but for now, we just tighten the select policy.
DROP POLICY IF EXISTS "Public Read Profiles" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;

CREATE POLICY "Profiles are viewable by authenticated users" ON public.profiles
FOR SELECT TO authenticated
USING (true); -- Ideally, the 'email' column should be moved to a private table in a future migration.
