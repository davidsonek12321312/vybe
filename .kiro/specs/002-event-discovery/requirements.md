# Requirements Document

**Spec 002: Event Discovery**

## Status: APPROVED
## Version: 0.4
## Approved by: CEO
## Approved on: 2026-11-06

Depends on: Spec 001 Project Foundation v0.4 (Expo SDK 58 and MOVA rebrand,
CEO-approved 2026-11-06; branch `feature/spec-001-sdk58-mova` must be merged
first). Spec 002 implementation
SHALL NOT start until this requirements document, `design.md` and `tasks.md`
are each approved by the CEO.

---

## Introduction

Let anyone in Da Nang find real upcoming events and decide whether to go,
including alone, from a list and a shareable event page that work in the app
and on mobile web, with no account. Event data lives in the existing MOVA Supabase project (ADR-0010) and is
read-only for clients.

**In scope:** Discover list; event details; filters (date, category,
language, price, solo-friendly); Going Solo as an event attribute;
loading/empty/error states; sharing; Supabase event storage with versioned
migrations, explicit grants, RLS and authorization tests; typed read-only
Expo client; server-rendered web pages on Vercel with per-event Open Graph
metadata (ADR-0009); premium dark-mode UI under the MOVA brand (ADR-0008).

**Out of scope:** RSVP, capacity, waitlists, attendee lists; ticketing and
payments; sign-in, Supabase Auth, profiles, saved events; People, swipe,
matching; Rooms; Chats or contacting organisers; event creation or host tools
in the app; client writes of any kind; Supabase Storage uploads, Edge
Functions, Realtime; maps, "near me", location permission; push
notifications; Telegram bot/Mini App; personalised recommendations; city
switcher; machine translation; persistent offline cache; add-to-calendar;
creating a new Supabase project; deploying to Vercel or running hosted
migrations without separate CEO approval.

**Priority:** **M** = needed for Beach Social #001 (Sat 2026-12-05) ·
**S** = should ship in 002 · **C** = could, defer if short of time.

---

### Personas and journeys

| | Persona | Context | Needs | Main worry | Entry | UI lang |
|---|---|---|---|---|---|---|
| P1 | Newcomer nomad | Arrived this week, 1–3 months, remote worker | Regular plans, meet people fast | Walking in alone to a group of friends | App → Discover | EN |
| P2 | Short-stay tourist | 4–7 days, won't install an app | "What's on tonight/tomorrow?" | Wasting an evening on a dead event | Telegram link → mobile web | RU |
| P3 | Local connector | Da Nang resident | Language exchange, international friends | Event is foreigner-only or English-only | Shared link / app | VI |
| P4 | Settled expat | Long-term resident | Specific activities, low noise | Low-quality or phantom events | App + filters | EN |
| P5 | Organiser (secondary) | MOVA team in the pilot | One accurate page to share; announce changes | Outdated info circulating | Shares link | any |

Languages are preferences, not assumptions about nationality.

- **J1 Link-first (P2, M):** Telegram link → `/events/[slug]` on mobile web, no sign-in → reads when (Da Nang time), where, price, languages, "Coming alone?" → shares or opens maps.
- **J2 Tonight (P1, M):** app → Discover → Date: Today → opens a card → back to the same spot.
- **J3 Going solo (P1/P2, S):** Solo-friendly toggle → reads meeting point and intro time → decides.
- **J4 Language (P3, S):** Language: VI → finds language-exchange events → shares.
- **J5 Change (P5 → all, M):** MOVA team moves venue or cancels in Supabase → anyone opening the card or old link sees Updated/Cancelled.

---

## Glossary

| Term | Meaning |
|---|---|
| Discover | The `/` screen listing upcoming events |
| Slug | Short URL name of an event, e.g. `da-nang-beach-social-001` |
| Visible event | Status `published` or `cancelled`; `draft` and `archived` are never readable by clients |
| City time | The event city's IANA time zone (Da Nang: Asia/Ho_Chi_Minh, UTC+07:00) |
| City | A row in `public.cities`; Da Nang is the only active city at launch (ADR-0016) |
| Solo-friendly | Organiser commitment with concrete help for people arriving alone |
| Data source | `sample` (fictional, labelled) or `supabase` (live), chosen at build time |
| Data API | Supabase's REST interface to Postgres (PostgREST) |
| RLS | Postgres Row Level Security |
| Publishable key | Public Supabase client key (`sb_publishable_…`); safe in the app because RLS and grants decide access |
| Secret key | Privileged Supabase key (`sb_secret_…` or service-role); never in the app, repository or CI |
| `anon` / `authenticated` | Postgres roles used by Data API requests without / with a signed-in user |
| Server rendering (SSR) | Vercel renders each web page on request from the Expo Router server build |
| Baseline migration | A migration that captures the existing remote schema before Spec 002 changes |

