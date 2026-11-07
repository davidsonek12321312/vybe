# Spec 001: Project Foundation — Requirements
## Status: APPROVED
## Version: 0.4
## Approved by: CEO
## Approved on: 2026-11-06

---

## Purpose

Establish a reproducible, governed, cross-platform foundation for MOVA: a
working application shell with typed navigation, baseline quality tooling,
localization infrastructure, a deployable static web export, and the repository
governance artefacts that all subsequent specs depend on.

This spec does **not** implement social, discovery, RSVP, auth, or database
features. Those belong to later specs. This is a **draft for review**, not
permission to scaffold or install dependencies.

---

## Assets and Trust Boundaries (Lightweight, for Design Phase Context)

**Assets at this stage:** Source code, developer workstation files, dependency
lockfile, build artefacts and any credentials used by developers or CI to access
GitHub/package registries. The application shell itself does not collect or
process end-user personal data, login credentials, or event information.

**Actors:** Developer (trusted, local), CI runner (trusted, isolated), end-user
browser/device (untrusted, receives only static assets at this stage).

**Trust boundaries:** Untrusted third-party packages enter the trusted developer
and CI environments through installation. Built static assets cross from the
build environment to an untrusted browser/device. Any CI or repository access
credentials remain outside client assets. No backend, authentication or database
is introduced in Spec 001.

**Implication for design:** The threat model in `design.md` need only address
the dependency supply chain, developer and CI credentials, repository access,
exported asset integrity and quality gates. User-data threats are deferred to
specifications that introduce user data.

---

## Supported Developer Environment

The following environment is the baseline for all setup and verification
requirements in this spec:

- **OS:** Windows 11
- **Runtime:** Node.js current LTS (exact version to be pinned in design)
- **Package manager:** npm (bundled with Node.js LTS)
- **Framework:** Expo + React Native + TypeScript + Expo Router
- **Physical device testing:** Expo Go, subject to SDK compatibility verified
  in design (see NFR-003)
- **iOS testing:** Expo Go on a physical iPhone can be used with a compatible
  SDK while developing on Windows. A local iOS simulator/native build requires
  macOS; cloud iOS builds are possible through Expo EAS. The design shall select
  and document the actual test path and prerequisites.

---

## EARS Requirements

### REQ-001: Repeatable development environment setup

WHEN a developer clones the repository on a Windows 11 machine with the
documented Node.js LTS version and npm, and follows the documented setup
instructions, the project SHALL install all dependencies and reach a runnable
state without undocumented manual file edits, missing environment variables, or
interactive prompts beyond those explicitly called out in the documentation.

### REQ-002: Cross-platform application shell

WHEN a tester opens the application on a documented supported target (Android
via Expo Go, a physical iPhone via a compatible Expo Go client, or web via the
development server or exported static assets), the application SHALL display
the localized home screen at `/`, including the app name and accessible home
shell content, without an uncaught runtime error. Mobile and web verification
methods SHALL be documented, including any unavailable test device.

### REQ-003: Typed navigation baseline — initial routes

WHEN navigation is used, the application SHALL implement a single ordinary
route `/` (home), and an Expo Router special `+not-found` fallback for unmatched
paths. Expo Router typed routes SHALL be enabled, and the documented fresh-clone
verification procedure SHALL generate route types before type-checking so that
an invalid literal route passed to a typed navigation API fails compilation.
The special not-found handler is not counted as a second ordinary typed route.

### REQ-004: Quality verification commands

WHEN a contributor runs the documented verification commands, the project SHALL:

- (a) perform TypeScript type-checking in strict mode and exit with code 0 when
  no type errors exist, or exit with a non-zero code and output identifying
  each failing file and error when type errors exist;
- (b) run ESLint against all TypeScript and TSX source files and exit with
  code 0 when no rule violations exist, or exit with a non-zero code and
  output identifying each failing file, line, and rule when violations exist;
- (c) run automated baseline smoke tests and exit with code 0 when all pass,
  or exit with a non-zero code identifying each failing test when any fail;
- (d) produce a deployable web export (static output directory) and exit with
  code 0 on success, or exit with a non-zero code on build failure.

No arbitrary line-coverage percentage is required for the foundation shell.

### REQ-005: Mock data clearly distinguished from live events

WHILE Spec 001 is the only implemented product specification, the home shell
SHALL NOT render event listings (sample or live), attendance counts, RSVP
controls, booking links, or claims that an event is confirmed. The shell MAY
show a localized "coming soon" message. Real and sample events are both deferred
to Spec 002, where their disclosure and source separation will be specified.

