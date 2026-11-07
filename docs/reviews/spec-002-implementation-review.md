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
