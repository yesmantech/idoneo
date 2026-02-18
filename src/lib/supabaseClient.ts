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
  // Show error on screen for debugging production white screen issues
  if (typeof document !== 'undefined') {
    document.body.innerHTML = `
      <div style="padding: 20px; font-family: sans-serif; text-align: center; color: #333;">
        <h1 style="color: #ef4444;">Configurazione Mancante</h1>
        <p>Le variabili d'ambiente di Supabase non sono state caricate correttamente.</p>
        <p style="font-size: 0.9em; opacity: 0.8;">VITE_SUPABASE_URL: ${supabaseUrl ? 'Presente' : 'MANCANTE'}</p>
        <p style="font-size: 0.9em; opacity: 0.8;">VITE_SUPABASE_ANON_KEY: ${supabaseAnonKey ? 'Presente' : 'MANCANTE'}</p>
      </div>
    `;
  }
}

import { SupabaseNativeStorage } from "./SupabaseStorage";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: SupabaseNativeStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
