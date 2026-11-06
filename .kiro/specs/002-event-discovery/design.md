# Design Document — Spec 002: Event Discovery
## Status: APPROVED
## Version: 0.4
## Approved by: CEO
## Approved on: 2026-11-06

Requirements reference: `requirements.md` v0.4 — Status: APPROVED by CEO on 2026-11-06

> Prepared in advance at the CEO's request (2026-11-06). Under
> `docs/SDD_WORKFLOW.md` this design cannot be approved before the
> requirements are approved, and must be revised if they change.

---

## Amendment v0.3 — MOVA, SDK 58, server rendering on Vercel, existing Supabase, premium dark

Sets the CEO direction of 2026-11-06. Where this section conflicts with a later
section, this section governs.

### A1. Platform baseline
Spec 001 v0.4: Expo SDK 58 (`expo` 58.0.23, `expo-router` 58.0.30, React
Native 0.88.1, React 19.3.0), Node.js ≥ 22.13, React Native Testing Library 14
(`await render()`). Brand MOVA (ADR-0008); URL scheme `mova`; the data-source
flag is `EXPO_PUBLIC_MOVA_DATA_SOURCE`.

### A2. Web rendering on Vercel (ADR-0009, REQ-010, 017, 020, 047)
- `app.json`: `"web": { "output": "server" }`. `npx expo export -p web`
  writes `dist/client` (static assets) and `dist/server` (routes, loaders,
  metadata). Native builds are unaffected.
- `expo-server` becomes a direct dependency (`npx expo install expo-server`).
- Vercel function entry, `api/index.js`:
  ```js
  const path = require('node:path');
  const { createRequestHandler } = require('expo-server/adapter/vercel');
  module.exports = createRequestHandler({ build: path.join(__dirname, '../dist/server') });
  ```
- `vercel.json` (confirm on the first CEO-approved preview deployment):
  ```json
  {
    "installCommand": "npm ci",
    "buildCommand": "npx expo export -p web",
    "outputDirectory": "dist/client",
    "framework": null,
    "functions": { "api/index.js": { "includeFiles": "dist/server/**" } },
    "rewrites": [{ "source": "/(.*)", "destination": "/api/index.js" }]
  }
  ```
  Files in `dist/client` are served before the rewrite; every other path goes
  to the function. Vercel project setting: Node.js 22.x. Vercel sets `CI`, so
  the Spec 001 hook installer skips itself during builds.
- `src/app/events/[slug].tsx` exports:
  - `loader(request, params)`: reads the event on the server with the
    publishable key (RLS applies); unknown, draft or archived slug →
    `throw new StatusError(404, …)`.
  - `generateMetadata(request, params)`: `title`, `description` and
    `openGraph` (`title`, `description`, `images` = cover URL, `url` =
    `EXPO_PUBLIC_SITE_URL/events/<slug>`, `type: 'website'`).
  - the screen, which on web starts from `useLoaderData()` and on native loads
    through `EventRepository` (task 1 confirms native loader behaviour, D23).
- `src/app/index.tsx` (Discover) exports `generateMetadata` with the site title
  and Open Graph image; the list loads on the client.
- **Verified 2026-11-06** on a local SDK 58 server build in scratch. `npx expo
  serve` and the `expo-server/adapter/vercel` handler behind a Node `http`
  server gave identical results:

  | Request | Status | Metadata |
  |---|---|---|
  | `/` | 200 | none yet (Discover gets `generateMetadata`) |
  | `/events/beach-social-001` | 200 | `<title>Da Nang Beach Social #001 · MOVA</title>`, `og:title` |
  | `/events/unknown-slug` | 404 | plain-text body from `StatusError` |
  | `/does-not-exist` | 404 | `+not-found` |
- **Gap (D22):** the 404 body for an unknown slug is plain text. Task 16 makes
  it the localized "Event not available" page while keeping HTTP 404, and
  records the mechanism.
- Metadata values come from organiser text; tests cover quotes and `<script>`
  in titles to confirm `expo-server` escapes them (extends S17).

### A3. Supabase (ADR-0010, REQ-050)
- Existing project `vozitoaqntixingqwuiw`, `https://vozitoaqntixingqwuiw.supabase.co`.
  No new project.
- Publishable key only, in `.env.local` (development, gitignored) and in the
  Vercel project environment. It is never committed, and no secret or
  service-role key exists anywhere in the app, server bundle or CI.
- Baseline first (task 4, operator with CEO authorization):
  `npx supabase link --project-ref vozitoaqntixingqwuiw`, then
  `npx supabase db pull baseline_remote_schema` (Docker). Answer **No** when
  asked to update the remote migration history, until the CEO approves that
  write. Commit the file as the first migration. If it already contains an
  `events` table or conflicting objects, stop and amend this design before
  writing Spec 002 migrations.
- Spec 002 migrations are created after the baseline. Hosted application
  (`db push --dry-run`, then `db push`) only with CEO approval and after a
  backup.
