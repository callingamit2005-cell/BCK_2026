# Phase BK-P0: False Negative Edit Failure Resolution

## Root Cause Analysis
The user reported that editing a transaction produced an "Edit Failed" toast on Android, despite the fact that the transaction successfully updated in the SQLite database and subsequently synced to the cloud.

A forensic trace revealed the following execution chain:
1. `RecentExpenses.tsx` calls `handleSave()`.
2. `handleSave()` calls `saveAndSync()` in `sqliteService.ts`.
3. `saveAndSync()` successfully executes an `INSERT OR REPLACE` into the local `transactions` table.
4. `saveAndSync()` then calls `enqueueSync()` to push the task to the offline `sync_queue`.
5. Inside `enqueueSync()`, an `INSERT ... ON CONFLICT(idempotency_key) DO UPDATE SET ...` query is executed.
6. The `UPDATE SET` clause referenced `updated_at = CURRENT_TIMESTAMP`.
7. **The Crash:** The `sync_queue` table schema (defined in `initSQLite`) does not contain an `updated_at` column.
8. SQLite threw a `no such column: updated_at` error.
9. `enqueueSync()` caught the error and returned `false`.
10. `saveAndSync()` saw the failure, threw a `Sync Queue insertion failed` error, and bypassed the success toast and React Query invalidation.

## Implementation Fix
The `enqueueSync()` function in `src/integrations/sqlite.ts` was surgically modified to remove the non-existent `updated_at` column from the `ON CONFLICT` clause.

**Before:**
```sql
ON CONFLICT(idempotency_key) DO UPDATE SET 
  operation = excluded.operation,
  payload = excluded.payload,
  status = 'pending', 
  retry_count = 0,
  updated_at = CURRENT_TIMESTAMP,
  next_retry_at = CURRENT_TIMESTAMP;
```

**After:**
```sql
ON CONFLICT(idempotency_key) DO UPDATE SET 
  operation = excluded.operation,
  payload = excluded.payload,
  status = 'pending', 
  retry_count = 0,
  next_retry_at = CURRENT_TIMESTAMP;
```

## Schema Validation
The `sync_queue` schema was thoroughly verified against the master schema definition in `sqlite.ts`.
**Verified Schema:**
```sql
CREATE TABLE IF NOT EXISTS sync_queue (
  id TEXT PRIMARY KEY, table_name TEXT NOT NULL, operation TEXT NOT NULL, payload TEXT NOT NULL,
  idempotency_key TEXT UNIQUE NOT NULL, status TEXT DEFAULT 'pending', retry_count INTEGER DEFAULT 0,
  next_retry_at DATETIME DEFAULT CURRENT_TIMESTAMP, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```
No other invalid column references exist in the `enqueueSync` or `processQueue` logic. The `sync_queue` table relies exclusively on `created_at` and `next_retry_at` for temporal tracking.

## System Status
The False-Negative bug is fully resolved. Edits now commit atomically to both the data table and the sync queue, triggering the proper UI success notifications and cache invalidations.
