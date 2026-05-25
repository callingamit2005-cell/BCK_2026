# SQLITE SYNC FLOW & IDENTITY ARCHITECTURE [V1.0]

## 1. TRANSACTION IDENTITY ARCHITECTURE
The system employs a **Hybrid Identity Model** to bridge native Android capturing with the centralized Supabase ledger.

### A. PRIMARY KEY CONTRACTS
*   **Local SQLite (`transactions`):** Uses `id` (TEXT PRIMARY KEY). This `id` is a UUID for manual/voice entries, but an **Integer String** for native entries fetched via the bridge.
*   **Supabase Cloud (`public.transactions`):** Uses `id` (UUID PRIMARY KEY).

### B. THE IDENTITY PARITY FIX
To prevent the `transactions_pkey` violation (where integer IDs collide globally in Supabase), the system implements a **Safe Sync Translation Layer** in `sqliteService.ts`:

1.  **Conflict Target:** For the `transactions` table, the sync engine uses `(user_id, sms_hash)` as the authoritative conflict target instead of `id`.
2.  **ID Stripping:** If the local `id` is not a valid UUID (e.g., an integer from the bridge), it is stripped from the remote payload before the `upsert` call.
3.  **Cloud Preservation:** This allows Supabase to maintain its own generated UUID for the record (found via `sms_hash`) while allowing the local SQLite to keep its integer handle.
4.  **Surgical Merging:** The `ledger.ts` logic merges local and cloud records using `smsHash` as the key, ensuring the UI remains deduplicated.

---

## 2. DATABASE READINESS LIFECYCLE
Addressing the "database not opened" deadlock on Android.

### A. CENTRALIZED INITIALIZATION LOCK
All SQLite operations MUST await `ensureDbReady()`. This function implements a module-level lock (`initPromise`) to prevent race conditions during app boot.

### B. HARDENED READINESS CHECK
The new `ensureDbReady` gatekeeper performs a three-step verification:
1.  **Wait for Lock:** Awaits any in-flight `initPromise`.
2.  **API Verification:** Checks the actual connection state using the verified `db.isDBOpen()` API.
3.  **Self-Healing:** If the connection is closed or missing (common after Android backgrounding), it clears the stale lock and triggers a fresh `initSQLite()` sequence.

---

## 3. EXECUTION FLOWS

### I. VOICE/MANUAL INPUT FLOW
`SmartUniversalInput` → `createLedgerTransaction` → `saveLocalTransaction` (SQLite) → `enqueueSync` → `sync_queue_updated` Event → `RecentExpenses` UI Refresh.

### II. NATIVE SMS FLOW
`SmsReceiver` (Android) → `sms_transactions.db` → `TransactionSyncWorker` (WorkManager) → `Supabase`.
Then: `newTransaction` Event (Capacitor) → `loadNativeTransactions` → `saveLocalTransaction` (SQLite) → `Dashboard` UI Refresh.

### III. EDIT FLOW
`RecentExpenses` → `saveAndSync` → `sqliteService.ts` → `ensureDbReady` → `INSERT OR REPLACE` (Local SQLite) → `enqueueSync` → `sync_queue` Processing.

---

## 4. ROOT CAUSE ANALYSES

| Issue | Root Cause | Fix |
| :--- | :--- | :--- |
| **Deadlock (Android)** | Stale closed handle returned from cache. | Added `isDBOpen()` verification in `ensureDbReady`. |
| **API Crash (Android)** | `isOpened` vs `isDBOpen` mismatch. | Aligned code with Capacitor SQLite v8 API. |
| **Edit PK Violation** | Integer ID collision in Supabase. | Stripped non-UUID `id` + targeted `sms_hash` for sync. |
| **UI Desync (Android)** | SQLite insertion failed silently. | Hardened insertions and added forensic error propagation. |

---

## 5. RELEVANT FILES
*   `src/integrations/sqlite.ts`: Central initialization and insertion logic.
*   `src/integrations/sqliteService.ts`: Conflict resolution and sync translation.
*   `src/services/sqliteSyncEngine.ts`: Background sync and cleanup logic.
*   `src/features/transactions/ledger.ts`: Unified identity mapping and merging.
*   `src/components/dashboard/RecentExpenses.tsx`: UI interaction layer for edits/deletes.
