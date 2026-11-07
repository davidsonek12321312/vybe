# Implementation Plan: Spec 002 Event Discovery
## Status: APPROVED
## Version: 0.4
## Approved by: CEO
## Approved on: 2026-11-06

Requirements reference: `requirements.md` v0.4 — Status: APPROVED by CEO on 2026-11-06
Design reference: `design.md` v0.4 — Status: APPROVED by CEO on 2026-11-06

> Prepared in advance at the CEO's request. Not executable until requirements,
> design and tasks are each approved and recorded. Design amendment v0.3
> (A1–A7) governs where earlier design sections differ.

## Overview

Execution rules:

- Start after the Spec 001 v0.4 PR (`feature/spec-001-sdk58-mova`) is merged:
  rebase `feature/spec-002-event-discovery` onto `master`.
- One task at a time, in dependency order. Attach command output as evidence;
  never claim a pass without it.
- Agents never deploy to Vercel, push migrations to the hosted Supabase
  project, write its migration history or merge. CI uses only a throwaway
  local database.
- Only the Supabase URL and publishable key are used, by both the client and
  the web server. Secret and service-role keys never appear in the repository,
  `.env*` files, CI, the client bundle or the server bundle.
- Stop and raise a spec amendment if a task conflicts with the design.

## Tasks

- [ ] 1. Verify prerequisites
  - Spec 001 v0.4 merged; branch rebased; CI green on `master`.
  - Confirm current `@supabase/supabase-js` and Supabase CLI versions, and the CLI 3.x syntax for `link`, `db pull`, `migration new`, `db start`, `db reset`, `test db` and `gen types`.
  - Check whether React Native 0.88 needs a URL polyfill for supabase-js; confirm `useLoaderData()` behaviour on native builds (D23); confirm Hermes `Intl.DateTimeFormat` honours `timeZone` on Android and iOS (design A8).
  - Confirm Docker Desktop with WSL 2 runs the local Supabase stack on Windows 11.
  - Files: `design.md` (amendment only if something differs)
  - Acceptance: findings recorded with links; divergences raised as a design amendment before task 2.
  - _Requirements: NFR-008, REQ-041, REQ-047_

- [ ] 2. Dependencies and scripts
  - `npx expo install @supabase/supabase-js expo-server`; `npm install --save-dev --save-exact supabase@<version>`; `npm install-scripts approve supabase` (npm 11 runs dependency install scripts only after approval; the CLI downloads its binary there).
  - Scripts: `db:start`, `db:stop`, `db:reset`, `db:test`, `db:types`, `serve:web` (`expo serve`), `ssr:smoke`, `export:web:live`.
  - Files: `package.json`, `package-lock.json`
  - Acceptance: clean `npm ci`; `npm audit --omit=dev --audit-level=high` exit 0; `npm run check` exit 0.
  - Depends on: 1
  - _Requirements: REQ-041, REQ-044, REQ-047_

