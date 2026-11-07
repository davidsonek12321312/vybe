/**
 * Deployment config guards — amendment v0.5 A11 (security headers), review SEC-1/SEC-3.
 */
declare const require: (path: string) => unknown;

type Header = { key: string; value: string };
const config = require('../../vercel.json') as {
  buildCommand: string;
  functions: Record<string, { maxDuration?: number }>;
  headers: { source: string; headers: Header[] }[];
};

test('security headers are set on every route (A11)', () => {
  const all = config.headers.find((rule) => rule.source === '/(.*)');
  const byKey = Object.fromEntries((all?.headers ?? []).map((h) => [h.key, h.value]));
  expect(byKey['X-Content-Type-Options']).toBe('nosniff');
  expect(byKey['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
  expect(byKey['Content-Security-Policy']).toContain("frame-ancestors 'none'");
  expect(byKey['Permissions-Policy']).toContain('geolocation=()');
});

test('the Vercel build runs the live-env and bundle checks (SEC-1) and the function has a time limit (SEC-3)', () => {
  expect(config.buildCommand).toContain('export:web:live');
  expect(config.buildCommand).toContain('check:bundle');
  expect(config.functions['api/index.js'].maxDuration).toBe(10);
});
