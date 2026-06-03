# PRODUCTION HARDENING ROADMAP: BACHATKARO V6-SMS
**Status:** VERIFIED | **Target:** Zero-Failure Architecture

## 1. CORE SYSTEM: `sqliteSyncEngine.ts`
*   **Failure Scenario:** Queue reaches 50+ failed items with high retry counts, blocking new transactions.
*   **Bottleneck:** Sequential processing of `promises` using `Promise.allSettled` on the main thread.
*   **Scaling Limitation:** Max batch size of 50 records per 15s.
*   **Recovery Strategy:** "Hard Reset" method to clear failed items into an 'Archive' table and restart sync.
*   **Monitoring:** Log `sync_queue` count to Telemetry; alert if `status='failed'` > 10.
*   **Priority:** **CRITICAL**

## 2. CORE SYSTEM: `AuthContext.tsx`
*   **Failure Scenario:** Auth state becomes stale during tab switching or background/foreground transitions.
*   **Bottleneck:** Deeply nested state object forces global rerenders on minor profile changes.
*   **Scaling Limitation:** Performance degrades as the number of context-dependent components grows.
*   **Recovery Strategy:** Automatic session refresh on `appStateChange` (Capacitor listener).
*   **Monitoring:** Track `AuthProvider` render count via Forensic Tracer.
*   **Priority:** **HIGH**

## 3. CORE SYSTEM: `TransactionSyncWorker.kt`
*   **Failure Scenario:** App is closed; OS kills the worker; SMS transactions are "trapped" on device.
*   **Bottleneck:** OkHttpClient synchronous execution within the worker thread.
*   **Scaling Limitation:** Limited by Android WorkManager execution windows (15m+ intervals).
*   **Recovery Strategy:** Trigger "Force Sync" on next App launch via `SmsBridge`.
*   **Monitoring:** Log native sync success/fail to `SmsEngineLogger.java`.
*   **Priority:** **CRITICAL**

## 4. HARDENING MILESTONES
1.  **Phase 1 (Reliability):** Implement Foreground Service for `TransactionSyncWorker` to bypass Doze mode.
2.  **Phase 2 (Performance):** Move `sqliteSyncEngine` queue processing to a dedicated Web Worker.
3.  **Phase 3 (Observability):** Integrate Sentry/NewRelic to track `sync_queue` health and RLS violations.
4.  **Phase 4 (Security):** Implement Certificate Pinning for Supabase API calls in the native layer.
