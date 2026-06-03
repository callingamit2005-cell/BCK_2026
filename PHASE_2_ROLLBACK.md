# PHASE 2 ROLLBACK NOTES

## Target Files & Rollback Strategy

1. **src/pages/SetupWizard.tsx**
   - **Change:** Removed auto-skip to Step 4.
   - **Rollback:** Restore the `else { setStep(4); }` block in the Resume Logic `useEffect`.

2. **src/hooks/useDashboardData.ts**
   - **Change:** Removed `window.dispatchEvent` and `invalidateQueries` from `loadNativeTransactions`.
   - **Rollback:** Re-insert the event dispatch and manual invalidation at the end of the `loadNativeTransactions` try block.

3. **src/components/SmartUniversalInput.tsx**
   - **Change:** Switched from Mock to Real Voice Engine, added props.
   - **Rollback:** Revert to zero-prop signature and restore the `setTimeout` based `toggleListening` mock.

## Data Impact
- No database schema changes were made.
- RPC functions remain unchanged.
- Rollback will not affect existing user data.
