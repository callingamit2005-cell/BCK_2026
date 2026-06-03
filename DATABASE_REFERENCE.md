# DATABASE REFERENCE: BACHATKARO V6-SMS
**Status:** VERIFIED | **Schema Version:** 6.0.0

## 1. CORE TRANSACTIONAL TABLES

### `transactions`
*   **Columns:** `id` (UUID), `user_id` (UUID), `amount` (BIGINT/Integer), `type` (TEXT: 'income'/'expense'), `category` (TEXT), `description` (TEXT), `date` (TIMESTAMPTZ), `sms_hash` (TEXT), `is_deleted` (BOOLEAN), `updated_at` (TIMESTAMPTZ).
*   **Relationships:** `user_id` ➔ `auth.users(id)`.
*   **Constraints:** `UNIQUE(user_id, sms_hash)`.
*   **Triggers:** `on_transaction_insert_map_group` (Mig: 20260412000000).
*   **Policies:** `Users can manage their own transactions` (Mig: 20260321000000).

### `group_expenses`
*   **Columns:** `id` (UUID), `group_id` (UUID), `amount` (BIGINT), `paid_by_member_id` (UUID), `split_type` (TEXT), `title` (TEXT).
*   **Relationships:** `group_id` ➔ `groups(id)`, `paid_by_member_id` ➔ `group_members(id)`.
*   **RPC Connection:** `insert_group_expense_with_split` (Mig: 20260416000000).

### `expense_splits`
*   **Columns:** `id` (UUID), `expense_id` (UUID), `group_id` (UUID), `member_id` (UUID), `share_amount` (BIGINT).
*   **Relationships:** `expense_id` ➔ `group_expenses(id)`, `member_id` ➔ `group_members(id)`.

## 2. IDENTITY & SOCIAL TABLES

### `group_members`
*   **Columns:** `id` (UUID), `group_id` (UUID), `user_id` (UUID, nullable), `name` (TEXT), `role` (TEXT), `upi_id` (TEXT).
*   **Ghost Support:** `user_id` is intentionally NULL for unauthenticated participants.
*   **Policies:** `Members can view group members` (Mig: 20260423000002).

### `profiles`
*   **Columns:** `id` (UUID), `full_name` (TEXT), `upi_id` (TEXT), `has_completed_setup` (BOOLEAN).
*   **Security:** RLS locked to `auth.uid()`.

## 3. STORED PROCEDURES (RPCs)

| RPC Name | Migration | Purpose |
| :--- | :--- | :--- |
| `insert_group_expense_with_split` | `20260515000000` | Atomic insertion of group expenses and split records. |
| `join_group_via_token` | `20260520000003` | Verifies invite token and adds member to group. |
| `create_group_with_admin` | `20260515000002` | Creates a group and sets the creator as the first admin. |
| `delete_group_expense_atomic` | `20260520000000` | Hard-deletes an expense and its splits. |
| `get_bachat_data_stats` | `20260412000001` | Aggregates user metrics for dashboard analytics. |

## 4. DETERMINISTIC PLANNING TABLES
### `salaries` / `budgets`
*   **Columns:** `id`, `user_id`, `monthly_salary`/`monthly_budget`, `month_year` (TEXT).
*   **Constraints:** `UNIQUE(user_id, month_year)`.
*   **Triggers:** `tr_latest_wins_` (Mig: 20260419000007).
