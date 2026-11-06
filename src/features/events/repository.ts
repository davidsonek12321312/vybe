/**
 * Picks exactly one event source for the build (REQ-009) and exposes the
 * shared app context used by screens and server loaders.
 */
import { ConfigError, readConfig, type AppConfig } from '@/config/env';
import { getSupabaseClient } from '@/lib/supabase';

import { hostOf } from './links';
import { createSampleRepository } from './sample-repository';
import { createSupabaseRepository } from './supabase-repository';
import type { EventRepository } from './types';

export function createEventRepository(config: AppConfig): EventRepository {
  if (config.source === 'sample') return createSampleRepository();
  const client = getSupabaseClient(config.supabaseUrl, config.publishableKey);
  return createSupabaseRepository(client, { coverHost: hostOf(config.supabaseUrl) });
}

export type AppContext =
  | { ok: true; config: AppConfig; repository: EventRepository }
  | { ok: false; error: ConfigError };

let context: AppContext | null = null;

export function getAppContext(): AppContext {
  if (context) return context;
  try {
    const config = readConfig();
    context = { ok: true, config, repository: createEventRepository(config) };
  } catch (error) {
    if (!(error instanceof ConfigError)) throw error;
    context = { ok: false, error };
  }
  return context;
}
