# i18n Architecture

## Goal
Make sure users always see readable text in their selected language, never raw keys like `expenseTotals.today`.

## Key Naming Rules
- Use canonical format: `feature.section.label`
- Examples:
  - `dashboard.expenseTotals.today`
  - `dashboard.dateFilter.thisWeek`
  - `WealthPredictor` (formerly `dashboard.wealthPredictor.title`)
  - `dashboard.goalProgress.target`

## Namespace Structure
- `common`
- `dashboard`
- `savings`
- `split`
- `group-expenses` (logical page namespace grouped under `split.*` keys)
- `split.trip.*` for Plan Trip modal
- `split.roulette.*` for Spin Wheel modal
- `savings.*` for Savings page/cards/forms

These namespaces are logical groupings in key names. Current implementation keeps translations in one local catalog and supports future async loading.

## Resolution Flow
1. Component asks for a key (`t(...)` or `tSafe(...)`).
2. Resolver checks alias map for legacy keys:
   - Example: `dateFilter.today` -> `dashboard.dateFilter.today`
3. Lookup order:
   - Current language + canonical key
   - Current language + original key
   - English + canonical key
   - English + original key
4. If still missing, return safe fallback text (never show raw key in UI).

## Safe Translation Helper
- `tSafe(key, fallback?)` is available in `src/i18n/index.ts`.
- Use `tSafe` when user-facing labels must never degrade to keys.

## Route Namespace Wiring
- `Dashboard` page preloads: `dashboard`, `common`, `savings`, `split`
- `Savings` page preloads: `savings`, `common`, `dashboard`, `split`
- `Group Expenses` page preloads: `split`, `common`, `dashboard`, `savings`
- Hook used: `src/hooks/useI18nNamespaces.ts`

## Adding a New Language
1. Add language code to `Language` union in `src/contexts/LanguageContext.tsx`.
2. Add display metadata in `LANGUAGE_NAMES`.
3. Add language object in `src/i18n/translations.ts`.
4. You can start with partial translations:
   - Missing keys automatically fall back to English.
5. Verify by switching app language and checking top navigation + dashboard cards.

## Debugging Checklist
1. If key is visible in UI, check if key exists in `translations.ts`.
2. Check if key is legacy and should map via alias resolver.
3. Check language is stored in `localStorage.preferred-language`.
4. Confirm fallback language (`en`) contains the key.
5. Run build:
   - `npm run build`
6. Smoke test:
   - Dashboard tabs
   - Card headings
   - Date filter labels
   - Wealth predictor labels
   - Group Expenses page labels and buttons
   - Health Score card
   - Recent Transactions card
   - EMI empty state text

## Verification Checklist
1. Switch language to Hindi.
2. Open `/group-expenses`:
   - Group create/select labels are in Hindi.
   - Member/invite/expense labels are in Hindi.
   - Spin Wheel modal labels/buttons are translated (or safely fallback to English).
   - Plan Trip modal labels/buttons/sections are translated (or safely fallback to English).
3. Open `/dashboard`:
   - Health Score card labels are in Hindi.
   - Recent Transactions empty state is in Hindi.
   - EMI empty state is in Hindi.
4. Switch language to English and verify live update without refresh.
5. Refresh page and verify selected language persists.
6. Confirm no raw keys like `dateFilter.today` or `group.create.title` are visible.

## Files Involved
- `src/i18n/index.ts`
- `src/i18n/translations.ts`
- `src/contexts/LanguageContext.tsx`
- `src/components/dashboard/ExpenseTotalsGrid.tsx`
- `src/components/dashboard/DateFilter.tsx`
- `src/components/dashboard/FutureWealthPredictor.tsx`
- `src/components/dashboard/GoalProgress.tsx`
