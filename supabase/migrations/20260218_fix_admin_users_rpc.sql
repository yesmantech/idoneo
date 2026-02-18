
-- Fix ambiguity in get_admin_profiles function
-- This resolves the "column reference 'role' is ambiguous" error 
-- caused by the RETURNS TABLE column naming.

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
DECLARE
  v_role text;
BEGIN
  -- 1. Fetch the role of the calling user (auth.uid()) into a local variable.
  -- This prevents ambiguity between the return table column 'role' and the 'profiles.role' column.
  SELECT p.role INTO v_role 
  FROM public.profiles p 
  WHERE p.id = auth.uid();
  
  -- 2. Verify admin access
  IF v_role = 'admin' THEN
    -- 3. Return the full list of profiles.
    -- Explicitly prefix column names with 'p.' to ensure clarity.
    RETURN QUERY 
    SELECT 
      p.id, 
      p.nickname, 
      p.role, 
      p.email, 
      p.created_at 
    FROM public.profiles p 
    ORDER BY p.created_at DESC;
  ELSE
    -- Rejection for non-admins
    RAISE EXCEPTION 'Access Denied: Admins Only';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Re-grant execute permission to ensure it's correct
GRANT EXECUTE ON FUNCTION get_admin_profiles() TO authenticated;
