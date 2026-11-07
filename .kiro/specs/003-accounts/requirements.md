# Requirements Document

**Spec 003: Accounts (Google Sign-In, Email and Password, Public Profiles)**

## Status: DRAFT
## Version: 0.2
## Approved by: (none, awaiting CEO review)
## Approved on: (none)

Prepared by the MOVA worker for CEO review. Requirements phase only: no design,
no tasks and no code exist for this spec, and none may start until the CEO
approves this document.

Depends on: Spec 001 v0.4 and Spec 002 v0.4 (merged first), ADR-0012 (identity; the CEO request of
2026-11-07 to include email and password in this spec amends its "email later" line, see Q10),
ADR-0013 (public profiles separate from private data), ADR-0014 (permissions and
media), ADR-0015 (data conventions), ADR-0010 (existing Supabase project,
publishable key only).

---

## Introduction

Let a person register and sign in to MOVA with Google or with an email address and
password, get a profile page that other people can see (within the visibility the
user chooses), keep private account data private, and leave: sign out, export their
data and delete their account. Browsing events stays anonymous. This spec is the
prerequisite for RSVP, Hosts, the social graph and chats; none of those are in
scope here.

**In scope:** Google Sign-In and email-and-password registration through Supabase Auth (email confirmation, password reset, password change) on iOS, Android and web; a unique public handle and a profile page per user;
session handling and sign-out; `public.profiles` (public) and a separate private
user-data table with owner-only access; profile view and edit; avatar upload to
a Supabase Storage bucket; account deletion; data export; consent record for the
terms and privacy notice; migrations, grants, RLS and authorization tests; the
UI states for all of the above in EN, VI and RU.

**Out of scope:** Apple sign-in and magic links (added later as providers without schema
changes); multi-factor authentication; phone numbers; RSVP and attendance; hosts and host tools; follows,
friends and any social graph; chats and rooms; push notifications; roles and
moderation (ADR-0014, a later spec); profile search or a people directory;
verification badges; payments; importing contacts; creating a new Supabase
project; deployment or hosted migrations without separate CEO approval.

## Glossary

- **User**: a row in `auth.users`; `auth.users.id` (UUID) is the only user key.
- **Public profile**: the data in `public.profiles` that any visitor may read.
- **Private data**: data only its owner may read or change.
- **Provider identity**: the Google or email login kept by Supabase in `auth.identities`.
- **Handle**: the unique, URL-safe public name of a profile (for example `anna-dn`). It is not an email address and not a key; the key stays `auth.users.id`.
- **Visibility**: `public` (anyone, including signed-out visitors and search engines, if the user opted in) or `members` (signed-in users only, the default).

## Requirements

Priority: (M) must, (S) should. Every requirement uses EARS wording.

### Sign-in and session

- **REQ-001 (M)** WHERE a person is not signed in, THE app SHALL offer "Continue with Google" without blocking event browsing.
- **REQ-002 (M)** WHEN a person completes Google sign-in, THE system SHALL create or reuse exactly one user and open a session, using Supabase Auth only.
- **REQ-003 (M)** THE system SHALL identify users only by `auth.users.id`; it SHALL NOT use the Google subject, the email address or any provider identifier as a key, foreign key, storage path or RLS input.
- **REQ-004 (M)** WHEN sign-in fails or is cancelled, THE app SHALL show a plain-language message in the active locale, SHALL NOT show error codes or provider messages, and SHALL leave the person signed out and able to retry.
- **REQ-005 (M)** THE session SHALL persist across app restarts in secure storage on native and in the browser's Supabase session storage on web, and SHALL refresh without user action until it is revoked or expires.
- **REQ-006 (M)** WHEN the person chooses "Sign out", THE system SHALL end the session on the device, clear session data and any cached private data, and return to the signed-out state.
- **REQ-007 (M)** THE app SHALL use only the publishable key. A secret or service-role key SHALL NOT appear in any bundle, repository file or `EXPO_PUBLIC_*` variable (extends Spec 002 REQ-041, 048).
- **REQ-008 (M)** THE redirect URLs for sign-in SHALL come from configuration and SHALL be restricted to the MOVA app scheme and the configured site origin; the system SHALL reject any other redirect target.

### Email and password

