# Spec 002 implementation review

- Spec: `.kiro/specs/002-event-discovery` v0.4 (plus amendment v0.5, once recorded)
- Reviewed tip: `a2819b4` on `feature/spec-002-event-discovery`
- Date: 2026-11-07
- Reviewers: `code-reviewer` (sonnet, read-only), `security-reviewer` (opus, read-only)
- Triage: the worker checked each finding against the code on the tip. "Confirmed" means the
  cited lines were read and the defect is present. "Plausible" means the code supports the
  claim, but it needs a runtime or device check; the fix includes that check.
- Recommendation: the code review says request changes; the security review says approve the
  merge with conditions, but not deployment. This document is a recommendation, not an approval.

## Decisions by the CEO (2026-11-07)

| Id | Decision |
|---|---|
| AR1 | Approved: add security headers to `vercel.json` (SEC-4). Recorded as amendment A11. |
| AR2 | `change_note` stays optional; show a generic "Details changed" line when missing (CR-11b). |
| AR3 | Approved: unknown category or language values use a safe fallback instead of dropping the event (CR-14). Recorded as an REQ-037 amendment. |
| AR4 | Real-device date and time-zone checks (Hermes `Intl`, task 1, M1/M2) are required before the public release, not before the PRs. The CR-10 guard is still added. |

## Findings and disposition

Severity as reported by the reviewer. Status: Open = fix planned in Q4 (one `fix(002):` commit each, with tests).

| Id | Sev | Check | Disposition |
|---|---|---|---|
| SEC-1 | HIGH | Confirmed: `vercel.json` `buildCommand` is `npx expo export -p web`, so the live-env and bundle checks do not run on the build that ships | Open. Build via `export:web:live` + `check:bundle`; validate all env files Expo loads; reject secret-shaped `EXPO_PUBLIC_*` values |
| CR-1 | HIGH | Confirmed: `EventCard.tsx` `accessibilityLabel` is title + time + meta only, so badges (Cancelled, Happening now, Updated, Solo, Sample, 18+) are hidden from screen readers | Open. Share a badge-label helper with `EventBadges`; test the accessible name |
| SEC-2 | MED | Confirmed: `check-bundle-secrets.mjs` has only `sb_secret_` and JWT patterns; no `sbp_` or `postgres://user:pass@` | Open. Add to gitleaks rules and bundle scan, with positive and negative tests |
| CR-2 | MED | Confirmed by code reading (`use-events.ts`, `EventDetailScreen`) | Open. Inline loading/error/Retry banner over the cached summary |
| CR-3 | MED | Confirmed: the listed hook and UI scenarios have no tests | Open. Fake-timer hook tests and the listed S-scenarios |
| CR-4 | MED | Plausible | Open. Neutral site metadata on a loader `error`; keep noindex only for a real 404 |
| CR-5 / SEC-3 | MED / LOW | Confirmed: `loadEventForRoute` calls `getBySlug` with no timeout; no `maxDuration` | Open (one commit). `AbortSignal.timeout(8000)` mapped to `error`; `maxDuration: 10` |
| CR-6 | MED | Confirmed: meta line has `numberOfLines={2}` | Open. Remove the clamp or move the price to its own line |
| CR-7 | MED | Plausible (Chip role `button` with `selected` becomes `aria-selected` on web) | Open. Use `checkbox` with `checked`, or `aria-pressed`; check on web |
| CR-8 | MED | Confirmed | Open. Show active values in chip labels or a summary line (S6) |
| CR-9 | MED | Plausible (SSR vs client time zone, locale, clock) | Open. First render from server values; set the city-time label after mount; browser check |
| CR-10 | MED | Plausible; device check deferred by AR4 | Open (guard only). try/catch fallback in `time.ts`; device check stays on the release list |
| SEC-4 | LOW | Confirmed: no security headers | Open per AR1. Amendment A11, then headers in `vercel.json` |
| SEC-5 | LOW | Plausible | Open. Pin `supabase/setup-cli` to a SHA; `persist-credentials: false` |
| SEC-6 | LOW | Plausible; probe P1 first | Open. Revoke then grant; `table_privs_are` for `service_role` |
| SEC-7 | LOW | Confirmed gaps in pgTAP | Open. Add the listed checks |
| SEC-8 | LOW | Confirmed by the reviewer's reproduction; regexes are prefix-only | Open. Reject `..`, `%2e`, `\` and over-long URLs in SQL and `links.ts` |
| SEC-9 | LOW | Confirmed: the check is `[0-9]{6,}` on contiguous digits and misses spaced numbers and `t.me/` | Open. Strip non-digits first; reject messenger links and URLs |
| SEC-10 | LOW | Confirmed: `SafeText` uses `Linking.openURL` | Open. Use `openExternal` |
| SEC-11 | LOW | Documentation | Open. Document UUID cover paths |
| SEC-12 | INFO | (a) log note; (b) site URL for native; (c) `.gitignore` of `.omc/`; (d) `config.toml` hardening | (c) and (d) open; (a) and (b) are documentation |
| CR-11 | LOW | (a) confirmed; (b) resolved by AR2 | Open. Show both banners; generic "Details changed" |
| CR-12 | LOW | Confirmed | Open. Hide Register once started; drop or hide an invalid `updated_at` |
| CR-13 | LOW | Confirmed: 404 HTML hardcodes `lang="en"` and colours | Open |
| CR-14 | LOW | (a) add `slug` as secondary order; (b) resolved by AR3 | Open. Fallback mapping per amendment v0.5 |
| CR-15 | LOW | Plausible | Open. Key `EventDetailScreen` by slug |
| CR-16 | LOW | Confirmed gap | Open. i18n placeholder-set equality test |

