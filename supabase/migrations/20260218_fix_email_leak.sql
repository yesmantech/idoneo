-- ==============================================================================
-- PII LEAK FIX: Secure Email Column
-- ==============================================================================

-- 1. Create a secure RPC for Admins to fetch user lists with emails
CREATE OR REPLACE FUNCTION get_admin_profiles()
RETURNS TABLE (
  id uuid,
  nickname text,
  role text,
  email text,
  created_at timestamptz
)
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow Admins
  IF (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' THEN
    RETURN QUERY SELECT p.id, p.nickname, p.role, p.email, p.created_at FROM public.profiles p ORDER BY p.created_at DESC;
  ELSE
    RAISE EXCEPTION 'Access Denied: Admins Only';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 2. Revoke SELECT permission on the 'email' column from public roles
-- Note: We must revoke from public/anon/authenticated to be sure.
-- However, Postgres REVOKE syntax for columns is specific. 
-- Actually, the standard way is to REVOKE ALL on TABLE, then GRANT specific columns.

-- Revoke Table access first (standard RLS setup usually grants ALL or SELECT on table)
-- We'll assume standard grants exist.
-- To implement Column Level Security effectively without breaking everything,
-- we need to restrict the column specifically.

-- Step A: Revoke Table SELECT (to reset) - This might be too aggressive if not careful.
-- Safer: We cannot just REVOKE column select. We have to REVOKE table select and GRANT specific columns.

-- 3. Grant Safe Columns to Authenticated/Anon
-- (Assumes Schema is 'public')
-- We rely on the fact that existing grants might be "GRANT ALL ON profiles".

REVOKE SELECT ON TABLE public.profiles FROM anon, authenticated;

GRANT SELECT (id, nickname, avatar_url, role, streak_current, streak_max, dismissed_modals, total_xp, created_at, updated_at) 
ON TABLE public.profiles TO anon, authenticated;

-- 4. Grant Execute on RPC
GRANT EXECUTE ON FUNCTION get_admin_profiles() TO authenticated;
