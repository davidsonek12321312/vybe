// Spec 001 REQ-003 / Scenario 4: an invalid literal route must fail
// type-checking. Run after `npm run typegen`. The fixture lives in
// type-tests/ and is excluded from the normal `npm run typecheck`.
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import process from 'node:process';

const FIXTURE = 'type-tests/invalid-route.tsx';
const require = createRequire(import.meta.url);

if (!existsSync('.expo/types/router.d.ts')) {
  console.error('test:types: generated route types are missing; run `npm run typegen` first.');
  process.exit(1);
}

const tsc = require.resolve('typescript/bin/tsc');
const result = spawnSync(process.execPath, [tsc, '-p', 'tsconfig.typetest.json', '--pretty', 'false'], {
  encoding: 'utf8',
});
const output = `${result.stdout ?? ''}${result.stderr ?? ''}`;
const errors = output.split(/\r?\n/).filter((line) => /error TS\d+/.test(line));
const expected = errors.filter(
  (line) => line.replace(/\\/g, '/').startsWith(FIXTURE) && line.includes('error TS2322'),
);

if (result.status !== 0 && errors.length > 0 && expected.length === errors.length) {
  console.log(`test:types: invalid route rejected as expected (${expected.length} x TS2322 in ${FIXTURE}).`);
  process.exit(0);
}

console.error(`test:types: expected only TS2322 errors from ${FIXTURE}; tsc exited ${result.status}.`);
console.error(output.trim() || '(no output)');
process.exit(1);
