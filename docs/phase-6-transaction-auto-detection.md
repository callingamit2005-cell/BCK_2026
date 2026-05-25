# Phase 6: Transaction Auto-Detection (Capacitor Safe Mode)

## What was built

- Added feature-flagged transaction auto-detection module:
  - `src/services/transactionAutoDetectService.ts`
  - `src/hooks/useTransactionAutoDetect.ts`
  - `src/components/TransactionAutoDetector.tsx`
- Wired detector globally in app shell:
  - `src/App.tsx`
- Added env/flag support:
  - `VITE_ENABLE_TXN_AUTODETECT`
  - `featureFlags.transactionAutoDetect`

## How it works

1. On app start (logged-in user), detector initializes only if feature flag is enabled.
2. On native (Capacitor), it tries to bind to available SMS/notification plugins (adapter style).
3. Incoming text is parsed for:
   - amount
   - merchant
   - payment method
   - category
   - timestamp
4. A local draft transaction is created and stored in localStorage (`bk:transaction-drafts`).

## Draft format

Each draft stores:

- `amount`
- `merchant`
- `paymentMethod`
- `occurredAt`
- `source` (`sms` or `notification`)
- `note`, `category`, user context

## Safety decisions

- No change to existing manual add-expense flow.
- No schema/API breaking changes.
- No hard dependency on any one native plugin.
- If plugin is unavailable, module remains no-op (safe).

## Test guide

### Web simulation

Open console and run:

```js
window.dispatchEvent(new CustomEvent("bk:transaction-message", {
  detail: {
    source: "sms",
    message: "INR 500 debited via UPI paid to Fresh Mart on 2026-03-01 12:45",
    timestamp: new Date().toISOString()
  }
}));
```

Expected:

- Toast appears: transaction detected
- Draft is created in localStorage key `bk:transaction-drafts`

### Native

- Enable feature flag and run Capacitor build
- Ensure plugin permissions are granted
- Send test SMS/payment notification
- Verify draft creation via storage/logging and toast feedback
