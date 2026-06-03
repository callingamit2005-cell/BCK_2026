# FORENSIC ROOT CAUSE ANALYSIS REPORT

## PHASE 1: READ-ONLY FORENSIC ANALYSIS

- Investigated Execution Flows: SMS Bridge, SQLite Data Engine, React Query Hydration, Currency Normalization.
- Examined Source Code: src/hooks/useBachatData.ts, src/features/transactions/ledger.ts, ndroid/app/src/main/java/com/bachatkaro/SmsBridge.java, src/integrations/sqlite.ts, src/hooks/useDashboardSync.ts.
- Examined Database Schemas: Supabase migrations and Local SQLite setup.

---

## PHASE 2: VERIFIED ROOT CAUSE REPORT

### CRITICAL ISSUE #1: SMS Transactions Duplicating in Dashboard/Recent Transactions (Not in DB)
**Trace Evidence:**
- etchUnifiedLedger fetches arrays from Native Android DB, local SQLite, and Cloud Supabase.
- Android Native assigns an auto-incrementing integer id (e.g., 1), while Supabase uses a uuid. 
- mergeUnifiedLedgerEntries relies on id, smsHash, or canonicalKey to deduplicate records.
- Because smsHash can be null (for manual entries) and native IDs mismatch with cloud UUIDs, the grouping fails.
- Furthermore, the canonicalKey generation differs subtly across platforms due to timestamp parsing precision (getTime() / 1000), causing deduplication failure. The DB enforces UNIQUE constraints, so duplicate inserts fail silently, but UI merges arrays in-memory, causing visual duplicates.

### CRITICAL ISSUE #2: Web vs Android Data Desync
**Trace Evidence:**
- src/hooks/useBachatData.ts conditionally forks data fetching logic.
- On Android: It uses etchUnifiedLedger which queries the modern 	ransactions table.
- On Web (Fallback): It executes supabase.from('expenses').select('*').
- The expenses table is a legacy table. createLedgerTransaction writes exclusively to the new 	ransactions table. Thus, Web users are entirely blind to new modern ledger entries.

### CRITICAL ISSUE #3: Broken New User Onboarding (6-Month Scan UI Freeze)
**Trace Evidence:**
- useDashboardSync.ts attempts to bootstrap new users quickly by requesting scanHistoricalSms(62) (expecting 2 months of data for instant UI render).
- However, ndroid/app/src/main/java/com/bachatkaro/SmsBridge.java completely ignores the days parameter passed from JS. It hardcodes cal.add(Calendar.MONTH, -6).
- This forces the device to synchronously scan up to 5000 messages across 6 months, freezing the onboarding flow.
- Additionally, no background worker is dispatched post-bootstrap to gracefully fetch the remaining expected 180 days of history.

### CRITICAL ISSUE #4: Manual/Voice Expense Amount Corruption (?11 -> ?1100.00)
**Trace Evidence:**
- QuickAddExpense.tsx correctly calls createLedgerTransaction({ amount: 11 }).
- convertToPaisa(11) correctly scales it to 1100 paisa, and it is stored safely in the database.
- However, in src/integrations/sqlite.ts, the ensureDbReady() function executes unconditionally on every app startup.
- It contains a forensic repair script: UPDATE transactions SET amount = amount * 100 WHERE (entry_source IN ('manual', 'voice')) AND amount > 0 AND amount < 10000.
- On app restart, 1100 paisa (which is < 10000) is falsely identified as an unscaled rupee value and multiplied by 100, resulting in 110000 paisa (which formats to ?1100.00 in UI).
