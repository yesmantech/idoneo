/**
 * @file supabaseClient.ts
 * @description Supabase client singleton for the entire application.
 *
 * This module creates and exports a single Supabase client instance that should
 * be used across the entire application. The singleton pattern ensures:
 * - Consistent authentication state
 * - Connection pooling for optimal performance
 * - Single source of truth for realtime subscriptions
 *
 * @requires VITE_SUPABASE_URL - The Supabase project URL (from .env.local)
 * @requires VITE_SUPABASE_ANON_KEY - The Supabase anonymous/public API key
 *
 * @example
 * ```typescript
 * import { supabase } from '@/lib/supabaseClient';
 *
 * // Query data
 * const { data, error } = await supabase.from('profiles').select('*');
 *
 * // Auth operations
 * const { data, error } = await supabase.auth.signInWithOtp({ email });
 * ```
 *
 * @see https://supabase.com/docs/reference/javascript/initializing
 */

import { createClient } from "@supabase/supabase-js";

// Environment variables (required, will throw if missing)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase env vars mancanti. Controlla VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY in .env.local"
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
