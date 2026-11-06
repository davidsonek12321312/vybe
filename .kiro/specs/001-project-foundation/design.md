# Spec 001: Project Foundation — Design
## Status: APPROVED
## Version: 0.3
## Approved by: CEO
## Approved on: 2026-11-06

Requirements reference: `requirements.md` v0.3 — Status: APPROVED by CEO on 2026-11-06

---

## 0. Reconciliation with the implementation (v0.2)

Implementation of Spec 001 started before this design and `tasks.md` were
approved, a recorded deviation from `docs/SDD_WORKFLOW.md`. On 2026-11-06 the
CEO authorized finalizing Spec 001. This revision records what was built and
the remediation applied so the design can be reviewed for approval. It does
not claim approval.

| Area | v0.1 design | Implemented (v0.2) | See |
|---|---|---|---|
| Test runner | Vitest preferred | Jest (`jest-expo`), 11 smoke tests | §6.4 |
| Typed routes | `expo customize` before `tsc` in CI | `npm run typegen` before `typecheck` in CI and `npm run check` | §4.2 |
| Routes | `/`, `+not-found` | Same; Expo Router's built-in `/_sitemap` disabled | §4.1 |
| ESLint a11y plugin | Installed | Installed; scoped npm override for ESLint 9 | §6.3, ADR-0005 |
| `.gitignore` | Listed patterns | Listed patterns plus credential files | §9.1 |
| Secret scanning | `gitleaks detect`; gitleaks-action | gitleaks 8.30.1 `dir`/`git` with `.gitleaks.toml`; pinned binary in CI | §9.2, ADR-0007 |
| CI | PRs to `main`, Node 22 | PRs and pushes to `master`; Node from `.nvmrc` (22) | §11 |
| Template code | Remove extra screens | Unused template components, `scripts/reset-project.js` and unused images removed; `themed-text`, `themed-view`, `use-theme`, `use-color-scheme`, `constants/theme` kept because screens use them | §3 |
| Dependency audit | Block on high | 3 high advisories accepted until SDK 58 | §12, ADR-0006 |
| Expo Go | SDK 57 supported | SDK 58 is now npm `latest`; device check pending | §1.2 |

### 0.1 Alignment with requirements v0.3 (design v0.3)

On 2026-11-06 the CEO also authorized the code changes below before design and
tasks ratification, overriding `.claude/rules/spec-workflow.md` for this
change only.

| Requirement (v0.3) | Design response | See |
|---|---|---|
| REQ-003, Scenario 4 | `npm run test:types` type-checks `type-tests/invalid-route.tsx` through `tsconfig.typetest.json` and passes only if it fails with TS2322; the fixture is excluded from `npm run typecheck`. Runs after `typegen` in `npm run check` and CI | §4.2, §6.1 |
| REQ-003, Scenario 3 | Static hosts must serve `+not-found.html` (HTTP 404) for unmatched paths, not rewrite every path to `index.html` | §6.5 |
| REQ-004(b), NFR-005 | `expo lint --max-warnings 0`: any warning, including a11y rules, fails lint | §6.3 |
| REQ-005 | Home shows a localized "coming soon" line; `SampleDataBadge` and `home.sampleDataBadge` removed; sample/live disclosure belongs to Spec 002 | §7 |
| REQ-006 | `createTranslator()`: active locale, else English; i18n-js implicit fallback off; missing key reported once with `console.warn` when `__DEV__`; `setLocale()` for the test harness; no UI switcher | §5.2 |
| REQ-002, REQ-007, NFR-004, NFR-005 | `docs/MANUAL_SMOKE_CHECKLIST.md` covers web, Android, iPhone, keyboard, contrast, labels, screen readers and 44 pt/dp targets; unverified items are recorded as such | §8, §10 |
| REQ-008(a) | `.gitignore` per §9.1, including `!.env.example` | §9.1 |
| REQ-008(b) | `npm run scan:secrets:staged` (staged) plus `npm run scan:secrets` and `scan:secrets:history` (tree, history) | §9.2 |
| REQ-008(c) | Selected gate: versioned pre-commit hook `.githooks/pre-commit`, enabled by `npm install` and failing closed without gitleaks, **plus** the CI `secrets` job as a required status check on `master` (branch protection set by the repository owner) | §9.2, §11 |

---

## 1. SDK and Dependency Version Matrix

This section resolves NFR-003 and Open Question 1 from requirements.

