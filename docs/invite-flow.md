# Group Invite & Join Flow Documentation

## MODULE: Secure Join Flow

### PURPOSE
To provide a secure, idempotent, and user-friendly way for new members to join a group using a shareable token.

### DEPENDENCIES
- `supabase.rpc('join_group_via_token')`: The core backend logic for token validation and membership insertion.
- `React Router`: Handles token extraction from the query string and redirection.

### LOGIC
1. **Token Extraction:** The `/join` route captures the `token` parameter from the URL.
2. **Auth Verification:** Users must be authenticated before the join process begins.
3. **RPC Execution:**
   - Validates the token against expiry and usage status.
   - Idempotently joins the user (handles `already_member` cases).
   - Returns a structured JSON response with success status and group metadata.
4. **Cache Invalidation:** Triggers `queryClient.invalidateQueries` for both `groups` and `group-members` to ensure zero-refresh UI updates.
5. **Redirection:** Automatically navigates the user to the active group dashboard (`/group-expenses?groupId=<id>`).

### EDGE CASES
- **Invalid/Expired Token:** Displays a specific error message encouraging the user to request a new link.
- **Server Errors:** Catches and logs RPC failures, providing a generic "Try again" fallback.
- **Multiple Tabs:** Prevented via `isJoiningRef` guard to avoid redundant RPC calls.

### DO NOT MODIFY
- The RPC parameter structure (`{ invite_token: token }`).
- The automatic cache invalidation sequence after navigation.

### LAST UPDATED
2026-04-21 16:30:00