## Requirements

### 2.1 Discover

- **REQ-001 (M)** WHEN a user opens `/` on any supported target, the system SHALL display the Discover screen listing published upcoming events in the default city (Da Nang at launch) without requiring sign-in.
- **REQ-002 (M)** The system SHALL order events by start time ascending, grouped under date headers (Today, Tomorrow, then weekday + date) computed in the event city's time zone (Asia/Ho_Chi_Minh for Da Nang).
- **REQ-003 (M)** Each event card SHALL show start date and time; title; area and venue name, or "Venue TBC"; category; event languages; price label; cover image or neutral placeholder; and applicable badges (Solo-friendly, 18+, Happening now, Updated, Cancelled). Badges SHALL use text, not colour alone.
- **REQ-004 (M)** The system SHALL exclude events whose end time has passed and events that are not published or cancelled.
- **REQ-005 (S)** WHILE the current time is between an event's start and end, its card SHALL show "Happening now".
- **REQ-006 (M)** WHERE an event is cancelled, its card SHALL show "Cancelled" until its scheduled start time, after which it SHALL be excluded from Discover.
- **REQ-007 (M)** The system SHALL show event times in the event time zone; IF the device time zone differs, THEN times SHALL carry a localized city-time label (for example "Da Nang time").
- **REQ-008 (S)** WHEN the user refreshes (pull-to-refresh on native, refresh control on web), the system SHALL reload events and keep active filters.
- **REQ-009 (M)** The build SHALL select its event source from `EXPO_PUBLIC_MOVA_DATA_SOURCE` (`sample` or `supabase`; default `sample`). WHILE the source is `sample`, every card and details screen SHALL show a localized "Sample event, not real" label, no external registration link SHALL be shown, and sample and live events SHALL never be mixed. (Spec 001 v0.3 REQ-005 deferred this disclosure and the environment flag to Spec 002; Discover replaces the Spec 001 "coming soon" home.)

### 2.2 Event details

Event information required to publish: slug, title, start, end, time zone,
status, category, languages, price type (+ VND amount if paid), organiser
display name, area, venue status (confirmed/TBC), description. Optional:
venue name, address, maps link, cover image, what to expect, age
restriction, accessibility notes, solo-support details, payment note, change
note, cancellation note (required when cancelled).

- **REQ-010 (M)** Each published or cancelled event SHALL have a stable URL `/events/[slug]` that opens its details on mobile web without sign-in or install, and the same path SHALL work as a deep link in native builds. Reloading the URL SHALL show the same event. On web, the server SHALL render the page per request (Expo Router server output on Vercel, ADR-0009), so the first HTML response already contains the event.
- **REQ-011 (M)** The details screen SHALL show, in order: status banner (if any); cover image; title; date, start–end time and zone label; venue and area, or "Venue to be confirmed"; languages; price and payment note; organiser name; "Coming alone?" (if Solo-friendly); what to expect; description; age restriction and accessibility notes (if provided); "Last updated" time. Missing optional fields SHALL be omitted, not shown blank.
- **REQ-012 (M)** WHERE the venue is confirmed and has a maps link, the screen SHALL offer "Open in Maps", which opens outside the app. The system SHALL NOT request location permission.
- **REQ-013 (M)** WHEN the user taps Share, the system SHALL open the native share sheet (native) or Web Share API (web); IF neither is available, THEN it SHALL copy the URL and confirm "Link copied" visually and to screen readers.
- **REQ-014 (M)** The details screen SHALL NOT show in-app RSVP, tickets, payment, attendee counts or attendee lists.
- **REQ-015 (M)** IF the event is cancelled, THEN a "Cancelled" banner with the cancellation note SHALL appear at the top. IF the event has ended, THEN an "Event has ended" banner SHALL appear.
- **REQ-016 (M)** WHEN date, time or venue changes after publication, the system SHALL show an "Updated" banner on details stating what changed and when, and an "Updated" badge on the card, until the event starts.
- **REQ-017 (M)** IF the requested slug does not exist or is not published or cancelled, THEN the system SHALL show "Event not available" with a link to Discover, identical in all cases. On web, the response status SHALL be HTTP 404.
- **REQ-018 (M)** The system SHALL render event text as plain text with line breaks; only `https` URLs SHALL be tappable, opening outside the app; no markup SHALL execute.
- **REQ-019 (M)** The system SHALL NOT store or show personal phone numbers, emails, messaging handles or private addresses of organisers or attendees.
- **REQ-020 (M)** WHEN an event URL is shared to Telegram, Facebook, Zalo or WhatsApp, the link preview SHALL show the event title, date and cover image, from Open Graph metadata that the server renders for that event.