- [ ] 3. Local Supabase project and environment template
  - `npx supabase init`; keep `[api] schemas = ["public"]`.
  - `.env.example`: `EXPO_PUBLIC_MOVA_DATA_SOURCE=sample`, `EXPO_PUBLIC_SUPABASE_URL=https://vozitoaqntixingqwuiw.supabase.co`, empty `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and `EXPO_PUBLIC_SITE_URL`, and a comment forbidding secret keys.
  - README "Supabase" section: Docker, local stack, where the publishable key goes (`.env.local`, Vercel environment), never a secret key.
  - Files: `supabase/config.toml`, `.env.example`, `README.md`
  - Acceptance: `npm run db:start` works on Windows 11; `.env.local` untracked; `npm run scan:secrets` exit 0.
  - Depends on: 2
  - _Requirements: NFR-008, REQ-041_

- [ ] 4. Baseline the existing remote schema (operator, CEO authorization)
  - `npx supabase link --project-ref vozitoaqntixingqwuiw` (the operator types the database password; it is never stored); `npx supabase db pull baseline_remote_schema`; answer **No** to updating the remote migration history.
  - Review the file for an existing `events` table, policies or conflicting objects; record findings. If conflicts exist, stop and amend the design.
  - Files: `supabase/migrations/<ts>_baseline_remote_schema.sql`
  - Acceptance: `npm run db:reset` applies the baseline to an empty local database; gitleaks clean; review notes attached.
  - Depends on: 3
  - _Requirements: REQ-050, REQ-044_

- [ ] 5. Migrations: cities and events schema
  - `npx supabase migration new create_cities` (design A8, with the Da Nang reference row and its grants and policy), then `create_events` (design "Migration 1", including `city_id` and `registration_url`).
  - Files: `supabase/migrations/<ts>_create_cities.sql`, `supabase/migrations/<ts>_create_events.sql`
  - Acceptance: `npm run db:reset` applies baseline plus both migrations; table definitions attached; no `auth.users` references (REQ-052).
  - Depends on: 4
  - _Requirements: REQ-044, REQ-051, REQ-052, REQ-030, REQ-016, REQ-019_

- [ ] 6. Migration: access control
  - Implement design "Migration 2": RLS on, `REVOKE ALL`, `GRANT SELECT` to `anon` and `authenticated`, `service_role` grants, trigger function revoke, one SELECT policy, no write policies.
  - Files: `supabase/migrations/<ts>_events_access_control.sql`
  - Acceptance: `db:reset` clean; `information_schema.role_table_grants` shows SELECT only for `anon` and `authenticated`.
  - Depends on: 5
  - _Requirements: REQ-043, REQ-044_

- [ ] 7. Migration: event covers bucket
  - Implement design "Migration 3" (`on conflict do nothing`); no `storage.objects` policies for API roles.
  - Files: `supabase/migrations/<ts>_event_covers_bucket.sql`
  - Acceptance: `db:reset` clean; an upload as `anon` is rejected (output attached).
  - Depends on: 4
  - _Requirements: REQ-043, REQ-044_

- [ ] 8. Database tests, positive and negative
  - `events_access.test.sql`: RLS on; `policies_are`; `table_privs_are` = SELECT only for both API roles; visible rows = published and cancelled; draft by slug empty; insert, update, delete and truncate raise 42501 for both roles; row count unchanged; trigger function not executable by `anon`; no `anon` writes to `storage.objects`; `cities`: SELECT only for API roles, inactive cities hidden and their events unreadable, writes denied, invalid IANA zone rejected; `registration_url` outside the allowlist rejected.
  - `events_constraints.test.sql`: 23514 for every constraint in Migration 1; trigger behaviour for `published_at` and `material_changed_at`.
  - Files: `supabase/tests/events_access.test.sql`, `supabase/tests/events_constraints.test.sql`
  - Acceptance: `npm run db:test` passes on baseline plus migrations (S31). A temporary local change adding `draft` to the policy makes the access tests fail (output attached; reverted).
  - Depends on: 6, 7
  - _Requirements: REQ-043, REQ-045, REQ-050, REQ-030, REQ-016_

- [ ] 9. Local seed data
  - `supabase/seed.sql`: fixture F1 plus draft, archived, cancelled and ended examples; fictional text; dates relative to `now()`. Local only; never pushed.
  - Files: `supabase/seed.sql`
  - Acceptance: as `anon`, only published and cancelled slugs are visible (output attached).
  - Depends on: 6
  - _Requirements: REQ-043, NFR-008_

- [ ] 10. Generated types and drift check
  - `npm run db:types`; add `src/lib/database.types.ts text eol=lf` to `.gitattributes`.
  - Files: `src/lib/database.types.ts`, `.gitattributes`
  - Acceptance: `npm run typecheck` exit 0; regenerating gives no diff.
  - Depends on: 6, 7
  - _Requirements: REQ-046_

- [ ] 11. Configuration and Supabase client
  - `src/config/env.ts` (static `process.env.EXPO_PUBLIC_*` reads, including `EXPO_PUBLIC_DEFAULT_CITY` with default `da-nang`; `ConfigError`; localhost only in development); `src/lib/supabase.ts` (`createClient<Database>`, `persistSession: false`), shared by screens and server loaders; `scripts/check-live-env.mjs`.
  - Tests: source flag, URL, `sb_secret_` and JWT keys rejected, valid publishable key accepted, no key values in messages.
  - Files: `src/config/env.ts`, `src/lib/supabase.ts`, `scripts/check-live-env.mjs`, `__tests__/events/env.test.ts`
  - Acceptance: tests pass; `export:web:live` without a URL exits non-zero (S24).
  - Depends on: 2, 10
  - _Requirements: REQ-009, REQ-041, REQ-042, REQ-048_

- [ ] 12. Design tokens and primitives (premium dark)
  - `src/design/tokens.ts` per design A4; primitives `Text`, `Card`, `Chip`, `Badge`, `Button`; `app.json` `userInterfaceStyle: "dark"`; contrast unit test over every text/background pair (S30).
  - ESLint `no-restricted-imports`: features cannot import other features (A5).
  - Files: `src/design/*`, `app.json`, `eslint.config.js`, `__tests__/design/contrast.test.ts`
  - Acceptance: contrast test passes; `npm run check` exit 0; screenshot of the primitives on web.
  - Depends on: 1
  - _Requirements: REQ-049, NFR-002_

- [ ] 13. Event domain, repositories and sample source
  - Types; `mapping.ts`; `SupabaseEventRepository` (explicit columns with the embedded city, filter by city slug, `in(status)`, `gt(ends_at)`, `order`, `limit(200)`, `abortSignal`, error classification); `SampleEventRepository` with fictional events relative to now; `createEventRepository`; `loadEventForRoute(slug)` for the web loader.
  - Tests with a mocked client: never `select('*')`; cancelled-and-started excluded; malformed rows dropped; invalid slug → `null` without a request; offline, server and timeout classification; sources never mixed.
  - Files: `src/features/events/{types,mapping,repository,supabase-repository,sample-repository,sample-events,route-data}.ts`, `__tests__/events/repository.test.ts`
  - Acceptance: tests pass (output attached).
  - Depends on: 10, 11, 14
  - _Requirements: REQ-004, REQ-006, REQ-009, REQ-017, REQ-037, REQ-041, REQ-048_

- [ ] 14. Time, grouping and filter logic
  - `time.ts` and `filters.ts` take the city's IANA time zone as a parameter (design A8); no hard-coded city or offset.
  - Table tests: every S4 row; Saturday and Sunday weekend cases (S5); midnight boundaries; "Happening now" (S2); day headers; device time-zone label (S3); `NO_FILTERS` identity; the same cases in a UTC+09:00 zone and in Europe/Berlin across a daylight-saving change (S32).
  - Files: `src/features/events/time.ts`, `src/features/events/filters.ts`, `__tests__/events/time.test.ts`, `__tests__/events/filters.test.ts`
  - Acceptance: tests pass (output attached).
  - Depends on: 1
  - _Requirements: REQ-002, REQ-005, REQ-007, REQ-022, REQ-023, REQ-024, REQ-025, REQ-026, REQ-027, REQ-051_

- [ ] 15. Localized strings
  - Add `discover.*`, `filters.*`, `event.*`, `status.*`, `solo.*`, `states.*`, `share.*`, `config.*`, `meta.*` in EN, VI, RU; extend `t(key, params?)` with interpolation while keeping the Spec 001 fallback tests green; no count plurals.
  - Files: `src/i18n/index.ts`, `src/i18n/locales/{en,vi,ru}.ts`
  - Acceptance: parity and fallback tests pass; interpolation test added; VI and RU flagged for native-speaker review.
  - Depends on: 1
  - _Requirements: NFR-001_

- [ ] 16. Web server output and Vercel entry
  - `app.json` `web.output: "server"`; `api/index.js` and `vercel.json` per design A2; `scripts/ssr-smoke.mjs` (starts the Vercel adapter on `dist/server` behind Node `http`, requests the given paths and asserts status and metadata).
  - Smoke on existing routes now: `/` 200 with site metadata; `/does-not-exist` 404 with the localized not-found page.
  - Files: `app.json`, `api/index.js`, `vercel.json`, `scripts/ssr-smoke.mjs`, `src/app/+not-found.tsx` (metadata only)
  - Acceptance: `npx expo export -p web` produces `dist/client` and `dist/server`; `npm run ssr:smoke` passes; no deployment.
  - Depends on: 2
  - _Requirements: REQ-047, REQ-010_

- [ ] 17. Discover screen
  - Replace `src/app/index.tsx`; `FilterBar`, `FilterSheet`, `EventCard`, `StateView`, `OfflineBanner`, `SampleEventLabel`; `useUpcomingEvents` (10 s slow, 20 s abort, session cache, refresh); `SectionList` by Da Nang day; `generateMetadata` (site title, description, Open Graph image); dark tokens.
  - Component tests: S1, S2, S4 (sampled rows), S6, S18 (every row), S19, S20, S21, S24.
  - Files: `src/app/index.tsx`, `src/features/events/use-events.ts`, `src/features/events/components/*.tsx`, `__tests__/events/discover.test.tsx`
  - Acceptance: tests pass; `npm run check` exit 0; web and device screenshots attached.
  - Depends on: 12, 13, 14, 15, 16
  - _Requirements: REQ-001, REQ-002, REQ-003, REQ-004, REQ-005, REQ-006, REQ-007, REQ-008, REQ-009, REQ-021, REQ-028, REQ-032, REQ-033, REQ-034, REQ-035, REQ-036, REQ-037, REQ-038, REQ-039, REQ-042, REQ-049_

- [ ] 18. Event details: server loader, metadata and screen
  - `src/app/events/[slug].tsx`: `loader` (publishable key; unknown, draft or archived → HTTP 404), `generateMetadata` (title, description, `openGraph` image and canonical URL), screen from `useLoaderData()` on web and the repository on native (D23); localized "Event not available" HTML with HTTP 404 (D22); `StatusBanner`, `SoloSection`, `SafeText`, `ShareButton`, `MapsButton`, `RegisterButton` (REQ-053); `unstable_settings.initialRouteName = 'index'`.
  - Tests: S7–S13, S15–S17, S34; metadata escaping (quotes and `<script>` in a title); `ssr:smoke` extended to a sample event (200 plus `og:title`) and an unknown slug (404 plus "Event not available") (S28).
  - Files: `src/app/events/[slug].tsx`, `src/app/_layout.tsx`, `src/features/events/components/*.tsx`, `__tests__/events/details.test.tsx`, `scripts/ssr-smoke.mjs`
  - Acceptance: tests and `npm run ssr:smoke` pass; `npm run check` exit 0.
  - Depends on: 13, 14, 15, 16, 17
  - _Requirements: REQ-010, REQ-011, REQ-012, REQ-013, REQ-014, REQ-015, REQ-016, REQ-017, REQ-018, REQ-019, REQ-020, REQ-029, REQ-030, REQ-031, REQ-040, REQ-048, REQ-053_

- [ ] 19. CI: database job, bundle scans and SSR smoke test
  - `database` job: `supabase/setup-cli` pinned to the task 1 version; `supabase db start`; `supabase test db`; type drift diff.
  - `check` job: server export; `scripts/check-bundle-secrets.mjs` over `dist/client` and `dist/server` (fails on `sb_secret_` or a service-role JWT); `npm run ssr:smoke`.
  - Files: `.github/workflows/ci.yml`, `scripts/check-bundle-secrets.mjs`
  - Acceptance: CI green on the PR; the bundle scan fails locally on a planted fake key (output attached; not committed).
  - Depends on: 8, 10, 16
  - _Requirements: REQ-045, REQ-046, REQ-047, REQ-048, NFR-006_

- [ ] 20. Accessibility, manual smoke tests and pull request
  - `npm run lint` passes; complete the manual smoke matrix below; Draft PR to `master` titled `feat(002): event discovery per approved spec` with evidence. No deployment and no hosted database changes.
  - Files: none (evidence in the PR)
  - Acceptance: matrix results attached; CI green; independent Claude review findings resolved or accepted.
  - Depends on: 17, 18, 19
  - _Requirements: NFR-002, NFR-003, NFR-004, NFR-005, NFR-007, REQ-020_

## Task Dependency Graph

```json
{
  "waves": [
    { "wave": 1, "tasks": ["1"] },
    { "wave": 2, "tasks": ["2", "12", "14", "15"] },
    { "wave": 3, "tasks": ["3", "16"] },
    { "wave": 4, "tasks": ["4"] },
    { "wave": 5, "tasks": ["5", "7"] },
    { "wave": 6, "tasks": ["6"] },
    { "wave": 7, "tasks": ["8", "9", "10"] },
    { "wave": 8, "tasks": ["11", "19"] },
    { "wave": 9, "tasks": ["13"] },
    { "wave": 10, "tasks": ["17"] },
    { "wave": 11, "tasks": ["18"] },
    { "wave": 12, "tasks": ["20"] }
  ]
}
```

## Notes

### Manual smoke matrix (task 20)

| # | Platform / condition | Check |
|---|---|---|
| M1 | Android, Expo Go SDK 58 | Discover, filters, details, share sheet; back from `mova://events/b` lands on Discover |
| M2 | iPhone, Expo Go SDK 58 | Same as M1 |
| M3 | Mobile Chrome (Android), local server build | Discover, details, reload `/events/b`, share or copy, no console errors |
| M4 | Mobile Safari (iOS), local server build | Same as M3 |
| M5 | Link preview (local tunnel or approved preview deployment) | Telegram and WhatsApp show the event title, date and image |
| M6 | `curl -I` on the server build | 200 for a published event; 404 for unknown slugs and unknown paths |
| M7 | TalkBack and VoiceOver | Badges and banners read as text; chips announce selected state |
| M8 | 200% text size on the dark theme | Time, price and venue not truncated; contrast holds |
| M9 | Slow network and offline | "Still loading…" at 10 s; timeout at 20 s; offline banner |
| M10 | Device time zone Europe/Moscow | "Da Nang time" label |
| M11 | Freshness | Change a venue in local Studio; a refresh shows "Updated" without a rebuild |
| M12 | Performance | First cards ≤ 3 s on a mid-range Android phone over 4G with the seed data |
| M13 | Privacy | No location prompt; no network calls besides Supabase, images and the MOVA server |

### Operations outside these tasks (separate CEO approval)

- Vercel project creation, environment variables, domains, preview or production deployments.
- `supabase db push` to `vozitoaqntixingqwuiw`, remote migration-history writes, cover uploads and real event entry.

### Coverage

Every requirement REQ-001–REQ-053 and NFR-001–NFR-008 maps to at least one
task through its `_Requirements_` line.

### Implementation evidence (2026-11-06, branch `feature/spec-002-event-discovery`)

Progress record only; scope, requirements and design are unchanged.
Everything ran on Windows 11 against a disposable local Supabase stack
(CLI 3.0.0, Docker Desktop). Nothing was applied to the hosted project
`vozitoaqntixingqwuiw` and nothing was deployed.

| Task | State | Evidence | Open |
|---|---|---|---|
| 1 | Partly done | supabase-js 2.x and CLI 3.0.0 syntax confirmed; native URL polyfill added (`src/lib/url-polyfill.native.ts`); Docker Desktop runs the stack on Windows 11; D23 resolved (below) | Hermes `Intl` `timeZone` on a device; Spec 001 v0.4 is not merged yet, so this branch is stacked on `docs/mova-platform-decisions` |
| 2 | Done | Clean `npm ci`; `npm audit --omit=dev --audit-level=high` exit 0 (low and moderate advisories only); `npm run check` exit 0 | — |
| 3 | Done | `supabase/config.toml` (`project_id = "mova"`), `.env.example`, README; `.env.local` is gitignored | — |
| 4 | **Blocked** | Needs CEO authorization and the database password (operator step) | Baseline pull; re-run tasks 5–10 on top of it |
| 5–7 | Done on an empty local database | `db:reset` applies all four migrations and the seed | Re-check against the task 4 baseline |
| 8 | Done | `supabase test db`: 2 files, 52 tests, PASS; policy mutation check below | — |
| 9 | Done | REST with the local publishable key returns only visible Da Nang events; anonymous insert returns 401 | — |
| 10 | Done | `src/lib/database.types.ts` is raw CLI output; CI diffs it against a fresh generation | — |
| 11 | Done | Config tests in `__tests__/events/data.test.ts`; `check-live-env` exits 1 without a URL (S24) | — |
| 12 | Done | Tokens, primitives, contrast test; ESLint blocks cross-feature imports (A5) | — |
| 13–15 | Done | Jest suites under `__tests__/events/` and the i18n tests | VI and RU need native-speaker review |
| 16 | Done | `web.output: "server"`, `api/index.js`, `vercel.json`; `ssr:smoke` passes | — |
| 17 | Done | Discover with sample and local Supabase data; web screenshots taken locally | Device screenshots (M1, M2) |
| 18 | Done | Loader, metadata, details screen; `ssr:smoke` covers 200, 404 and loader data | — |
| 19 | Done locally | CI `database` job, SSR smoke and bundle scan; planted-key check below | CI green on the PR |
| 20 | Partly done | Lint clean; M6 covered by `ssr:smoke` | M1–M5, M7–M12 need devices, a tunnel or an approved preview |

**Results.** Jest 7 suites, 102 tests; pgTAP 52 tests; `ssr:smoke` 6 checks
(`/` 200, `/events/beach-social-001` 200 with `og:title`,
`/events/does-not-exist` 404 "Event not available", `/no-such-page` 404,
loader data `found` and `not_available` with HTTP 200); typecheck and lint
(`--max-warnings 0`) clean; generated types match the migrations; metadata
escaping test (quotes, `&` and `<script>` in a title) passes.

**Negative checks (run locally, not committed).**

- Policy mutation (task 8): adding `'draft'` to `events_read_visible` makes
  pgTAP fail tests 10, 11 and 23 ("sees only published and cancelled",
  "cannot read a draft by slug"); restored, 52 of 52 pass.
- Planted key (task 19): a fake `sb_secret_…` file in `dist/client` makes
  `check:bundle` exit 1; removed, exit 0.
- Live config (S24): `check-live-env` exits 1 without a URL and exits 1 for
  an `sb_secret_` key.
- Feature boundary (A5): a probe importing `@/features/events` from
  `src/lib` fails lint.

**D22 decision.** The loader returns data (`found`, `not_available` or
`error`) and never throws, with one exception: in the production server, a
direct page request (a browser or link-preview crawler, so not
`Accept: application/json`) for a slug that is not visible gets the
localized "Event not available" page with HTTP 404 (REQ-017). Reasons: the
router's in-app loader fetch fails on any non-2xx status, and the Expo dev
server turns a thrown `Response` into HTTP 500. During in-app navigation and
in `expo start`, the screen shows the in-app "Event not available" state
without another request. If the server cannot reach the Data API, the
loader returns `error` and the browser retries through the repository.

**D23 decision.** Native builds have no server loader: `use-route-event.ts`
returns `null` and the screen loads through `EventRepository`; web uses
`useLoaderData()` (`use-route-event.web.ts`).

### Implementation evidence: independent review outcome (2026-11-07)

Recording only. Full findings, severities and commit ids:
`docs/reviews/spec-002-implementation-review.md`.

- Reviews: code review (sonnet) and security review (opus) on tip `a2819b4`; every finding was checked
  against the code, none was a false positive. All in-scope findings were fixed, one commit each.
- CEO decisions (2026-11-07): AR1 security headers and AR3 unknown-value fallback, recorded in
  `amendment-v0.5.md`; AR2 `change_note` stays optional (generic "Details changed" line); AR4 real-device
  time-zone checks (task 1, M1/M2) are required before the public release, not before the pull requests.
- New migration `20261107100000_harden_events.sql` (service_role privileges, URL allowlists, organiser check).
  It has not been applied to the hosted project.
- Verification on the branch tip: `npm run check` exit 0 (11 suites, 124 Jest tests, SSR smoke all passed,
  bundle scan clean); `db:reset` and `db:test` 71/71; generated types regenerated (no drift after the API
  schema config change); `npm run scan:secrets` clean.
- Open: AR5 (hide Register once an event starts?), manual item M13 (web screen reader check of the filter chips,
  browser hydration check of the city-time label), native-speaker review of the new VI and RU strings,
  UI test follow-ups listed in the review record (CR-3), first CI run on Node 22 and the `database` job.

## Change Log

| Version | Date | Author | Summary |
|---|---|---|---|
| 0.1 | 2026-11-06 | Claude Code (draft for CEO review) | Initial DRAFT: 17 tasks in 11 waves |
| 0.2 | 2026-11-06 | Claude Code | Aligned with merged Spec 001 v0.3 |
| 0.3 | 2026-11-06 | Claude Code | Rebuilt for the CEO direction of 2026-11-06: baseline migration of the existing Supabase project (task 4), premium dark tokens (task 12), Vercel server output and SSR smoke test (tasks 16, 18, 19), MOVA naming; 20 tasks in 12 waves. Still DRAFT |
| 0.4 | 2026-11-06 | Claude Code | CEO platform decision: cities migration and tests (tasks 5, 8), default-city config (task 11), city-aware repository (task 13), time logic by IANA zone with UTC+09:00 and daylight-saving tests (task 14), Hermes `timeZone` check (task 1). Still DRAFT |
| 0.4 (review) | 2026-11-06 | Claude Code | Consistency review: `registration_url` column and tests (tasks 5, 8); `RegisterButton` and S34 (task 18); events of inactive cities unreadable. Still DRAFT |
| 0.4 (approval) | 2026-11-06 | Claude Code (recording only) | Approved by the CEO on 2026-11-06; implementation authorized on `feature/spec-002-event-discovery` (local disposable database only) |
| 0.4 (progress) | 2026-11-06 | Claude Code (recording only) | Implementation evidence, D22 and D23 decisions recorded; no scope change |
| 0.5 (amendment) | 2026-11-07 | Claude Code (recording only) | CEO-approved amendment recorded in `amendment-v0.5.md`: A11 security headers (AR1) and REQ-037 unknown-value fallback (AR3) |
| 0.5 (review) | 2026-11-07 | Claude Code (recording only) | Independent review outcome, fixes and verification evidence recorded; no scope change |
| 0.6 (amendment) | 2026-11-07 | Claude Code (recording only) | CEO-approved visual redesign recorded in `amendment-v0.6.md`: A12 Afterglow direction (replaces A4/D21), A13 image policy, A14 browser acceptance; no behaviour change |

**This document is APPROVED (v0.4, CEO, 2026-11-06). Any change requires a
spec amendment with a new version and fresh CEO approval.**
