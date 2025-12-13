-- Allow authenticated users to view all profiles (needed for search)
-- IMPORTANT: This allows reading nickname/avatar of any user.
CREATE POLICY "Profiles are viewable by authenticated users"
ON profiles FOR SELECT
TO authenticated
USING (true);
