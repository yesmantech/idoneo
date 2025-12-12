-- Migration: Add Email to Profiles and Backfill
-- Created on 2024-12-12
-- Steps:
-- 1. Add email column to profiles
-- 2. Update handle_new_user trigger to include email
-- 3. Backfill existing profiles with email from auth.users

-- 1. Add Column
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Update Trigger Function
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

-- 3. Backfill Data
-- Note: This requires permissions to read auth.users which standard service role has.
UPDATE public.profiles p
SET email = au.email
FROM auth.users au
WHERE p.id = au.id
  AND p.email IS NULL;
