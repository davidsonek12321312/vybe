/**
 * Build configuration from EXPO_PUBLIC_* variables — Spec 002 REQ-009, 041,
 * 042, 051. Expo inlines EXPO_PUBLIC_* values only for static
 * `process.env.NAME` reads, so readConfig() names each variable literally.
 * Only the Supabase URL and the publishable key are accepted; secret and
 * service-role keys are rejected.
 */
export type DataSource = 'sample' | 'supabase';

export type ConfigErrorCode =
  | 'invalid_source'
  | 'invalid_city'
  | 'invalid_site_url'
  | 'missing_url'
  | 'invalid_url'
  | 'missing_key'
  | 'invalid_key'
  | 'secret_key';

export class ConfigError extends Error {
  readonly code: ConfigErrorCode;

  constructor(code: ConfigErrorCode) {
    super(`MOVA configuration error: ${code}`);
    this.name = 'ConfigError';
    this.code = code;
  }
}

interface BaseConfig {
  defaultCity: string;
  siteUrl: string | null;
}

export type AppConfig =
  | (BaseConfig & { source: 'sample' })
  | (BaseConfig & { source: 'supabase'; supabaseUrl: string; publishableKey: string });

export interface RawEnv {
  source?: string;
  supabaseUrl?: string;
  publishableKey?: string;
  siteUrl?: string;
  defaultCity?: string;
  /** Allows http://localhost and http://127.0.0.1 (development and local previews). */
  allowLocalhost: boolean;
}

const CITY_SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const PUBLISHABLE_KEY = /^sb_publishable_[A-Za-z0-9_-]{10,}$/;
const JWT = /^eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;
const HTTPS_ORIGIN = /^https:\/\/[a-z0-9.-]+(:\d+)?\/?$/i;
const LOCAL_ORIGIN = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/?$/;

function clean(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function isAllowedOrigin(value: string, allowLocalhost: boolean): boolean {
  return HTTPS_ORIGIN.test(value) || (allowLocalhost && LOCAL_ORIGIN.test(value));
}

function isServiceRoleJwt(value: string): boolean {
  if (!JWT.test(value)) return false;
  try {
    const payload = value.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const claims: unknown = JSON.parse(atob(payload));
    return typeof claims === 'object' && claims !== null && (claims as { role?: unknown }).role === 'service_role';
  } catch {
    return false;
  }
}

export function parseConfig(raw: RawEnv): AppConfig {
  const source = clean(raw.source) ?? 'sample';
  if (source !== 'sample' && source !== 'supabase') throw new ConfigError('invalid_source');

  const defaultCity = clean(raw.defaultCity) ?? 'da-nang';
  if (!CITY_SLUG.test(defaultCity)) throw new ConfigError('invalid_city');

  const site = clean(raw.siteUrl);
  if (site && !isAllowedOrigin(site, raw.allowLocalhost)) throw new ConfigError('invalid_site_url');
  const siteUrl = site ? site.replace(/\/$/, '') : null;

  if (source === 'sample') return { source, defaultCity, siteUrl };

  const supabaseUrl = clean(raw.supabaseUrl);
  if (!supabaseUrl) throw new ConfigError('missing_url');
  if (!isAllowedOrigin(supabaseUrl, raw.allowLocalhost)) throw new ConfigError('invalid_url');

  const publishableKey = clean(raw.publishableKey);
  if (!publishableKey) throw new ConfigError('missing_key');
  if (publishableKey.startsWith('sb_secret_') || isServiceRoleJwt(publishableKey)) {
    throw new ConfigError('secret_key');
  }
  if (!PUBLISHABLE_KEY.test(publishableKey)) throw new ConfigError('invalid_key');

  return { source, defaultCity, siteUrl, supabaseUrl: supabaseUrl.replace(/\/$/, ''), publishableKey };
}

export function readConfig(): AppConfig {
  return parseConfig({
    source: process.env.EXPO_PUBLIC_MOVA_DATA_SOURCE,
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    publishableKey: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    siteUrl: process.env.EXPO_PUBLIC_SITE_URL,
    defaultCity: process.env.EXPO_PUBLIC_DEFAULT_CITY,
    allowLocalhost: __DEV__ || process.env.EXPO_PUBLIC_ALLOW_LOCAL_SUPABASE === 'true',
  });
}
