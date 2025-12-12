-- Migration: Referral System
-- Adds referral tracking to profiles table

-- 1. Add referral columns to profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS referral_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS waitlist_position INTEGER,
  ADD COLUMN IF NOT EXISTS waitlist_joined_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- 2. Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON public.profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by ON public.profiles(referred_by);

-- 3. Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    -- Generate 6-character alphanumeric code
    NEW.referral_code := upper(substring(md5(random()::text || NEW.id::text) from 1 for 6));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Trigger to auto-generate referral code on insert
DROP TRIGGER IF EXISTS set_referral_code ON public.profiles;
CREATE TRIGGER set_referral_code
  BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION generate_referral_code();

-- 5. Backfill existing profiles with referral codes
UPDATE public.profiles 
SET 
  referral_code = upper(substring(md5(id::text || random()::text) from 1 for 6)),
  waitlist_joined_at = COALESCE(created_at, now())
WHERE referral_code IS NULL;

-- 6. Function to increment referrer's count when new user signs up with ref code
CREATE OR REPLACE FUNCTION handle_referral_signup()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referred_by IS NOT NULL THEN
    UPDATE public.profiles 
    SET referral_count = referral_count + 1
    WHERE id = NEW.referred_by;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_referral_signup ON public.profiles;
CREATE TRIGGER on_referral_signup
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION handle_referral_signup();

-- 7. Update existing user creation trigger to include referral code
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, nickname, avatar_url, referral_code, waitlist_joined_at)
    VALUES (
        new.id,
        split_part(new.email, '@', 1),
        null,
        upper(substring(md5(random()::text || new.id::text) from 1 for 6)),
        now()
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
