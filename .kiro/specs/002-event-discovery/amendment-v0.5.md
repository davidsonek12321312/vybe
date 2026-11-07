# Amendment v0.5: Spec 002 Event Discovery

## Status: APPROVED
## Approved by: CEO
## Approved on: 2026-11-07

Recorded by Claude Code on the CEO's instruction (decisions AR1 and AR3, given in the
VS Code session on 2026-11-07, after the implementation review in
`docs/reviews/spec-002-implementation-review.md`). Where this amendment differs from
requirements v0.4 or design v0.4/v0.3 (A1–A7), this amendment governs.

## A11. Security response headers (design A2, `vercel.json`; review finding SEC-4)

`vercel.json` SHALL set these response headers on all routes:

- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Content-Security-Policy: frame-ancestors 'none'; object-src 'none'; base-uri 'self'`
- `Permissions-Policy: geolocation=(), camera=(), microphone=()`

A stricter script and style CSP is out of scope for this amendment (Expo web inline
scripts); it needs its own proposal. Headers are confirmed on the first preview deployment,
which still needs CEO approval.

## REQ-037 amendment: unknown values use a fallback

Requirements v0.4 REQ-037 says an event that fails client validation is excluded. For
unknown `category` and `language` values the rule changes:

- WHEN a returned event has a category value the client does not know, THE client SHALL map
  it to `other`.
- WHEN a returned event has a language code the client does not know, THE client SHALL show
  the raw code neutrally (no translation, no error).
- THE client SHALL NOT crash or drop the event for these two reasons.
- Rows that fail any other validity check SHALL still be excluded.

## Not changed by this amendment

`change_note` stays optional (decision AR2). Missing notes show a generic "Details changed"
line; this is within v0.4 scope. Real-device time-zone checks (AR4) are required before the
public release, not before the pull requests.
