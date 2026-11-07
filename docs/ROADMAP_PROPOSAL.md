# MOVA development roadmap (PROPOSAL, awaiting CEO review)

Status: DRAFT, prepared 2026-11-07 by the MOVA worker. It changes no approved document.
Source: `docs/PRODUCT_VISION.md` (roadmap, out of scope), ADR-0011 to ADR-0016, Specs 001 to 003.
Each step is its own Kiro spec: requirements, design, tasks, each approved by the CEO before the next phase.

## Order

| Step | Spec | Delivers | Depends on | Size |
|---|---|---|---|---|
| 0 | Merge 001 v0.4, ADRs, 002 | Event Discovery on `master`; branch protection; hosted baseline and migrations (CEO gates) | PRs #2 to #4 | gate work |
| 1 | 003 Accounts | Google and email sign-in, handle, profile pages, avatar, export, deletion, consent | step 0 | large |
| 2 | 004 RSVP and Hosts | Join/leave, capacity, waitlist, host role (first use of `has_role`/membership, ADR-0014), host attendee list visible to the host only, attendee privacy rules | 003 | large |
| 3 | 005 Event Map | Map of event venues and meeting points (see constraint) | 002, 004 | medium |
| 4 | 006 Notifications | Reminders, event-change alerts, waitlist promotion; opt-in per channel | 004 | medium |
| 5 | 007 Social graph | Follow or connect, "who is going" shown only to people the user allows | 003, 004 | medium |
| 6 | 008 Chats | Event chats first (members of one event), then direct messages; moderation, blocking, reporting, retention | 003, 004, 005, 007 | large |
| 7 | later | Feeds, rooms and communities, swipe (needs a CEO decision on dating, per the vision), more cities, payments (out of scope today) | the above | open |

## Constraints that shape the order

1. **"Live Event Map" must not become location tracking.** `CLAUDE.md` and the vision forbid permanent location tracking and "maps requiring constant location sharing". Proposed reading: a map of **event venues and meeting points** with the user's own position shown only on their device, never sent to the server. Any live sharing of people's positions would need a separate spec with explicit, per-event, time-limited opt-in and a CEO decision. Please confirm this reading.
2. **Chat needs moderation first.** Reporting (Spec 003 REQ-043), blocking and a role model must exist before messages, so chat comes after RSVP, notifications and the social graph.
3. **RSVP creates the first attendee data.** It brings the privacy question "who can see who is going", so it needs Spec 003's visibility model.
4. **Each step ships behind its own PR with CI green**, and hosted migrations stay a CEO gate every time.

## Decisions needed from the CEO

- Confirm the map reading above (venues only, no people tracking).
- Confirm that 004 RSVP precedes any map work, and that notifications precede chat.
- Whether Beach Social #001 (planned 2026-12-05) needs RSVP before the date. If yes, Specs 003 and 004 are on the critical path and the first release could use a simpler "register by link" (already in Spec 002) until they land.
