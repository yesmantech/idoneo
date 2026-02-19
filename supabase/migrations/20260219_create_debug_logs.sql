-- Create a table for debugging Edge Functions
CREATE TABLE IF NOT EXISTS debug_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    function_name TEXT NOT NULL,
    message TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Allow insertion from service role and authenticated users (for dev)
ALTER TABLE debug_logs ENABLE ROW LEVEL SECURITY;

-- Ensure Bandi are visible to everyone
DROP POLICY IF EXISTS "Enable read access for all users" ON bandi;
CREATE POLICY "Enable read access for all users" ON bandi FOR SELECT USING (true);

-- Ensure Debug Logs are visible to authenticated users (simplifying for debug)
DROP POLICY IF EXISTS "Enable read for admins" ON debug_logs;
DROP POLICY IF EXISTS "Enable read for authenticated" ON debug_logs;
DROP POLICY IF EXISTS "Enable insert for service role and admins" ON debug_logs;

CREATE POLICY "Enable read for authenticated" ON debug_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert for service role and admins" ON debug_logs FOR INSERT TO service_role, authenticated WITH CHECK (true);
