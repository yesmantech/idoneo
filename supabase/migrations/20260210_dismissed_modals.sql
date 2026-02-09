-- Migration: Add dismissed_modals array to profiles
-- Stores keys of modals the user has dismissed (e.g., 'xp_info', 'prep_info')

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS dismissed_modals TEXT[] DEFAULT '{}';

COMMENT ON COLUMN public.profiles.dismissed_modals IS 'Array of modal keys the user has dismissed, e.g. xp_info, prep_info';