### 2.3 Filters

- **REQ-021 (S)** Discover SHALL offer Date, Solo-friendly, Language, Price and Category filters in a bar that stays visible while the list scrolls.
- **REQ-022 (S) Date:** single choice: Any date (default), Today, Tomorrow, This weekend, Next 7 days; (C) Pick a date. All computed in the event city's time zone. "This weekend" = the coming Saturday–Sunday, or the remaining days of the current weekend on Saturday/Sunday. An event matches if it overlaps the period.
- **REQ-023 (S) Category:** multi-select from the fixed list (D4).
- **REQ-024 (S) Language:** multi-select EN, VI, RU, Other; an event matches if it lists any selected language. This is the language spoken at the event, not the UI language.
- **REQ-025 (S) Price:** Any (default), Free, Paid. Price is informational; no payment flow exists.
- **REQ-026 (S) Solo-friendly:** on/off; on shows only events with a visible Solo-friendly badge.
- **REQ-027 (S)** Filters SHALL combine with AND across types and OR within a type; the bar SHALL show active filters, the result count and "Clear all".
- **REQ-028 (S)** Filters SHALL persist when navigating to details and back within a session. (C) On web, filters SHALL be reflected in the URL.

### 2.4 Going Solo

In Spec 002, "Going Solo" is an organiser commitment, not a user status. A
user's own "I'm going solo" opt-in belongs to the future RSVP spec;
introductions between solo attendees belong to a future People spec.

- **REQ-029 (M)** WHERE an event is Solo-friendly, the system SHALL show the badge on card and details and a "Coming alone?" section with the solo-support details.
- **REQ-030 (M)** The database SHALL reject an event marked Solo-friendly without solo-support details; IF such an event reaches the client, THEN the client SHALL NOT show the badge or section and SHALL exclude it from the Solo-friendly filter.
- **REQ-031 (M)** The system SHALL NOT collect, infer or show whether any individual is attending alone.

### 2.5 Empty, loading and error states

- **REQ-032 (M)** WHILE events are loading, the system SHALL show skeleton placeholders; IF loading exceeds 10 s, THEN it SHALL show "Still loading…" with Retry; IF loading exceeds 20 s, THEN the request SHALL be cancelled and the error state shown.
- **REQ-033 (M)** IF there are no published upcoming events, THEN Discover SHALL show a no-events message and SHALL NOT show sample or placeholder events.
- **REQ-034 (S)** IF filters match no events, THEN Discover SHALL show a no-matches state with the active filters and "Clear filters".
- **REQ-035 (M)** IF events cannot be loaded and none were loaded earlier in the session, THEN the system SHALL show an error with Retry, worded differently for offline and server errors.
- **REQ-036 (S)** IF events cannot be loaded but were loaded earlier in the same session, THEN the system SHALL keep showing them (still excluding ended events) with an offline banner showing the last-updated time.
- **REQ-037 (M)** The system SHALL NOT show error codes, stack traces, "null" or "undefined" to users. IF a returned event fails client validation, THEN the client SHALL exclude it.
- **REQ-038 (M)** IF a cover image fails to load, THEN the system SHALL show a neutral placeholder without changing layout.

### 2.6 Navigation

- **REQ-039 (M)** WHEN the user returns from details to Discover, the system SHALL restore the previous filters and scroll position.
- **REQ-040 (M)** WHEN details were opened directly by link, the in-app back control SHALL go to Discover, not close the app or show a blank screen.

### 2.7 Event data, configuration and access control

