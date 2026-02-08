-- Migration: Add onboarding_completed to profiles
-- This allows persisting whether a user has seen the app guide

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.onboarding_completed IS 'Whether the user has completed/dismissed the onboarding guide';
