# Manual Smoke and Accessibility Checklist — Spec 001

Covers REQ-002, REQ-003, REQ-005, REQ-007, NFR-004 and NFR-005
(Scenarios 2, 3, 8 and 9). Automated lint and tests supplement these checks;
they are not a WCAG certification. Never record a pass without doing the
check. Record an unavailable device or tool as **Not verified**.

## How to open the app

- **Web (development):** `npx expo start`, then press `w`.
- **Web (export):** `npm run export:web`, then `npx expo serve`.
- **Android:** Expo Go on the same Wi-Fi; scan the QR code from `npx expo start`.
- **iPhone:** scan the QR code with the Camera app; it opens Expo Go. Expo Go
  must support this project's SDK (design §1.2). If it does not, record
  "Not verified (Expo Go incompatible)".
- **Not-found on a phone:** open `exp://<LAN address>:8081/--/does-not-exist`
  in the phone browser, using the address shown by `npx expo start`.

## Checks

| ID | Target | Check | Requirement |
|---|---|---|---|
| W1 | Web | `/` shows the app name, welcome title and coming-soon message; no console errors; no event, RSVP, booking or sample content | REQ-002, REQ-005 |
| W2 | Web | `/does-not-exist` shows the not-found screen; "Go to home" returns to `/` | REQ-003 |
| K1 | Web | Tab reaches "Go to home" with a visible focus indicator; Enter activates it | REQ-007 |
| C1 | Web and phone | Text contrast ≥ 4.5:1 in light and dark mode (values documented in `src/theme.ts`) | REQ-007 |
| S1 | Web | Screen reader (Narrator or NVDA) announces the title as a heading and the link as "Go to home" | REQ-007, NFR-005 |
| A1 | Android | Home renders in EN, VI and RU (change the device language); not-found link returns home | REQ-002, REQ-006 |
| A2 | Android | TalkBack announces the heading and "Go to home"; touch target ≥ 44 dp | REQ-007 |
| I1 | iPhone | Same as A1 | REQ-002, NFR-004 |
| I2 | iPhone | VoiceOver same as A2; touch target ≥ 44 pt | REQ-007 |

## Results

| Date | Tester | Device / browser / OS | Expo Go version | Check IDs | Result | Notes |
|---|---|---|---|---|---|---|
| — | — | — | — | All | Not verified | No manual run recorded yet |
