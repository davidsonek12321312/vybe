# Discover and Event Detail redesign (PROPOSAL, awaiting CEO approval)

Status: DRAFT 2026-11-07. Nothing here is implemented. It needs CEO approval before any visual change
(and an amendment to Spec 002 REQ-049 / design A4, which define the current look).

## 1. What was measured (Playwright CLI, real browser)

| Finding | Evidence |
|---|---|
| Empty Discover on the CEO's machine is configuration, not a code bug | `.env.local` sets `EXPO_PUBLIC_MOVA_DATA_SOURCE=supabase` with the local URL `127.0.0.1:54321`; Docker and local Supabase are not running; 4 requests get `ERR_CONNECTION_REFUSED`; skeletons show for about 10 s (retries), then "You're offline". The server-rendered HTML also says `Events: 0`. |
| Sample mode works | 8 events at 1280 and 390 px, 0 console errors, a card opens the detail page (local screenshots: `.omc/shots/sample-desktop.png`, `sample-mobile.png`, `detail-desktop.png`) |
| Hydration warning not reproduced | No hydration message on three dev servers (supabase mode and sample mode). Candidates: server vs browser time zone and clock in time labels (CR-9 in the Spec 002 review), browser extensions that edit the DOM, and the `unstable_settings.initialRouteName` deprecation (a real warning, harmless). Next step: get the exact warning text and the browser. |
| Visual quality gap | Cover is a flat gradient with two circles; no photography; content is a 688 px column with about 300 px of empty space on each side at 1280; no top navigation or brand; no social signal; five identical grey filter chips. Functional, not premium. |

Shipped: `npm run web:sample` (always sample data) and a README note for the "Events: 0, then offline" symptom.

## 2. Direction (fits the vision: social discovery for newcomers, trust, "what to expect")

**Discover**
1. Top bar: MOVA wordmark and city switcher (Da Nang); later the profile avatar. Sticky on desktop; a bottom tab bar on mobile (Discover, later Map, My events, Profile).
2. Hero strip: "Tonight in Da Nang", a featured event as a full-width photo card with gradient scrim, title, time, venue and one primary action.
3. Quick filters as a horizontal strip with icons: Tonight, This weekend, Free, Solo-friendly, plus "Filters" for the rest. Selected state is an accent fill.
4. Event cards: 16:9 photo (category duotone poster if none), date badge top left, status badges top right (Happening now, Cancelled), title, venue and area, price and language pills, a "good for solo" marker. Desktop: 2 to 3 column grid (max width 1120); mobile: 1 column.
5. Keep the day grouping (Today, Tomorrow, weekday).
6. Restyled loading (skeleton cards in the same grid), empty, offline and error states with the same copy.

**Event Detail**
1. Full-bleed cover photo; on desktop two columns: content left, sticky action panel right.
2. Title, date and time block with "Add to calendar" and the city-time note, venue with a Maps link.
3. "What to expect" and "Solo-friendly" as cards with icons; organiser line; the changes banner stays on top.
4. Primary action: Register (existing registration link) and Share; secondary: Directions.
5. No invented social proof. "Who is going" appears only after Spec 004 RSVP and the Spec 003 privacy settings exist; until then no fake counts or avatars.

**Images** are the biggest visual lever and need real Da Nang photography. CEO to choose:
(a) the CEO or hosts supply photos (best; via `cover_image_url` now, the media module later);
(b) licensed stock with a credit line in the footer (licence review needed);
(c) interim: polished category duotone posters with an icon and pattern, no captions.
Sample events stay labelled "Sample event, not real" whatever images they use.

## 3. Implementation plan (existing React Native, Expo and Expo Router; no new dependency)

| Step | Work | Files | Size |
|---|---|---|---|
| R1 | Layout shell: top bar and bottom tabs, responsive max width and grid via `useWindowDimensions` | `src/app/_layout.tsx`, new `src/design/AppShell.tsx` | S |
| R2 | New `EventCard` (photo, overlays, pills) and `FeaturedEventCard`; keep the accessible-name logic | `components/EventCard.tsx`, `EventPoster.tsx` | M |
| R3 | Discover: hero strip, quick filter strip, grid list, skeleton grid | `DiscoverScreen.tsx`, `FilterBar.tsx` | M |
| R4 | Event Detail: cover, two-column desktop, sticky action panel, calendar link (ICS) | `EventDetailScreen.tsx` | M |
| R5 | Image handling with `expo-image` (already used): placeholder, aspect ratio, error fallback to the poster | `EventPoster.tsx` | S |
| R6 | Sample data: bundled cover images once they exist (no remote hot-linking) | `sample-events.ts`, `assets/` | S |
| R7 | Browser acceptance run, fixes, screenshots in the PR | section 4 | S |

Order: R1, R2, R3, R5, R4, R6, R7; about 3 to 5 working sessions. Tokens stay in `tokens.ts`; the DESIGN.md gaps (focus, heading levels, hover, color-scheme) are folded in. A Spec 002 amendment lists R1 to R7 as requirements first.

## 4. Browser acceptance criteria (Playwright CLI on `npm run web:sample`; screenshots attached to the PR)

Viewports: 390x844, 768x1024, 1280x800, 1920x1080.
1. **Content loads:** within 3 s at least 6 event cards are visible and no skeleton remains; `Events: n` equals the number of cards.
2. **Console clean:** 0 errors and 0 warnings from our code (the expo-router deprecation is fixed or allow-listed); no hydration message on first load or after reload at each viewport.
3. **Layout:** no horizontal scroll at any viewport; 2 or more columns at 1280 and 3 at 1920; cards never narrower than 280 px; content width follows the viewport (no 300 px empty sides at 1280).
4. **Images:** every card shows an image or the designed poster; no broken image icon; explicit dimensions so layout shift (CLS) stays under 0.1.
5. **Hierarchy:** exactly one h1 per page, sections are h2; the first card's title is visible above the fold at 390x844.
6. **Navigation:** Discover, open the 3rd card (URL `/events/<slug>`), Back returns to Discover at the same scroll position; the deep link loads directly; an unknown slug shows the not-found page.
7. **Filters:** the Solo-friendly chip reduces the cards to the solo events and the counter matches; clearing restores all; the filter strip scrolls horizontally at 390 px without clipping.
8. **Keyboard and focus:** Tab reaches every card and chip in order; the focus ring is at least 2 px and 3:1 contrast on each ground; Enter opens a card; Escape closes the filter sheet.
9. **Touch targets and text:** every interactive element at least 44x44 at 390 px; at 200% zoom nothing is clipped or overlapped.
10. **Offline and error:** in live mode with the network blocked, the offline state with Retry appears within 12 s, and Retry recovers when the network returns.
11. **Locale:** EN, VI and RU render without overflow on the longest strings.
12. **Visual verdict:** screenshots reviewed by the CEO against this proposal (the only subjective gate).
Jest and CI stay, but a UI PR is not done until criteria 1 to 11 pass in the browser run and the screenshots are attached.

## 5. Shortest path to a convincing MOVA experience

1. Done today: `npm run web:sample` gives a working Discover and Detail in one command.
2. CEO decisions: approve the direction (section 2) and choose the image option (a), (b) or (c).
3. R1 to R3 plus R5 (about 2 sessions) give a visibly new Discover: shell, hero, grid cards, polished states.
4. R4, R6 and R7 (1 to 2 sessions) give Event Detail and the browser acceptance run.
Everything stays on sample data; no hosted Supabase, deployment or merge is involved.
