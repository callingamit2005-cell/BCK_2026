# Phase 3 - Voice Expense Engine (Checkpoint)

## What was built
- Improved voice session controller to enforce strict 10-second silence finalization.
- Transcript accumulation is now stable across multiple speech result chunks.
- Added 10-second auto-save countdown when required expense fields are complete:
  - Add Expense page
  - Group Expenses form
- Added best-effort auto-save on page exit/unmount if form is complete.

## Files changed
- `src/voice/core/useVoiceController.ts`
- `src/pages/AddExpense.tsx`
- `src/pages/GroupExpenses.tsx`

## How it works
1. User speaks.
2. Voice parser fills fields.
3. When required fields are complete and user is idle, a 10-second countdown starts.
4. On countdown end, expense auto-saves.
5. If user leaves page while form is complete, app attempts a best-effort save.

## How to test
1. Open Add Expense page.
2. Fill Amount + Payment Mode + Category (manual or voice).
3. Verify "Auto-save in 10s" appears and counts down.
4. Wait until zero and verify expense is saved.
5. Repeat on Group Expenses Add Expense form.
6. Try speaking in mixed order (example: "Dinner 1200 UPI paid by Rahul") and verify mapped fields.
7. Start voice and stop talking; verify session closes after silence and save flow triggers only when form is complete.

## Safety notes
- Business logic and DB schema were not changed.
- UI layout was not changed, only small status text additions.