- Environment variables: `EXPO_PUBLIC_SUPABASE_URL`,
  `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `EXPO_PUBLIC_SITE_URL`,
  `EXPO_PUBLIC_MOVA_DATA_SOURCE`. The client and server bundles read the same
  public values.

### A4. Premium dark theme (D21 proposal, REQ-049)
Contrast ratios below were computed with the WCAG 2.1 formula.

| Token | Value | Contrast |
|---|---|---|
| `bg` | `#0B0B10` | — |
| `surface` (cards, sheets) | `#15151D` | — |
| `raised` (chips, inputs) | `#1F1F2A` | — |
| `border` (non-text) | `#2E2E3A` | — |
| `text` | `#F5F5F7` | 18.0:1 on `bg`; 16.7:1 on `surface` |
| `textSecondary` | `#A8A8B3` | 8.3:1 on `bg`; 7.7:1 on `surface`; 6.9:1 on `raised` |
| `accent` (brand, links, active chips) | `#9D8CFF` | 7.1:1 on `bg`; 6.6:1 on `surface` |
| `onAccent` (text on accent) | `#0B0B10` | 7.1:1 |
| `success` / `warning` / `danger` | `#4ADE80` / `#FBBF24` / `#F87171` | 10.4 / 10.9 / 6.6:1 on `surface` |

- Typography: system fonts (SF Pro, Roboto, `system-ui` on web), so nothing
  is downloaded. Scale 34/28/22/17/15/13 pt; weights 700/600/400.
- Spacing on a 4-pt grid (4, 8, 12, 16, 24, 32); radii 12 (chips), 16 (cards),
  24 (sheets).
- Cards: 16:9 cover with a bottom gradient behind the date; depth from
  surface colour, not shadows.
- Dark-only (`userInterfaceStyle: "dark"`); the Spec 001 light tokens stay
  for later use (D24).
- Tokens live in `src/design/tokens.ts`; a unit test checks every text and
  background pair at ≥ 4.5:1 (S30).

### A5. Modular architecture
```
src/app/            thin routes: _layout, index (Discover), events/[slug], +not-found
src/features/events/ Spec 002 domain, data access, hooks, components
src/features/…      reserved for People, Rooms, Chats, RSVP, Hosts (created by their specs)
src/platform/…      shared auth, permissions, media (created by their specs; ADR-0011, ADR-0014)
src/lib/            Supabase client, generated database types
src/config/         environment parsing
src/design/         tokens and primitives (Text, Card, Chip, Badge, Button)
src/i18n/           Spec 001 localization layer
api/index.js        Vercel function entry (web only)
supabase/           config, migrations (baseline first), tests, seed
```
Features may import from `lib`, `config`, `design` and `i18n`, but never from
another feature. Routes import features. An ESLint `no-restricted-imports`
rule enforces this.

### A6. CI additions
- `check` job: export server output; scan `dist/client` and `dist/server` for
  secret keys; **SSR smoke test** (`scripts/ssr-smoke.mjs`), which starts the
  Vercel adapter on the build with sample data and asserts status and metadata
  for `/`, a sample event, an unknown slug and an unknown path (S28).
- `database` job unchanged (S22, S23, S26, S31).

### A7. Added threats
| Threat | Mitigation | Residual |
|---|---|---|
| Server function exposed to the internet | Publishable key only; RLS; no write paths; Vercel function timeout | Low |
| Organiser text injected into HTML metadata | `expo-server` escaping, covered by tests | Low |
| Request floods raising hosting cost | Vercel spend limit (CEO setting); short `Cache-Control` later if needed | Medium |
| Preview deployments exposing work in progress | Vercel preview protection; drafts stay unreadable through RLS | Low |

### A8. Multi-city data model (ADR-0016, REQ-051)
Replaces the single-city `city` and `time_zone` columns of Migration 1 and the
fixed UTC+07:00 time logic (K6).

New migration before Migration 1, `supabase/migrations/<ts>_create_cities.sql`:
```sql
create table public.cities (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name         text not null check (char_length(btrim(name)) between 2 and 80),
  country_code char(2) not null check (country_code ~ '^[A-Z]{2}$'),
  time_zone    text not null,   -- IANA name; validated by trigger against pg_timezone_names
  is_active    boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
-- RLS on; REVOKE ALL from public, anon, authenticated; GRANT SELECT to anon, authenticated;
-- policy cities_read_active: for select to anon, authenticated using (is_active).
insert into public.cities (slug, name, country_code, time_zone, is_active)
values ('da-nang', 'Da Nang', 'VN', 'Asia/Ho_Chi_Minh', true)
on conflict (slug) do nothing;   -- reference data, present in every environment
```
- Migration 1 (Data Models) uses `city_id uuid not null references
  public.cities(id)` with city-scoped partial indexes, and the events read
  policy also requires an active city.
- Client: `EXPO_PUBLIC_DEFAULT_CITY` (slug, `da-nang` at launch). The list
  query embeds the city: `select('…, city:cities!inner(slug, name, time_zone)')`
  filtered by `city.slug`.
- Time logic: `time.ts` and `filters.ts` take the IANA time zone as a
  parameter and use `Intl.DateTimeFormat(..., { timeZone })` /
  `formatToParts`, recomputing the offset per instant so daylight-saving zones
  work. No constants. Task 1 confirms Hermes supports `timeZone` on Android
  and iOS; tests run with Asia/Ho_Chi_Minh, a UTC+09:00 zone and Europe/Berlin.
  If Hermes lacks `timeZone` support, add the FormatJS `Intl.DateTimeFormat`
  polyfill with time-zone data through a design amendment.
