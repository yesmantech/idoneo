-- Migration to add Preparation Score breakdown columns to concorso_leaderboard

ALTER TABLE concorso_leaderboard
ADD COLUMN IF NOT EXISTS recency_score float8 DEFAULT 0,
ADD COLUMN IF NOT EXISTS coverage_score float8 DEFAULT 0,
ADD COLUMN IF NOT EXISTS reliability float8 DEFAULT 0,
ADD COLUMN IF NOT EXISTS unique_questions int4 DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_answers int4 DEFAULT 0;

-- Optional: Add comments for clarity
COMMENT ON COLUMN concorso_leaderboard.score IS 'Final Preparation Score (0-100)';
COMMENT ON COLUMN concorso_leaderboard.volume_factor IS 'Volume Score (0-1)';
COMMENT ON COLUMN concorso_leaderboard.accuracy_weighted IS 'Time-Weighted Accuracy Score (0-1)';
COMMENT ON COLUMN concorso_leaderboard.recency_score IS 'Recency Score (0-1)';
COMMENT ON COLUMN concorso_leaderboard.coverage_score IS 'Coverage/Diversity Score (0-1)';
COMMENT ON COLUMN concorso_leaderboard.reliability IS 'Reliability Gate Factor (0-1)';
