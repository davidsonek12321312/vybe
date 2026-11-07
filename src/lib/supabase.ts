/**
 * Supabase client — Spec 002 REQ-041, REQ-048. Publishable key only, no
 * session (Spec 002 has no sign-in). Shared by screens and server loaders.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import type { Database } from './database.types';
import './url-polyfill';

let cached: { key: string; client: SupabaseClient<Database> } | null = null;

export function getSupabaseClient(url: string, publishableKey: string): SupabaseClient<Database> {
  const key = `${url}|${publishableKey}`;
  if (!cached || cached.key !== key) {
    cached = {
      key,
      client: createClient<Database>(url, publishableKey, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      }),
    };
  }
  return cached.client;
}
