# Transaction Auto-detect Flow

## Event wiring
- `TransactionAutoDetector` renders in `App.tsx`, so the hook runs once after login.
- `useTransactionAutoDetect` calls `startTransactionAutoDetect`, which registers `window.addEventListener("bk:transaction-message", …)`.
- Platform hooks (native plugin or web `dispatchEvent`) feed raw `source`, `message`, and `timestamp` into `createTransactionDraft`.
- Logs added inside the listener and parser confirm the event, message, and parsed data.

## Parser flow
- `smartParseSMS` extracts amount, payment mode, category, and merchant note from the raw SMS/notification text.
- `createTransactionDraft` normalizes merchant, bank, payment mode, and timestamps; it also persists drafts and emits `bk:transaction-draft-created`.
- Debug logs now show parsed amount + merchant + payment mode details before the draft is returned.

## Autosave flow
- The hook deduplicates transactions using `${amount}|${merchant}|${timestamp}`.
- Valid drafts trigger a Supabase `expenses` insert with `payment_mode`, `category`, `expense_date`, and an auto-generated note containing merchant/bank/time.
- On success, the hook invalidates `["expenses"]`, stores the signature, and fires a toast confirming auto-save. Logs show every save attempt/result.
- `docs/phase-6-transaction-auto-detection.md` already covers plugin listener behavior for native builds; this file documents the event → parser → save chain.

## Event listener architecture
- `TransactionAutoDetector` runs in `App.tsx`, registering a root-level `window` listener for `bk:transaction-message` so every dispatched payload is honored no matter where it originates.
- Handler logs the payload, feeds it into `createTransactionDraft`, and hands the resulting draft to `saveAutoDetectedExpense`, which already powers the react-query invalidation/toast workflow.
- This keeps the UI updates, parser, and autosave logic unchanged while ensuring the listener is wired globally.

## Testing checklist
1. Dispatch the event in console and check console logs plus toast:
   ```js
   window.dispatchEvent(new CustomEvent("bk:transaction-message", {
     detail: {
       source: "sms",
       message: "INR 3000 debited via UPI to SHOP123 at 19:15 from HDFC Bank",
       timestamp: new Date().toISOString(),
     },
   }));
   ```
2. Ensure console logs show:
   - `[txn-auto-detect] event received …`
   - `[txn-auto-detect] parsed draft …`
   - `[txn-auto-detect] saving auto expense …`
3. Confirm toast appears and `Recent Transactions` card refreshes with the new entry.
4. On native device with SMS permission granted, perform a real SMS/notification transaction; verify identical logs/toasts and auto-saved expense.
