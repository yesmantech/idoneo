-- Migration: Account Deletion for Apple App Store Compliance
-- This function allows users to delete their own account securely
-- Required by Apple App Store Review Guidelines 5.1.1 (Account Deletion)

-- 1. Create a secure function to delete user account
-- Note: This uses auth.uid() to ensure users can ONLY delete their own account
CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    _user_id UUID;
BEGIN
    -- Get the current user's ID
    _user_id := auth.uid();
    
    -- Safety check: ensure user is authenticated
    IF _user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Delete user's avatar from storage (if exists)
    -- Note: Storage deletion is handled separately via client
    
    -- The following tables have ON DELETE CASCADE from auth.users:
    -- - profiles (primary user data)
    -- - user_xp (XP per season)
    -- - concorso_leaderboard (quiz scores)
    -- - user_badges (earned badges)
    -- - xp_events (XP history)
    -- - friendships (social connections)
    -- - user_quiz_stats (quiz statistics)
    
    -- Tables with ON DELETE SET NULL (data preserved, user reference nulled):
    -- - blog_posts.user_id -> NULL
    -- - question_reports.user_id -> NULL
    
    -- Delete the user from auth.users - this triggers all CASCADE deletes
    DELETE FROM auth.users WHERE id = _user_id;
    
END;
$$;

-- 2. Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.delete_user_account() TO authenticated;

-- 3. Revoke from public for security
REVOKE EXECUTE ON FUNCTION public.delete_user_account() FROM public;
REVOKE EXECUTE ON FUNCTION public.delete_user_account() FROM anon;
