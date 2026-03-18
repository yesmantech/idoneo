-- =============================================================================
-- MIGRATION: Harden Avatar Storage RLS Policies
-- SEC-025: Restrict avatar uploads so users can only write to their own folder
-- 
-- Before: Any authenticated user could upload to any path in the avatars bucket
-- After: Users can only upload/delete files under their own user_id folder prefix
-- =============================================================================

-- Drop old permissive upload policy
DROP POLICY IF EXISTS "Authenticated Upload Avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Delete Avatars" ON storage.objects;

-- New scoped upload policy: users can only write under their own {user_id}/ folder
CREATE POLICY "Users upload own avatars"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (
      -- Scoped path: {user_id}/{filename}
      (storage.foldername(name))[1] = auth.uid()::text
      -- Flat path fallback (legacy filenames like {user_id}-timestamp.ext)
      OR name LIKE auth.uid()::text || '-%'
    )
  );

-- New scoped delete policy: users can only delete their own files
CREATE POLICY "Users delete own avatars"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR name LIKE auth.uid()::text || '-%'
    )
  );
