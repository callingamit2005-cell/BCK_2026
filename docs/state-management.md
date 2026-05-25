# State & Cache Management Documentation

## MODULE: Data Synchronization Engine

### PURPOSE
To ensure that the application UI is always perfectly synchronized with the latest backend state without requiring manual page reloads.

### DEPENDENCIES
- `@tanstack/react-query`: Manages the local data cache and invalidation cycles.
- `supabase`: Provides real-time event triggers.

### LOGIC
1. **Aggressive Invalidation:**
   - Immediately after a mutation (Creating a group, Joining a group, or Deleting an expense), the system invokes `queryClient.invalidateQueries`.
   - Keys invalidated: `['groups']`, `['group-members', groupId]`, `['group-expenses', groupId]`.
2. **Atomic State Updates:**
   - States like `selectedGroupId` are updated only after a successful mutation response is received.
   - URL synchronization happens via `navigate` with `{ replace: true }` to keep the navigation history clean.
3. **Freshness Settings:**
   - Critical group queries are configured with `staleTime: 0` and `gcTime: 0` to force re-verification upon mount or identity change.

### DO NOT MODIFY
- The order of `invalidateQueries` calls.
- The use of `Promise.all` in `handleCreateGroup` for parallel cache refreshes.

### LAST UPDATED
2026-04-21 16:45:00
