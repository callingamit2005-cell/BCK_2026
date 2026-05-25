# GROUP SYSTEM DOCUMENTATION & LOCK

## MODULE: AuthContext

### PURPOSE
Centralized authentication and session management. Derives user identity from Supabase Auth and manages global loading states.

### DEPENDENCIES
- Supabase Auth API
- LocalStorage (Session persistence)
- Capacitor (Native sync)

### LOGIC
1. Restores session on mount via `getSession`.
2. Listens to `onAuthStateChange` for real-time updates.
3. Fetches user preferences (language, region) after successful auth.
4. Synchronizes session with native mobile layers.

### EDGE CASES
- **Auth Flickering:** Prevented by ignoring transient null sessions during refresh cycles.
- **Concurrent Pref Fetches:** Blocked by guard refs to avoid redundant RPC calls.

### DO NOT MODIFY
- **Stability Guard:** `if (!session) return` block in `onAuthStateChange` listener (except for explicit SIGNED_OUT).
- **Session Restoration Order:** Must complete before `loading` set to false.

### LAST UPDATED
2026-04-21 14:30:00

---

## MODULE: GroupDiscovery

### PURPOSE
Securely identifies and retrieves groups associated with the authenticated user.

### DEPENDENCIES
- `group_members` table
- `groups` table
- Supabase RLS

### LOGIC
1. Fetches all active memberships for `auth.uid()`.
2. Extracts unique group IDs.
3. Retrieves group metadata (name, creator, date) for identified IDs.
4. Auto-selects the first available group if none specified in URL.

### EDGE CASES
- **No Memberships:** Returns empty array and triggers "New User Onboarding" UI.
- **Race Condition:** Guarded by `if (!user?.id) return` in query function.

### DO NOT MODIFY
- **2-Step Fetch:** Do not convert back to nested joins; the current sequence ensures 100% RLS compliance.
- **Auth Guard:** Query must remain disabled until `user.id` is available and `loading` is false.

### LAST UPDATED
2026-04-21 14:30:00

---

## MODULE: MemberManagement

### PURPOSE
Handles group member registration, validation, and role assignment.

### DEPENDENCIES
- `group_members` table
- Unique Constraint: `unique_group_member (group_id, name)`

### LOGIC
1. Normalizes input name (trim, lowercase).
2. Performs local duplicate check against existing members array.
3. Executes safe `upsert` with conflict resolution on `group_id, name`.
4. Fallback to `insert` handles legacy environments or transient connection issues.

### EDGE CASES
- **Duplicate Name:** Handled by conflict resolution to prevent database 400 errors.
- **Self-Registration:** Automatically maps authenticated user ID to the member record.

### DO NOT MODIFY
- **UPSERT Pattern:** The try/catch fallback block is mandatory for production stability.
- **Unique Constraint:** Database constraint `unique_group_member` is the final line of defense against duplication.

### LAST UPDATED
2026-04-21 14:30:00
