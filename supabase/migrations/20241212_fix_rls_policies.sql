-- FIX RLS POLICIES FOR PROFILES
-- Run this in Supabase SQL Editor

-- 1. Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Drop potential duplicate/conflicting policies
DROP POLICY IF EXISTS "Public Read Profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- 3. Re-create Policies

-- Allow anyone to read profiles (needed for leaderboard, etc.)
CREATE POLICY "Public Read Profiles" ON public.profiles
    FOR SELECT USING (true);

-- Allow users to update ONLY their own rows
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Allow users to insert ONLY their own rows (fallback for upsert)
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 4. Ensure permissions are granted to the authenticated role
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
