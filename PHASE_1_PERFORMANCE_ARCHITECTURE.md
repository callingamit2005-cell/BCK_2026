# Phase 1: Performance + Architecture Setup

## What Was Built

- Added centralized environment configuration in `src/config/env.ts`.
- Added centralized feature flags in `src/config/featureFlags.ts`.
- Migrated route gating in `src/App.tsx` to use feature flags.
- Converted page and auth screen imports in `src/App.tsx` to lazy loading.
- Added shared suspense loading shell for route chunks.
- Added conservative vendor chunk splitting in `vite.config.ts`.
- Wired `src/services/tripShareService.ts` to centralized env config.

## Why It Was Built

- Reduces first-load JavaScript cost by splitting routes into separate chunks.
- Makes feature rollout safer by toggling behavior using env flags.
- Prepares upcoming phases (i18n, voice, realtime, AI) without changing existing core logic.

## How It Works

- `appEnv` reads environment variables with fallback values.
- `featureFlags` exposes typed flags used by app routing and feature modules.
- Routes now load only when needed (`React.lazy` + `Suspense`), improving initial rendering time.
- Vite build now creates stable vendor chunks for better browser caching.

## How To Test (Step-by-Step)

1. Run `npm run dev`.
2. Open the app and verify all existing pages still open:
   - `/auth`
   - `/dashboard`
   - `/add-expense`
   - `/savings`
   - `/group-expenses`
3. Confirm loading spinner appears briefly on first navigation to each route.
4. Set `VITE_ENABLE_ANALYTICS=true` in `.env`, restart dev server, and confirm `/analytics` route is available.
5. Set `VITE_ENABLE_ANALYTICS=false`, restart, and confirm analytics route is hidden again.
6. Run `npm run build` and verify build completes successfully with vendor chunks.

## Notes

- Existing business logic was not removed or refactored.
- Changes are additive and safe for incremental rollout.

