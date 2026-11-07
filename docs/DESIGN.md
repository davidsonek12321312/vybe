# MOVA DESIGN.md

Status: DRAFT v0.1 (2026-11-07). Not approved. Prepared by the MOVA worker for CEO review.
Nothing here changes code; implementation follows through a Kiro spec (see "Adoption").
Source of truth today: `src/design/tokens.ts` and `src/design/primitives.tsx` (Spec 002 REQ-049, design A4).
This file describes them and the gaps; if the two disagree, the code wins until this file is approved.

## 1. Identity

Premium, calm, night-time social. Dark first. Confident type, generous space, one accent colour,
real photography when we have it (never stock-looking filler). Voice: plain, warm, specific
("Sat 7 Nov · 20:15", not "Upcoming experience"). The same tokens drive web and React Native;
there is one set of values, no per-platform colours.

## 2. Tokens (current, from code)

| Token | Value | Use |
|---|---|---|
| bg / surface / raised | #0B0B10 / #15151D / #1F1F2A | page / card / control |
| border | #2E2E3A | hairlines |
| text / textSecondary | #F5F5F7 / #A8A8B3 | body / meta (both pass 4.5:1 on all three grounds) |
| accent / onAccent | #9D8CFF / #0B0B10 | brand, primary actions |
| success / warning / danger | #4ADE80 / #FBBF24 / #F87171 | status only, always with a text label |
| spacing | 4 8 12 16 24 32 | one scale, no ad-hoc values |
| radii | chip 12, card 16, sheet 24, pill 999 | |
| type | display 34/40, title 28/34, heading 22/28, subheading 17/22, body 15/22, caption 13/18, label 13/18 | bold only for headings and labels |
| touch target | 44 minimum | |

Rule: a new colour, size or radius is added to `tokens.ts` first, with its contrast pairs in `TEXT_PAIRS`.

## 3. Principles

1. **Time and place first.** Date, time and venue are the most prominent data on any event surface.
2. **State is never colour alone.** Every status has a text label (Cancelled, Happening now, Sample event).
3. **Every screen has loading, empty, error, offline states** in the active locale.
4. **Text grows.** Layouts survive 200% text and the longest string among EN, VI and RU.
5. **Motion is quiet and optional.** Press and hover feedback only; honour reduced motion; no autoplay.
6. **One accent.** Accent marks the next action or the selected state, never decoration.

## 4. Components (existing primitives and their required states)

Each interactive component defines: default, hover (web), pressed, focus-visible, disabled, selected.
Chip is a checkbox (checked state); Button is a button or link; EventCard is a link.
- Focus-visible: 2px #F5F5F7 ring, 2px offset (`focusRing` in primitives; added 2026-11-07 after the web default measured rgb(16,16,16) on the dark ground).
- Hover (web): lift one surface step (surface to raised); not yet implemented, proposed.
- Cards: no caption under images; poster gradient is used when no photo exists.

## 5. Web and native parity

| Topic | Web | React Native |
|---|---|---|
| Layout | single column up to 720 px, centred; checked at 375, 768, 1280 (no horizontal overflow, 2026-11-07) | full width with safe-area insets |
| Focus | focus ring as above | screen-reader focus only |
| Headings | one h1 per page; sections h2 (gap: Discover currently renders 8 h1) | accessibilityRole header with level |
| Browser chrome | add `color-scheme: dark` and `theme-color` #0B0B10 (gap) | status bar light |
| Lists | virtualised past about 50 rows | FlatList or SectionList |

## 6. Known gaps found by the tooling (measured, 2026-11-07)

| Gap | Evidence | Status |
|---|---|---|
| Focus ring invisible on dark | computed outline rgb(16,16,16), auto 1px | Fixed on spec-002 branch |
| 8 h1 elements on Discover | Playwright snapshot | Open, needs section header level |
| no `color-scheme`/`theme-color` meta | page metas | Open |
| no hover state on web controls | primitives.tsx pressed-only styles | Open |

## 7. Adoption (proposal)

1. CEO approves this DRAFT (or edits it).
2. A small amendment to Spec 002 (or the first UI of Spec 003) lists the open gaps as requirements; no redesign of screens.
3. UI review rule: Playwright CLI checks at 375, 768 and 1280 plus the focus and heading probes above on each UI PR; Web Design Guidelines audit only on changed files; Taste Skill only for an explicit visual review request of marketing pages, never per task.

## 8. Not decided here

Logo and wordmark, brand photography, final font family (system fonts today), light theme (not planned), illustration style.
