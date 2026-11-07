# MOVA

Mobile-first social discovery for real-world events, launching in Da Nang,
Vietnam. Built with Expo (SDK 58), React Native, TypeScript and Expo Router
for Android, iOS and web.

> **Status:** Spec 002 (Event Discovery, v0.4, approved by the CEO on
> 2026-11-06) is implemented on `feature/spec-002-event-discovery` and in
> review: Discover, event details, filters, sharing and registration links,
> on sample data or a local Supabase database. The hosted database is not
> migrated and nothing is deployed. There are no accounts yet.

## Prerequisites (Windows 11)

| Tool | Version | Install |
|---|---|---|
| Node.js | 22 LTS, 22.13 or later (see `.nvmrc`) | `winget install CoreyButler.NVMforWindows`, then `nvm install 22` and `nvm use 22` |
| npm | bundled with Node 22 | — |
| Git | current | `winget install Git.Git` |
| gitleaks | 8.30.1 | `winget install Gitleaks.Gitleaks`, or download `gitleaks_8.30.1_windows_x64.zip` from <https://github.com/gitleaks/gitleaks/releases> and add `gitleaks.exe` to `PATH` |
| Expo Go | for SDK 58 | Android: Play Store · iOS: App Store (see [Expo Go and SDK versions](#expo-go-and-sdk-versions)) |

Run all commands from the repository root in PowerShell or Git Bash.

## Set up

```powershell
git clone <repository-url> mova
cd mova
nvm use 22
npm ci
```

`npm ci` installs exactly what `package-lock.json` records. Do not use
`--force` or `--legacy-peer-deps`. npm may print an `install-scripts` notice
for `@parcel/watcher`; it is safe to ignore.

`npm ci` also enables the pre-commit secret-scan hook
(`git config core.hooksPath .githooks`). Install gitleaks first: without it,
commits are blocked. Never bypass the hook with `--no-verify`.

## Run the app

```powershell
npx expo start
```

- **Web:** press `w`.
- **Android:** open Expo Go and scan the QR code.
- **iPhone:** scan the QR code with the Camera app; it opens Expo Go.
- Phone and PC must be on the same Wi-Fi. If Windows Firewall asks, allow
  Node.js on private networks. On restricted networks use
  `npx expo start --tunnel`.

Native iOS builds need macOS and are out of scope for Spec 001; iPhone
testing uses Expo Go.

### Event data sources (Spec 002)

- **Sample (default, no setup):** fictional events, clearly labelled
  "Sample event, not real". Used when `EXPO_PUBLIC_MOVA_DATA_SOURCE` is unset.
  `npm run web:sample` starts the web app on sample events even if `.env.local`
  says `supabase`. If Discover shows "Events: 0" and then "You're offline", the
  app is set to a local database that is not running: start it (`npm run db:start`)
  or use `npm run web:sample`.
- **Local Supabase (real database, disposable):** needs Docker Desktop.

  ```powershell
  npm run db:start          # local Postgres + Data API; applies migrations and seed
  copy .env.example .env.local
  # in .env.local: EXPO_PUBLIC_MOVA_DATA_SOURCE=supabase,
  # EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321,
  # EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<"Publishable" key from `npx supabase status`>,
  # EXPO_PUBLIC_ALLOW_LOCAL_SUPABASE=true
  npx expo start --web
  ```

- **Hosted project `vozitoaqntixingqwuiw`:** publishable key only, in
  `.env.local` or the Vercel environment. Hosted migrations need CEO approval.

### Web server build (Vercel, server rendering)

```powershell
npx expo export -p web    # dist/client + dist/server
npm run ssr:smoke         # status codes and Open Graph tags via the Vercel adapter
npm run serve:web         # serve the server build locally
```

`vercel.json` and `api/index.js` are ready; deployments need CEO approval.

### Expo Go and SDK versions

This project uses Expo SDK 58. Store versions of Expo Go follow the newest
SDK. If Expo Go says the project is incompatible, update Expo Go from the
store, or install the SDK 58 build from <https://expo.dev/go> (Android).

## Verify changes (same as CI)

```powershell
npm run check
```

| Script | What it does |
|---|---|
| `npm run typegen` | Generates typed-route types (`expo-env.d.ts`, `.expo/types/`) |
| `npm run typecheck` | `tsc --noEmit` in strict mode |
| `npm run test:types` | Checks that an invalid route fails type-checking |
| `npm run lint` | ESLint: Expo config plus React Native accessibility rules; fails on any warning |
| `npm test` | Jest tests |
| `npm run export:web` | Web server build to `dist/client` and `dist/server` |
| `npm run check` | All of the above in order; stops at the first failure |
| `npm run scan:secrets` | gitleaks scan of the working tree |
| `npm run scan:secrets:history` | gitleaks scan of the git history |
| `npm run scan:secrets:staged` | gitleaks scan of staged changes |
| `npm run hooks:install` | Re-enables the pre-commit secret-scan hook |
| `npm run ssr:smoke` | Server-rendering checks on `dist/server` (part of `check`) |
| `npm run check:bundle` | Fails if a secret or service-role key is in `dist/` (part of `check`) |
| `npm run db:start` / `db:stop` / `db:reset` | Local Supabase stack (Docker) |
| `npm run db:test` | pgTAP tests: RLS, privileges, constraints |
| `npm run db:types` | Regenerates `src/lib/database.types.ts` from the local database |

The pre-commit hook runs the staged scan on every commit. Manual smoke and
accessibility checks are in `docs/MANUAL_SMOKE_CHECKLIST.md`.

## Continuous integration

`.github/workflows/ci.yml` runs on pull requests and pushes to `master`:

- **check:** `npm ci`, typegen, typecheck, lint, tests, web server build,
  SSR smoke test, bundle key scan, and `npm audit` (fails on high severity).
- **secrets:** gitleaks 8.30.1 (pinned, checksum-verified) on the working
  tree and the full git history.
- **database:** a disposable local Supabase stack: migrations, pgTAP
  access and constraint tests, and a generated-types drift check. It never
  connects to the hosted project.

CI never deploys, pushes or merges. The repository owner must protect `master`
and make all three jobs required status checks, so a failed scan or test
blocks the merge.

## Project layout

```
src/app/              Thin routes: / (Discover), /events/[slug], +not-found
src/features/events/  Event Discovery: data access, time/filters, hooks, UI, screens
src/design/           Premium dark tokens and primitives
src/config/           EXPO_PUBLIC_* configuration (publishable key only)
src/lib/              Supabase client and generated database types
src/i18n/             EN / VI / RU strings and t()
src/components/, src/constants/, src/hooks/, src/theme.ts
                      Spec 001 template helpers, unused since Spec 002 (cleanup candidate)
supabase/             Migrations, pgTAP tests, local seed, CLI config
api/index.js          Vercel function entry (Expo Router server output)
__tests__/            Jest tests
.kiro/specs/      Canonical specifications (SDD)
docs/             Product vision, SDD workflow, decisions (ADRs)
```

## Dependency notes

- `eslint-plugin-react-native-a11y` officially supports ESLint ≤ 8. A scoped
  `overrides` entry in `package.json` lets it run with ESLint 9
  (`docs/DECISIONS.md`, ADR-0005).
- The Expo SDK 58 upgrade removed the high `npm audit` advisories in
  `expo-router` 57 (ADR-0006). CI now fails on any high-severity advisory in
  production dependencies. **Never run `npm audit fix --force`**: it can
  downgrade Expo.
- Tests use React Native Testing Library 14, where `render()` is async:
  always `await render(...)`.

## How we work: Spec-Driven Development

Every change follows `docs/SDD_WORKFLOW.md`: requirements → approved →
design → approved → tasks → approved → implementation → tests → independent
review → PR. Start with `AGENTS.md`. Canonical specs live in `.kiro/specs/`;
never copy them to `/spec/`. Only the CEO marks a phase APPROVED.

## Security

- Never commit `.env` files, keys or credentials. `.gitignore` blocks common
  patterns and gitleaks checks every pull request.
- Never put a Supabase secret or service-role key in the app or in an
  `EXPO_PUBLIC_*` variable.
- Do not wipe `.git`, force-push or replace live infrastructure.
- If a secret leaks, rotate it first, then remove it from history.
