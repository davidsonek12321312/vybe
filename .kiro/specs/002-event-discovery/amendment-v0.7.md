# Amendment v0.7: Spec 002 Event Discovery (CEO reference design)

## Status: APPROVED
## Approved by: CEO
## Approved on: 2026-11-07

Recorded by Claude Code on the CEO's instruction. After approving the redesign (amendment v0.6),
the CEO supplied reference screenshots (`design_ceo_sugestion/`, kept out of the repository
because they show real people and a third party's product) and asked for the same design and
look "1:1", with MOVA's own icons and graphics. Where this amendment differs from amendment
v0.6, this amendment governs. Behaviour requirements (REQ-001 to REQ-048, S1 to S34) are unchanged.

## A15. Visual system (replaces the Afterglow palette of A12)

- Ground near-black (#0B0B0C), surfaces #151618 and #202226, thin grey borders.
- Primary actions and the active filter or tab are white pills with black text.
- One signal colour, red (#FF2D55), for badges, unread dots, live and like; never body text.
- Large heavy italic upper-case titles for events and groups, wide-tracked screen titles
  (applied step by step; see tasks.md evidence).
- A bottom tab bar with five icons (Discover, Events, Create, People, Chat), the active one filled
  white. Only Discover exists; the other four are dimmed, disabled and labelled "coming soon" until
  their own specs ship. No dead buttons and no fake data.
- Icons and artwork are MOVA's own, drawn in code. The reference app's name, logo, photographs,
  copy and promotional banners are never copied.

## A16. Out of scope of this amendment (unchanged rules apply)

- People cards with age, distance, "online" or "chatting now" (location and presence signals need an
  explicit opt-in spec; the vision lists swipe/people discovery as a pending CEO decision).
- Chats, clubs, create-event and attendee face-piles (later specs: hosts, RSVP, chats, with
  privacy and moderation first).

## A17. Acceptance

Browser acceptance as in amendment v0.6 A14, plus: the tab bar is present at 390 px, exactly one tab
is selected, the four unbuilt tabs expose `aria-disabled="true"`, and contrast of every text pair stays
at 4.5:1 or better.
