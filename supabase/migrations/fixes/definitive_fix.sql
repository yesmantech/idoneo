-- DEFINITIVE FIX FOR PROFILE SAVE ERRORS
-- Run this in Supabase SQL Editor

-- 1. Temporarily Disable RLS to ensure we can fix everything
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 2. Drop legacy policies to clean state
DROP POLICY IF EXISTS "Public Read Profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;

-- 3. Fix the Trigger Function (Ensure it doesn't fail silently)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, nickname, avatar_url, email)
    VALUES (
        new.id,
        split_part(new.email, '@', 1),
        null,
        new.email
    )
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email; 
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Re-Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. Create Permissive Policies for Authenticated Users
-- Allow User to Read Everything
CREATE POLICY "Public Read Profiles" ON public.profiles
    FOR SELECT USING (true);

-- Allow User to Insert THEIR OWN Profile
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow User to Update THEIR OWN Profile
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- 6. Grant Permissions
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- 7. (Optional) Manual Backfill for your current user if the trigger missed it
-- This safe upsert ensures your row exists so the UI performs an UPDATE instead of INSERT
INSERT INTO public.profiles (id, email, nickname)
SELECT id, email, split_part(email, '@', 1)
FROM auth.users
WHERE id = auth.uid()
ON CONFLICT (id) DO NOTHING;
