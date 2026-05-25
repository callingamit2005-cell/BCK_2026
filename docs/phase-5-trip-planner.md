# Phase 5: Trip Planner (Hybrid AI + Static Fallback)

## What was implemented

- Hybrid planning in `src/services/tripPlanner.ts`:
  - Try Groq AI first (only when `VITE_TRIP_DATA_MODE=ai` and API key exists)
  - If AI fails or is disabled, fallback automatically to static dataset
- Static source uses:
  - `src/data/tripData.ts` (legacy plans)
  - `src/data/DestinationsData.ts` (Top 50 India destinations)
- Additional plan fields generated:
  - `tips`
  - `packingList`
  - `dosAndDonts`
  - `timeEstimates`
  - `source` (`ai` or `static`)

## Env config

Added in `src/config/env.ts`:

- `VITE_GROQ_API_KEY`
- `VITE_GROQ_MODEL` (default: `llama-3.1-8b-instant`)

Also used:

- `VITE_TRIP_DATA_MODE=ai` to enable AI attempt
- Any other value (or missing key) keeps static mode

## Why this is safe

- Existing modal/UI flow remains unchanged.
- Existing DB write path (`trip_plans`) unchanged.
- If AI is unavailable, users still get a plan from static data without any error break.

## How to test

1. Static mode test:
   - Set `VITE_TRIP_DATA_MODE=static`
   - Generate plan for Jaipur/Goa
   - Verify plan is generated and saved
2. AI mode success:
   - Set `VITE_TRIP_DATA_MODE=ai`
   - Add valid `VITE_GROQ_API_KEY`
   - Generate plan and verify saved plan has `source: "ai"` in `plan_data`
3. AI fallback:
   - Keep `VITE_TRIP_DATA_MODE=ai` but remove/invalid key
   - Generate plan and verify it still succeeds with static content
