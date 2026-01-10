-- Fix referral data sync
-- This migration syncs the referral_count with actual referred users
-- Run this after fixing the profile setup bug

-- Create a function to recalculate referral counts
CREATE OR REPLACE FUNCTION public.sync_referral_counts()
RETURNS void AS $$
BEGIN
    -- Update referral_count for all users to match actual referred_by counts
    UPDATE public.profiles p
    SET referral_count = (
        SELECT COUNT(*)
        FROM public.profiles ref
        WHERE ref.referred_by = p.id
    );
    
    RAISE NOTICE 'Referral counts synchronized';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Execute the sync
SELECT public.sync_referral_counts();

-- Create a trigger to keep referral_count accurate
CREATE OR REPLACE FUNCTION public.update_referrer_count()
RETURNS trigger AS $$
BEGIN
    -- When referred_by is set on a new user
    IF NEW.referred_by IS NOT NULL AND (TG_OP = 'INSERT' OR OLD.referred_by IS DISTINCT FROM NEW.referred_by) THEN
        UPDATE public.profiles
        SET referral_count = referral_count + 1
        WHERE id = NEW.referred_by;
    END IF;
    
    -- When referred_by is removed
    IF TG_OP = 'UPDATE' AND OLD.referred_by IS NOT NULL AND NEW.referred_by IS NULL THEN
        UPDATE public.profiles
        SET referral_count = GREATEST(0, referral_count - 1)
        WHERE id = OLD.referred_by;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_profile_referral_change ON public.profiles;

-- Create trigger
CREATE TRIGGER on_profile_referral_change
    AFTER INSERT OR UPDATE OF referred_by ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_referrer_count();
