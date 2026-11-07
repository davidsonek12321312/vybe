# MOVA design lab: UI audit and the "Afterglow" prototype

| | |
|---|---|
| Branch | `design/mova-ui-lab` (isolated worktree; nothing committed, pushed or merged) |
| Date | 2026-11-07 |
| Status | **Prototype for CEO review, not approved.** Shipping it needs the spec amendments in section 5. |
| Screens | Discover, event details, filter sheet and panel, empty, no-match, error, not-found, loading |
| Run it | `npm run web:sample -- --port 8099`, then open http://localhost:8099 |

## Summary

The current app works and is accessible, but it looks like an admin list:
no photographs, one narrow column on every screen, the date printed three
times per card, and violet-on-black, the default "AI template" palette. The
prototype keeps every Spec 002 behaviour and test, and changes how it looks
and reads:

- **Photo-led Discover:** the next event leads as a large spotlight, and the
  rest follow as fast-to-scan rows on phones and as photo tiles on tablets
  and desktops.
- **Real desktop layout:** a fixed side panel with the title and *every*
  filter visible (no modal sheets needed), plus a three-column grid where
  days flow side by side.
- **Event page:** a full-bleed cover with the details on a sheet over it,
  icon-tile facts, a highlighted "Coming alone?" card, and a sticky action
  bar. On desktop, a two-column page with a sticky booking panel.
- **Brand "Afterglow":** a warm night ground with a sunset-coral accent and a
  sea-glass signal for Solo-friendly. A new mark: the sun setting on the sea
  over Da Nang.
- **Web fixes from the audit:** one `h1` per page with `h2` days, cards as
  real `<a href>` links (Cmd-click and crawlable), focus rings for keyboard
  only, hover feedback, `theme-color` and `color-scheme`, tabular numbers.
- **Round 2:** shareable filtered views (`/?date=weekend&solo=1`), a
  virtualised phone list, a title bar on the event page, a fixed broken Back
  URL, and screen-reader fixes for web (filter chips now say whether they are
  on; decorative parts are silent).

## 0. How the required tools were used

| Tool | Use | Outcome |
|---|---|---|
| **playwright-cli** | Opened the running app at 390x844, 820x1180 and 1440x900; captured 11 baseline and 13 prototype screenshots; inspected the DOM (headings, links, meta, fonts); tested keyboard order, sheet focus and Escape, hover, focus-visible, client navigation and Back. | Evidence for every audit finding; caught two prototype bugs (full page reload on card click, slug leaking into the Discover URL) that were then fixed. |
| **web-design-guidelines** | Fetched the latest Vercel Web Interface Guidelines and checked the UI files and the rendered DOM against them. | Section 1.2 below. All fixable items are fixed in the prototype except URL-synced filters. |
| **design-taste-frontend** | Read-only security review first (section 6). Passed with caveats. Its kit targets static marketing pages, so its gate and dealers were **not** run on the app. Used: the live photo search (`photos.mjs search`/`fetch`) for licensed stand-in photographs, its hover/press timings (150/120/90 ms, 2 px lift, 1.03 photo zoom), its "no violet" rule, its copy-voice rules (facts over adjectives) and its rule against text on photos without a contrast plan. | 9 CC-licensed photographs with credits (`PHOTO_CREDITS.md`); motion tokens in `src/design/motion.ts`; the palette change. |
| **find-skills** | Not used: no missing capability came up. Icons are drawn with Views, so no icon library or skill was needed. | No installs. |

## A. Audit of the current app

Screenshots: `design-lab/screenshots/before/`.

### 1.1 UX problems found with Playwright

