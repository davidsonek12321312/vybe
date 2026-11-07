// Spec 002 REQ-042 (S24): a live web build must have a valid Supabase URL and
// publishable key. Reads process.env, then .env and .env.local (without
// overriding), in the same order Expo loads them (highest precedence first:
// .env.production.local, .env.local, .env.production, .env). Never prints key values.
import { existsSync, readFileSync } from 'node:fs';
import process from 'node:process';

for (const file of ['.env.production.local', '.env.local', '.env.production', '.env']) {
  if (!existsSync(file)) continue;
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (match && process.env[match[1]] === undefined) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, '');
    }
  }
}

const fail = (code) => {
  console.error(`check-live-env: ${code}`);
  process.exit(1);
};

// Review SEC-1: no EXPO_PUBLIC_* value may look like a secret, whatever its name.
const SECRET_SHAPES = [/sb_secret_/, /sbp_[a-f0-9]{20,}/, /eyJ[A-Za-z0-9_-]{8,}\./, /postgres(?:ql)?:\/\/[^:\s/]+:[^@\s]+@/];
for (const [name, value] of Object.entries(process.env)) {
  if (name.startsWith('EXPO_PUBLIC_') && value && SECRET_SHAPES.some((re) => re.test(value))) {
    fail(`${name} holds a secret-shaped value; EXPO_PUBLIC_* values are shipped to browsers`);
  }
}

const source = (process.env.EXPO_PUBLIC_MOVA_DATA_SOURCE ?? '').trim();
if (source !== 'supabase') fail('EXPO_PUBLIC_MOVA_DATA_SOURCE must be "supabase" for a live build');

const url = (process.env.EXPO_PUBLIC_SUPABASE_URL ?? '').trim();
const allowLocal = process.env.EXPO_PUBLIC_ALLOW_LOCAL_SUPABASE === 'true';
if (!url) fail('missing EXPO_PUBLIC_SUPABASE_URL');
if (!/^https:\/\/[a-z0-9.-]+(:\d+)?\/?$/i.test(url) && !(allowLocal && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/?$/.test(url))) {
  fail('EXPO_PUBLIC_SUPABASE_URL must be an https origin');
}

const key = (process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '').trim();
if (!key) fail('missing EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY');
if (key.startsWith('sb_secret_') || key.startsWith('eyJ')) fail('a secret or JWT key is not allowed; use the publishable key');
if (!/^sb_publishable_[A-Za-z0-9_-]{10,}$/.test(key)) fail('EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY is not a publishable key');

console.log('check-live-env: live configuration is valid');
