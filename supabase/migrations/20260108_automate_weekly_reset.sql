-- 1. Enable pg_cron Extension (if not enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Define the Function to Create New Season
CREATE OR REPLACE FUNCTION public.create_new_season()
RETURNS void AS $$
BEGIN
  -- Insert a new season starting from 'now' (which will be Monday 00:00 when triggered)
  INSERT INTO leaderboard_seasons (name, start_at, end_at, is_active)
  SELECT 
    'Season ' || to_char(now(), 'IYYY-IW'), 
    date_trunc('week', now()), 
    date_trunc('week', now()) + interval '1 week', 
    true
  WHERE NOT EXISTS (
      -- Idempotency check: don't create if one exists for this timeframe
      SELECT 1 FROM leaderboard_seasons 
      WHERE is_active = true 
      AND start_at <= now() 
      AND (end_at IS NULL OR end_at > now())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Schedule the Cron Job (Every Monday at 00:00 UTC)
-- Note: '0 0 * * 1' = At minute 0 past hour 0 on Monday.
SELECT cron.schedule(
  'weekly-season-reset',
  '0 0 * * 1',
  'SELECT public.create_new_season()'
);