| # | Problem | Evidence | Severity |
|---|---|---|---|
| 1 | **No photography.** Sample events have no covers, so every card shows the same violet circles. Discover gives no reason to go to anything. | `discover-mobile-390.png` | High |
| 2 | **Date shown three times per card** (big "07", "Sat 7 Nov" under it, "Sat 7 Nov · 20:30" in the body) and again in the "TODAY" heading. The 148 px placeholder carries no information. | `discover-mobile-390.png` | High |
| 3 | **Low density, flat hierarchy.** About 1.3 events per phone screen. Venue, area, languages and price run together in one grey line of equal weight. | `discover-mobile-390-scrolled-2.png` | Medium |
| 4 | **Desktop is the phone column, centred.** A 688 px column in a 1440 px window (52 % empty); one card per screen; the filter sheet stretches 1440 px wide; the not-found button is 1392 px wide; the back arrow sits at x = 26, far from the content. | `discover-desktop-1440.png`, `filter-sheet-desktop-1440.png`, `not-available-desktop-1440.png`, `detail-desktop-1440.png` | High |
| 5 | **Generic header.** The `h1` reads "Discover"; the wordmark is 13 px; "Refresh" floats off the baseline. | `discover-mobile-390.png` | Medium |
| 6 | **Filter chips don't say they open a sheet** (no chevron); after a mouse click, the chip keeps a white focus ring. | `no-matches-desktop-1440.png` | Low |
| 7 | **Badge noise.** Three or four outline colours per card, plus "Sample event, not real" on every card in amber, the same colour as "Updated". | `discover-mobile-390-scrolled-2.png` | Medium |
| 8 | **Event page reads like a form.** Small placeholder, label/value box, "Coming alone?" below the fold, and Share as a full-width primary button. | `detail-mobile-390.png`, `detail-mobile-390-scrolled.png` | High |
| 9 | **Empty and error states** use an empty circle with no meaning. | `no-matches-desktop-1440.png` | Low |
| 10 | **Brand.** Violet accent on near-black is the most common AI-template look; there is no mark. | all | Medium |

Working well, and kept: logical keyboard order; the sheet is a modal that
moves focus inside and closes on Escape; 44 px targets; tested contrast
tokens; badges as text, never colour alone; the honest sample-data labels.

### 1.2 Web Interface Guidelines findings (code at `b5aa286`)

```text
## src/features/events/screens/DiscoverScreen.tsx
:119, :145 - every heading renders as <h1> (8 on Discover) → one h1, days as h2      FIXED
:146 - section title uppercased in JS (.toUpperCase) → textTransform in style          FIXED
:69  - card navigation via onPress + router.push, no href → <a href> (Cmd-click, SEO)  FIXED
:44  - filter state in useState only, not in the URL (REQ-028 C, optional)             FIXED (round 2)
:172 - maxWidth 720 column on every width → responsive layout                          FIXED

## src/features/events/components/EventCard.tsx
:39 - role="link" on a div without href                                                FIXED
:44 - no hover state (cursor only) → lift 2 px, border step, photo zoom 1.03           FIXED

## src/design/primitives.tsx
:67, :116 - focus ring on :focus (shows after mouse click) → :focus-visible only        FIXED

## src/app/_layout.tsx
- no <meta name="theme-color">; color-scheme "normal" on a dark UI                      FIXED

## src/features/events/components/FilterBar.tsx
:219 - sheet has no max width on desktop                                               FIXED (centred, 520 px; desktop uses the side panel)

## src/i18n/locales/en.ts
:107 - straight quotes in 'Try "Any date"' → curly quotes                               FIXED (round 2; VI too)

## Typography
- times and prices not tabular-nums                                                    FIXED
- headline widow ("Da / Nang") → non-breaking space in city names                      FIXED
```

## B. Two premium directions

Both are original to MOVA. Both are built from the same Da Nang references:
the beach at golden hour, the Dragon Bridge lit at night, and street-food
light. They are not copied from any product.

### Direction 1: "Afterglow" (dark, photo-led) — recommended

The moment after sunset on My Khe, when people gather. A warm night ground
(`#0E0C0B`) instead of blue-black, sunset coral (`#FF7A59`) for actions and
the brand, sea glass (`#5CD6C5`) as the signal for Solo-friendly, the
product's most important social-safety cue. Photographs lead. Type is the
system face (SF Pro, Roboto, system-ui) set heavy and tight for headlines.
Pill controls, 20 px cards, a sun-on-the-sea mark.

- **Why:** most browsing for "what's on tonight" happens in the evening,
  where photographs glow on dark. It meets the approved REQ-049 (premium
  dark), so it needs only a palette amendment, not a requirements change. It
  separates MOVA from the violet template look. Coral reads warm and human,
  close to how the founder describes the beach socials.
