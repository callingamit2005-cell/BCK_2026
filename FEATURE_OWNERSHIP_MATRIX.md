# FEATURE OWNERSHIP MATRIX: BACHATKARO V6-SMS
**Status:** VERIFIED | **Source:** Forensic Phase 2, 3 & 4

| Feature | Owner Files | Hooks | Services | Tables | RPCs / Triggers | Dependencies |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Auth** | `LoginForm.tsx`, `Auth.tsx` | `useAuth` | `AuthContext` | `profiles` | None | `supabase-js` |
| **Offline Ledger** | `Dashboard.tsx`, `RecentExpenses.tsx` | `useDashboardData` | `sqliteSyncEngine` | `transactions` | `on_transaction_insert_map_group` | `@capacitor-community/sqlite` |
| **Group Split** | `GroupExpenses.tsx` | `useI18nNamespaces` | `groupLedgerService` | `group_expenses`, `expense_splits` | `insert_group_expense_with_split` | `simplifyDebts.ts` |
| **Trip Planner** | `AdvancedTripPlannerV2.tsx` | `useQuery` | `advancedTripPlanner` | `groups` | None | `Lucide Icons` |
| **SMS Tracking** | `N/A` | `useDashboardSync` | `SmsBridge` | `transactions` | `handle_transaction_auto_group_mapping` | Android `SmsReceiver` |
| **Sync Engine** | `N/A` | `useDashboardSync` | `sqliteSyncEngine` | `sync_queue` | None | `sqliteService.ts` |
| **Savings Goals** | `Savings.tsx` | `useQuery` | `sqliteService` | `savings_goals` | None | `Framer Motion` |
| **EMI Tracker** | `Dashboard.tsx` | `useDashboardData` | `sqliteService` | `emis` | None | `loanCalculator.ts` |
| **Onboarding** | `SetupWizard.tsx` | `useAuth` | `supabase` | `user_preferences` | `finalize_user_onboarding` | `PermissionEducation.tsx` |
| **Analytics** | `Analytics.tsx` | `useBachatData` | `supabase` | `transactions` | `get_bachat_data_stats` | `Recharts` |