- Database tests add: `cities` SELECT only for API roles; inactive cities
  hidden; writes denied (42501); an invalid IANA zone rejected.

### A9. Platform readiness (ADR-0011 to ADR-0015, REQ-052)
- Spec 002 creates no auth, user or profile tables, and adds no `auth.users`
  references. The future Accounts spec (proposed Spec 003: Google Sign-In and
  profiles) owns those.
- Later specs add references by `auth.users.id` or `profiles.id` only, for
  example an event's host (Hosts spec) or an RSVP (RSVP spec). Organiser text
  in `events.organizer_name` remains until the Hosts spec replaces it.
- Event covers stay in the `event-covers` bucket. When the shared media module
  (ADR-0014) arrives, it adopts that bucket rather than replacing it.
- All Spec 002 keys are stable UUIDs; slugs are secondary keys (ADR-0015).

### A10. External registration bridge for 5 December (D2, REQ-053)
- Column `events.registration_url`: `https` only, host allowlist
  `docs.google.com/forms/` and `forms.gle/` (Migration 1).
- Details screen: a "Register ↗" button in the bottom bar (the slot reserved
  for RSVP), labelled as a MOVA team form that opens outside the app. Shown
  only for published, upcoming, not-cancelled events in live mode.
- MOVA stores nothing about registrants. The Google Form is owned by the MOVA
  team account and asks only for a name, one contact (email or Telegram
  username), an optional "coming solo" tick and an explicit consent with a
  link to a privacy note. Responses stay team-only and are deleted 30 days
  after the event. No attendee list is shown anywhere.
- Retired when the RSVP spec ships: a migration drops the column.

## Overview

Spec 002 replaces the Spec 001 home shell with a Discover list and adds a
shareable event details page. Events are stored in Supabase Postgres and read
by the Expo app (iOS, Android, web) through the Supabase Data API with a
publishable key. Clients never write. Row Level Security (RLS) and explicit
privileges are the only gate between anonymous users and unpublished data, so
they are delivered as versioned SQL migrations and proved by database tests
in CI, including negative (denied) cases.

**Key decisions**

| # | Decision | Why |
|---|---|---|
| K1 | One table `public.events`; no views, RPCs or Edge Functions | Smallest surface that meets the requirements |
| K2 | `REVOKE ALL` then `GRANT SELECT` to `anon`/`authenticated`; one SELECT policy; no write policies | Explicit least privilege (REQ-043, REQ-044) |
| K3 | Invariants enforced by `CHECK` constraints and one trigger | Bad data cannot be published (REQ-030, REQ-037) |
| K4 | Supabase CLI migrations + pgTAP (`supabase test db`) locally and in CI | Reproducible schema and authorization proof (REQ-045) |
| K5 | `createClient<Database>` with `persistSession: false`; publishable key only | No auth in 002; no session storage; no secrets (REQ-041) |
| K6 | Times in each city's IANA time zone via `Intl` (A8); Da Nang is `Asia/Ho_Chi_Minh` | Correct for every city, including daylight-saving zones |
| K7 | Slugs in URLs (`/events/[slug]`) | Readable shared links; unknown, draft and archived look identical |
| K8 | `EXPO_PUBLIC_MOVA_DATA_SOURCE` = `sample` (default) or `supabase` | Spec 001's deferred environment flag (REQ-009) |
| K9 | Covers in a public Storage bucket `event-covers` on the project host only | Avoids third-party image hosts tracking viewers |

**Version matrix (verify in task 1; record any divergence here)**

| Component | Version (npm/GitHub, 2026-11-06) | Notes |
|---|---|---|
| Expo SDK | 58 (Spec 001 v0.4) | `expo` 58.0.23, `expo-router` 58.0.30, React Native 0.88.1, React 19.3.0; ADR-0006 resolved |
| `expo-server` | 58.0.6 | Vercel adapter for server output (A2) |
| `@supabase/supabase-js` | 2.119.0 | Install with `npx expo install`; check RN 0.86 URL polyfill needs against current Supabase Expo guide |
| Supabase CLI (`supabase` npm devDependency and `supabase/setup-cli` in CI) | 3.0.0 | Same pinned version locally and in CI; confirm `gen types` syntax for 3.x. npm 11.20 runs dependency install scripts only after approval, so `npm install-scripts approve supabase` is required for the CLI binary download |
| Docker Desktop (Windows 11, WSL 2) | current | Required for the local Supabase stack |
| pgTAP | bundled with the Supabase local stack | Used by `supabase test db` |

---

## Architecture

```
 Expo app (iOS / Android / web export)            Supabase project (one per environment)
 ┌───────────────────────────────────────┐        ┌─────────────────────────────────────────┐
 │ src/app/index.tsx  (Discover)         │        │ Data API (PostgREST)  ── role: anon ─┐  │
 │ src/app/events/[slug].tsx (Details)   │ HTTPS  │                                      ▼  │
 │   └─ use-events hooks                 │───────▶│ Postgres: public.events  (RLS on)       │
 │       └─ EventRepository              │ GET    │   policy events_read_visible:           │
 │           ├─ SupabaseEventRepository  │ only   │     status in (published, cancelled)    │
 │           └─ SampleEventRepository    │        │   anon/authenticated: SELECT only       │
 │ src/config/env.ts (EXPO_PUBLIC_*)     │        │ Storage: event-covers (public read)     │
 └───────────────────────────────────────┘        └─────────────────────────────────────────┘
        ▲ build-time inlined public config                ▲ migrations applied by an authorized
        │ (URL, publishable key, data source)             │ operator (never by CI or the app)
```