- **Tradeoffs:** dark UIs need careful contrast over photos (solved with a
  0.84 glass chip and a gradient scrim measured for AA over a white photo).
  Coral is close to the red "Cancelled" signal, so cancelled always shows a
  text badge plus strikethrough. Daytime events in bright sun read less
  "true" on dark.

### Direction 2: "Sand Daylight" (light, editorial)

Paper-white sand ground, deep ink text, sea-teal accent, an editorial serif
for event titles, generous white space, and magazine-style day spreads. It
feels like a city guide for newcomers.

- **Why:** very distinctive among event apps; approachable for first-time
  solo visitors; link previews and the shareable web page look clean;
  daytime and outdoor events shine.
- **Tradeoffs:** breaks the approved REQ-049 ("premium dark theme"), so it
  needs a requirements amendment. A display serif must cover Latin,
  Vietnamese **and** Cyrillic (few good ones do), and adds a font dependency
  and download. Glare at night when most browsing happens. More rework of
  the contrast tests.

**Recommendation: Afterglow.** It delivers the premium, photo-led feel within
the approved dark direction, with the smallest governance cost.

## C. What the prototype changes

All in this worktree, reusing the existing Expo / React Native components,
data layer, filters, i18n and tests. No new dependencies.

| Area | Files | Change |
|---|---|---|
| Tokens | `src/design/tokens.ts` | Afterglow palette, type scale (hero 40/44 to eyebrow 12), tabular numbers, breakpoints (720 / 1080), 21 contrast-tested text pairs |
| Primitives | `src/design/primitives.tsx`, `motion.ts`, `icons.tsx`, `layout.ts` | Pill chips with a chevron for sheet chips; dot badges; buttons with hover, press and icon; round `IconButton`; `headingProps(level)` for real h1/h2; View-drawn icons (chevrons, share, pin, close, the MOVA sun mark); a hydration-safe layout mode |
| Cards | `components/EventCard.tsx`, `EventPoster.tsx`, `EventBadges.tsx` | `spotlight`, `row` and `tile` layouts of one card; wrapped in Expo Router `Link` (an `<a href>` on web); hover lift and photo zoom; gradient scrim under text on photos; a designed placeholder for events without a cover |
| Discover | `screens/DiscoverScreen.tsx` | Phone: one scrolling page with a sticky filter bar (REQ-021), the spotlight, then day rows. Tablet: two-column tiles. Desktop: a fixed side panel with title, notice and all filters, and a three-column grid where days flow side by side. The spotlight event is never repeated below. |
| Filters | `components/FilterBar.tsx` | Phone and tablet: sheet with handle, title, close button, apply/reset (centred dialog on tablet). Desktop: `FilterPanel`, where every option is visible and applies at once |
| Details | `screens/EventDetailScreen.tsx` | Full-bleed cover; content sheet over it; calendar, pin, "Aa" and "₫" fact tiles; host row; sea-glass "Coming alone?" card; sticky bottom actions. Desktop: banners across the top, cover and story on the left, a sticky panel on the right with title, facts and actions (first in reading order); a "Back to events" control aligned to the content |
| States | `components/StateViews.tsx` | Sun-mark empty and error states with width-capped buttons; skeletons shaped like the screen (spotlight and rows, or the detail cover), with a slow pulse that stops under reduced motion; notice banners with a tag |
| Web shell | `src/app/_layout.tsx` | `theme-color` and `color-scheme` meta tags; keyboard-only focus rings; the detail screen draws its own back control |
| Sample data | `sample-covers.ts`, `assets/images/sample/` | 9 bundled stand-in photos for **sample events only** (`isSample`). Real events still show only covers from the project's Storage host (`mapping.ts` unchanged) |
| Copy | `src/i18n/locales/*.ts` | 6 new keys in EN, VI and RU (VI and RU need native-speaker review, as the existing files already note) |

### Verification

