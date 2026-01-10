-- Ensure there is an active season for the current week
INSERT INTO leaderboard_seasons (name, start_at, end_at, is_active)
SELECT 
  'Season ' || to_char(now(), 'IYYY-IW'), 
  date_trunc('week', now()), 
  date_trunc('week', now()) + interval '1 week', 
  true
WHERE NOT EXISTS (
    SELECT 1 FROM leaderboard_seasons 
    WHERE is_active = true 
    AND start_at <= now() 
    AND (end_at IS NULL OR end_at > now())
);
