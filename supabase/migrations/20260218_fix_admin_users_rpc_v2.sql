
-- DEFINITIVE FIX FOR AMBIGUITY IN get_admin_profiles
-- This version uses #variable_conflict to prevent Postgres from confusing 
-- the return table columns with the actual table columns.

-- 1. Drop existing function to ensure a clean state
DROP FUNCTION IF EXISTS get_admin_profiles();

-- 2. Re-create with the conflict directive
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
-- Tell Postgres to prioritize table columns in case of naming conflicts
#variable_conflict use_column
DECLARE
  v_caller_role text;
BEGIN
  -- Check the role of the user calling the function
  SELECT role INTO v_caller_role FROM profiles WHERE profiles.id = auth.uid();
  
  IF v_caller_role = 'admin' THEN
    RETURN QUERY 
    SELECT 
      profiles.id, 
      profiles.nickname, 
      profiles.role, 
      profiles.email, 
      profiles.created_at 
    FROM public.profiles
    ORDER BY profiles.created_at DESC;
  ELSE
    RAISE EXCEPTION 'Access Denied: Admins Only';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 3. Ensure permissions are correct
GRANT EXECUTE ON FUNCTION get_admin_profiles() TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_profiles() TO service_role;