| Check | Result |
|---|---|
| `npx tsc --noEmit` | Pass |
| `npx expo lint --max-warnings 0` | Pass |
| `npx jest` | 177 / 177 pass (31 new: URL filter parsing and hostile input, the web URL sync, the phone list across 5 instants × 3 device time zones). Test edits: the 404 page's background is read from the token instead of the old hex; `EventCard` no longer takes `onPress` (the `Link` navigates); the `expo-router` mock gained `useNavigation`; the Language chip is queried as a button (it opens a sheet) |
| `npm run export:web`, `check:bundle`, `test:types` | Pass |
| `npm run ssr:smoke` | **All 6 pass** on the final code, in three runs. Note: two earlier runs (this branch, and the untouched `HEAD` built separately) failed 3 loader checks with `ERR_INVALID_URL`. They did not reproduce later, and I could not find the cause; since `HEAD` failed the same way, it was not the prototype. An earlier version of this note blamed Node 26; that was a guess and is withdrawn. Worth watching in CI |
| Playwright | Cards are `<a href="/events/…">` with their card surface (20 px radius, background, border) and a 2 px hover lift; one `h1`, days as `h2`; client-side navigation keeps the page; Back returns to `/`; focus ring on Tab, none after a click; the spotlight grows to fit its text (nothing clipped at 390 or 1080 px); no horizontal scroll and no target under 44 px at 320 px; no console errors |

### Independent review

A separate code-review agent reviewed the diff (verdict: request changes,
3 high, 6 medium, 2 low). Resolution:

| Finding | Resolution |
|---|---|
| High: `Link asChild` passed the card through a Slot that flattens a `style` function to `{}`, so cards lost their surface, hover and focus ring | Fixed: the style function moved into a `CardSurface` wrapper the Slot doesn't touch; verified in the browser |
| High: the spotlight's fixed aspect ratio clipped the price line and badges (including the sample label) at some widths and at large text | Fixed: the aspect ratio is now a minimum height and the text sets the height; verified nothing is clipped |
| High: phone rows showed neither category nor date | Fixed: rows show "Sun 8 Nov · 07:00" and "Sports & Fitness · Free · EN · RU" |
| Medium: no back control while the detail screen loads | Fixed |
| Medium: the desktop detail read the story before the facts (REQ-011 order) | Fixed: the panel (title, facts, actions) comes first in the DOM and is drawn on the right. The phone visual order stays a spec question (section 5) |
| Medium: white text over photos could fail AA at the top of the text block | Fixed: the scrim now sits behind the text block and reaches 92 % dark before the first line |
| Medium: grid cells keyed by index, so a failed cover could move to another event | Fixed: keyed by event id |
| Medium: Discover is no longer virtualised (NFR-003) | Open: section 5 and follow-up 6 |
| Medium: palette and layout changes need a spec amendment | Open: section 5 |
| Low: live rows dropped the city-time label; decorative tiles were read aloud; the phone back button came last in DOM order; "real events" lede in sample mode; a cancelled event could lead | All fixed |
| Open question: day sections could wrap on a sub-pixel rounding error | Fixed: whole-pixel cell widths |

### Round 2

