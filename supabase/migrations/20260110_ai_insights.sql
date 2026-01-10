-- Dynamic AI Insights Table
-- Stores auto-generated insights based on analytics data

CREATE TABLE admin_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  insight_type TEXT NOT NULL,        -- 'conversion', 'content_gap', 'trend', 'alert'
  priority TEXT NOT NULL DEFAULT 'medium', -- 'high', 'medium', 'low'
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  recommendation TEXT,
  trend TEXT,                        -- 'up', 'down', null
  metadata JSONB DEFAULT '{}',       -- Additional context data (quiz_id, subject, etc.)
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ             -- Auto-dismiss after this time
);

-- Create index for quick active insights lookup
CREATE INDEX idx_admin_insights_active ON admin_insights(is_active, created_at DESC);

-- RLS: Only admins can read/write
ALTER TABLE admin_insights ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read (admin check happens in app layer)
CREATE POLICY "Authenticated users can read insights" ON admin_insights
  FOR SELECT TO authenticated USING (true);

-- Only service role can insert/update/delete (via backend/edge functions)
CREATE POLICY "Service role can manage insights" ON admin_insights
  FOR ALL TO service_role USING (true);

COMMENT ON TABLE admin_insights IS 'Stores AI-generated insights for admin analytics dashboard';