- **REQ-041 (M)** WHERE the source is `supabase`, the client SHALL read events only through the Supabase Data API, configured solely by `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. The client SHALL NOT contain, request or accept a Supabase secret or service-role key; IF the configured key is not a publishable key, THEN the client SHALL refuse to connect.
- **REQ-042 (M)** IF the source is `supabase` and either variable is missing or invalid, THEN the app SHALL show a "Service unavailable" state, SHALL NOT fall back to sample events, and the live web build command SHALL exit non-zero.
- **REQ-043 (M)** The database SHALL allow the `anon` and `authenticated` roles to read only events whose status is `published` or `cancelled`, and SHALL deny them every insert, update, delete and truncate on event data.
- **REQ-044 (M)** Every database change SHALL be a versioned, forward-only SQL migration in `supabase/migrations/`. Every table reachable through the Data API SHALL have RLS enabled and explicit `REVOKE`/`GRANT` statements for `anon` and `authenticated`; platform default privileges SHALL NOT be relied on.
- **REQ-045 (M)** WHEN CI runs, it SHALL apply all migrations to an empty database and run authorization tests asserting both allowed reads and denied reads/writes for `anon` and `authenticated`; CI SHALL fail if any denied operation succeeds or any allowed read fails.
- **REQ-046 (S)** The client SHALL use TypeScript types generated from the migrated schema; CI SHALL fail if committed types differ from freshly generated types.
- **REQ-047 (M)** The web app SHALL be built with Expo Router server output and served on Vercel through `expo-server/adapter/vercel`; unmatched paths SHALL return HTTP 404 with the localized not-found page. This amends Spec 001 REQ-004(d) (static export → server output: client assets plus server bundle), effective with the approval of this spec.
- **REQ-048 (M)** Server rendering SHALL read Supabase only with the publishable key, under the same RLS as clients. The server SHALL hold no secret or service-role key.
- **REQ-049 (M)** Discover and event pages SHALL use the approved premium dark theme (D21), with every text/background pair meeting WCAG 2.1 AA contrast.
- **REQ-050 (M)** Before any Spec 002 migration, the existing project's schema SHALL be captured as a baseline migration in `supabase/migrations/`, and Spec 002 migrations SHALL apply cleanly on top of it.
- **REQ-051 (M)** Cities SHALL be stored as data (stable UUID, slug, name, country code, IANA time zone, active flag), and every event SHALL reference one city. Discover SHALL show the default active city from configuration (`EXPO_PUBLIC_DEFAULT_CITY`, `da-nang` at launch). No code, constant or check constraint SHALL hard-code a city or UTC offset (ADR-0016). A city switcher stays out of scope.
- **REQ-052 (M)** Spec 002 SHALL NOT create authentication, user or profile tables. Any future user reference SHALL use `auth.users.id` (ADR-0012), and event browsing SHALL keep working without an account.
- **REQ-053 (M)** WHERE a published, upcoming, not-cancelled event has a registration URL, the details screen SHALL show a "Register ↗" button, labelled as a MOVA team form that opens outside the app. The URL SHALL be `https` on an allowlisted host (Google Forms). The button SHALL be hidden for ended or cancelled events and in sample mode. MOVA SHALL store no registrant data, and no attendee list SHALL be shown (bridge until the RSVP spec, D2).

---

## 3. Non-functional requirements

- **NFR-001 Localization:** all UI text EN/VI/RU via the Spec 001 i18n layer; dates and VND amounts formatted for the UI locale; event content shown as authored (no machine translation).
- **NFR-002 Accessibility:** WCAG 2.1 AA; touch targets ≥ 44 pt; filter chips expose selected state; time, price and venue not truncated at 200% text size.
- **NFR-003 Performance (targets, validate in design):** first cards ≤ 3 s on a mid-range Android phone on 4G with ≤ 100 events; filter change ≤ 300 ms; list query limited to 200 rows; images resized and lazy-loaded.
- **NFR-004 Freshness:** changes saved in Supabase, including cancellations, SHALL be visible on the next load or refresh without a new app build. On web, server rendering reads current data on every request.
- **NFR-005 Privacy:** no account, no location permission, no device identifiers, no analytics in 002 (D10). The events table SHALL hold no attendee data and no organiser contact data.
- **NFR-006 Security:** least privilege per REQ-041–045; event text treated as untrusted input (REQ-018); secret scanning (Spec 001 gitleaks) extended to Supabase secret keys and to the built web bundle.
- **NFR-007 Web parity:** Discover and details work fully on current mobile Chrome (Android) and Safari (iOS); web is the pilot channel (ADR-0003).
- **NFR-008 Reproducibility:** a developer on Windows 11 SHALL be able to run the local Supabase stack, apply migrations and run database tests using documented commands.

---

## 4. Acceptance criteria

```gherkin
Feature: Event Discovery (Spec 002)

  Background:
    Given the data source is "supabase"
    And it is Thu 3 Dec 2026 12:00 in Da Nang
    And these events are published:
      | Event | Slug | Start           | Category          | Languages  | Price | Solo-friendly |
      | A     | a    | Thu 3 Dec 19:00 | Social & Meetups  | EN, VI     | Free  | yes           |
      | B     | b    | Sat 5 Dec 17:00 | Beach & Outdoors  | EN, VI, RU | Free  | yes           |
      | C     | c    | Sun 6 Dec 08:00 | Sports & Fitness  | RU         | Paid  | no            |
      | D     | d    | Mon 7 Dec 19:00 | Language Exchange | VI         | Paid  | no            |

  # S1 — REQ-001, 002, 003, 004
  Scenario: Discover lists only upcoming visible events in time order
    Given a draft event X, an archived event Z and an event Y that ended yesterday also exist
    When an anonymous user opens "/"
    Then A, B, C, D are listed in that order under date headers
    And X, Y and Z are not listed
    And each card shows time, title, area or "Venue TBC", category, languages and price
    And no sign-in prompt is shown

  # S2 — REQ-005
  Scenario: Event in progress
    Given it is Thu 3 Dec 19:30 and A ends at 22:00
    When the user opens Discover
    Then A's card shows "Happening now"

  # S3 — REQ-007
  Scenario: Times shown in Da Nang time
    Given the device time zone is Europe/Moscow
    When the user views B
    Then the start time reads "17:00" with the label "Da Nang time"

  # S4 — REQ-022 to 027, 034
  Scenario Outline: Filters
    When the user applies <filters>
    Then exactly <shown> are listed
    Examples:
      | filters                                        | shown                   |
      | Date = Today                                   | A                       |
      | Date = This weekend                            | B, C                    |
      | Date = Next 7 days                             | A, B, C, D              |
      | Category = Beach & Outdoors, Sports & Fitness  | B, C                    |
      | Language = RU                                  | B, C                    |
      | Language = VI and Price = Paid                 | D                       |
      | Solo-friendly = on                             | A, B                    |
      | Language = RU and Category = Language Exchange | none (no-matches state) |

  # S5 — REQ-022
  Scenario: "This weekend" on a Saturday
    Given it is Sat 5 Dec 2026 12:00 in Da Nang
    When the user selects Date = "This weekend"
    Then B and C are listed and D is not

  # S6 — REQ-021, 027, 028, 039
  Scenario: Filter bar, persistence and Clear all
    Given the user applied Language = RU
    When the user scrolls the list
    Then the filter bar stays visible showing "Language: RU" and a count of 2
    When the user opens B and goes back
    Then Language = RU is still active and the list is at the same scroll position
    When the user taps "Clear all"
    Then A, B, C, D are listed

  # S7 — REQ-006, 015
  Scenario: Cancelled event
    Given A is cancelled with the note "Storm warning"
    When the user opens Discover at 15:00
    Then A's card shows "Cancelled"
    And opening A shows a "Cancelled" banner with "Storm warning" at the top
    When the user opens Discover at 19:01
    Then A is not listed

  # S8 — REQ-015
  Scenario: Old link to an ended event
    Given published event Y ended yesterday
    When a user opens "/events/y"
    Then an "Event has ended" banner is shown

  # S9 — REQ-016
  Scenario: Venue change is surfaced
    Given B's venue changed today at 10:00 after publication
    When the user opens B before it starts
    Then an "Updated" banner says the venue changed today at 10:00
    And B's card shows "Updated"

  # S10 — REQ-010, 011, 014, 019, 031
  Scenario: Shared link works on mobile web without an account
    When a user with no app and no account opens "/events/b" in mobile Safari
    Then B's details are shown in the REQ-011 order
    And no RSVP, ticket, payment, attendee count, attendee list or personal contact detail is shown
    And reloading the page shows B again

  # S11 — REQ-017
  Scenario Outline: Unknown, draft and archived events look the same
    When a user opens "/events/<slug>"
    Then "Event not available" is shown with a link to Discover
    And the screen is identical for every row
    Examples:
      | slug           |
      | does-not-exist |
      | x              |
      | z              |

  # S12 — REQ-011, 012
  Scenario: Venue to be confirmed
    Given B has venue status "tbc"
    When the user opens B
    Then "Venue to be confirmed" is shown and "Open in Maps" is not
    And the app never asks for location permission

  # S13 — REQ-013
  Scenario: Share falls back to copying the link
    Given the browser has no Web Share API
    When the user taps Share on B
    Then B's URL is copied and "Link copied" is shown and announced to screen readers

  # S14 — REQ-020 (manual check)
  Scenario: Link preview in messengers
    When B's URL is pasted into Telegram
    Then the preview shows B's title, date and cover image

  # S15 — REQ-040
  Scenario: Back from a deep-linked event goes to Discover
    Given the native app is closed
    When the user opens a link to "/events/b" and taps the in-app back control
    Then Discover is shown

  # S16 — REQ-029, 030
  Scenario: Solo-friendly needs real details
    When A is viewed
    Then the Solo-friendly badge and "Coming alone?" section with A's solo details are shown
    When an operator saves an event with Solo-friendly = true and no solo details
    Then the database rejects the row with a check violation

  # S17 — REQ-018
  Scenario: Event text cannot run code
    Given B's description contains "<script>alert(1)</script>", "javascript:alert(1)" and "https://example.com"
    When the user views B
    Then the script text is shown literally and nothing executes
    And only "https://example.com" is tappable, opening outside the app

  # S18 — REQ-032, 033, 035, 037, 038
  Scenario Outline: Discover states
    Given <condition>
    When the user opens Discover
    Then <result>
    And no error code, stack trace, "null" or "undefined" is visible
    Examples:
      | condition                                | result                                                 |
      | the request is pending                   | skeleton cards and the filter bar are shown            |
      | the request is pending for over 10 s     | "Still loading…" with Retry is shown                   |
      | the request is pending for over 20 s     | the request is cancelled and the error state is shown  |
      | no events are visible                    | the no-events message is shown, with no sample events  |
      | the device is offline, nothing loaded    | the offline error with Retry is shown                  |
      | the Data API returns HTTP 500            | the server error with Retry is shown                   |
      | a returned row has no title              | that row is excluded and the others are shown          |
      | B's cover image fails to load            | B shows a placeholder and the card layout is unchanged |

  # S19 — REQ-036
  Scenario: Connection lost after a successful load
    Given the user loaded Discover at 18:42 and the connection is then lost
    When the user refreshes at 19:30
    Then the earlier events are still shown with "Offline · last updated 18:42"
    And events that already ended are hidden

  # S20 — REQ-008
  Scenario: Refresh keeps filters
    Given Language = VI is active
    When the user refreshes
    Then events reload and Language = VI stays active

  # S21 — REQ-009
  Scenario: Sample data never mixes with live data
    Given the data source is "sample"
    When the user opens Discover
    Then every card and details screen shows the localized sample-event label
    And no live events and no registration links are shown

  # S22 — REQ-043, 045 (database test)
  Scenario Outline: Read access by role
    Given events exist with statuses draft, published, cancelled and archived
    When the <role> role selects all rows from public.events
    Then only the published and cancelled rows are returned
    Examples:
      | role          |
      | anon          |
      | authenticated |

  # S23 — REQ-043, 044, 045 (database test)
  Scenario Outline: Writes are denied
    When the <role> role attempts to <operation> on public.events
    Then the database raises "permission denied" (SQLSTATE 42501)
    And no row is changed
    Examples:
      | role          | operation |
      | anon          | insert    |
      | anon          | update    |
      | anon          | delete    |
      | anon          | truncate  |
      | authenticated | insert    |
      | authenticated | update    |
      | authenticated | delete    |
      | authenticated | truncate  |

  # S24 — REQ-042
  Scenario: Missing live configuration
    Given the data source is "supabase" and EXPO_PUBLIC_SUPABASE_URL is not set
    When the user opens Discover
    Then "Service unavailable" is shown and no sample events are shown
    And the live web build command exits with a non-zero code

  # S25 — REQ-041, NFR-006
  Scenario: Secret keys are rejected and never shipped
    Given EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY starts with "sb_secret_"
    When the app starts
    Then no request is sent to Supabase and "Service unavailable" is shown
    And the CI bundle scan fails if any "sb_secret_" key appears in the web export

  # S26 — REQ-044, 045
  Scenario: Migrations are reproducible and privileges are explicit
    Given an empty local database
    When all migrations are applied in order
    Then RLS is enabled on public.events
    And anon and authenticated hold only SELECT on public.events
    And the database test suite passes

  # S27 — REQ-046
  Scenario: Generated types match the schema
    Given a migration changes public.events
    When CI runs without regenerating src/lib/database.types.ts
    Then the type drift check fails

  # S28 — REQ-010, 017, 020, 047
  Scenario Outline: Server-rendered web responses
    Given the web server build is running
    When a crawler requests "<path>"
    Then the HTTP status is <status>
    And the HTML <content>
    Examples:
      | path            | status | content                                          |
      | /events/b       | 200    | contains B's title in <title> and in og:title    |
      | /events/x       | 404    | shows "Event not available"                      |
      | /does-not-exist | 404    | is the localized not-found page                  |

  # S29 — REQ-048
  Scenario: The server holds no privileged key
    When dist/server, dist/client and the Vercel environment variable list are inspected
    Then only the Supabase URL and the publishable key are present
    And no "sb_secret_" key or service-role JWT exists

  # S30 — REQ-049
  Scenario: Dark theme contrast
    When contrast is computed for every text/background token pair
    Then each pair is at least 4.5:1

  # S31 — REQ-050
  Scenario: Spec 002 migrations apply on the baseline
    Given an empty local database
    When the baseline migration and all Spec 002 migrations are applied in order
    Then every migration succeeds and the database test suite passes

  # S32 — REQ-051
  Scenario: Cities are data, not constants
    Given active city "da-nang" (Asia/Ho_Chi_Minh) and inactive city "test-city" (Asia/Tokyo), each with a published event
    When an anonymous user opens Discover with the default city "da-nang"
    Then only the Da Nang event is listed, with times in Asia/Ho_Chi_Minh
    And time and filter unit tests pass for a UTC+09:00 zone and a daylight-saving zone (Europe/Berlin)

  # S33 — REQ-052
  Scenario: No account tables in Spec 002
    When the Spec 002 migrations are applied
    Then no table references auth.users except through future specs
    And Discover and event pages work without signing in

  # S34 — REQ-053
  Scenario Outline: External registration bridge
    Given event B has registration URL "<url>" and is <state>
    When the user opens B
    Then the "Register ↗" button is <button>
    Examples:
      | url                                   | state     | button                                   |
      | https://forms.gle/abc123              | upcoming  | shown, opening outside the app           |
      | https://forms.gle/abc123              | cancelled | hidden                                   |
      | https://forms.gle/abc123              | ended     | hidden                                   |
      | https://evil.example/form             | upcoming  | impossible: the database rejects the URL |