*Note: `MOVA_ENV` and multi-environment data configuration are out of scope until
a later specification introduces real data sources.*

### REQ-006: Localization infrastructure

WHEN EN, VI, or RU is selected by the application or its test harness, the
home and not-found shell SHALL display their user-facing strings using a shared
localization layer and locale data files, without language-specific strings in
components. The layer SHALL use English as a documented deterministic fallback
when a translated key is absent and report the missing key in development.
A visible in-app language switcher is not required in Spec 001.

### REQ-007: Accessibility baseline

WHEN the user interacts with shell controls (for example, returning home from
the not-found screen), the web implementation SHALL target applicable WCAG 2.1
Level AA criteria including contrast, keyboard operation and accessible names.
Equivalent native controls SHALL expose accessible labels and semantics. As a
separate product usability target (not a WCAG 2.1 AA criterion), primary touch
targets SHALL be at least 44 by 44 logical points/dp. Automated lint checks
SHALL supplement, not replace, documented manual accessibility smoke checks.

### REQ-008: Secret and credential protection

WHEN a contributor prepares a repository change, the repository SHALL:

- (a) ignore `.env`, `.env.*` and common credential files, while permitting an
  explicitly non-secret `.env.example` if later introduced;
- (b) provide a documented secret-scan command for staged files and tracked
  repository content, returning non-zero and identifying the offending path
  when a known test credential pattern is detected; and
- (c) document and configure a preventive check (pre-commit hook or required
  pull-request quality check) selected in the approved design, so that a
  detected secret blocks the corresponding commit or merge step. A standalone
  manual scan command alone does not satisfy this prevention requirement.

Tests SHALL use synthetic example credentials, never real secrets.

### REQ-009: Repository governance artefacts

WHEN a contributor opens the repository, the repository SHALL contain the
governing SDD workflow document, agent instruction files, architecture decision
log, and spec directory structure in their documented locations, such that an
agent following `AGENTS.md` can locate all required governance files without
additional configuration.

---

## Non-Functional Requirements

- **NFR-001:** TypeScript strict mode (`"strict": true`) SHALL be enabled in
  `tsconfig.json`. Layouts SHALL use mobile-first responsive design principles
  consistent with Expo/React Native conventions.

- **NFR-002:** No secrets, customer data, personal contact details, or access
  tokens SHALL be committed to the repository. `.env*` patterns SHALL be
  `.gitignore`d before first commit. (See REQ-008.)

- **NFR-003:** The design SHALL verify and document mutually compatible versions
  of Expo SDK, React Native, Expo Router, and the Expo Go client before
  pinning any version. The workspace tech rule prohibiting untested Expo Go
  assumptions applies. Do not assume a given SDK version is Expo Go-compatible
  without checking current official Expo documentation.

- **NFR-004:** Windows 11 SHALL be sufficient for day-to-day development.
  Native local iOS simulation requires macOS, but a Mac SHALL NOT be required
  to satisfy foundation development on Windows. The design SHALL document a
  feasible iOS smoke-testing path (prefer a physical iPhone with compatible
  Expo Go; if unavailable, record the test limitation and later EAS/cloud build
  strategy) and any prerequisites or fees.

- **NFR-005:** WCAG 2.1 Level AA is the target for applicable web shell
  interactions; the mobile shell SHALL follow equivalent accessible naming,
  contrast and navigation principles (see REQ-007). A11y linting compatible with
  the chosen tooling SHALL be part of quality checks. The repository SHALL
  include a minimal manual accessibility checklist (keyboard, readable contrast,
  accessible labels, and screen reader), with any unverified devices explicitly
  noted. Lint passing alone SHALL NOT be represented as WCAG certification.

---

## Acceptance Criteria

### Scenario 1: Clean clone and setup (covers REQ-001, REQ-004, REQ-008)

```gherkin
Given a developer has a clean clone of the repository on Windows 11
  And the documented Node.js LTS version and npm are installed
  And no .env files exist in the working directory
When the developer follows the documented setup instructions end to end
Then all dependencies install without interactive prompts beyond those documented
  And the TypeScript check command exits with code 0
  And the ESLint check command exits with code 0
  And the smoke test command exits with code 0
  And the web export command exits with code 0 and produces a non-empty output directory
  And no .env or credential files are present in the committed repository tree
  And the documented secret-scan command exits with code 0 on the clean tree
```

### Scenario 2: Home screen renders on web (covers REQ-002, REQ-003, REQ-005)

