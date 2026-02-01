# Database Migrations

This directory contains SQL migration files for the Supabase PostgreSQL database.

## Migration Naming Convention

Files are named using the format:
```
YYYYMMDD_description.sql
```

For example:
- `20241209_profiles_schema.sql` - Initial profiles table schema
- `20260102_scalability_scoring.sql` - Leaderboard scoring algorithm

## Schema Overview

### Core Tables

| Table | Purpose | Migration |
|-------|---------|-----------|
| `categories` | Top-level contest categories | `profiles_schema.sql` |
| `roles` | Specific positions (Allievo Agente, etc.) | `role_hub_schema.sql` |
| `quizzes` | Quiz/exam definitions | `quizzes_seed.sql` |
| `subjects` | Subject areas within quizzes | `quizzes_seed.sql` |
| `questions` | Multiple choice questions | `quizzes_seed.sql` |

### User Data Tables

| Table | Purpose | Migration |
|-------|---------|-----------|
| `profiles` | Extended user profiles | `profiles_schema.sql` |
| `quiz_attempts` | User's quiz sessions | `quiz_attempts_policies.sql` |
| `user_badges` | Earned badges | `badge_system.sql` |
| `user_xp` | Seasonal XP balances | `xp_system.sql` |

### Leaderboard Tables

| Table | Purpose | Migration |
|-------|---------|-----------|
| `concorso_leaderboard` | Per-quiz skill rankings | `leaderboard_schema.sql` |
| `leaderboard_seasons` | Weekly/monthly XP seasons | `scalability_scoring.sql` |
| `xp_events` | XP transaction log | `xp_system.sql` |

### Other Tables

| Table | Purpose | Migration |
|-------|---------|-----------|
| `friendships` | Social connections | `create_friendships.sql` |
| `question_reports` | User-reported issues | `question_reports.sql` |
| `blog_posts`, `blog_categories`, `blog_tags` | Blog system | `blog_schema.sql` |

## Key Triggers

### `on_new_attempt_score`
Updates `concorso_leaderboard` whenever a `quiz_attempt` is inserted/updated.
Calculates the 5-factor composite score (volume, accuracy, recency, coverage, reliability).

### `trg_question_stats_update`
Updates question-level statistics for answer analytics.

### `auto_reset_weekly_season`
Automated job to reset weekly XP seasons.

## Running Migrations

Migrations are applied automatically when deploying to Supabase. For local development:

```bash
# Apply all pending migrations
supabase db push

# Create a new migration
supabase migration new your_migration_name
```

## Row Level Security (RLS)

All tables have RLS policies defined. Key principles:

- Users can only access their own data (attempts, profile, badges)
- Quiz content (questions, categories) is publicly readable
- Admin users (role = 'admin') have full access

See `*_rls.sql` and `*_policies.sql` files for specific policies.