- **REQ-034 (M)** WHERE a person is not signed in, THE app SHALL offer registration and sign-in with an email address and password next to "Continue with Google".
- **REQ-035 (M)** WHEN a person registers with email, THE system SHALL require a confirmed email address before a profile can be created, using Supabase Auth only; unconfirmed accounts SHALL expire and be removed.
- **REQ-036 (M)** THE password SHALL be at least 10 characters and SHALL be checked against a list of common passwords; MOVA code SHALL NOT store, log or display passwords (hashing is Supabase Auth's job).
- **REQ-037 (M)** WHEN a person asks for a password reset, or registers with an address that already exists, THE system SHALL give the same neutral response as for an unknown address, so that nobody can learn which addresses have accounts.
- **REQ-038 (M)** WHEN a person signs in with Google and the same email already belongs to an email account, THE system SHALL link both logins to one user only after the person proves control of the existing account; it SHALL NOT merge accounts by email alone.
- **REQ-039 (M)** WHEN a person changes their password or email, THE system SHALL require a recent sign-in first and SHALL end their other sessions.
- **REQ-040 (M)** THE system SHALL limit failed sign-ins, registrations and reset requests per address and per client, with a neutral "try again later" message (extends REQ-025).

### Profiles

- **REQ-009 (M)** WHEN a user is created, THE system SHALL create exactly one profile whose primary key equals `auth.users.id`.
- **REQ-010 (M)** THE public profile SHALL hold only: handle, display name, avatar reference, short bio, spoken languages (EN, VI, RU, other), interests, and home city (a reference to `public.cities`).
- **REQ-011 (M)** THE system SHALL NOT copy the Google email address, full name, phone or birth date into the public profile. The initial display name SHALL be taken from the Google given name only if the user confirms it on first sign-in; otherwise the user chooses one.
- **REQ-012 (M)** Private data (email copy if any, settings, consent records, locale preference) SHALL live in a separate table readable and writable only by its owner. No public view or function SHALL join private columns.
- **REQ-013 (M)** WHEN a signed-in user edits their profile, THE system SHALL validate display name (2 to 40 characters, no contact details such as phone numbers, email addresses or messenger links), bio (up to 300 characters) and language and interest lists, and SHALL reject invalid input with a specific message.
- **REQ-014 (M)** THE app SHALL show a profile page at `/u/<handle>` only as the profile's visibility allows: `members` profiles to signed-in users, `public` profiles to everyone. Any other visitor SHALL get exactly the response for a handle that does not exist. THIS spec SHALL NOT add a people directory, search, suggestions or any list of profiles; a page is reachable only by someone who knows the handle.
- **REQ-041 (M)** WHEN a user creates a profile, THE system SHALL require a unique handle (3 to 24 characters: lower-case letters, digits and hyphens; not reserved; not resembling an email address or phone number), SHALL set visibility to `members`, and SHALL let the user change visibility at any time. A changed handle SHALL be released only after a cool-down, so it cannot be taken over.
- **REQ-042 (M)** WHERE a profile is `public`, THE server-rendered page SHALL put only the REQ-010 fields in its title, description and Open Graph tags, escaped as in Spec 002 REQ-018; `members` profiles SHALL carry `noindex` and no personal data in metadata.
- **REQ-043 (S)** A signed-in user SHALL be able to report a profile (reason and optional note); this spec stores the report in a private table, and review tooling belongs to a later moderation spec.
- **REQ-015 (S)** THE app SHALL show the user's own profile with an "Edit" action and a preview of what others see.

### Avatar

- **REQ-016 (M)** WHEN a user uploads an avatar, THE system SHALL accept only JPEG, PNG or WebP up to 5 MB, store it in a dedicated bucket under a UUID path derived from `auth.users.id`, and reject other types and sizes.
- **REQ-017 (M)** Storage policies SHALL allow a user to write and delete only objects in their own path; anonymous clients SHALL NOT write; zero policies SHALL allow listing other users' objects.
- **REQ-018 (S)** WHEN a user removes their avatar, THE system SHALL delete the object and clear the reference.

### Privacy, consent, export and deletion

- **REQ-019 (M)** BEFORE creating a profile, THE app SHALL show a link to the terms and privacy notice and SHALL record the version and time of the user's acceptance in private data. The wording of both documents is a CEO and legal decision, not part of this spec.
- **REQ-020 (M)** THE system SHALL NOT collect location, contacts, device identifiers or attendance for accounts in this spec. Any such signal requires its own spec and an explicit opt-in (ADR-0013).
- **REQ-021 (M)** WHEN a user requests data export, THE system SHALL produce a machine-readable file (JSON) with their profile, private data and consent records, available only to that user.
- **REQ-022 (M)** WHEN a user confirms account deletion (a second explicit step), THE system SHALL delete their profile, private data, avatar object and consent records, remove the `auth.users` row, and end all sessions. Deletion SHALL NOT be reversible by the app, and a short in-product notice SHALL say so.
- **REQ-023 (M)** THE deletion path SHALL run on the server with the least privilege needed; the secret key used for it SHALL exist only in the server environment, never in a client bundle.
- **REQ-024 (M)** WHERE content written by a deleted user is referenced by a later module, THAT module's spec SHALL define how it is anonymised or deleted; this spec SHALL define only the hooks (foreign keys with a stated delete rule).

### Abuse resistance and security

- **REQ-025 (M)** THE system SHALL rate-limit sign-in attempts, profile writes and avatar uploads per user and per client, and SHALL show a neutral "try again later" message when a limit is hit.
- **REQ-026 (M)** All profile text SHALL be rendered as plain text; no markup, HTML or links are interpreted (consistent with Spec 002 REQ-018).
- **REQ-027 (M)** Row level security SHALL be enabled on every new table. Anonymous and authenticated roles SHALL have only the privileges listed in the design; defaults SHALL be revoked first (ADR-0015).
- **REQ-028 (M)** A user SHALL NOT be able to read, change or delete another user's private data, or change another user's profile, by any API call; tests SHALL prove each denial.
- **REQ-029 (S)** THE system SHALL log authentication events (sign-in, sign-out, deletion request) without storing tokens, email addresses or other personal data in application logs.

### States, accessibility and language

- **REQ-030 (M)** Every sign-in, profile, upload, export and deletion screen SHALL have loading, error, offline and retry states with plain-language text, and SHALL never show error codes, stack traces or "null" (consistent with Spec 002 REQ-037).
- **REQ-031 (M)** All new strings SHALL exist in EN, VI and RU. Machine translation is not used; VI and RU wording needs native-speaker review.
- **REQ-032 (M)** All controls SHALL have accessible names, roles and states; touch targets SHALL be at least 44 pt; text SHALL scale to 200% without clipping (NFR from Spec 002).
- **REQ-033 (S)** THE sign-in button SHALL follow Google's branding guidelines.

## Acceptance scenarios (Given / When / Then)

- **S1 (REQ-001, 002, 009)** Given a signed-out visitor on Discover, When they tap "Continue with Google" and finish Google's flow, Then they are signed in, exactly one user and one profile exist, and Discover still works.
- **S2 (REQ-004)** Given the Google flow is cancelled, When the app returns, Then the person is signed out, sees a plain message and a Retry action, and no error code.
- **S3 (REQ-005, 006)** Given a signed-in user, When they restart the app, Then they are still signed in; When they tap "Sign out", Then the session and cached private data are gone.
- **S4 (REQ-003)** Given the schema, When all foreign keys, RLS policies and storage paths are inspected, Then every user reference is `auth.users.id` and none uses an email or provider ID.
- **S5 (REQ-010, 011, 012)** Given a new Google account with a full name and email, When the profile is created, Then the public profile contains no email, no full name and no phone, and private data is not readable by anyone else.
- **S6 (REQ-013)** Given the edit form, When the user enters a display name containing a phone number or a messenger link, Then the save is rejected with a specific message and nothing is stored.
- **S7 (REQ-016, 017)** Given an avatar upload, When the file is a 9 MB image or an HTML file, Then it is rejected; When user B tries to overwrite user A's avatar path, Then the request is denied.
- **S8 (REQ-028)** Given users A and B, When B reads A's private data or updates A's profile through the API, Then both requests are denied.
- **S9 (REQ-019)** Given a first sign-in, When the profile step opens, Then the terms and privacy links are shown and acceptance (version and time) is recorded before the profile exists.
- **S10 (REQ-021)** Given a signed-in user, When they request export, Then they receive a JSON file with only their own data.
- **S11 (REQ-022, 023)** Given a signed-in user, When they confirm deletion in the second step, Then their profile, private data, avatar, consent records and auth user are removed, their sessions end, and no secret key was used in the client.
- **S12 (REQ-007, 008)** Given a production build, When the bundle is scanned, Then no secret or service-role key is found; When a sign-in redirect to another origin is attempted, Then it is rejected.
- **S13 (REQ-025)** Given 30 profile saves in one minute from one user, When the limit is hit, Then further saves are refused with a neutral message.
- **S14 (REQ-030, 031, 032)** Given the device is offline, When the person opens their profile, Then they see an offline state with Retry in the active locale; the same screens pass a screen-reader and 200% text check.

- **S15 (REQ-034, 035)** Given a new visitor, When they register with an email and password, Then they are asked to confirm the address, cannot create a profile until they do, and an unconfirmed account is removed after the expiry.
- **S16 (REQ-036, 037, 040)** Given a registered address, When someone requests a reset or registers it again, Then the response is identical to that for an unknown address; When 10 sign-ins fail within a minute, Then further attempts are refused neutrally.
- **S17 (REQ-038)** Given an email account for a@x.com, When someone signs in with Google using a@x.com, Then the two logins are not merged until control of the email account is proven.
- **S18 (REQ-039)** Given two signed-in devices, When the password is changed on one, Then the other session ends.
- **S19 (REQ-014, 041, 042)** Given a `members` profile, When a signed-out visitor opens `/u/<handle>`, Then they get the not-found page that an unknown handle gets, with `noindex`; Given the user sets `public`, Then the page shows only REQ-010 fields and the metadata contains no email, full name or phone.
- **S20 (REQ-041)** Given the handle `anna-dn` is taken, When another user chooses it, or `admin`, or a phone number, Then the save is refused with a specific message and nothing is stored.
- **S21 (REQ-043)** Given a signed-in user viewing another profile, When they report it, Then a private report row exists that only the reporter and, later, moderators can read.

## Traceability (planned)

| Area | Requirements | Scenarios |
|---|---|---|
| Sign-in and session | 001-008 | S1-S4, S12 |
| Email and password | 034-040 | S15-S18 |
| Profiles and profile pages | 009-015, 041-043 | S1, S5, S6, S19-S21 |
| Avatar | 016-018 | S7 |
| Privacy, export, deletion | 019-024 | S9-S11 |
| Abuse and security | 025-029 | S8, S12, S13 |
| States, accessibility, language | 030-033 | S14 |

## Threat surface (input to the design phase)

- **Account takeover or confusion:** provider identity linking (later Apple or email), unverified email on another provider. Mitigation: `auth.identities`, no email-as-key (REQ-003).
- **Open redirect or token leakage on sign-in:** restricted redirect URLs (REQ-008); tokens never logged (REQ-029).
- **Privilege escalation through RLS gaps:** deny-by-default grants, per-table tests for each role (REQ-027, 028).
- **PII in public profiles:** whitelist of public fields and input validation (REQ-010, 011, 013).
- **Abusive uploads:** type, size and path rules, rate limits (REQ-016, 017, 025).
- **Secret key exposure through the deletion function:** server-only environment, bundle scan (REQ-007, 023).
- **Spam accounts and credential stuffing:** email confirmation and rate limits; a bot check only if abuse appears (REQ-035, 040; Q4).
- **Account enumeration:** neutral responses for reset and duplicate registration (REQ-037).
- **Email-based takeover:** no automatic merge by email (REQ-038).
- **Profile scraping and stalking:** `members` by default, no directory or search, rate-limited reads, `noindex` (REQ-014, 041, 042).
- **Handle squatting and impersonation:** reserved words, cool-down on release, report action (REQ-041, 043).

## Open questions with recommended defaults (v0.2)

Every question has a recommended default. Only rows marked **CEO** need a real decision;
the rest take the default unless the CEO objects.

| # | Question | Recommended default | Who decides |
|---|---|---|---|
| Q1 | Display name on first sign-in | Pre-fill from the Google given name and ask the user to confirm; email sign-ups start empty. | Default |
| Q2 | Account deletion: immediate or grace period | Immediate and final, after re-authentication and a second confirmation. A grace period needs a soft-delete state and a scheduled job; revisit if support needs it. | Default |
| Q3 | Terms and privacy text | EN text from the CEO or legal, VI and RU after. Development uses clearly marked placeholder text, and public release waits for the final text. | **CEO** |
| Q4 | Bot check at sign-up | Rate limits plus email confirmation for the pilot. Add Cloudflare Turnstile on email registration only if abuse appears; that is a new third-party service and needs CEO approval then. | Default |
| Q5 | Minimum age | Required checkbox "I am 18 or older", stored as a boolean and a time, no birth date. Legal confirmation of 18 versus 16 is needed. | **CEO** |
| Q6 | Where deletion runs | A `SECURITY DEFINER` SQL function `delete_my_account()` removes the rows and the `auth.users` row; the client first deletes its own avatar through its storage policy. No secret key outside Supabase, no Edge Function, no Vercel secret. The design phase confirms this works; if not, a Vercel server route holding the secret key needs CEO approval. | Default; design verifies |
| Q7 | Web or native first | Web and Expo Go through browser-based OAuth first; a native Google SDK needs a development build and comes later. | Default |
| Q8 | Public handle | Required, unique, changeable with a cool-down (REQ-041). | Default |
| Q9 | Profile visibility | `members` by default; the user can make a profile `public`; no directory or search in this spec. | **CEO** (privacy stance) |
| Q10 | ADR-0012 amendment | Record that email and password join Google in Spec 003 (ADR-0012 said "later"); Apple stays later. | **CEO** |

## Change Log

| Version | Date | Author | Summary |
|---|---|---|---|
| 0.1 | 2026-11-07 | Claude Code (MOVA worker, draft for CEO review) | Initial DRAFT, requirements only |
| 0.2 | 2026-11-07 | Claude Code (MOVA worker, draft for CEO review) | CEO request: email and password (REQ-034 to 040), profile pages with handle and visibility (REQ-014 rewritten, REQ-041 to 043), scenarios S15 to S21, threats, recommended defaults for Q1 to Q7 and new Q8 to Q10 |