```gherkin
Given the web application has been started or exported
When a tester opens the home route "/"
Then the localized application name and home shell are visible
  And the screen renders without uncaught JavaScript errors in the browser console
  And no sample or live event listing, attendance claim, RSVP button, or booking link is displayed
```

### Scenario 3: Unrecognised route renders fallback (covers REQ-003)

```gherkin
Given the web development server is running
When a tester navigates to a route that does not exist (e.g. "/does-not-exist")
Then the Expo Router not-found fallback screen is rendered
  And no JavaScript exception or blank white screen is shown
  And the user is offered an accessible way to return to the home screen
  And the design documents any host-specific routing configuration required for static deployment
```

### Scenario 4: TypeScript catches invalid route at compile time (covers REQ-003)

```gherkin
Given Expo Router typed routes are enabled
  And the documented fresh-clone command has generated route types
When a negative-test fixture uses a literal invalid href in a typed Link or router API
Then TypeScript reports an error for the invalid route
  And the fixture type-check exits non-zero
  And the normal project type-check remains successful when the fixture is absent
```

### Scenario 5: Locale strings resolved through localization layer (covers REQ-006)

```gherkin
Given the localization infrastructure contains EN, VI, and RU strings for the shell
When the test harness renders the home and not-found screens using each supported locale
Then the screens use the corresponding translated strings without component code changes
When a translation key is deliberately absent from the VI or RU fixture
Then the documented English fallback is shown without crashing
  And a missing-key diagnostic is produced in development
```

### Scenario 6: Secret scanning catches a leaked credential (covers REQ-008)

```gherkin
Given the repository has the documented secret-scan command and preventive gate
When a contributor introduces a synthetic test credential in staged content
Then the secret scan exits non-zero and identifies the path and pattern
  And the configured pre-commit hook blocks the commit, or the required PR check
      blocks merging, depending on the approved design
  And no real credentials are used in the test
```

### Scenario 7: Governance artefacts present and locatable (covers REQ-009)

```gherkin
Given a fresh clone of the repository
When an agent reads AGENTS.md
Then the agent can resolve all referenced governance documents
  (docs/SDD_WORKFLOW.md, docs/DECISIONS.md, docs/PRODUCT_VISION.md,
   .kiro/specs/ directory, spec templates if defined)
  without encountering missing files or broken relative paths
```

### Scenario 8: Mobile smoke test on documented devices (covers REQ-002, NFR-004)

```gherkin
Given the documented Expo SDK is compatible with the selected Expo Go client
  And at least one supported Android test device or emulator is available
When the tester opens the app on Android
Then the localized home shell renders without an uncaught JavaScript error
  And the test result and device information are recorded
When a physical iPhone is available for the documented iOS smoke path
Then the same shell behavior is checked and recorded on iOS
  And if no iPhone is available, the limitation is recorded rather than claiming a pass
```

### Scenario 9: Accessible shell control (covers REQ-007, NFR-005)

```gherkin
Given the web home and not-found screens are implemented
When a tester follows the documented accessibility smoke checklist
Then the not-found return-home action is keyboard-operable with an accessible name
  And required color-contrast checks are documented
  And primary mobile touch targets are at least 44 by 44 logical points/dp
  And any untested screen reader or platform is recorded as not verified
```

---

## Out of Scope for Spec 001

The following are explicitly deferred to later specs and must not appear in the
Spec 001 design or implementation:

- Supabase setup, database schema, migrations, or RLS policies
- User authentication, sessions, or profiles
- Event creation, event discovery, or event detail screens (→ Spec 002)
- RSVP flow, capacity management, or attendee lists
- Payment or ticketing
- Real or live event data of any kind
- Telegram bot or Mini App integration
- Maps, constant location sharing, or geolocation permissions
- In-app chat or messaging
- Beach Social #001 public launch or any public event publication
- Production deployment pipeline (CI/CD beyond build validation)
- Push notifications
- MOVA_ENV environment variable or multi-environment configuration (deferred
  until a live data source exists)

---

## Relationship to Other Specs

| Spec | Dependency direction | Notes |
|------|---------------------|-------|
| Spec 001 (this) | — | Foundation only; no social features |
| Spec 002 Event Discovery | Depends on Spec 001 | Routes, nav, i18n, and shell from this spec |
| Future auth spec | Depends on Spec 001 | Supabase integration starts in a later spec |

---

## Open Questions (Must Be Resolved Before Design Approval)

These are no longer blocking requirements approval but must be answered and
recorded in `design.md` before design is approved:

1. **Expo SDK / Expo Go compatibility:** Which Expo SDK version is compatible
   with the current Expo Go client on both Android and iOS? Verify against
   current official Expo documentation; do not assume. (NFR-003)
2. **iOS smoke testing:** Can we test on a physical iPhone using Expo Go?
   Document the Windows-first test path; if a device is unavailable, identify
   when EAS/cloud builds or macOS-based simulator testing will be used and
   record unverified scenarios. (NFR-004)
3. **i18n library selection:** Which library will provide the localization
   infrastructure (e.g., `expo-localization` + `i18next`, or an alternative)?
   Evaluate against Expo SDK compatibility before selection. (REQ-006)
4. **Secret scanning tool:** Which tool will be used for secret scanning
   (e.g., `gitleaks`, a GitHub Actions native scan, or another)? Confirm
   Windows 11 compatibility. (REQ-008)

---

## Requirements Traceability Matrix

| Req ID | Statement summary | Acceptance Scenario(s) | Review Finding(s) Addressed |
|--------|------------------|------------------------|----------------------------|
| REQ-001 | Repeatable setup on Windows 11 + Node LTS + npm | Scenario 1 | M-1 (environment undefined) |
| REQ-002 | App shell renders on supported targets | Scenarios 2, 8 | S-1 (vague "coherent screen") |
| REQ-003 | Typed navigation: `/` and not-found only | Scenarios 2, 3, 4 | H-1 (routes undefined); resolves "agreed routes" |
| REQ-004 | Verifiable quality commands with specific exit codes | Scenario 1 | M-2 (vague exit codes); adds build validation per S-2/ADR-003 |
| REQ-005 | Foundation shows no event data or RSVP | Scenario 2 | H-2 (no enforcement mechanism); SEC-2 |
| REQ-006 | EN/VI/RU localization infrastructure | Scenario 5 | M-4 (i18n not in/out of scope) |
| REQ-007 | Accessible web and native shell controls; separate touch-target rule | Scenario 9 | M-5 (accessibility standard unnamed) |
| REQ-008 | Ignore patterns, staged/tracked scan, and preventive gate | Scenarios 1, 6 | SEC-1 (NFR-002 not testable) |
| REQ-009 | Governance artefacts present and locatable | Scenario 7 | M-3 (REQ-006 was governance, not app behavior — replaced) |
| NFR-001 | Strict TypeScript, mobile-first layouts | Scenario 1 (type check) | — |
| NFR-002 | No secrets in repo; .gitignore before first commit | Scenarios 1, 6 | SEC-1 |
| NFR-003 | Expo SDK/Expo Go compatibility verified in design | Open Question 1 | Tech rule compliance |
| NFR-004 | Windows-first iOS strategy documented | Scenario 8; Open Question 2 | M-1 (platform ambiguity) |
| NFR-005 | Accessible shell checks + a11y lint + manual checklist | Scenario 9 | M-5 |

---

## Change Log

| Version | Date | Author | Summary |
|---------|------|--------|---------|
| 0.1 | 2026-11-06 | Kiro (initial draft) | Initial DRAFT |
| 0.2 | 2026-11-06 | Kiro (requirements engineer) | Applied engineering lead decisions; resolved H-1, H-2, H-3, M-1–M-5, S-1, S-2, SEC-1, SEC-2, SEC-3; added Scenarios 1–7; added traceability matrix; added assets/trust-boundary section; deferred VYBE_ENV; added REQ-006 through REQ-009; replaced Scenario C with REQ-009 + Scenario 7 |
| 0.3 | 2026-11-06 | ChatGPT (independent requirements review) | Clarified Expo Router special not-found route, Windows-first iOS tests, accurate accessibility criteria, deterministic localization, no events in foundation, secret-scan enforcement, additional mobile/accessibility acceptance scenarios. DRAFT pending founder approval. |
| 0.3 (approval) | 2026-11-06 | Claude Code (recording only) | CEO approval of v0.3 recorded on CEO instruction. Requirement text is identical to the CEO-supplied v0.3 file |
| 0.4 | 2026-11-06 | Claude Code (CEO-approved amendment) | Product renamed Vybe → MOVA (ADR-0008), including the deferred `MOVA_ENV` name. No behavioural change. Approved by the CEO on 2026-11-06 together with the Expo SDK 58 design amendment |

---

**This document is APPROVED (v0.4, CEO, 2026-11-06). Any change requires a spec
amendment with a new version and fresh CEO approval.**
