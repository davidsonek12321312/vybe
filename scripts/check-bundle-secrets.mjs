// Spec 002 S29 / NFR-006: fail if a Supabase secret key or a service-role JWT
// appears anywhere in the web build (dist/client and dist/server).
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';

const ROOT = 'dist';
const SECRET_KEY = /sb_secret_[A-Za-z0-9_-]{20,}/;
const ACCESS_TOKEN = /sbp_[a-f0-9]{40}/;
const DB_URL = /postgres(?:ql)?:\/\/[^:\s/]+:[^@\s]{6,}@/;
const JWT = /eyJ[A-Za-z0-9_-]{8,}\.eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]+/g;

function* files(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) yield* files(path);
    else yield path;
  }
}

function isServiceRole(jwt) {
  try {
    const payload = JSON.parse(Buffer.from(jwt.split('.')[1], 'base64url').toString('utf8'));
    return payload?.role === 'service_role';
  } catch {
    return false;
  }
}

let scanned = 0;
const findings = [];
for (const path of files(ROOT)) {
  if (!/\.(js|mjs|cjs|html|json|map|css|txt)$/.test(path)) continue;
  scanned += 1;
  const text = readFileSync(path, 'utf8');
  if (SECRET_KEY.test(text)) findings.push(`${path}: Supabase secret key`);
  if (ACCESS_TOKEN.test(text)) findings.push(`${path}: Supabase access token`);
  if (DB_URL.test(text)) findings.push(`${path}: database URL with password`);
  for (const match of text.matchAll(JWT)) {
    if (isServiceRole(match[0])) findings.push(`${path}: service-role JWT`);
  }
}

if (findings.length > 0) {
  console.error('check:bundle: privileged keys found in the web build:');
  for (const finding of findings) console.error(`  ${finding}`);
  process.exit(1);
}
console.log(`check:bundle: ${scanned} files scanned, no secret or service-role keys`);
