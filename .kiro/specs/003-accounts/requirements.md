# Requirements Document

**Spec 003: Accounts (Google Sign-In and Profiles)**

## Status: DRAFT
## Version: 0.1
## Approved by: (none, awaiting CEO review)
## Approved on: (none)

Prepared by the MOVA worker for CEO review. Requirements phase only: no design,
no tasks and no code exist for this spec, and none may start until the CEO
approves this document.

Depends on: Spec 001 v0.4 and Spec 002 v0.4 (merged first), ADR-0012 (identity),
ADR-0013 (public profiles separate from private data), ADR-0014 (permissions and
media), ADR-0015 (data conventions), ADR-0010 (existing Supabase project,
publishable key only).

---

## Introduction

Let a person sign in to MOVA with Google, get a public profile that other people
can see, keep private account data private, and leave: sign out, export their
data and delete their account. Browsing events stays anonymous. This spec is the
prerequisite for RSVP, Hosts, the social graph and chats; none of those are in
scope here.

**In scope:** Google Sign-In through Supabase Auth on iOS, Android and web;
session handling and sign-out; `public.profiles` (public) and a separate private
user-data table with owner-only access; profile view and edit; avatar upload to
a Supabase Storage bucket; account deletion; data export; consent record for the
terms and privacy notice; migrations, grants, RLS and authorization tests; the
UI states for all of the above in EN, VI and RU.

**Out of scope:** Apple and email sign-in (added later as providers without schema
changes); phone numbers; RSVP and attendance; hosts and host tools; follows,
friends and any social graph; chats and rooms; push notifications; roles and
moderation (ADR-0014, a later spec); profile search or a people directory;
verification badges; payments; importing contacts; creating a new Supabase
project; deployment or hosted migrations without separate CEO approval.

## Glossary

- **User**: a row in `auth.users`; `auth.users.id` (UUID) is the only user key.
- **Public profile**: the data in `public.profiles` that any visitor may read.
- **Private data**: data only its owner may read or change.
- **Provider identity**: the Google account link kept by Supabase in `auth.identities`.

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

### Profiles

- **REQ-009 (M)** WHEN a user is created, THE system SHALL create exactly one profile whose primary key equals `auth.users.id`.
- **REQ-010 (M)** THE public profile SHALL hold only: display name, avatar reference, short bio, spoken languages (EN, VI, RU, other), interests, and home city (a reference to `public.cities`).
- **REQ-011 (M)** THE system SHALL NOT copy the Google email address, full name, phone or birth date into the public profile. The initial display name SHALL be taken from the Google given name only if the user confirms it on first sign-in; otherwise the user chooses one.
- **REQ-012 (M)** Private data (email copy if any, settings, consent records, locale preference) SHALL live in a separate table readable and writable only by its owner. No public view or function SHALL join private columns.
- **REQ-013 (M)** WHEN a signed-in user edits their profile, THE system SHALL validate display name (2 to 40 characters, no contact details such as phone numbers, email addresses or messenger links), bio (up to 300 characters) and language and interest lists, and SHALL reject invalid input with a specific message.
- **REQ-014 (M)** WHERE a person is signed out, THE app SHALL show another user's public profile only if a later spec links to it; this spec SHALL NOT add a people directory, search or any list of profiles.
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

## Traceability (planned)

| Area | Requirements | Scenarios |
|---|---|---|
| Sign-in and session | 001-008 | S1-S4, S12 |
| Profiles | 009-015 | S1, S5, S6 |
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
- **Spam accounts:** rate limits now; CAPTCHA or verification is a later decision (open question Q4).

## Open questions for the CEO

- **Q1** Display name on first sign-in: pre-fill from the Google given name (current draft, with confirmation) or always start empty?
- **Q2** Account deletion: immediate and final (current draft) or a 14-day grace period?
- **Q3** Terms of service and privacy notice: who supplies the final text, and in which languages? (REQ-019)
- **Q4** Is a CAPTCHA or other bot check wanted at sign-up for the pilot, or are rate limits enough?
- **Q5** Minimum age: does MOVA need an age confirmation at sign-up (some events are 18+ or 21+)?
- **Q6** Is the deletion function allowed to be a Supabase Edge Function, or must it run on the Vercel server (Spec 002 lists Edge Functions as out of scope there)?
- **Q7** Should web sign-in work on the first release, or native first?

## Change Log

| Version | Date | Author | Summary |
|---|---|---|---|
| 0.1 | 2026-11-07 | Claude Code (MOVA worker, draft for CEO review) | Initial DRAFT, requirements only |
