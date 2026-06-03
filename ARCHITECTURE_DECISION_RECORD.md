# ARCHITECTURE DECISION RECORD (ADR): BACHATKARO V6-SMS
**Status:** VERIFIED | **Version:** 6.0.0

## 1. ADR-001: Hybrid Local-First Sync Engine
*   **Decision:** Implement a custom SQLite-based sync queue (`sqliteSyncEngine.ts`) instead of direct API calls.
*   **Rationale:** Ensures offline usability in low-connectivity areas (India/SE Asia) and zero UI latency.
*   **Consequence:** Increased complexity in conflict resolution; requires idempotency keys on all mutations.

## 2. ADR-002: Native SMS Intelligence Engine
*   **Decision:** Move transaction detection to a native Kotlin/Java engine (`SmsTransactionEngine.kt`).
*   **Rationale:** Web-based SMS APIs are restricted or non-existent. Background Workers allow "passive" tracking.
*   **Consequence:** Requires a robust Capacitor Bridge (`SmsBridge.java`) to sync native data back to the React UI.

## 3. ADR-003: Deterministic Overwrite for Planning
*   **Decision:** Use `UNIQUE(user_id, month_year)` for Salaries and Budgets.
*   **Rationale:** Simplifies financial forecasting by enforcing a single "truth" per month.
*   **Consequence:** Previous month-state is overwritten unless explicitly archived (See Mig 20260520000004).

## 4. ADR-004: Member-Centric Identity (Ghost Members)
*   **Decision:** Use `member_id` as the primary identity for settlement, allowing `user_id` to be null.
*   **Rationale:** Supports "Ghost Members" (unregistered users) in group expenses, critical for social adoption.
*   **Consequence:** Identity logic must always resolve via the `group_members` table, never direct `auth.users` join.
