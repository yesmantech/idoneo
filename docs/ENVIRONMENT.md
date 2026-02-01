# Environment Variables

This document describes all environment variables used by the Idoneo application.

---

## Required Variables

These variables **must** be set for the application to function.

### `VITE_SUPABASE_URL`

| Property | Value |
|----------|-------|
| **Required** | ✅ Yes |
| **Type** | URL string |
| **Example** | `https://abcdefgh.supabase.co` |

The URL of your Supabase project. Found in Supabase Dashboard → Settings → API.

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
```

---

### `VITE_SUPABASE_ANON_KEY`

| Property | Value |
|----------|-------|
| **Required** | ✅ Yes |
| **Type** | JWT string |
| **Example** | `eyJhbGciOiJIUzI1NiIs...` |

The anonymous (public) API key for Supabase. This key is safe to expose in client-side code as Row Level Security (RLS) policies control access.

Found in Supabase Dashboard → Settings → API → `anon` `public`.

```env
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> ⚠️ **Never commit** the service role key. Only the anon key should be in client code.

---

## Optional Variables

These variables have sensible defaults or are only needed for specific features.

### Google Analytics (Production Only)

If you want to enable Google Analytics tracking:

```env
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

| Property | Value |
|----------|-------|
| **Required** | ❌ No |
| **Type** | String |
| **Default** | Disabled if not set |

---

## Environment File Setup

### Local Development

Create a `.env.local` file in the project root:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Optional: Analytics (usually not needed locally)
# VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### Production (Vercel)

Set environment variables in Vercel Dashboard → Project → Settings → Environment Variables.

| Variable | Environment |
|----------|-------------|
| `VITE_SUPABASE_URL` | Production, Preview |
| `VITE_SUPABASE_ANON_KEY` | Production, Preview |
| `VITE_GA_MEASUREMENT_ID` | Production only |

---

## Accessing Variables in Code

Vite exposes environment variables via `import.meta.env`:

```typescript
// Accessing environment variables in TypeScript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
```

> **Note**: Only variables prefixed with `VITE_` are exposed to client-side code. This is a security feature.

---

## Troubleshooting

### Variables not loading

1. Ensure the file is named `.env.local` (not `.env`)
2. Restart the dev server after changing variables
3. Verify variable names start with `VITE_`

### Supabase connection errors

```
Error: supabaseUrl is required
```

This means `VITE_SUPABASE_URL` is not set. Check your `.env.local` file.

### Variables in production builds

Environment variables are **embedded at build time**, not runtime. If you change variables:

1. Rebuild the application: `npm run build`
2. Redeploy

---

## Security Notes

| DO ✅ | DON'T ❌ |
|-------|---------|
| Commit `.env.local.example` with placeholder values | Commit `.env.local` with real values |
| Use anon key in client code | Use service role key in client code |
| Set production vars in Vercel dashboard | Hardcode production values |

The `.gitignore` file excludes `.env.local` from version control.