No finding was dropped as a false positive. Reviewer positives (time/DST, filters, timers, RLS, grants,
escaping, source separation, Spec 001 v0.4 diff) were not re-run here; they are covered by the Q5
re-verification.

## Fix order (Q4)

1. SEC-1 and SEC-2, then CR-1, CR-2, and CR-5/SEC-3.
2. CR-3 tests, then CR-4, CR-6, CR-7, CR-8, CR-9, CR-10 (guard).
3. SEC-5 to SEC-12 and CR-11 to CR-16.
4. Amendment v0.5 (A11 headers, REQ-037 fallback) is recorded first, since SEC-4 and CR-14 depend on it.

## Open items outside this review

- Hosted baseline pull (task 4), device checks M1–M5 and M7–M12, native-speaker review of VI and RU,
  merges and deployment remain CEO or person gates.

## Disposition after fixes (2026-11-07)

Every finding above was either fixed on `feature/spec-002-event-discovery` (one commit each,
with tests), decided by the CEO, or moved to a manual or release list. Commit ids are short hashes.

| Finding | Status | Commit |
|---|---|---|
| SEC-1 | Fixed: Vercel build runs `export:web:live` and `check:bundle`; all env files read in Expo order; secret-shaped `EXPO_PUBLIC_*` values rejected | 3dca8c9 |
| SEC-2 | Fixed: gitleaks rules and bundle patterns for `sbp_` tokens and `postgres://user:pass@` | 8c39a8e |
| CR-1 | Fixed: badges in the card's accessible name, with a test | 7ae7b67 |
| CR-2 | Fixed: loading, error and Retry banner over the cached summary | 4d97459 |
| CR-3 | Fixed in parts: hook tests with fake timers (10 s, 20 s, last good list), repository query, HTTP 500 and no-title cases, Ended and Updated banners. **Not covered yet:** refresh keeps filters, Clear all, Happening-now badge, city-time label UI, share copy fallback, S15, S17, failed cover image | 2d79ce8, 2845663, e74aefa |
| CR-4 | Fixed: neutral metadata on a lookup failure | b14fab8 |
| CR-5, SEC-3 | Fixed: 8 s lookup timeout, `maxDuration` 10 | f16c0e1 |
| CR-6 | Fixed: meta line no longer clamped | 7d28bd9 |
| CR-7 | Fixed in code: chips are `checkbox` with `checked`. Screen-reader check on web is manual (M13) | 03bcc10 |
| CR-8 | Fixed: chips show the active values | 9e32212 |
| CR-9 | Open, manual (M13): server and client time zone, locale and clock may differ at hydration; needs a browser check | — |
| CR-10 | Guard fixed (UTC fallback). Device verification stays a release requirement (AR4) | 7ee3744 |
| CR-11 | Fixed: both banners; generic "Details changed" line (AR2) | e74aefa |
| CR-12a | Open: product decision AR5 (hide Register once an event starts?) | — |
| CR-12b | Fixed: `updatedAt` is null when invalid and the line is hidden | e3b00a3 |
| CR-13 | Fixed: 404 page uses the active locale and design tokens | b150c82 |
| CR-14 | Fixed: slug as secondary order; unknown category or language maps to `other` (amendment v0.5). Note: the amendment text says an unknown language shows its raw code; the client maps it to `other` because the type has no slot for a raw code | b974bdb, 1b46958 |
| CR-15, CR-16 | Fixed: detail screen keyed by slug; i18n placeholder test | ca60282 |
| SEC-4 | Fixed per amendment A11. Headers are confirmed on the first preview deployment (needs CEO approval) | b56476f |
| SEC-5 | Fixed: `supabase/setup-cli` pinned to the v1.2.0 commit; `persist-credentials: false`. Confirmed by the first CI run | 7cfb202 |
| SEC-6, SEC-8 (database), SEC-9 | Fixed in migration `20261107100000_harden_events.sql`, with pgTAP tests | dd41e9d |
| SEC-8 (client) | Fixed: `isSafeUrl` mirrors the database rules | 795f6d2 |
| SEC-7 | Fixed: `events_hardening.test.sql` (RLS on every table, no views, trigger functions not executable, exact `service_role` privileges, no storage write policies) | e1821ac |
| SEC-10 | Fixed: `SafeText` uses `openExternal` | f876545 |
| SEC-11 | Documented: cover images use UUID paths and are uploaded at publish time (a public bucket is readable by anyone who knows the object name). No code change | — |
| SEC-12 | (a) every 404 logs "SSR render error" (D22): filter in the log drain; (b) native builds need `EXPO_PUBLIC_SITE_URL` or share links fall back to `mova://` (D19); (c), (d) fixed: `.omc/` ignored, `config.toml` tightened for the local stack (`public` only, signups off, password length 12; never `config push` without review) | e1821ac |

## Items for the CEO or a person

- AR5 (CR-12a): hide the Register button once an event has started, or keep it for late joiners?
- Manual list M13: web screen reader check of the filter chips (CR-7) and a browser hydration check of the "(Da Nang time)" label and banners (CR-9).
- Native-speaker review (B5) now also covers the new strings: `status.detailsChanged` and `category.other` in Vietnamese and Russian.
- CR-3 UI tests listed as not covered above are a follow-up; the fixes themselves are verified by the tests that exist.
