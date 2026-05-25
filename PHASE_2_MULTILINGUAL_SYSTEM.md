# Phase 2: Multilingual System

## What Was Built

- Added first-login language onboarding modal in `LanguageContext`.
- Added one-time onboarding persistence with local storage key:
  - `language-onboarding-complete`
- Expanded supported Indian language set to 18+ (now 22 Indian options + English):
  - Added `as`, `kok`, `ks`, `doi`, `ne`
- Centralized top app header labels through translation keys:
  - Dashboard
  - Saving
  - Split
- Localized mobile sign-out label.
- Localized dashboard subheader tab labels via `t(...)`.
- Added new translation keys for nav and onboarding CTA:
  - `common.continueEnglish`
  - `nav.dashboard`
  - `nav.saving`
  - `nav.split`
  - `nav.signOut`
- Fixed language-change toast key mismatch:
  - from `language.changed` to `common.languageChanged`
- Improved translation typing for safer fallback behavior when some keys are missing in non-English languages.

## Why It Was Built

- Requirement asks language modal on first login with default English.
- Requirement asks 18+ Indian language support.
- Requirement asks main tabs to render in user-selected language.
- Changes are additive and avoid touching stable business logic.

## How It Works

- When logged in, if onboarding is not marked complete, language modal appears.
- User can select any available language or continue in English.
- Selected language is saved in local storage and synced to Supabase preferences.
- Header/tab labels read translated text from `useLanguage().t(...)`.
- If translation is missing in a language, app safely falls back to English text.

## How To Test (Step-by-Step)

1. Run `npm run dev`.
2. Log in with a user where `language-onboarding-complete` is not set in local storage.
3. Confirm language modal appears on first app entry.
4. Click `Continue in English` and verify app proceeds with English.
5. Reopen app: confirm modal does not show again.
6. Clear local storage key `language-onboarding-complete`, reload, and confirm modal appears again.
7. Choose Hindi (or any Indian language), apply, and verify:
   - Header tabs show translated labels
   - Dashboard subheader labels are translated
8. Open setup wizard (`/setup`) and confirm language list includes the expanded Indian language set when country is India.
9. Run `npm run build` and `npm run test` to verify no regressions.

