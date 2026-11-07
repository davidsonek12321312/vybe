# MOVA — Product Charter (v0.2)

## Product
MOVA is an **Open Social Platform** for real-world connection: people, events,
communities and conversations in one app for iOS, Android and web. It starts
with public event discovery in Da Nang and grows module by module into a social
platform for multiple cities, beginning in Asia (CEO decision, 2026-11-06).

## Problem
People in Da Nang discover social activities through scattered Telegram/Facebook/Instagram channels. New arrivals and solo visitors often lack a simple way to find trustworthy events, RSVP, know what to expect, and meet other attendees. Hosts handle reservations and updates manually. These are **hypotheses**, not validated findings.

## Mission
Help people discover what is happening around them, meet others in real life, and feel at home in a new city.

## Audience
Adults in Da Nang first, then other cities: Vietnamese locals, international travelers, expats and digital nomads, including Russian-speaking communities. Plan EN/VI/RU access, without assuming nationality implies behavior.

## Platform modules

| Module | Purpose | Status |
|---|---|---|
| Event discovery | Browse public events without an account | Spec 002 (approved v0.4; implemented, in review) |
| Accounts and profiles | Sign-in (Google first; Apple and email later), public profiles separate from private data | Proposed Spec 003 |
| RSVP | Join events, capacity, waitlists, host attendee lists | Planned |
| Hosts | Vetted organisers, event publishing, moderation | Planned |
| Social graph | Friends and follows | Planned |
| Feeds | Posts and activity from people and communities you follow | Planned |
| Rooms and communities | Topic and city communities | Planned |
| Chats | Private and group messaging | Planned |
| Swipe | People discovery | Planned; scope needs a CEO decision (see Not MVP) |
| Media | Avatars, event covers, attachments | Shared platform module |
| Notifications | Push, email and in-app | Planned |
| Multi-city | Cities as data; expansion beyond Da Nang | In the data model from Spec 002 |

## Architecture principles (ADR-0011 to ADR-0016)
1. One modular monolith: one Expo codebase (iOS, Android, web), one Supabase project, one Vercel web server. No microservices without a measured need.
2. Shared platform modules (auth, permissions, media, i18n, design) do not depend on business modules; business modules never reach into each other's internals.
3. Supabase Auth; `auth.users.id` is the only user ID in application data. Google Sign-In first; Apple and email plug in later without redesign.
4. Public profiles are separate from private user data.
5. Public event browsing needs no account.
6. Every table has stable UUID keys, a versioned migration, RLS with explicit grants, and positive and negative tests.
7. Cities are data. Nothing hard-codes Da Nang or a time zone.
8. Build only what the current spec needs; reserve structure, not code, for future modules.

## Roadmap
Each item is its own governed spec (`docs/SDD_WORKFLOW.md`).
1. Spec 001 Foundation — done; amendment v0.4 (Expo SDK 58, MOVA) in review.
2. Spec 002 Event Discovery and Supabase — approved v0.4 (CEO, 2026-11-06); implemented on `feature/spec-002-event-discovery`, in review.
3. **Proposed Spec 003 Accounts: Google Sign-In and Profiles** — Supabase Auth with Google; a public `profiles` table and private user data with owner-only RLS; sign-out, account deletion and data export basics; browsing stays anonymous. Prerequisite for RSVP, Hosts, the social graph and chats.
4. RSVP and Hosts.
5. Social graph, feeds, rooms and communities, chats, notifications, swipe, media and new cities, in an order set by the CEO.

## Initial pilot
Da Nang Beach Social #001, planned 2026-12-05. Frequency: intent to hold weekly events. Precise venue/time and any open-fire authorization TBC. First operational goal: a shareable event page and usable RSVP process, with host access to an attendee list. Trial targets, attendance, and unit economics to be validated.

## Value proposition
1. Discover actual nearby events (not speculative/phantom availability).
2. Join without friction, including solo attendance as an opt-in.
3. Understand languages, hosts, location, rules, capacity and updates.
4. Help hosts manage RSVPs and communication without manual DMs.

## Success signals (pilot)
- Event page visits -> RSVPs conversion
- RSVP -> actual attendance conversion
- Share of solo attendees (opt-in)
- Repeat attendance intent
- Number of issues requiring manual host intervention
- Qualitative user feedback

## Not MVP
Paid ticketing, subscriptions, dating, anonymous messaging, AI matching, maps requiring constant location sharing, Telegram Mini App, event marketplace open to all without moderation. Swipe is a planned future module; whether it stays people discovery or touches dating needs a CEO decision before its spec.

## Founder decision areas
Brand, event format, budget, venue/permissions, monetization, geographic expansion, module order, launch approval.

## Change log

| Version | Date | Author | Summary |
|---|---|---|---|
| 0.1 | — | Founder | Initial charter |
| 0.2 | 2026-11-06 | Claude Code (CEO decision) | MOVA as an Open Social Platform: module map, architecture principles, roadmap with proposed Spec 003 (Accounts: Google Sign-In and Profiles) |
| 0.2 (status) | 2026-11-06 | Claude Code (status only) | Spec 002 status corrected from DRAFT to approved and in review; no product change |
