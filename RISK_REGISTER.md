# RISK REGISTER: BACHATKARO V6-SMS
**Status:** VERIFIED | **Scope:** Enterprise Fintech Readiness

## 1. ARCHITECTURAL & SYNC RISKS
| ID | Risk Name | Severity | Description | Mitigation Roadmap |
| :--- | :--- | :--- | :--- | :--- |
| **AS-01** | Sync Engine SPOF | **CRITICAL** | `sqliteSyncEngine.ts` is the only path to the cloud. A logic error here halts all global updates. | Implement secondary "Re-sync All" failsafe. |
| **AS-02** | Sync Loop Overload | **HIGH** | 15s interval processing batches of 50 may fall behind during high activity. | Shift to Event-Driven sync triggers. |
| **AS-03** | Race Condition (Dual Sync) | **MEDIUM** | Simultaneous sync triggers from 'online' event and 'interval'. | Locked via `isSyncing` flag (Verified). |

## 2. SCALABILITY RISKS
| ID | Risk Name | Severity | Description | Mitigation Roadmap |
| :--- | :--- | :--- | :--- | :--- |
| **SC-01** | SQLite File Size | **HIGH** | Unbounded transaction growth will slow down Capacitor SQLite queries. | Implement `performCleanup` purging > 1080 days. |
| **SC-02** | Auth Context Bloat | **MEDIUM** | Entire app rerenders when `userProfile` updates. | Split Context into `AuthState` and `UserConfig`. |
| **SC-03** | Supabase Connection Limit | **LOW** | High volume of individual UPSERTs during queue processing. | Implement Batch UPSERT in `processQueue`. |

## 3. PERFORMANCE & PERFORMANCE RISKS
| ID | Risk Name | Severity | Description | Mitigation Roadmap |
| :--- | :--- | :--- | :--- | :--- |
| **PE-01** | UI Lags on Heavy Sync | **MEDIUM** | Main thread processing of 50 records may drop frames. | Move sync processing to a Web Worker. |
| **PE-02** | Deep Memoization Cost | **LOW** | `React.memo` usage in Dashboard may increase memory overhead. | Monitor heap size on low-end Android. |

## 4. SECURITY & RELIABILITY RISKS
| ID | Risk Name | Severity | Description | Mitigation Roadmap |
| :--- | :--- | :--- | :--- | :--- |
| **SR-01** | RLS Bypass Risk | **HIGH** | If `is_member_of()` logic fails, group data is exposed. | Add Migration-level unit tests for RLS. |
| **SR-02** | Native Worker Death | **CRITICAL** | OS kills `TransactionSyncWorker.kt` during sleep. | Foreground Service + OEM Power management alerts. |
| **SR-03** | Insecure Deep Links | **MEDIUM** | Invite tokens in URLs could be intercepted. | Implement one-time-use tokens + Short TTL (10m). |
