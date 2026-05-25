# INVITE SYSTEM DOCUMENTATION & LOCK

## MODULE: Invite System

### FLOW
1. **User clicks link:** The user visits `/join?token=<invite_token>`.
2. **Token validated in DB:** The frontend calls the `join_group_via_token` RPC.
3. **Atomic Consumption:** The RPC uses an `UPDATE ... RETURNING` pattern to mark the token as used and retrieve group data in a single atomic operation. This prevents multiple users (or the same user in multiple tabs) from consuming the same token simultaneously.
4. **Member inserted:** If valid, the user is added to `group_members` (idempotently).
5. **Redirection:** User is redirected to the group dashboard.

### SECURITY
- **Race Condition Prevention:** Atomic updates ensure only one successful consumer per token.
- **Token expires:** Validated against `expires_at`.
- **Single use only:** Enforced by the `is_used` column check within the atomic update.
- **Duplicate join prevented:** Explicit `ON CONFLICT` resolution and `ROW_COUNT` detection for `already_member` status.
- **Parameter Safety:** Explicit use of function namespace (e.g., `join_group_via_token.user_id`) to prevent variable collision with table columns.

### DO NOT MODIFY
- **RPC logic:** The atomic validation sequence (expiry -> usage -> insertion -> mark used) is critical for system integrity.
- **already_member logic:** Must use `GET DIAGNOSTICS ROW_COUNT` after the `INSERT` to accurately detect existing membership without race conditions.

### LAST UPDATED
2026-04-21 15:15:00
