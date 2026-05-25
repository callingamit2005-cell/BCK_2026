# i18n Phase Restart Reference

Date: 2026-02-28
Project: Bachatkaro

## Current Status (Checkpoint)
- English: working.
- Hindi: working.
- Other Indian languages: partial (fallback works in many places, but native language coverage is incomplete).

## What Was Completed
- Added safe translation flow using `tSafe` + English fallback.
- Standardized and expanded keys for dashboard/group/savings/trip/roulette flows.
- Wired namespaces for key pages (`dashboard`, `savings`, `split`, `common`, `group-expenses`).
- Removed multiple hardcoded strings and shifted to translation keys.
- Build and test pass at checkpoint.

## Remaining Work (When You Resume)
1. Full key coverage audit for all non-Hindi Indian languages:
   - bn, mr, gu, ta, te, kn, ml, or, pa, as (and any others enabled in LanguageContext).
2. Replace any remaining hardcoded strings in untouched modules/popups/forms/buttons.
3. Add native translations for missing keys (not only English fallback).
4. End-to-end manual verification in each language for:
   - Dashboard cards
   - Group Expenses
   - Spin Wheel
   - Plan Trip
   - Savings page/cards/forms
   - Tabs, buttons, popups, empty states

## Important Files
- `src/i18n/translations.ts`
- `src/i18n/index.ts`
- `src/hooks/useI18nNamespaces.ts`
- `src/pages/Dashboard.tsx`
- `src/pages/GroupExpenses.tsx`
- `src/pages/Savings.tsx`
- `src/components/groups/TripAdvisor.tsx`
- `src/components/groups/BillRoulette.tsx`
- `src/components/savings/CreateGoalForm.tsx`
- `src/components/savings/SavingsGoalCard.tsx`
- `src/components/savings/SavingsSummary.tsx`
- `docs/i18n-architecture.md`

## Resume Prompt (Copy-Paste)
Use this when resuming:

"Resume i18n phase in SAFE MODE.
Do not change business logic, APIs, or layout.
Goal: complete non-Hindi Indian language coverage across full app.
Tasks:
1) scan all `tSafe/t` usage and hardcoded UI strings,
2) add missing keys to translation catalog,
3) provide native translations for all enabled Indian languages,
4) ensure fallback order: selected language -> English -> readable fallback,
5) verify language persistence + live rerender,
6) run build/tests and provide a language-by-language checklist.
Return only i18n wiring/key updates."

## Quick Verification Commands
- `npm run build`
- `npm run test`

## Manual Verification Checklist
- Switch language -> navigate all major routes -> verify no raw keys visible.
- Refresh browser -> selected language should persist.
- Group/Trip/Spin/Savings popups should follow selected language.

