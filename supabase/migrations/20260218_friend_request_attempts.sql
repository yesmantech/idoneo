-- Migration: Add limits to friend requests (Spam prevention)

-- 1. Add request_attempts column
ALTER TABLE public.friendships 
ADD COLUMN IF NOT EXISTS request_attempts INTEGER DEFAULT 1;

-- 2. Security: Ensure users can't reset their own attempts (handled via code, but RLS could enforce if strict)
-- For now, trust the service logic + RLS allows update of status/attempts if user is involved.

-- 3. Notes
-- Status 'rejected' is now a persistent state, not just a deleted row.
-- Logic:
--   - Send Request (First time): Insert (attempts=1)
--   - Reject: Update status='rejected'
--   - Send Request (Again): Update status='pending', attempts=attempts+1 (IF attempts < 3)
