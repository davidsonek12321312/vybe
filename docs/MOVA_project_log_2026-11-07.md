# MOVA — Product, Authentication & Delivery Log

Date: 2026-11-07
Status: Product and configuration notes; **not** an approved implementation spec or production release authorization.
Repository: `davidsonek12321312/vybe` (product brand: MOVA). Canonical implementation specs: `.kiro/specs/`.

## Current technical baseline

- Expo + React Native + TypeScript + Expo Router, Expo SDK 58, server-rendered web pages intended for Vercel.
- Supabase Auth/Postgres with RLS, migrations in `supabase/migrations`, initially one location: Da Nang, but multi-city design.
- Supabase project reference: `vozitoaqntixingqwuiw`; project callback `https://vozitoaqntixingqwuiw.supabase.co/auth/v1/callback`.
- Spec 001 and Spec 002 v0.4 recorded as approved on 2026-11-06; ongoing independent review remediation in feature/spec-002-event-discovery.
- Persistent OMC/Claude Code worker: tmux/psmux session `mova`, worker `mova-worker`; OMC wait daemon monitors usage limits. Rate-limit resume under a real reset remains unverified.
- Local Docker Desktop and Supabase containers were shown running Nov 7, 2026; pgTAP/RLS test success must be verified from commands, not assumed.
- The human controls merge, production deploy, hosted Supabase migrations, costs and amendments to approved requirements. Avoid concurrent edits to worker's worktree.

## Product direction — proposed roadmap

1. Complete Spec 002 Event Discovery review and tests, prepare Draft PRs and verify CI, without deployment/merge.
2. **Proposed Spec 003 — Accounts & Profiles.** Login via Google and email/password first, then Apple and Facebook after their provider setups; sessions, sign-out, verified email, password reset, account deletion, safe account linking, display name, avatar, languages, interests, home city, public/private separation and RLS. Public event discovery without login remains available. Spec 003 requirements/design/tasks each need human approval before implementation.
3. **Proposed Spec 004 — Native event participation / RSVP.** Join/leave, registration open/closed, attendee capacity, waiting list (if approved), and host controls.
4. **Proposed Spec 005 — Live Event Map.** Opt-in, default-OFF sharing of approximate event-presence positions only for appropriately authorized participants during an active event; 15 km radius around event venue, 30–60 s refresh as a performance starting point; stop at event end, no track history, revocation, privacy and stalking threat model. Not part of Spec 002.
5. **Proposed Spec 006 — Event chats and communities** with reporting, blocking and moderation.
6. Subsequent social discovery and swipe only after user validation.

## Product decision AR5 — registration while event underway

Founder requested that a user may join/register while an event has already started, provided registration remains open, capacity rules allow it and the event has not ended. This is a product decision to document; the worker should reconcile it against the canonical approved Spec 002 before code changes that require an amendment.

## Authentication provider setup — facts verified 2026-11-07

- In Google Auth Platform the application audience was chosen as **External**; testing mode was indicated. Test users must be configured before testing.
- A Google Cloud OAuth client named `MOVA WEB`, type **Web application**, was **created** (screenshot confirmation).
- `Authorized JavaScript origins` was left blank while the final web origin remains undecided.
- `Authorized redirect URIs` was correctly populated with the hosted Supabase callback: `https://vozitoaqntixingqwuiw.supabase.co/auth/v1/callback`.
- **Important:** Google OAuth client secret was displayed in an image uploaded to chat; treat it as exposed. Rotate/regenerate the client secret in Google Cloud, then use the NEW secret solely in the private Supabase provider settings. Do not commit, print, upload, or place secret in agent prompts. GitHub PAT was also pasted earlier; rotate/revoke that credential separately.
- Screenshot of Supabase `Authentication > Users` initially showed no app sign-ups; this does not indicate a configuration failure. The next configuration screen is `Authentication > Sign In / Providers > Google`.
- **Not yet verified**: Google provider enabled and saved in Supabase, Client ID entered, freshly rotated Client Secret saved, Google test user allowlisted, URL Configuration (Site URL and redirect URLs), end-to-end sign-in in MOVA web/development build.
- For web sign-in configure production/staging/localhost redirect URLs in Supabase based on actual deployed origins and callback route. Do not invent domains or ports. Expo native scheme (`mova://`) and deep linking require implementation/verification in approved Spec 003.
- Apple Developer account was shown without paid membership; defer paid Apple setup until the iOS strategy is confirmed. Meta Facebook Login to be configured when required. Email/password via Supabase is intended, with email verification, anti-abuse controls and production mail configuration to be designed.

## Checklist for next owner action

- [ ] Open Supabase project > Authentication > Sign In / Providers > Google.
- [ ] Verify the provider's callback URL exactly matches Google's Authorized redirect URI.
- [ ] Rotate the Google OAuth client secret exposed in screenshot (Google Cloud > Auth Platform > Clients > MOVA WEB).
- [ ] Turn on Google provider, enter Google Client ID and newly rotated Client Secret, save.
- [ ] Check Google Auth Platform > Audience > test users for the intended Gmail test account.
- [ ] Check Supabase Authentication > URL Configuration (Site URL and allowlisted Redirect URLs); use actual web and native targets only when established.
- [ ] Validate provider configuration in a safe test flow before advertising Google Login as complete.
- [ ] Have a single existing worker integrate this document into repo as a documentation-only change or proposed Draft PR. Do not change approved specs, implement unapproved auth features, commit secrets or merge autonomously.

## Security and project-governance notes

- No OAuth secret, personal access token, credentials, raw screenshot, or production user PII is contained in this document.
- Store provider secrets only in protected provider settings/environment secrets. Client IDs are not passwords but still shouldn't be used as a substitute for credential handling.
- External provider configuration, code implementation, schema migration and deployment are distinct steps: a created OAuth client does not mean sign-in in MOVA works.
- This record captures user requests and observed evidence. A future agent must verify live configuration before claiming implementation is complete.

## Configuration follow-up — 2026-11-07 12:43 CET

- Google Cloud OAuth **MOVA WEB** client creation is confirmed, with the correct Supabase callback in **Authorized redirect URIs**; no JavaScript origin was configured yet.
- Latest Supabase Google provider screenshot showed the provider toggle **OFF**. The **Client IDs** field contained a project display name, not a Google OAuth Client ID of the form `<number>-<suffix>.apps.googleusercontent.com`. The **Client Secret** field contained a manually entered string, not a confirmed Google-generated OAuth secret. **This is not a functioning OAuth integration.** Do not preserve or share the entered field values.
- Next action: rotate the exposed Google-generated client secret in Google Auth Platform; copy the actual OAuth Client ID from MOVA WEB; enter that ID and the newly generated secret in Supabase, enable Google sign-in and save; ensure test account is allowlisted. Leave `Skip nonce checks` and `Allow users without an email` OFF unless the approved design identifies a reason.
- Secrets, tokens and full screenshots that reveal them must not be included in this document, GitHub, issues or agent prompts.
- Autonomous Spec 002 worker log around 12:40 CET showed Q4 fixes nearly complete, **Jest 124/124** and **local pgTAP 71/71** on recent runs after Docker recovered; Q5 full verification and browser-only manual CR-9 check still pending. These are observed worker-reported results, not independently rerun here.