| Change | Detail |
|---|---|
| Filters in the URL (REQ-028 C) | `src/features/events/filter-params.ts`. On web, every filter change is written to Discover's query string (`?date=weekend&solo=1&lang=en,ru&price=free&cat=…`), and opening such a link applies it, so a filtered view can be shared in Telegram or Zalo. The query is untrusted input: unknown keys and values are dropped, and lists are de-duplicated and kept in a fixed order (7 unit tests). Verified: chip → URL, URL → chips, card → event → Back keeps `?solo=1` |
| Back after a deep link | Opening `/events/x` directly and pressing Back used to land on `/?slug=x` (Discover sits under the event as Expo Router's anchor and gets its params). Discover now clears keys it doesn't own from its own route. First attempt used `router.setParams`, which changes the *focused* route and broke direct event links ("Event not available"); caught in the browser and fixed with `navigation.setParams` |
| Virtualised phone list (NFR-003) | The phone layout is a `FlatList` of flattened rows (header, sticky filter bar, spotlight, day headings, events), so hundreds of events stay smooth. Tablet and desktop keep the flowing grid |
| Event page title bar | On phones, a solid bar with the event title fades in as the cover scrolls away, so the back button no longer floats over text |
| Screen readers on web | react-native-web 0.21 ignores `accessibilityState` and `accessibilityElementsHidden`. Result in the **current app too**: filter chips never told screen readers whether they were on, and placeholder text was read aloud. Now `aria-checked` and `aria-hidden`, which also work on iOS and Android |
| Vietnamese and Russian | Checked at 390 and 1440 px: no overflow, diacritics and Cyrillic render cleanly in the heavy headline weight. Fixed: the calendar tile's month ("THÁNG 11") wrapped in Vietnamese; the tile now shows the weekday ("THỨ 7 / 14") |

### Round 3 (second independent review)

A second code-review agent reviewed round 2 (verdict: comment; no critical
or high findings). Resolution:

| Finding | Resolution |
|---|---|
| Medium: the URL was read once, so after browser Back/Forward plus "Clear all" the URL could describe a different view than the screen | Fixed: on web the query string is the single source of truth (filters are derived from it; changes write it). Verified with the exact Back → Clear all → Forward → Back sequence: URL and screen agree |
| Medium: sheet-opening chips were announced as checked checkboxes but open a dialog (WCAG 4.1.2); exposed on web once `aria-checked` worked | Fixed: those chips are buttons with `aria-haspopup="dialog"` and a name that carries the value ("Date: This weekend"), so the selection stays exposed (NFR-002). Date and Price options are radios in a named radio group; multi-choice options stay checkboxes |
| Medium: no test for the web URL sync | Fixed: 4 web tests (link applies filters, a change writes the URL, Clear all, deep-link params cleared) |
| Low: cleared, hash and router-internal params counted as foreign | Fixed, with tests |
| Low: the phone-list test relied on every row fitting the first render window at one moment | Fixed: the phone list now runs the same 5 instants × 3 time zones as the tablet test |
| Low: spec traceability (Task 17 names a `SectionList`; the URL contract is not in design.md) | Open: section 5 |
| Open question: scroll position after Back on web | Checked: kept (1200 → 1267 px), no fix needed |
| Open question: a shared event link with a query (`/events/x?date=today`) left filters on Discover | Fixed: params a deep link leaves on Discover are all cleared, filter keys included; verified Back lands on an unfiltered `/` |

## D. Screenshots

`design-lab/screenshots/before/` (current app) and
`design-lab/screenshots/after/` (prototype):

| Screen | Phone 390 | Tablet 820 | Desktop 1440 |
|---|---|---|---|
| Discover | `discover-mobile-390.png`, `-scrolled.png` | `discover-tablet-820.png` | `discover-desktop-1440.png`, `-scrolled.png` |
| Event details | `detail-mobile-390.png`, `-scrolled.png`, `detail-cancelled-mobile-390.png` | | `detail-desktop-1440.png` |
| Filters | `filter-sheet-mobile-390.png` | | (inline panel in the Discover shots) |
| States | `no-matches-mobile-390.png` | | `not-available-desktop-1440.png` |
| Keyboard focus | | | `keyboard-focus-desktop-1440.png` |
| Filtered link | `discover-filtered-url-mobile-390.png` (`/?date=weekend&solo=1&lang=ru`) | | |
| Vietnamese | `discover-mobile-390-vi.png`, `detail-mobile-390-vi.png` | | `discover-desktop-1440-vi.png` |
| Russian | `discover-mobile-390-ru.png`, `detail-mobile-390-ru.png` | | `discover-desktop-1440-ru.png` |

Not captured: the loading skeleton and the network error states. The sample
data source answers instantly, so they never show on screen. Jest tests
cover the error states (offline, service unavailable) but not the skeleton visuals.

## 5. Spec impact (what needs approval before this ships)

| Item | Spec | Needed |
|---|---|---|
| Afterglow palette replaces the A4 violet tokens | Design A4 / D21 | **Palette amendment (CEO).** REQ-049 itself (premium dark, AA contrast) is met |
| Desktop filters apply at once in a side panel; phone and tablet still apply on "Apply" | Design for REQ-021–027 | Design amendment, or keep sheets on desktop too |
| On phones the cover appears above the status banner. The cover is hidden from screen readers, so the *reading* order is still REQ-011's | REQ-011 | Confirm or amend the wording ("visual order") |
| Bundled stand-in photos for sample events | REQ-009 (sample labels unchanged) | Design note; replace with commissioned photos before launch |
| Phones use a virtualised list; tablet and desktop render all rows in one ScrollView (flowing grid) | NFR-003 (≤ 100 events) | Fine at the pilot scale; virtualise the grid too before a city has hundreds of events |
| Filters live in the URL on web (`date`, `solo`, `lang`, `price`, `cat`; canonical order; untrusted input, whitelisted) | REQ-028 (C); design and threat model | Record the URL contract and its threat model in design.md; confirm the parameter names |
| Phones use a `FlatList` of flattened rows | Task 17 names a `SectionList` | Update the task wording |
| Sheet-opening chips are buttons whose name carries the value; options are radios or checkboxes | NFR-002 ("chips expose selected state") | Confirm this meets NFR-002 |

## 6. Taste skill security review (read-only, before use)

**Verdict: passes with caveats; not malicious.** Reviewed `SKILL.md` in full,
and scanned all 1,631 files (about 3 MB of scripts) for process execution,
network calls, environment and credential access, file deletion and
obfuscation.

- **No** exfiltration, credential or home-directory reads (apart from finding
  Chrome), obfuscated payloads, or install commands.
- **Network:** read-only GETs to Wikimedia Commons, picsum.photos,
  jsdelivr/GitHub icon CDNs, Google Fonts and the Overpass map API. The user
  agent names the skill; no local data is sent. `consistency.mjs` fetches the
  links found on the page it checks.
- **Processes:** headless Chrome or Edge with a temporary profile, `taskkill`
  by PID, optional `ffmpeg`, and its own Node scripts. A detached watchdog
  deletes only the Chrome profile folders the gate passes it.
- **Why it was flagged (the caveats):**
  1. Its frontmatter registers a **Stop hook** that runs `gate.mjs` on every
     stop (600 s timeout). The hook can answer "block", which makes the agent
     keep working for up to about 3 rounds.
  2. The hook's search path includes
     `$CLAUDE_PROJECT_DIR/.claude/skills/design-taste-frontend/scripts/gate.mjs`
     and checks it **before** the home copy, so a cloned repository could
     plant a `gate.mjs` that runs automatically. Checked: this repository has
     none.
  3. It writes a `.taste-skill/` state folder into the project.
- **Decision:** used its guidance and the photo search (output kept in the
  session scratchpad); did **not** arm the gate. In this repo the hook finds
  no armed build and allows the stop. Consider removing the project-dir
  entries from the hook path, or uninstalling the skill, before working in
  untrusted repositories.

## 7. Follow-ups

1. CEO decision on Direction 1 versus 2, and on the palette amendment (D21).
2. Commission a photo shoot of real MOVA events (beach social, venues, hosts)
   to replace the stand-ins. Cover upload and resizing belong to the Hosts
   and Media specs.
3. **Pre-existing, found in round 2:** the server always renders English
   (`src/i18n/index.ts`: "Server rendering has no device locale"), so every
   Vietnamese or Russian visitor gets a hydration mismatch and a flash of
   English before the page re-renders. Needs a spec decision: read
   `Accept-Language` on the server, or put the locale in the URL.
4. **Pre-existing:** react-native-web ignores `accessibilityHint`, so hints
   such as "Opens outside the app" are not announced on web. Visible text
   covers Register; Open in Maps relies on the "↗" only. Consider
   `aria-describedby`.
5. City names come from data, so Vietnamese pages say "Da Nang", not
   "Đà Nẵng". Cities need localized names (multi-city model).
6. A display face covering Latin, Vietnamese and Cyrillic (for example
   Unbounded or Onest) could add brand character to headlines; it needs a
   dependency decision.
7. Virtualise the tablet and desktop grid before hundreds of events per city.
8. Native check on iOS and Android with Expo Go: the prototype was verified
   on web only.