```

---

## 5. Dependencies and boundaries

| Area | Spec 002 provides | Not in 002 → future owner |
|---|---|---|
| Spec 001 v0.4 (SDK 58, MOVA) | Uses routes, i18n (`t`, `setLocale`, English fallback), lint that fails on warnings, typed-route test, CI, gitleaks and pre-commit hook; replaces the "coming soon" home with Discover; adds `/events/[slug]`; amends REQ-004(d) to server output (REQ-047) | — |
| Supabase (existing project `vozitoaqntixingqwuiw`, ADR-0010) | Baseline migration; read-only events table, migrations, grants, RLS, DB tests, typed client | New projects, Auth, Storage uploads, Edge Functions, Realtime; hosted migrations without CEO approval |
| Event publishing | MOVA team edits events in Supabase Studio (no app UI) | Host/Admin tools, moderation queue |
| RSVP | Stable slug/URL, reserved CTA slot, status model, Solo-friendly attribute | RSVP, capacity, waitlist, attendee list, solo opt-in, reminders |
| Payments | Price shown for information | All payment flows (Not MVP) |
| Accounts and profiles (proposed Spec 003) | Anonymous browsing; no user tables | Google Sign-In, profiles, private user data (ADR-0012, ADR-0013) |
| People, Rooms, Chats, feeds, swipe | Nothing | Owned by their own specs (ADR-0011) |
| Hosting (Vercel, ADR-0009) | Server output, `api/index.js` adapter entry, `vercel.json`, local server-rendering checks | Vercel project setup, domains and deployments (separate CEO approval) |

Critical path: ADR-0003 needs a web RSVP flow by 2026-12-05. Spec 002 does not
deliver RSVP; the RSVP spec must be sequenced in parallel or D2 approved.

## 6. Open decisions

| ID | Decision | Recommendation |
|---|---|---|
| D1 | Who publishes events in the pilot? | **Resolved (CEO, 2026-11-06):** MOVA team only, in Supabase Studio. Opening to hosts needs a moderation spec |
| D2 | Registration before the RSVP spec ships | **Recommended for 12-05 (REQ-053, design A10):** a MOVA team Google Form linked from the details screen; minimal fields, explicit consent, team-only responses deleted 30 days after the event |
| D3 | Navigation shell | Discover-only stack; no placeholder tabs |
| D4 | Category list | social, beach_outdoors, sports_fitness, food_drink, language_exchange, arts_culture, workshops, nightlife (18+) |
| D5 | Price model | Free/Paid + free-text payment note; VND only |
| D6 | Solo-friendly criteria | ≥ 2 of greeter, meeting point, scheduled intro, group format; checked by the MOVA team |
| D7 | Event language meaning | Languages the programme uses: EN, VI, RU, Other |
| D8 | In-app UI language switch | Recommended, but needs a Spec 001 i18n amendment; not in 002 unless approved |
| D9 | Past events | Hidden from Discover; links still open with "Event has ended" |
| D10 | Analytics | None in 002; decide cookieless aggregate analytics separately after legal check |
| D11 | 18+ / alcohol | "18+" label only; no alcohol or bonfire promotion until verified (ADR-0004) |
| D12 | Link previews | **Resolved:** server-rendered Open Graph metadata per request (`generateMetadata`, ADR-0009); verified on a local server build |
| D13 | "Swipe" in People vs vision "dating: Not MVP" | Resolve before any People spec |
| D14 | "Report a problem" | Defer while only the MOVA team publishes |
| D15 | Time TBC | Date and time required to publish; only venue may be TBC |
| D16 | Supabase project | **Resolved:** existing project `vozitoaqntixingqwuiw` (ADR-0010). Still to confirm: region, backups and MFA for all members |
| D17 | Web hosting | **Resolved:** Vercel with Expo Router server output (ADR-0009); every deployment needs separate CEO approval |
| D18 | Expo SDK 58 upgrade | **Resolved:** Spec 001 amendment v0.4 upgraded to SDK 58; ADR-0006 resolved |
| D21 | Visual direction for Discover and details | **Direction resolved (CEO):** premium dark mode. Proposed tokens in design; the CEO confirms the palette with the consolidated approval |

## 7. Traceability

| Req | Scenario(s) | Req | Scenario(s) |
|---|---|---|---|
| 001–004 | S1 | 021, 027, 028 | S4, S6 |
| 005 | S2 | 022 | S4, S5 |
| 006 | S7 | 023–026 | S4 |
| 007 | S3 | 029, 030 | S16 |
| 008 | S20 | 031 | S10 |
| 009 | S21 | 032, 033, 035, 037, 038 | S18 |
| 010, 011, 014, 019 | S10 | 034 | S4 |
| 012 | S12 | 036 | S19 |
| 013 | S13 | 039 | S6 |
| 015 | S7, S8 | 040 | S15 |
| 016 | S9 | 041 | S25 |
| 017 | S11 | 042 | S24 |
| 018 | S17 | 043, 045 | S22, S23 |
| 020 | S14 | 044 | S23, S26 |
| | | 046 | S27 |

REQ-047 → S28; REQ-048 → S29; REQ-049 → S30; REQ-050 → S31; REQ-051 → S32;
REQ-052 → S33; REQ-053 → S34. REQ-010, REQ-017
and REQ-020 are also covered by S28.

NFR-001–008 are verified through design test strategy and the manual smoke
matrix in `tasks.md`.

## Change log

| Version | Date | Author | Summary |
|---|---|---|---|
| 0.1 | 2026-11-06 | Claude Code (draft for CEO review) | Initial DRAFT from the Event Discovery product draft, adding Supabase storage, migrations, explicit grants/RLS, negative authorization tests and typed client (REQ-041–046); slug URLs; session-only offline behaviour; resolved D1 storage per CEO direction |
| 0.2 | 2026-11-06 | Claude Code | Aligned with merged Spec 001 v0.3: Spec 002 owns the sample-event label (`SampleDataBadge` was removed in Spec 001); dependency row updated; D18 marked blocking for public URLs (ADR-0006); D21 visual direction added |
| 0.3 | 2026-11-06 | Claude Code | CEO direction of 2026-11-06: MOVA brand; server-rendered web pages on Vercel (REQ-010, 017, 020 updated; REQ-047, amending Spec 001 REQ-004d); publishable-key-only server (REQ-048); premium dark theme (REQ-049); existing Supabase project with baseline migration (REQ-050); D1, D12, D16, D17, D18 resolved; D21 direction set; S28–S31 added. Still DRAFT |
| 0.4 | 2026-11-06 | Claude Code | CEO platform decision (ADR-0011 to ADR-0016): cities as data, no hard-coded Da Nang or offset (REQ-051, S32); no auth or profile tables, `auth.users.id` for future references (REQ-052, S33); REQ-001, 002, 007, 022 and glossary generalised to city time. Still DRAFT |
| 0.4 (review) | 2026-11-06 | Claude Code | Consistency review: REQ-053 external registration bridge for 12-05 (D2) with S34. Still DRAFT |
| 0.4 (approval) | 2026-11-06 | Claude Code (recording only) | Approved by the CEO on 2026-11-06, including the eight categories (D4), EN/VI/RU/Other event languages (D7), premium dark design (D21), multi-city model, existing Supabase project, team-only publishing, Google Forms bridge (D2) and Vercel server rendering (REQ-047, amending Spec 001 REQ-004d) |

**This document is APPROVED (v0.4, CEO, 2026-11-06). Any change requires a
spec amendment with a new version and fresh CEO approval.**
