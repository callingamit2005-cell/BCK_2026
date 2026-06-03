# PRE-IMPLEMENTATION SAFETY & REGRESSION ANALYSIS REPORT

## PHASE 5A: REGRESSION IMPACT ANALYSIS

**1. Removal of mount * 100 repair query in sqlite.ts**
- **Risks:** Removing the auto-scaler means legacy records (entered as ?11 but stored as 11 instead of 1100) will stay incorrect.
- **Safety:** High. The auto-scaler is currently corrupting *correct* records on every launch. It's safer to have stable incorrect legacy records than an unstable system that corrupts new valid data.

**2. Fixing Web Fallback in useBachatData.ts**
- **Risks:** The 	ransactions table in Supabase has a different schema than the legacy expenses table.
- **Safety:** High. Parity is the goal. We will map the 	ransactions response to the unified format (UnifiedLedgerEntry) which the UI already handles.

**3. Fixing SmsBridge.java Days Parameter & Adding Background Sync**
- **Risks:** Potential race condition if the user manually triggers a scan while the background scan is running.
- **Safety:** High. The SmsBridge has internal locks to prevent concurrent scans. Using a 62-day synchronous bootstrap ensures "Wow" onboarding, while the 180-day background task ensures data completeness without lag.

## PHASE 5B: IDENTITY & CONCURRENCY ANALYSIS

**Can simultaneous execution create temporary duplicate states?**
- **Yes.** During the bridge "Feeder" phase, loadNativeTransactions saves to SQLite and invalidates the query client. 
- **The Duplicate Window:** When React Query refetches, it calls etchUnifiedLedger. This function fetches from ALL sources (Native Bridge, Local SQLite, Cloud Supabase) and merges them *in-memory* before returning to React.
- **The "Flashing" Duplicate:** If the canonicalKey generation has even a 1-character difference or 1-second timestamp drift between the layers, mergeUnifiedLedgerEntries will fail to group them. This results in the UI "flashing" a duplicate row during the transition from Native-only to Unified state.

**Root Cause of Key Drift:**
1. **RegEx Inconsistency:** sqlite.ts uses /[\s\.-]/g while ledger.ts uses separate .replace() calls for \s, ., and -.
2. **Timestamp Inconsistency:** sqlite.ts uses Math.floor(dateObj.getTime() / 1000). However, if dateObj is created from a string without a timezone (which can happen in SQLite), it may default to local time, while Supabase strings (T...Z) are UTC.
3. **Trigger Inconsistency:** The Supabase SQL trigger uses extract(epoch from date)::bigint. This is strictly UTC.

**Identity Coexistence:**
- **UUID vs Integer:** Coexistence is mandatory because the Native Android layer is hard-coupled to integer Long IDs for performance and cursor management. Forcing UUIDs there would require a massive native refactor.
- **Solution:** We will harden the canonicalKey generator to be the **Sole Source of Identity Truth** during the merge phase, allowing UUIDs and Integers to coexist as underlying storage keys while appearing as a single transaction in the UI.

## PHASE 5C: SAFE IMPLEMENTATION ORDER

**PHASE A — SAFE FIXES (Data Integrity & Onboarding)**
1. **File:** src/integrations/sqlite.ts -> Remove the mount = amount * 100 repair query.
2. **File:** src/hooks/useBachatData.ts -> Switch web fallback to the 	ransactions table with correct mapping.
3. **File:** src/hooks/useDashboardSync.ts -> Implement the delayed 180-day background scan.

**PHASE B — IDENTITY HARDENING (Duplicate Prevention)**
4. **File:** src/features/transactions/ledger.ts -> Unify 
ormPayee regex and harden 	s generation to be strictly UTC-safe and identical to the Supabase SQL extraction.

## PHASE 5D: ROLLBACK + DATA SAFETY PLAN

- **Rollback:** git checkout for all 4 files. No DB migrations are involved in this phase.
- **Data Recovery:** Users with corrupted 110000 paisa amounts will need to delete and re-add those specific manual transactions, or clear app cache to force a fresh pull from Cloud (if cloud sync happened before corruption).

## PHASE 5E: TEST STRATEGY + VALIDATION MATRIX

| Scenario | Platform | Verification |
| :--- | :--- | :--- |
| **Manual Entry Scaling** | Android | ?11 stays ?11 after 3 restarts. |
| **Web Dashboard** | Browser | Verify recent transactions match Android app exactly. |
| **New User Onboarding** | Android | Instant render (< 3s). History populated in background. |
| **Duplicate Prevention** | Android | Observe single row for SMS that exists in Bridge, SQLite, and Cloud. |
| **UTC Precision** | Both | Verify canonicalKey is identical for 2024-05-28T10:00:00Z and 2024-05-28 10:00:00. |
