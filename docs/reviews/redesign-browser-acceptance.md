# Redesign browser acceptance (Spec 002 amendment v0.6, A14)

Date: 2026-11-07. Run: Playwright CLI 0.1.23 (Chromium) against `npm run web:sample` (sample events,
dev server), at 390x844, 768x1024, 1280x800 and 1920x1080. Screenshots in `redesign-acceptance/`.

| # | Criterion | Result |
|---|---|---|
| 1 | Content loads: cards visible, no skeleton left, counter equals cards | Pass at all 4 viewports (8 cards, `Events: 8`, 0 skeletons) |
| 2 | Console clean | Pass for errors (0). Warnings: the expo-router `initialRouteName` deprecation (fixed by `anchor`, re-check after reload) and a dev-only `useNativeDriver` notice on web |
| 3 | Layout: no horizontal scroll; columns; card width | Pass: no horizontal scroll. Smallest card 358 px (390), 360 (768), 268 (1280, below the 280 target, accepted), 381 (1920) |
| 4 | Images: designed image or poster; none broken | Pass: 9 images, 0 broken. `alt` attribute not rendered by expo-image on web; the images sit inside `aria-hidden` wrappers (decorative), so no accessibility impact |
| 5 | Hierarchy: one visible h1, days as h2 | Pass: 1 h1, 6 to 11 h2. On an event page Discover's h1 is hidden and `aria-hidden` underneath, so one visible h1 |
| 6 | Navigation: open card, Back, deep link, unknown slug | Pass: card 3 opens `/events/sketching-dragon-bridge`; Back returns to `/` with 8 cards; deep link `/events/beach-social-001` loads; unknown slug shows "Event not available" |
| 7 | Filters: Solo-friendly matches counter | Pass: `/?solo=1` shows `Events: 3` and 3 cards |
| 8 | Keyboard and focus | Not re-run on the redesign in this pass (the lab review covers focus-visible; Jest covers roles). Open |
| 9 | Touch targets 44x44 | Pass: 0 interactive elements under 44 px at 390 |
| 10 | Offline / error states | Not re-run in the browser (Jest covers them). Open |
| 11 | Locale (EN, VI, RU) | Covered by the lab screenshots (`design-lab/screenshots/after/*-vi`, `*-ru`); not re-run |
| 12 | CEO visual verdict | Pending: screenshots attached |

Known and still open: SSR always renders English, so a VI or RU visitor can see a hydration mismatch
(found in the design-lab review); `npm run ssr:smoke` fails 3 loader checks on this Windows machine
(Node 26) on the commit before the redesign as well, while CI on Node 22 passes it.

## Re-run after amendment v0.7 (reference look), 2026-11-07

Palette (black, white pills, red signal), five-icon tab bar, italic upper-case titles, red live badge.
Screenshots: `redesign-acceptance/v07-final-390|768|1280|1920.png`, `v07-tabbar-390.png`, `v07b-titles-390.png`.
At all four viewports: 8 cards, `Events: 8`, 0 skeletons, no horizontal scroll, 1 h1, 0 console errors,
0 broken images, 0 touch targets under 44 px; `theme-color` #0B0B0C. Tab bar at 390 px: 5 tabs, Discover
selected, the other four `aria-disabled`. Jest 180/180, typecheck and lint clean.
Still open: keyboard and focus pass and offline pass on the new look; the VI and RU tab labels need a
native-speaker review; icons are a first drawing and will be refined.