### 1.1 Version Resolution (verified against official Expo documentation, November 2026)

From the official [Expo Router Introduction](https://docs.expo.dev/router/introduction):

> "During the SDK 58 transition period, `create-expo-app@latest` without the
> `--template` flag creates an SDK 57 project. **If you plan to use Expo Go on
> a physical device, use an SDK 57 project.** Otherwise, use
> `--template default@sdk-58` to create an SDK 58 project."

Because REQ-001 / NFR-003 require Expo Go for initial physical-device testing,
**this project targets Expo SDK 57**.

| Package | Pinned version | Source |
|---------|---------------|--------|
| Expo SDK | 57 | Official Expo docs — Expo Go compatible |
| React Native | per SDK 57 (determined by `npx create-expo-app`) | Expo SDK 57 release notes |
| Expo Router | bundled with SDK 57 default template | `create-expo-app --template default` |
| expo-localization | `npx expo install expo-localization` | Expo SDK 57 compatible |
| i18n-js | `npx expo install i18n-js` | Official Expo localization guide |
| Node.js | **22 LTS** ("Jod") | Node.js 22 is Active LTS until April 2027; Node 26 entered LTS 2026-10-28 but is too new — Node 22 is the stable choice for tooling compatibility with SDK 57 |
| npm | bundled with Node 22 LTS | — |

**Node version rationale:** Node.js 26 entered Active LTS on 2026-10-28, but
the SDK 53 migration notes explicitly warn "Node 18 reached EOL, Node 20+
recommended for SDK 53." For SDK 57, the safe and well-tested range is
Node 20+. Node 22 LTS is the longest-supported currently-stable version and is
the recommended choice. Node 26 LTS may be adopted in a future spec revision
once ecosystem tooling compatibility is confirmed.

The exact peer-dependency versions will be set by `create-expo-app` with the
SDK 57 template and locked in `package-lock.json`. No manual version pinning
beyond what `npx expo install` resolves is required for foundation packages.

### 1.2 Expo Go Compatibility Confirmation

Expo Go on both Android (Play Store) and iOS (App Store) supports SDK 57 as of
the time of writing. The implementation task (T-002) must re-verify this
against the current Expo Go release before scaffolding. If Expo Go has advanced
past SDK 57 by implementation time, update this design via a spec amendment
before proceeding.

> **v0.2 status (2026-11-06):** npm `latest` for `expo` is 58.0.23 (SDK 58).
> Store Expo Go compatibility with this SDK 57 project has **not** been
> verified on a device. Check Android and iOS before approving this design; if
> store Expo Go no longer opens SDK 57, raise the SDK 58 amendment (ADR-0006).

---

## 2. Architecture Overview

The Spec 001 foundation is a **static application shell** with no backend,
no auth, and no data persistence. It establishes:

- A scaffolded Expo Router (SDK 57) project using the official default template
- Typed navigation (exactly two routes)
- Localization infrastructure (EN / VI / RU)
- Quality tooling (TypeScript strict, ESLint, Jest smoke tests, web export)
- Security hygiene (`.gitignore`, secret scanning)
- Governance artefacts (already in repo, confirmed present)

```
Developer machine (Windows 11, Node 22 LTS)
  │
  ├── npx expo start          → Metro bundler → Expo Go (Android / iOS physical)
  ├── npx expo start --web    → Metro → browser (web dev)
  └── npx expo export -p web  → static output/  → deployable web artefact
```

No server, no API, no database exists in this spec.

---

## 3. Folder Structure

```
vybe/
├── .github/
│   └── pull_request_template.md          (existing)
├── .kiro/
│   ├── specs/001-project-foundation/     (existing)
│   └── steering/                         (existing)
├── docs/                                 (existing governance docs)
├── src/
│   └── app/                              ← Expo Router file-based routes
│       ├── _layout.tsx                   ← Root Stack layout + i18n provider
│       ├── index.tsx                     ← Route "/"  (home shell screen)
│       └── +not-found.tsx                ← Not-found fallback (Expo Router convention)
├── src/
│   ├── i18n/
│   │   ├── index.ts                      ← i18n setup; exports t() and useLocale()
│   │   └── locales/
│   │       ├── en.ts                     ← English strings
│   │       ├── vi.ts                     ← Vietnamese strings (keys must match en.ts)
│   │       └── ru.ts                     ← Russian strings (keys must match en.ts)
│   └── components/
│       └── SampleDataBadge.tsx           ← "Preview / Sample Data" visual indicator
├── __tests__/
│   ├── navigation.test.tsx               ← Smoke: routes render, not-found renders
│   └── i18n.test.ts                      ← Smoke: all locale keys present
├── app.json                              ← Expo config; experiments.typedRoutes: true
├── tsconfig.json                         ← strict: true; includes expo-env.d.ts
├── .eslintrc.js (or eslint.config.js)    ← ESLint + react-native-a11y rules
├── .gitignore                            ← includes .env*, expo-env.d.ts, secrets
├── package.json                          ← scripts: typecheck, lint, test, export
└── README.md                             ← Setup + verification commands
```

> **Note on `src/app/` vs `app/`:** Expo Router supports a top-level `src`
> directory. The SDK 57 default template may place `app/` at root. The
> implementation task must use whichever layout the chosen template produces and
> not rename directories without updating `app.json`'s `expo.scheme` and any
> `tsconfig.json` path aliases accordingly. This design uses `src/app/` as the
> canonical reference; the task note below covers the template-vs-convention
> check.

---

## 4. Route Design (REQ-003)

### 4.1 Route inventory

| File | Route path | Purpose |
|------|-----------|---------|
| `src/app/index.tsx` | `/` | Home shell screen |
| `src/app/+not-found.tsx` | any unrecognised path | Not-found fallback |

No other routes exist in Spec 001. Expo Router's built-in `/_sitemap` page is
disabled with the `expo-router` config plugin option `{ "sitemap": false }`, so
the web export contains only `/` and `/+not-found` (verified 2026-11-06). The
generated route types still list `/_sitemap`; this has no runtime effect.

### 4.2 Typed routes configuration

`app.json`:
```json
{
  "expo": {
    "experiments": {
      "typedRoutes": true
    }
  }
}
```

`npm run typegen` (`expo customize tsconfig.json`) generates `expo-env.d.ts`
and `.expo/types/router.d.ts` without modifying `tsconfig.json`; both are
gitignored. Without them `tsc` still passes but does not enforce typed routes,
so CI and `npm run check` run `typegen` before `typecheck`. Verified
2026-11-06 on a clean copy: an invalid `href` then fails with TS2322.

### 4.3 Root layout

`src/app/_layout.tsx` wraps the Stack navigator, initialises the i18n layer,
and is the single location where locale is resolved. No other setup is needed
for the foundation shell.

### 4.4 Not-found screen

`src/app/+not-found.tsx` must:
- Render a user-facing message (via i18n)
- Provide a link navigating back to `/`
- Meet WCAG 2.1 AA contrast and accessible label requirements

---

## 5. Localization Design (REQ-006)

### 5.1 Library selection

**Selected: `expo-localization` + `i18n-js`**

Rationale:
- `expo-localization` is the official Expo SDK library for reading device locale
  (synchronous `getLocales()` API)
- `i18n-js` is the library used in the current official Expo localization guide
- Both are compatible with SDK 57 and Expo Go
- The combination is well-documented, lightweight, and sufficient for a
  foundation shell with minimal strings
- `react-i18next` is the more powerful option for a production multi-locale app
  and can replace `i18n-js` in a later spec with no architectural change, since
  the i18n layer is fully encapsulated behind `src/i18n/index.ts`

### 5.2 i18n module design


`src/i18n/index.ts` exports:
```typescript
export function t(key: TranslationKeys): string   // active locale, else English
export function setLocale(locale: Locale): void   // test harness; no UI switcher
export function getActiveLocale(): Locale
export function createTranslator(dictionaries, initialLocale, reportMissing?): Translator
export function createDevReporter(): MissingKeyReporter
```

The module (v0.3, REQ-006):
1. Reads the device language with `getLocales()` from `expo-localization`;
   anything other than `en`, `vi` or `ru` starts in English.
2. Builds one `I18n` instance with the three locale files and **disables**
   i18n-js implicit fallback.
3. For each key, uses the active locale when it has a non-empty string;
   otherwise returns the English string (deterministic fallback) and calls the
   missing-key reporter.
4. The default reporter calls `console.warn` once per locale and key, only
   when `__DEV__` is true.

### 5.3 Locale file structure

Each locale file exports a flat `Record<string, string>`. All three files must
contain the same keys. The EN file is the source of truth; VI and RU files that
are missing keys will fall back to EN (flagged in the smoke test).

Minimum keys required for the foundation shell:

| Key | EN value |
|-----|---------|
| `app.name` | `"Vybe"` |
| `home.title` | `"Welcome to Vybe"` |
| `home.tagline` | `"Discover what's happening in Da Nang"` |
| `home.comingSoon` | `"Events in Da Nang are coming soon."` |
| `notFound.title` | `"Page not found"` |
| `notFound.body` | `"This page doesn't exist."` |
| `notFound.goHome` | `"Go to home"` |

VI and RU translations for these keys will be provided in the implementation.

### 5.4 app.json locale declaration

```json
{
  "expo": {
    "plugins": [
      [
        "expo-localization",
        {
          "supportedLocales": {
            "ios": ["en", "vi", "ru"],
            "android": ["en", "vi", "ru"]
          }
        }
      ]
    ]
  }
}
```

---

## 6. Quality Tooling Design (REQ-004)

### 6.1 npm scripts (package.json)

| Script | Command | Exit behaviour |
|--------|---------|---------------|
| `typegen` | `expo customize tsconfig.json` | Generates typed-route types |
| `typecheck` | `tsc --noEmit` | 0 = pass, non-zero = type errors |
| `test:types` | `node scripts/check-typed-routes.mjs` | 0 = the invalid-route fixture fails with TS2322 as required |
| `lint` | `expo lint --max-warnings 0` | 0 = no errors or warnings; non-zero otherwise |
| `test` | `jest --passWithNoTests` | 0 = pass, non-zero = failing tests |
| `export:web` | `npx expo export -p web` | 0 = success, non-zero = build failure |
| `check` | `npm run typegen && npm run typecheck && npm run test:types && npm run lint && npm run test && npm run export:web` | Composite gate |
| `scan:secrets` | `gitleaks dir . --config .gitleaks.toml --redact --no-banner` | 0 = clean, non-zero = secrets found |
| `scan:secrets:history` | `gitleaks git . --config .gitleaks.toml --redact --no-banner` | 0 = clean, non-zero = secrets found |
| `scan:secrets:staged` | `gitleaks git . --pre-commit --staged --config .gitleaks.toml --redact --no-banner` | 0 = clean, non-zero = secrets in staged changes (REQ-008b) |
| `prepare`, `hooks:install` | `node scripts/install-git-hooks.mjs` | Sets `core.hooksPath` to `.githooks` (skipped in CI) |

### 6.2 TypeScript configuration

`tsconfig.json` minimum required settings:
```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true
  },
  "include": [
    "**/*.ts",
    "**/*.tsx",
    ".expo/types/**/*.d.ts",
    "expo-env.d.ts"
  ]
}
```

The `includes` entry for `expo-env.d.ts` is required for typed routes. It is
added by `npx expo customize tsconfig.json` and must not be removed.

### 6.3 ESLint configuration

Base: `eslint-config-expo` (bundled with the SDK 57 default template)

Additional rule set: `eslint-plugin-react-native-a11y` (NFR-005)

Key rules enabled:
- `react-native-a11y/has-accessibility-props` — warn on missing accessibility props
- `react-native-a11y/has-valid-accessibility-role` — warn on invalid roles
- `@typescript-eslint/no-explicit-any` — error
- `@typescript-eslint/explicit-function-return-type` — off (too noisy at foundation stage)

**Peer dependency (ADR-0005):** the plugin's latest release (3.5.1) declares
ESLint ≤ 8. A scoped `package.json` override
(`{ "eslint-plugin-react-native-a11y": { "eslint": "$eslint" } }`) lets a
clean `npm ci` succeed without `--legacy-peer-deps`. The a11y rules are set to
`warn`, and `npm run lint` runs with `--max-warnings 0`, so any finding fails
the lint step (REQ-004b).

### 6.4 Test framework

**Selected: Jest** (`jest-expo` preset) with `@testing-library/react-native`.

Rationale: v0.1 preferred Vitest but required using the template's runner
when one is available. The SDK 57 setup supports Jest through `jest-expo`, so
Vitest was not added. `jest.setup.js` mocks `expo-localization`; tests run once
with `jest --passWithNoTests` (no watch mode).

**Smoke tests required:**

| Test file | What it verifies | Req |
|-----------|-----------------|-----|
| `navigation.test.tsx` | Home screen renders without crash | REQ-002 |
| `navigation.test.tsx` | Not-found screen renders without crash | REQ-003 |
| `navigation.test.tsx` | Not-found screen includes a link to `/` | REQ-003 |
| `i18n.test.ts` | All EN keys present in VI locale | REQ-006 |
| `i18n.test.ts` | All EN keys present in RU locale | REQ-006 |
| `i18n.test.ts` | `t('home.sampleDataBadge')` returns a non-empty string | REQ-005 |

No coverage percentage threshold is set (per requirements decision).

### 6.5 Web export

`npx expo export -p web` produces a static output in `dist/` (or `web-build/`
depending on Expo version). The CI check verifies the directory is non-empty
post-build. The output directory is gitignored.

**Static hosting (requirements v0.3, Scenario 3):** the export contains
`index.html` and `+not-found.html`. A host must serve `+not-found.html` with
HTTP 404 for unmatched paths and must not rewrite every path to `index.html`.
Production deployment remains out of scope for Spec 001.

---

## 7. No Event Data in the Foundation (REQ-005, requirements v0.3)

While Spec 001 is the only implemented product specification, the home shell
shows no event listings (sample or live), attendance counts, RSVP controls,
booking links or confirmed-event claims. It shows a localized "coming soon"
line (`home.comingSoon`). The v0.1 `SampleDataBadge` component and its
`home.sampleDataBadge` key were removed; disclosure of sample versus live data
is specified in Spec 002. A smoke test asserts the coming-soon text and the
absence of RSVP, booking, sample and attendance text.

---

## 8. Accessibility Design (REQ-007, NFR-005)

WCAG 2.1 AA gates applied to the foundation shell:

| Element | Requirement | Implementation |
|---------|------------|---------------|
| App name / title text | 4.5:1 contrast ratio (AA text) | Design tokens defined in a `theme.ts` constants file |
| "Go to home" link on not-found screen | Accessible label, minimum 44×44pt touch target | `accessibilityLabel` prop; `minHeight: 44`, `minWidth: 44` style |
| Coming-soon message | Readable contrast; plain text | `ThemedText` with the `text` token (contrast documented in `src/theme.ts`) |
| Navigation header | Provided by Expo Router Stack; inherits platform defaults | No custom override needed |

ESLint a11y rules (NFR-005) run in CI with `--max-warnings 0`. Manual checks
(keyboard, contrast, accessible labels, screen readers, 44 pt/dp touch
targets) are listed in `docs/MANUAL_SMOKE_CHECKLIST.md`, where unverified
devices are recorded. Lint passing is not presented as WCAG certification.

A colour theme is not fully designed in Spec 001 — only the minimum contrast
tokens needed to pass AA for the text actually rendered in the shell are
required. A full design system is out of scope.

---

## 9. Secret and Credential Protection (REQ-008)

### 9.1 .gitignore entries

The following patterns are in `.gitignore` before the first commit (v0.2
adds credential files beyond the v0.1 list):

```
# Environment and secrets
.env
.env.*
!.env.example
*.pem
*.key
*.p8
*.p12
*.jks
*.keystore
*.pfx
*.ppk
*.mobileprovision
google-services.json
GoogleService-Info.plist
credentials.json
*-credentials.json
service-account*.json
id_rsa*
id_ed25519*
gitleaks-report*.json
.claude/settings.local.json

# Expo generated (not secrets, but excluded to keep repo clean)
expo-env.d.ts
.expo/
dist/
web-build/
node_modules/
```

### 9.2 Secret scanning tool

**Selected: `gitleaks`** (open-source, Apache 2.0)

Rationale:
- Available as a standalone binary for Windows (no Python/Node dependency)
- Actively maintained, widely adopted
- Works against the local filesystem without requiring git history (`--no-git`)
  for developer pre-commit use
- Can be integrated into GitHub Actions without additional cost

**Version:** gitleaks 8.30.1 (pinned). `gitleaks detect` is deprecated; use
`gitleaks dir` (working tree) and `gitleaks git` (history).

**Installation for Windows 11:** `winget install Gitleaks.Gitleaks`, or the
release zip `gitleaks_8.30.1_windows_x64.zip` with `gitleaks.exe` on `PATH`
(documented in `README.md`).

**Configuration:** `.gitleaks.toml` extends the default rule set, adds a rule
for Supabase secret keys (`sb_secret_…`) and allowlists generated directories
(`node_modules/`, `dist/`, `web-build/`, `.expo/`, `.git/`).

**Local use:** `npm run scan:secrets` (working tree), `npm run
scan:secrets:history` (history) and `npm run scan:secrets:staged` (staged
changes).

**Preventive gate (REQ-008c), two layers:**
1. `.githooks/pre-commit` runs `gitleaks git . --pre-commit --staged` and
   blocks the commit on any finding. `npm install` enables it through the
   `prepare` script (`git config core.hooksPath .githooks`; skipped in CI), and
   `npm run hooks:install` re-enables it. It fails closed when gitleaks is not
   installed. `.gitattributes` keeps the hook's LF line endings.
2. The CI `secrets` job is a required status check on `master`, so a leak that
   bypasses the hook (`--no-verify`, hook not installed) still blocks the
   merge. Branch protection is a GitHub setting that the repository owner must
   enable; it cannot be committed.

**GitHub Actions integration (ADR-0007):** the `secrets` job downloads the
pinned release, verifies its SHA-256 against the published checksums and runs
both scans with full history (`fetch-depth: 0`). `gitleaks/gitleaks-action` is
not used: it needs a paid license for organisation-owned repositories and
would give a third-party action access to the token.

---

## 10. iOS Testing Strategy (NFR-004, Open Question 2)

Native iOS builds require macOS and Xcode and **cannot be produced on Windows 11**.

**Strategy:** GitHub Actions macOS runner for CI iOS build validation.

| Stage | Tool | Platform | Who triggers |
|-------|------|----------|-------------|
| iOS Expo Go dev | Expo Go on physical device | iOS (any) | Developer scans QR from `npx expo start` |
| iOS Expo Go CI | Not applicable — Expo Go cannot be automated via CI | — | — |
| iOS build validation | EAS Build (cloud) OR GitHub Actions `macos-latest` runner with `npx expo export` | CI | PR gate |
| iOS native smoke | Deferred to when native iOS build is required (post-Spec 001) | — | — |

**Spec 001 iOS gate:** The CI pipeline runs `npx expo export -p web` (not a
native iOS build) as the export check. This validates Metro bundling and the
full dependency graph without requiring macOS locally.

**Physical iOS testing:** Any contributor with an iPhone can run
`npx expo start` on their machine and scan the QR code with Expo Go (SDK 57).
This is the expected manual iOS smoke-test path during Spec 001 development.

No EAS account or paid CI tier is required for Spec 001. If a GitHub Actions
macOS runner is used, the `macos-latest` runner is available on the free tier
for public repos and paid tier for private repos. The founder should confirm
repo visibility before implementation begins.

---

## 11. GitHub Actions CI (REQ-004, REQ-008)

`.github/workflows/ci.yml` runs on pull requests and pushes to `master` (the
repository's default branch; v0.1 said `main`) and on manual dispatch, with
`permissions: contents: read`:

| Job | Steps |
|---|---|
| `check` | `actions/checkout@v7`; `actions/setup-node@v7` with `node-version-file: .nvmrc` (22) and npm cache; `npm ci`; `npm run typegen`; `typecheck`; `test:types`; `lint`; `test`; `export:web`; non-blocking `npm audit --omit=dev --audit-level=high` (ADR-0006) |
| `secrets` | `actions/checkout@v7` with `fetch-depth: 0`; pinned, checksum-verified gitleaks 8.30.1; `gitleaks dir` and `gitleaks git` with `.gitleaks.toml` |

**Required status checks (REQ-008c):** the repository owner protects `master`
and requires `Typecheck, lint, test, web export` and `Secret scan (gitleaks)`
before merging.

The CI does not deploy, push, or merge. It is read-only from the repository's
perspective.

---

## 12. Threat Model (REQ-008, security steering rule)

### 12.1 Assets

| Asset | Sensitivity | Location |
|-------|------------|---------|
| Source code | Internal | git repository |
| `package-lock.json` | Low | git repository |
| Developer credentials (npm tokens, GitHub PAT) | High | Developer's local env only; never in repo |
| Expo account credentials | Medium | Developer's local env; never in repo |
| CI `GITHUB_TOKEN` | Medium | GitHub Actions secret; read-only for CI |

No user data, no PII, no database credentials exist in Spec 001.

### 12.2 Actors and trust boundaries

| Actor | Trust level | Access |
|-------|------------|--------|
| Developer | Trusted | Read/write local workspace and repo |
| CI runner (GitHub Actions) | Trusted, isolated | Read repo; write build artefacts only |
| End-user browser | Untrusted | Receives static HTML/JS/CSS from web export |
| Third-party npm packages | Partially trusted | Execute in developer and CI environments |

**Primary trust boundary:** developer workstation ↔ git remote. Credentials
must never cross this boundary via committed files.

### 12.3 Threats and mitigations

| Threat | Likelihood | Impact | Mitigation | Residual risk |
|--------|-----------|--------|-----------|--------------|
| Developer accidentally commits `.env` or key file | Medium | High | `.gitignore` patterns; pre-commit gitleaks hook; required `secrets` check on PRs | Low |
| Pre-commit hook bypassed (`--no-verify`) or not installed | Medium | High | Required CI `secrets` status check blocks the merge | Low once branch protection is on |
| Malicious or typosquatted npm package | Low | High | Use `npm ci` (lockfile-only installs); review new deps before adding | Low |
| Dependency with known CVE | Medium | Medium | `npm audit --omit=dev --audit-level=high` runs in CI as a warning; accepted advisories are recorded as ADRs | Medium |
| Static web export served with wrong MIME types | Low | Low | Deployable output is pure static — no server config in Spec 001 | Low |
| CI secrets exfiltrated via a supply-chain attack | Very low | High | `GITHUB_TOKEN` has minimal read-only scope; no other secrets in CI | Very low |

### 12.4 Residual risks accepted for Spec 001

- No automated CVE blocking in CI (deferred; `npm audit` is informational only
  in this spec)
- No subresource integrity hashes for the web export (no CDN in Spec 001)
- iOS build not validated in CI (physical device testing via Expo Go only)
- Three high-severity npm advisories in `decode-uri-component` via
  `expo-router` 57 (client-side denial of service on malformed URLs), accepted
  until the SDK 58 amendment (ADR-0006)

These are recorded and will be revisited when Supabase / auth / production
deployment are introduced in later specs.

---

## 13. Open Decisions Resolved

| Open Question (from requirements) | Resolution |
|-----------------------------------|-----------|
| Expo SDK / Expo Go compatibility | **SDK 57** — verified against official Expo Router docs (Oct 2026): "If you plan to use Expo Go on a physical device, use an SDK 57 project." |
| iOS smoke testing strategy | Physical Expo Go on iOS (any contributor iPhone); CI uses web export only for Spec 001 |
| i18n library selection | `expo-localization` + `i18n-js` per official Expo localization guide; encapsulated behind `src/i18n/index.ts` for future migration |
| Secret scanning tool | `gitleaks` — open-source, Windows-compatible binary; pinned 8.30.1 with checksum verification in CI (ADR-0007) |

---

## 14. Out of Scope (restated from requirements)

Everything in the requirements out-of-scope list applies equally here.
Additionally:
- No EAS Build configuration (EAS is optional for Spec 001)
- No Expo Updates / OTA push
- No custom splash screen or icon (template defaults are acceptable)
- No app store metadata

---

## Change Log

| Version | Date | Author | Summary |
|---------|------|--------|---------|
| 0.1 | 2026-11-06 | Kiro (lead engineer) | Initial DRAFT; verified SDK 57 + Expo Go from official docs; resolved all four open questions; defined architecture, folder structure, routes, i18n, tooling, security, iOS strategy, threat model |
| 0.2 | 2026-11-06 | Claude Code (CEO-authorized remediation) | Reconciled with implementation (§0): Jest, typegen, `/_sitemap` disabled, ESLint override (ADR-0005), extended `.gitignore`, gitleaks 8.30.1 config and pinned CI binary (ADR-0007), CI on `master`, accepted audit advisories (ADR-0006), Expo Go/SDK 58 check pending. Still DRAFT |
| 0.3 | 2026-11-06 | Claude Code (CEO-authorized) | Aligned with approved requirements v0.3 (§0.1): no event data and coming-soon line (REQ-005), deterministic English fallback with development reporting (REQ-006), invalid-route type test (REQ-003), lint fails on warnings (REQ-004b), pre-commit hook plus required PR check (REQ-008c), manual checklist (NFR-005), static-host not-found note. Still DRAFT, pending CEO ratification |
| 0.3 (approval) | 2026-11-06 | Claude Code (recording only) | CEO approval of design v0.3 recorded on CEO instruction |

---

**This document is APPROVED (v0.3, CEO, 2026-11-06). Any change requires a
spec amendment with a new version and fresh CEO approval.**
