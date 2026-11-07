# Amendment v0.6: Spec 002 Event Discovery (visual redesign)

## Status: APPROVED
## Approved by: CEO
## Approved on: 2026-11-07

Recorded by Claude Code on the CEO's instruction. The CEO approved the Discover and Event
Detail redesign proposed in `docs/DISCOVER_REDESIGN_PROPOSAL.md` (branch `feature/spec-003-accounts`, PR #5) ("approved go all on",
2026-11-07) and chose "polished posters now, real photos later" as the image policy. The
reference implementation is the "Afterglow" prototype on `design/mova-ui-lab`
(`design-lab/DESIGN_REVIEW.md`). Where this amendment differs from requirements v0.4,
design v0.4 (A4, D21) or amendment v0.5, this amendment governs. Behaviour requirements
(REQ-001 to REQ-048, S1 to S34) are unchanged.

## A12. Visual direction (replaces design A4 and decision D21)

- Palette "Afterglow": warm night ground, sunset-coral accent, sea-glass signal for
  Solo-friendly. The token values live in `src/design/tokens.ts`; every text and background
  pair stays at 4.5:1 or better (the contrast test is kept).
- Discover is photo-led: a spotlight card for the next event, rows on phones, tiles on tablets
  and desktops, a side panel with every filter on desktop, a three-column grid.
- Event Detail has a full-bleed cover, icon-tile facts, a highlighted "Coming alone?" card, a
  sticky action bar, and a two-column page with a sticky booking panel on desktop.
- Web: one `h1` per page, days as `h2`, cards as real links, keyboard-only focus rings, hover
  feedback, `theme-color` and `color-scheme`; filters shareable in the URL.

## A13. Images

- Events without a cover show a designed poster (never an empty ground).
- Fictional sample events may use bundled stand-in photographs with their credits shown on the
  event page; they are replaced by real photography before any public launch. They are never
  remote URLs, and real events still show only covers from the project's Storage (REQ on cover
  hosts unchanged).
- Sample events stay labelled "Sample event, not real".

## A14. Acceptance in a real browser

A UI change is done only when the browser criteria in `docs/DISCOVER_REDESIGN_PROPOSAL.md` (branch `feature/spec-003-accounts`, PR #5)
section 4 pass (Playwright CLI at 390, 768, 1280 and 1920 px) and the screenshots are attached to
the pull request, in addition to Jest and CI.

## Not changed

No new requirements for data, RLS, security or hosted services. No deployment is authorized.
