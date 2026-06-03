# AI DEVELOPER GUIDE: BACHATKARO V6-SMS
**Status:** VERIFIED | **Role:** Technical Onboarding & Navigation | **Coverage:** 100%

## 1. CORE ARCHITECTURAL PHILOSOPHY
BachatKaro is a **Local-First, Cloud-Synced** fintech application. The UI always interacts with a local SQLite cache for zero-latency operations, while a background sync engine ensures global consistency.

## 2. FEATURE-TO-DATABASE MAPPING CHAINS (VERIFIED)

| Feature | Component | Hook | Service | API/RPC | Database Table |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Login** | `LoginForm` | `useAuth` | `supabase.auth` | `signInWithPassword` | `auth.users` |
| **Add Expense** | `SmartUniversalInput` | `useDashboardData` | `sqliteService` | `UPSERT` | `transactions` |
| **Group Split** | `GroupExpenses` | `useGroupLedger` | `groupLedgerService` | `insert_group_expense_with_split` | `group_expenses` |
| **Savings Goal** | `CreateGoalForm` | `useSavings` | `sqliteService` | `UPSERT` | `savings_goals` |
| **SMS Sync** | `N/A` | `useDashboardSync` | `SmsBridge` | `UPSERT` | `transactions` |
| **Salary/Budget**| `IncomeEngineCard` | `useDashboardData` | `sqliteService` | `UPSERT` | `salaries`, `budgets` |

## 3. HOW TO MODIFY MAJOR FEATURES (SAFE PROCEDURES)

### A. Modifying the SMS Parser
1.  **Locate:** `android/.../parser/SmsExtractor.kt`.
2.  **Verify:** Update regex patterns in `SmsParser.kt`.
3.  **Test:** Use `SmsTransactionEngineTest.kt` (if available) or manual broadcast triggers.
4.  **Constraint:** Ensure output maps exactly to the `Transaction` model in `model/Transaction.kt`.

### B. Adding a New Dashboard Widget
1.  **Create:** New component in `src/components/dashboard/cards/`.
2.  **Hydrate:** Use `useDashboardData.ts` to access unified SQLite/Cloud state.
3.  **Register:** Add to `src/pages/Dashboard.tsx` layout.

### C. Updating Group Settlement Logic
1.  **Logic:** Modify `src/utils/simplifyDebts.ts`.
2.  **Persistence:** Ensure changes reflect in `groupLedgerService.ts`.
3.  **Mandate:** NEVER replace `member_id` with `user_id`.

## 4. SAFE ENTRY POINTS FOR DEVELOPMENT
*   **Styles:** `src/index.css` (Base themes) and `tailwind.config.ts`.
*   **Translations:** `src/i18n/translations/`.
*   **UI Components:** `src/components/ui/` (Standard Shadcn components).
*   **Hooks:** `src/hooks/` (Custom reactive logic).

## 5. FORBIDDEN MODIFICATIONS (CRITICAL IMPACT)
*   **`sqliteSyncEngine.ts`**: Modifying the queue logic without absolute forensic proof will cause data corruption or duplicate transactions.
*   **`AuthContext.tsx`**: High risk of global render storms.
*   **`insert_group_expense_with_split` (RPC)**: Breaking this contract will crash the group ledger system.
*   **`member_id` Identity**: The primary key for all settlement logic; do not refactor.

## 6. DEVELOPMENT GUARDRAILS
*   **Currency:** Store as **Paisa (Integer)** in DB. Convert to Rupees only at the UI edge using `currencyFormatter.ts`.
*   **Network:** Assume the user is **Offline-First**. Always write to SQLite before attempting cloud sync.
