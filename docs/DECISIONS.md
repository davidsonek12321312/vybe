# Architecture Decision Log

## ADR-0001: Source of truth for requirements
Status: PROPOSED (founder approval pending)
Decision: `.kiro/specs/NNN-feature/` is canonical; do not maintain `/spec/` copies. Kiro supports the native spec review/implementation interface, while Claude Code can read these Markdown files.
Reason: One governed source of truth, practical Kiro integration, avoids duplicate requirements.
Consequence: This is a path adaptation from the original April 2026 manual.

## ADR-0002: Preferred mobile stack
Status: PROPOSED
Decision: Expo + React Native + TypeScript + Expo Router; Supabase backend when the feature needs persistence, Telegram later.
Reason: Cross-platform and fast testing on Windows, familiar tooling.
Constraint: Official current SDK/Expo Go compatibility must be verified before selecting versions in an approved design.

## ADR-0003: First release
Status: PROPOSED
Decision: Pilot web RSVP flow ahead of native store releases for the planned 2026-12-05 event; native builds can progress in parallel.
Reason: Avoid app store approval as a launch dependency.

## ADR-0004: Safety and permissions
Status: PROPOSED
Decision: Event venue and any open fire remain unconfirmed until validated; participant privacy and authorization are release blockers.

## ADR-0005: ESLint 9 with the React Native a11y plugin via a scoped npm override
Status: ACCEPTED (CEO, 2026-11-06)
Context: `eslint-plugin-react-native-a11y` 3.5.1 (latest) declares peer `eslint ^3–^8`; Expo SDK 57's `eslint-config-expo` uses ESLint 9. A clean `npm ci` failed with ERESOLVE; the earlier local install relied on an undocumented `--legacy-peer-deps`/`--force`.
Decision: `package.json` `overrides`: `{ "eslint-plugin-react-native-a11y": { "eslint": "$eslint" } }`. The override is scoped to this one plugin. No `.npmrc` `legacy-peer-deps`.
Evidence (2026-11-06): clean `npm ci` exits 0; a probe file triggers `react-native-a11y/has-valid-accessibility-role` under ESLint 9.
Consequences: the plugin runs outside its declared support range; a broken rule would surface as a lint failure. Revisit when the plugin supports ESLint 9, or replace it by spec amendment. Known residual: `jest-watch-typeahead` (transitive, watch mode only) declares peer `jest ≤ 29` while Jest 30 is installed; `npm ci` and `npm test` are unaffected.

## ADR-0006: Accept npm audit high advisories in expo-router 57 until the SDK 58 upgrade
Status: RESOLVED (2026-11-06) by the Expo SDK 58 upgrade (Spec 001 amendment v0.4, commit 8053f9b). Previously CONDITIONALLY ACCEPTED (CEO, 2026-11-06) for development only.
Evidence: `npm ls decode-uri-component query-string` is empty; `npm audit --omit=dev --audit-level=high` exits 0 (21 moderate, 1 low remain); CI now fails on any new high-severity advisory.
Context: 3 high advisories: `decode-uri-component` ≤ 0.5.0 (GHSA-vcc3-ghjq-m6fr, GHSA-qr28-fpjm-wq7f) via `query-string` 7.1.3 via `expo-router` 57.0.30 — denial of service when decoding malformed percent-encoded URLs. npm's only fix is `expo-router` 58 (SDK 58, breaking). `npm audit fix --force` would install Expo 52. The patched `decode-uri-component` 0.5.1 is ESM-only, so forcing it under CommonJS `query-string` 7 is unsafe.
Decision: accept for Spec 001 (static shell, no server, no user data; worst case a crafted link hangs the visitor's own tab). Never run `npm audit fix --force`. CI runs `npm audit` as a non-blocking warning. Upgrade to Expo SDK 58 by spec amendment before event links are distributed publicly (planned SDK 58 spec amendment).
Note: since the lockfile is resolved without legacy peer handling, `npm audit --omit=dev` also lists Jest tooling (moderate) because `expo-router` declares an optional peer on `@testing-library/react-native`, which peers `jest`. Jest is never bundled into the app; runtime exposure is unchanged.

## ADR-0007: Secret scanning with a pinned gitleaks binary
Status: ACCEPTED (CEO, 2026-11-06)
Decision: gitleaks 8.30.1 with `.gitleaks.toml` (default rules, a Supabase `sb_secret_` rule, generated directories allowlisted). Local: `npm run scan:secrets` (working tree), `npm run scan:secrets:history` (history) and `npm run scan:secrets:staged` (staged changes, before each commit; no automatic hook). CI downloads the pinned release and verifies its SHA-256 against the published checksums instead of using `gitleaks/gitleaks-action@v2`.
Reason: gitleaks-action needs a paid license for organisation-owned repositories; a pinned, checksum-verified binary is reproducible and gives no third-party action access to the token. `gitleaks detect` is deprecated in favour of `dir`/`git`.
Evidence (2026-11-06): working-tree and history scans exit 0; a planted fake `sb_secret_` key is detected (exit 1).
Prevention (REQ-008c, requirements v0.3): versioned pre-commit hook `.githooks/pre-commit`, enabled by `npm install` and failing closed without gitleaks, plus the CI `secrets` job as a required status check on `master` (the repository owner enables branch protection).

## ADR-0008: Product brand MOVA
Status: ACCEPTED (CEO, 2026-11-06)
Decision: The product formerly called Vybe is MOVA. App name "MOVA"; Expo slug and URL scheme `mova`; npm package `mova`. The GitHub repository and local folder keep the name `vybe` for now; Git history is preserved (no rewrites).
Consequence: `vybe://` links stop working; none were published.

## ADR-0009: Web hosting on Vercel with Expo Router server rendering
Status: ACCEPTED (CEO, 2026-11-06) as direction; implemented by Spec 002 after its approval.
Decision: Host the web app on Vercel. Event pages use Expo Router server output (`web.output: "server"`) through `expo-server/adapter/vercel`, so each event URL is rendered on request with its own Open Graph metadata, and unknown paths return HTTP 404.
Constraint: Spec 001 keeps static output (REQ-004d) until Spec 002 amends it. No Vercel deployment without separate CEO approval.

## ADR-0010: Existing Supabase project and version-controlled migrations
Status: ACCEPTED (CEO, 2026-11-06)
Decision: Use the existing Supabase project `vozitoaqntixingqwuiw` (`https://vozitoaqntixingqwuiw.supabase.co`); do not create another project. Every schema change is an SQL migration in `supabase/migrations/`, reviewed by PR and tested against a local database in CI; the existing remote schema is captured first as a baseline migration. Clients and the web server use only the publishable key; secret and service-role keys never enter bundles, the repository or CI. Only the MOVA team publishes events at first.
Constraint: Hosted migrations (`supabase db push`) and remote migration-history writes need separate CEO approval.
