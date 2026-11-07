// Spec 002 S28 / REQ-047: start the Vercel adapter (api/index.js) on the
// server build and check status codes and metadata. Run after `npx expo
// export -p web`. Works with the sample source and with the local seed,
// which both contain "beach-social-001".
import http from 'node:http';
import { createRequire } from 'node:module';
import process from 'node:process';

const require = createRequire(import.meta.url);
const handler = require('../api/index.js');

const server = http.createServer((req, res) => {
  handler(req, res).catch((error) => {
    res.statusCode = 500;
    res.end(String(error));
  });
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const { port } = server.address();

const checks = [
  { path: '/', status: 200, includes: ['<title>MOVA', 'og:title'] },
  { path: '/events/beach-social-001', status: 200, includes: ['Da Nang Beach Social #001 · MOVA', 'property="og:title"', 'Da Nang Beach Social #001'] },
  { path: '/events/does-not-exist', status: 404, includes: ['Event not available'] },
  { path: '/no-such-page', status: 404, includes: [] },
  // In-app navigation fetches loader data as JSON and must never get a 404 page (D22).
  { path: '/_expo/loaders/events/beach-social-001', accept: 'application/json', status: 200, includes: ['"status":"found"'] },
  { path: '/_expo/loaders/events/does-not-exist', accept: 'application/json', status: 200, includes: ['"status":"not_available"'] },
];

let failed = 0;
for (const check of checks) {
  const headers = check.accept ? { Accept: check.accept } : {};
  const response = await fetch(`http://127.0.0.1:${port}${check.path}`, { headers });
  const body = await response.text();
  const missing = check.includes.filter((text) => !body.includes(text));
  const ok = response.status === check.status && missing.length === 0;
  if (!ok) failed += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${response.status} ${check.path}${missing.length ? ` (missing: ${missing.join(', ')})` : ''}`);
}

server.close();
if (failed > 0) {
  console.error(`ssr:smoke: ${failed} check(s) failed`);
  process.exit(1);
}
console.log('ssr:smoke: all checks passed');