**Trust boundaries:** (1) client ↔ Data API: the publishable key is public,
and RLS plus grants decide everything; (2) operator ↔ Supabase Studio/CLI:
human-only, MFA, secret keys never leave the operator's password manager;
(3) CI ↔ repository: CI starts a throwaway local database and has no project
credentials.

**Data flow — Discover:** hook calls `repository.listUpcoming(now)` →
`GET /rest/v1/events?select=<list columns>&status=in.(published,cancelled)&ends_at=gt.<now>&order=starts_at.asc&limit=200`
→ RLS filters rows → client maps and validates rows, drops cancelled events
that have started, groups by Da Nang date, and applies filters in memory.

**Data flow — Details:** route param `slug` → regex check (invalid → "not
available" without a request) → `select=<detail columns>&slug=eq.<slug>` with
`maybeSingle()` → `null` means not available (identical for unknown, draft
and archived). Opening from a card renders the card data immediately, then
replaces it with the detail row.

**Configuration**

| Variable | Required when | Secret? | Notes |
|---|---|---|---|
| `EXPO_PUBLIC_MOVA_DATA_SOURCE` | always (defaults to `sample`) | No | `sample` or `supabase`; anything else is a config error |
| `EXPO_PUBLIC_SUPABASE_URL` | source = `supabase` | No | `https://<ref>.supabase.co`; `http://127.0.0.1:54321` allowed only in dev builds |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | source = `supabase` | No (public by design) | Must start `sb_publishable_`; `sb_secret_` keys and JWT keys are rejected |
| `EXPO_PUBLIC_SITE_URL` | native sharing in live mode | No | Base for share URLs on native; web uses `window.location.origin` |
| Supabase DB password, secret key, access token | operator only | **Yes** | Password manager; never in the repo, `.env*`, CI or `EXPO_PUBLIC_*` |

Expo inlines `process.env.EXPO_PUBLIC_*` only when referenced statically, so
`src/config/env.ts` reads each variable by its literal name. `.env.example`
(committed) lists the variables with placeholders; `.env.local` (gitignored)
holds local values from `npx supabase status`.

**Routes**

| File | Path | Change |
|---|---|---|
| `src/app/_layout.tsx` | — | Adds `events/[slug]` screen and `unstable_settings = { initialRouteName: 'index' }` so deep links have Discover underneath (REQ-040) |
| `src/app/index.tsx` | `/` | Spec 001 shell replaced by Discover |
| `src/app/events/[slug].tsx` | `/events/:slug` | New details route |
| `src/app/+not-found.tsx` | fallback | Unchanged |

Superseded by Amendment A2: the web app uses server output on Vercel, and
event pages are rendered per request with `loader` and `generateMetadata`.

---

## Components and Interfaces

```ts
// src/config/env.ts
export type AppConfig =
  | { source: 'sample' }
  | { source: 'supabase'; url: string; publishableKey: string; siteUrl: string | null };
export type ConfigErrorCode =
  'invalid_source' | 'missing_url' | 'invalid_url' | 'missing_key' | 'invalid_key' | 'secret_key';
export class ConfigError extends Error { readonly code: ConfigErrorCode }
export function readConfig(): AppConfig; // throws ConfigError; never logs key values

// src/lib/supabase.ts
export function getSupabase(config: Extract<AppConfig, { source: 'supabase' }>):
  SupabaseClient<Database>;
// createClient<Database>(url, publishableKey, {
//   auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } })

// src/features/events/types.ts
export type EventStatus = 'published' | 'cancelled';
export type EventLanguage = 'en' | 'vi' | 'ru' | 'other';
export type EventCategory = Database['public']['Enums']['event_category'];
export type Price = { type: 'free' } | { type: 'paid'; vnd: number };
export interface EventSummary {
  id: string; slug: string; status: EventStatus; title: string;
  city: { slug: string; name: string; timeZone: string };
  registrationUrl: string | null;   // REQ-053 bridge
  category: EventCategory; languages: EventLanguage[];
  startsAt: Date; endsAt: Date; area: string;
  venue: { status: 'confirmed' | 'tbc'; name: string | null };
  price: Price; soloFriendly: boolean; ageRestriction: 16 | 18 | 21 | null;
  coverImageUrl: string | null; materialChangedAt: Date | null;
}
export interface EventDetail extends EventSummary {
  description: string; whatToExpect: string | null; venueAddress: string | null;
  mapsUrl: string | null; paymentNote: string | null; organizerName: string;
  accessibilityNotes: string | null; soloDetails: string | null;
  cancellationNote: string | null; changeNote: string | null; updatedAt: Date;
}
export type LoadErrorKind = 'offline' | 'timeout' | 'server' | 'config';

// src/features/events/repository.ts
export interface EventRepository {
  listUpcoming(now: Date, signal: AbortSignal): Promise<EventSummary[]>;
  getBySlug(slug: string, signal: AbortSignal): Promise<EventDetail | null>;
}
export function createEventRepository(config: AppConfig): EventRepository;
// sample → SampleEventRepository (fictional events relative to "now", labelled);
// supabase → SupabaseEventRepository (explicit column lists, never `*`).

// src/features/events/mapping.ts
export function toEventSummary(row: ListRow): EventSummary | null; // null = invalid, excluded
export function toEventDetail(row: DetailRow): EventDetail | null;

// src/features/events/time.ts   (all instants are UTC Date objects)
// timeZone is always the city's IANA name (A8); no constants.
export type DateFilter = 'any' | 'today' | 'tomorrow' | 'weekend' | 'next7' | { day: string };
export function dateWindow(filter: DateFilter, now: Date, timeZone: string): { start: Date; end: Date } | null;
export function zonedDayKey(d: Date, timeZone: string): string;        // 'YYYY-MM-DD' in the city
export function isHappeningNow(e: EventSummary, now: Date): boolean;
export function deviceUsesCityTime(now: Date, timeZone: string): boolean;
export function formatTime(d: Date, locale: string, timeZone: string): string; // Intl with { timeZone }

// src/features/events/filters.ts
export interface Filters {
  date: DateFilter; categories: EventCategory[]; languages: EventLanguage[];
  price: 'any' | 'free' | 'paid'; soloOnly: boolean;
}
export const NO_FILTERS: Filters;
export function applyFilters(events: EventSummary[], f: Filters, now: Date, timeZone: string): EventSummary[];
export function groupByDay(events: EventSummary[], now: Date, timeZone: string): { key: string; title: string; data: EventSummary[] }[];

// src/features/events/use-events.ts
export function useUpcomingEvents(): {
  state: 'loading' | 'slow' | 'ready' | 'error';
  events: EventSummary[]; errorKind: LoadErrorKind | null;
  stale: { at: Date } | null;               // REQ-036: session cache shown while offline
  refresh(): void;
};
export function useEventDetail(slug: string): {
  state: 'loading' | 'slow' | 'ready' | 'not_available' | 'error';
  event: EventDetail | EventSummary | null; errorKind: LoadErrorKind | null; retry(): void;
};
```

Timers: 10 s → `slow`; 20 s → `AbortController.abort()` → `error`/`timeout`
(REQ-032). Error classification: abort by our timer → `timeout`; fetch
failure or HTTP status 0 → `offline`; other PostgREST errors → `server`.
Session cache: the last successful list and its time live in module memory;
there is no persistent storage.

**UI components** (`src/features/events/components/`): `FilterBar` (fixed
above the list; horizontal chips: Date, Solo, Language, Price, Category;
count; Clear all), `FilterSheet` (React Native `Modal`, Apply/Reset),
`EventCard`, `Badge` (text plus icon), `StatusBanner` (Cancelled, Ended,
Updated), `SoloSection`, `SafeText` (plain `Text`; `https` URLs become
pressable segments opening via `Linking.openURL`), `ShareButton` (native
`Share.share`; web `navigator.share`, else `navigator.clipboard.writeText` +
`AccessibilityInfo.announceForAccessibility`), `MapsButton` (only for a
confirmed venue with an allowlisted maps host), `StateView` (skeleton,
no-events, no-matches, offline, server, config), `OfflineBanner`,
`SampleEventLabel` (sample source only, REQ-009; replaces the removed Spec 001
`SampleDataBadge`). Discover
uses a `SectionList` (virtualized) grouped by Da Nang day; the stack keeps
Discover mounted under details, which preserves filters and scroll position
(REQ-039). Images use `expo-image` with a neutral placeholder and are shown
only when the host equals the Supabase project host (K9).

**i18n:** `t(key, params?)` gains optional interpolation (i18n-js `%{name}`);
the Spec 001 signature, explicit English fallback, development missing-key
reports and `setLocale()` test harness stay unchanged. New key groups: `discover.*`,
`filters.*`, `event.*`, `status.*`, `solo.*`, `states.*`, `share.*`,
`config.*`. Copy avoids count plurals ("Events: 4") so Russian plural rules
are not needed. Vietnamese and Russian strings need native-speaker review
before launch.

---

## Data Models

### Migration 1 — `supabase/migrations/<timestamp>_create_events.sql`

```sql
create type public.event_status as enum ('draft', 'published', 'cancelled', 'archived');
create type public.event_category as enum (
  'social', 'beach_outdoors', 'sports_fitness', 'food_drink',
  'language_exchange', 'arts_culture', 'workshops', 'nightlife');
create type public.event_price_type as enum ('free', 'paid');
create type public.event_venue_status as enum ('confirmed', 'tbc');

create table public.events (
  id                  uuid primary key default gen_random_uuid(),
  slug                text not null unique
                        check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) between 3 and 80),
  status              public.event_status not null default 'draft',
  city_id             uuid not null references public.cities(id),   -- A8; time zone comes from the city
  title               text not null check (char_length(btrim(title)) between 3 and 120),
  description         text not null check (char_length(btrim(description)) between 1 and 4000),
  what_to_expect      text check (char_length(what_to_expect) <= 2000),
  category            public.event_category not null,
  languages           text[] not null check (
                        cardinality(languages) between 1 and 4
                        and languages <@ array['en', 'vi', 'ru', 'other']::text[]),
  starts_at           timestamptz not null,
  ends_at             timestamptz not null,
  area                text not null check (char_length(btrim(area)) between 2 and 80),
  venue_status        public.event_venue_status not null default 'tbc',
  venue_name          text check (char_length(venue_name) <= 120),
  venue_address       text check (char_length(venue_address) <= 200),
  maps_url            text check (maps_url ~ '^https://(www\.google\.com/maps/|maps\.app\.goo\.gl/|maps\.apple\.com/)'),
  price_type          public.event_price_type not null,
  price_vnd           integer check (price_vnd between 1000 and 100000000),
  payment_note        text check (char_length(payment_note) <= 200),
  organizer_name      text not null check (char_length(btrim(organizer_name)) between 2 and 80),
  age_restriction     smallint check (age_restriction in (16, 18, 21)),
  accessibility_notes text check (char_length(accessibility_notes) <= 500),
  solo_friendly       boolean not null default false,
  solo_details        text check (char_length(solo_details) <= 500),
  cover_image_url     text check (cover_image_url ~ '^https://'),
  registration_url    text check (registration_url ~ '^https://(docs\.google\.com/forms/|forms\.gle/)'),  -- A10 bridge
  cancellation_note   text check (char_length(cancellation_note) <= 300),
  change_note         text check (char_length(change_note) <= 300),
  material_changed_at timestamptz,
  published_at        timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint events_time_order check (ends_at > starts_at),
  constraint events_price_consistent check (
    (price_type = 'free' and price_vnd is null) or (price_type = 'paid' and price_vnd is not null)),
  constraint events_solo_requires_details check (
    not solo_friendly or char_length(btrim(coalesce(solo_details, ''))) >= 10),
  constraint events_confirmed_venue_named check (venue_status = 'tbc' or venue_name is not null),
  constraint events_maps_only_when_confirmed check (maps_url is null or venue_status = 'confirmed'),
  constraint events_cancellation_note check (status <> 'cancelled' or cancellation_note is not null),
  constraint events_organizer_not_contact check (
    organizer_name !~ '@' and organizer_name !~ '[0-9]{6,}')
);

create index events_visible_starts_at_idx on public.events (city_id, starts_at)
  where status in ('published', 'cancelled');
create index events_visible_ends_at_idx on public.events (city_id, ends_at)
  where status in ('published', 'cancelled');

create function public.events_set_derived_fields()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  new.updated_at := now();
  if new.status <> 'draft' and new.published_at is null then
    new.published_at := now();
  end if;
  if tg_op = 'UPDATE' and old.status in ('published', 'cancelled')
     and (new.starts_at, new.ends_at, new.venue_status, new.venue_name, new.venue_address)
         is distinct from
         (old.starts_at, old.ends_at, old.venue_status, old.venue_name, old.venue_address) then
    new.material_changed_at := now();
  end if;
  return new;
end;
$$;

create trigger events_set_derived_fields
  before insert or update on public.events
  for each row execute function public.events_set_derived_fields();
```

### Migration 2 — `supabase/migrations/<timestamp>_events_access_control.sql`

```sql
alter table public.events enable row level security;

-- Explicit privileges; never rely on platform default privileges (REQ-044).
revoke all on table public.events from public, anon, authenticated;
grant select on table public.events to anon, authenticated;
grant select, insert, update, delete on table public.events to service_role;

revoke all on function public.events_set_derived_fields() from public, anon, authenticated;

create policy events_read_visible on public.events
  for select to anon, authenticated
  using (
    status in ('published', 'cancelled')
    and exists (select 1 from public.cities c where c.id = city_id and c.is_active)
  );   -- events of a city being prepared stay private until it is activated
-- No insert/update/delete policies. API-role writes fail on privileges (42501).
```

### Migration 3 — `supabase/migrations/<timestamp>_event_covers_bucket.sql`

```sql
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('event-covers', 'event-covers', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;
-- No storage.objects policies for anon/authenticated: API roles cannot upload,
-- replace or delete. Operators upload covers in Supabase Studio.
```

**Privilege matrix (asserted by tests)**

| Role | SELECT | INSERT | UPDATE | DELETE | TRUNCATE | Rows visible |
|---|---|---|---|---|---|---|
| `anon` | ✓ | ✗ | ✗ | ✗ | ✗ | published, cancelled |
| `authenticated` | ✓ | ✗ | ✗ | ✗ | ✗ | published, cancelled |
| `service_role` | ✓ | ✓ | ✓ | ✓ | ✗ | all (bypasses RLS); operator tooling only, never in clients |
| `postgres` (owner, Studio) | owner | owner | owner | owner | owner | all |

**Seed (`supabase/seed.sql`, local only):** fixture F1 from the requirements
plus one draft, one archived, one cancelled and one ended event; fictional
text and no personal data. `supabase db push` does not apply the seed, and it
must never be applied to a hosted project.

**Generated types:** `src/lib/database.types.ts` from the local database
(`npm run db:types`), committed with LF line endings (one line added to the
existing Spec 001 `.gitattributes`);
CI regenerates and diffs it (REQ-046).

---

## Correctness Properties

| ID | Property | Verified by |
|---|---|---|
| P1 | For `anon` and `authenticated`, readable rows = {status ∈ published, cancelled}; every write raises 42501 | pgTAP access tests |
| P2 | A client-listed event satisfies `ends_at > now` and not (`cancelled` and `starts_at ≤ now`) | Jest repository tests |
| P3 | Listed events are ordered by `starts_at` ascending within and across day groups | Jest |
| P4 | `applyFilters` = AND of per-type predicates; an empty selection in a type is no constraint; `NO_FILTERS` returns the input unchanged | Jest table tests (fixture F1) |
| P5 | Date windows start and end at midnight in the city's time zone; "weekend" follows REQ-022 | Jest table tests for UTC+07:00, UTC+09:00 and Europe/Berlin across a daylight-saving change |
| P6 | Solo badge shown ⇔ `solo_friendly` and non-empty solo details; the database rejects the opposite | pgTAP constraint test + Jest |
| P7 | No Supabase client is created unless the key matches `^sb_publishable_`; `sb_secret_` is rejected | Jest env tests; gitleaks; bundle scan |
| P8 | Sample and live sources are never both active in one build | Jest factory test |
| P9 | An invalid slug produces "not available" without a network request | Jest |
| P10 | `material_changed_at` changes only when schedule or venue changes after publication | pgTAP trigger tests |

---

## Error Handling

| Failure | Detection | User sees | Requirement |
|---|---|---|---|
| Slow Data API | 10 s timer | "Still loading…" + Retry | REQ-032 |
| No response | 20 s abort | Timeout error + Retry | REQ-032 |
| Offline | fetch failure / status 0 | Offline error, or cached list + offline banner | REQ-035, REQ-036 |
| Server/PostgREST error | `error` with HTTP status | Server error + Retry | REQ-035 |
| Missing/invalid config | `ConfigError` at startup | "Service unavailable"; no sample fallback | REQ-042 |
| Live build without config | `scripts/check-live-env.mjs` in `export:web:live` | Build exits non-zero | REQ-042 |
| Malformed row | mapping returns `null` | Row omitted; others shown | REQ-037 |
| Unknown/draft/archived slug | `maybeSingle()` → `null` | "Event not available" | REQ-017 |
| Cover image failure | `expo-image` `onError` | Neutral placeholder | REQ-038 |
| Share unavailable | no Web Share API | Link copied + announcement | REQ-013 |
| RLS or grant regression | pgTAP in CI | CI fails before merge | REQ-045 |
| Schema/type drift | CI diff of generated types | CI fails | REQ-046 |
| Wrong device clock | — | Ended/started decisions use the device clock (residual) | — |

Users never see raw error text; errors map to localized `states.*` strings.

---

## Security and Threat Model

**Assets:** unpublished drafts (confidential until published); integrity of
published events (time, venue, cancellation); Supabase secret keys, database
password and access tokens; user trust; viewers' IP addresses (privacy).

**Actors:** anonymous visitor (untrusted); scraper or attacker holding the
public publishable key (untrusted); MOVA operator in Studio (trusted, MFA);
CI (trusted, no project credentials); third-party npm packages (partially
trusted).

| Threat | Mitigation | Residual |
|---|---|---|
| Reading drafts through direct Data API calls | RLS policy + `in(status)` filter; pgTAP negative tests | Low |
| Writing or defacing events with the publishable key | No write grants or policies; tests for insert/update/delete/truncate | Low |
| Platform default privileges silently widen access | `REVOKE ALL` then explicit `GRANT`; `table_privs_are` tests | Low |
| Secret key committed or shipped in the bundle | gitleaks `sb_secret_` rule; CI bundle scan of `dist/`; env validation rejects non-publishable keys | Low |
| Script injection or malicious links in event text | Plain-text rendering; `https`-only links; maps host allowlist; length limits | Low |
| Draft enumeration by slug | Identical "not available" for unknown, draft, archived | Low |
| Scraping or request floods | Data is public by design; `limit(200)`; Supabase API rate limits | Medium (accepted) |
| Operator account compromise | Org MFA; minimal members; secrets in a password manager | Medium; no per-change audit log in 002 |
| Misleading content (unconfirmed bonfire, alcohol) | Editorial pre-publish checklist; venue TBC state (ADR-0004) | Medium (operational) |
| Third-party image hosts tracking viewers | Covers only from the project's Storage host (K9) | Low |
| Vulnerable dependencies | `npm ci`; audit review on adding `supabase-js` and CLI; ADR-0006 follow-up | Medium until SDK 58 |
| Personal data in events | No attendee data; organiser display name only; constraint blocks emails/phone digits in `organizer_name` | Low |

---

## Testing Strategy

| Layer | Tool | Scope |
|---|---|---|
| Unit | Jest | `env.ts` (sources, URLs, key prefixes incl. `sb_secret_`), `time.ts` (F1, Saturday, Sunday, midnight boundaries, device zones), `filters.ts`, `mapping.ts`, repositories with a mocked Supabase client or fetch (explicit columns, filters, abort, error kinds) |
| Component | `@testing-library/react-native` | Discover states (S1, S2, S4, S6, S18–S21), badges, filter sheet, details banners, not available, Safe text (S17), share fallback (S13), sample label (S21), config error (S24) |
| Database | pgTAP via `supabase test db` | Privileges, RLS, denied writes for `anon`/`authenticated` (S22, S23, S26), constraints (S16), trigger (P10) |
| CI | GitHub Actions | Existing `check` and `secrets` jobs; new `database` job (start local DB, `supabase test db`, type drift); bundle scan after `export:web` |
| Manual | Smoke matrix in `tasks.md` | Android Expo Go, iOS Expo Go (subject to SDK), mobile Chrome and Safari, TalkBack, VoiceOver, 200% text, dark mode, slow and offline network, Telegram preview |

---

## Migration and Rollback

- **Local:** `npx supabase start`, then `npx supabase db reset` replays all
  migrations and the seed; `npx supabase test db` runs the tests.
- **Hosted (not part of the tasks):** an operator authorized by the CEO links
  the project and runs `npx supabase db push --dry-run`, then
  `npx supabase db push` (no seed) after a backup. CI never connects to a
  hosted project.
- **Rollback:** migrations are forward-only; fixes ship as new migrations.
  Emergency kill switch: a migration that revokes `SELECT` from `anon` and
  `authenticated` hides all events instantly. App rollback = redeploy the
  previous web export.

## Affected Files

```
supabase/config.toml                                  (supabase init)
supabase/migrations/<ts>_create_events.sql
supabase/migrations/<ts>_events_access_control.sql
supabase/migrations/<ts>_event_covers_bucket.sql
supabase/tests/events_access.test.sql
supabase/tests/events_constraints.test.sql
supabase/seed.sql
.env.example
.gitattributes                                        (modified: LF for generated types)
scripts/check-live-env.mjs
scripts/check-bundle-secrets.mjs
src/config/env.ts
src/lib/supabase.ts
src/lib/database.types.ts                             (generated)
src/features/events/{types,mapping,repository,supabase-repository,sample-repository,sample-events,time,filters,use-events}.ts
src/features/events/components/*.tsx
src/app/_layout.tsx                                   (modified)
src/app/index.tsx                                     (replaced)
src/app/events/[slug].tsx                             (new)
src/i18n/index.ts, src/i18n/locales/{en,vi,ru}.ts     (modified)
__tests__/events/*.test.ts(x)
.github/workflows/ci.yml                              (database job, bundle scan)
package.json, package-lock.json                       (supabase-js, supabase CLI, db scripts)
README.md                                             (local Supabase section)
```

## Open Decisions (design)

| ID | Decision | Recommendation |
|---|---|---|
| D12 | Per-event link previews | **Resolved:** `generateMetadata` per request on the Vercel server (A2) |
| D16 | Supabase project | **Resolved:** existing project `vozitoaqntixingqwuiw` (A3, ADR-0010); confirm region, backups and MFA |
| D17 | Web hosting | **Resolved:** Vercel with Expo Router server output (A2, ADR-0009); deployments need CEO approval |
| D19 | `EXPO_PUBLIC_SITE_URL` for native share links | Adopt; required in live native builds |
| D20 | a11y lint severity for new code | Resolved by Spec 001: `npm run lint` already fails on any warning |
| D21 | Visual direction (palette, type scale, spacing, card style, dark mode) | Premium dark proposal in A4; the CEO confirms the palette with the consolidated approval |
| D22 | Localized "Event not available" HTML with HTTP 404 on web | Decide the mechanism in task 16 (loader data plus status, or `+not-found`); keep HTTP 404 |
| D23 | `useLoaderData()` on native builds | Task 1 confirms; if unsupported, native screens load through `EventRepository` only |
| D24 | Dark-only or follow the system theme | Dark-only for the MOVA brand at launch |

## Change Log

| Version | Date | Author | Summary |
|---|---|---|---|
| 0.1 | 2026-11-06 | Claude Code (draft for CEO review) | Initial DRAFT: Supabase schema, three migrations, explicit grants and RLS, pgTAP authorization tests, typed client, configuration, threat model, testing and rollback |
| 0.2 | 2026-11-06 | Claude Code | Aligned with merged Spec 001 v0.3: `SampleEventLabel` replaces the removed `SampleDataBadge`; i18n keeps Spec 001 fallback; `.gitattributes` extended, not created; Supabase CLI install-script approval (npm 11); D18 tied to ADR-0006; D20 resolved; D21 added |
| 0.3 | 2026-11-06 | Claude Code | Amendment v0.3 (A1–A7): MOVA, SDK 58 baseline, server rendering on Vercel via `expo-server/adapter/vercel` (verified on a local server build), existing Supabase project with baseline migration, premium dark tokens with computed contrast, modular structure, CI SSR smoke test, added threats; D12 resolved; D22–D24 added. Still DRAFT |
| 0.4 | 2026-11-06 | Claude Code | CEO platform decision: A8 multi-city model (`cities` table, `city_id`, IANA time zones, no constants); A9 platform readiness (no auth tables; future references by `auth.users.id`); `src/platform/` reserved. Still DRAFT |
| 0.4 (review) | 2026-11-06 | Claude Code | Consistency review: removed remaining Da Nang/UTC+07:00 constants (K6, time interfaces, P5, Migration 1); events readable only in active cities (RLS); Hermes time-zone fallback; A10 external registration bridge (D2, REQ-053). Still DRAFT |
| 0.4 (approval) | 2026-11-06 | Claude Code (recording only) | Approved by the CEO on 2026-11-06 |

**This document is APPROVED (v0.4, CEO, 2026-11-06). Any change requires a
spec amendment with a new version and fresh CEO approval.**
