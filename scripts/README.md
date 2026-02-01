# Scripts Directory

This directory contains utility and debug scripts for development and troubleshooting.

## Debug Scripts

| Script | Purpose |
|--------|---------|
| `debug_reports.mjs` | Inspect question report data from the database |
| `debug_score.mjs` | Debug leaderboard score calculations |
| `inspect_attempt.ts` | Analyze a specific quiz attempt's answers |
| `inspect_quiz_topology.ts` | Visualize quiz structure (roles, subjects, questions) |
| `inspect_seasons.ts` | Analyze XP seasons and their status |

## Data Scripts

| Script | Purpose |
|--------|---------|
| `find-user.js` | Look up a user by email, ID, or nickname |
| `reset_leaderboard.mjs` | Clear and recalculate leaderboard scores |
| `test_score.js` | Test the scoring algorithm with sample data |
| `verify_explanation.js` | Check that questions have explanations |

## Running Scripts

### TypeScript Scripts (`.ts`)

```bash
npx ts-node scripts/inspect_attempt.ts <attempt-id>
```

### JavaScript/ESM Scripts (`.mjs`)

```bash
node scripts/debug_score.mjs
```

### JavaScript Scripts (`.js`)

```bash
node scripts/find-user.js <email-or-id>
```

## Environment Variables

Most scripts require Supabase credentials. Set these in your `.env.local`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Some scripts may require the `SUPABASE_SERVICE_ROLE_KEY` for admin operations.

## Adding New Scripts

1. Create the script file with appropriate extension
2. Add a description to this README
3. Document required environment variables
4. Add usage examples in the script comments
