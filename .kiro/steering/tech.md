---
inclusion: always
---
# Technology Direction (not yet a design approval)

Preferred stack: Expo + React Native + TypeScript + Expo Router across iOS/Android/web; Supabase planned for auth/database/storage/realtime; Telegram Bot/Mini App planned later; GitHub CI/CD. These are preliminary decisions; each feature's approved technical design is authoritative.

Do NOT assume a particular Expo SDK is compatible with Expo Go; consult current official Expo documentation. Prefer the official Expo Router-enabled default template; avoid scaffolding blank TS and manually bolting on navigation without a reason.

Do not run scaffolding or dependency installation until the foundation spec (requirements, design and tasks) is explicitly approved.
