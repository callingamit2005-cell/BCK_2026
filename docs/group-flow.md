# Group Page Redirect Flow Documentation

## MODULE: GroupExpenses Redirect Logic

### PURPOSE
To ensure users are automatically directed to their primary group dashboard upon entry, bypassing the empty onboarding state if they are already members of one or more groups.

### DEPENDENCIES
- `AuthContext`: Provides authenticated `user` state and `loading` status.
- `React Query (groups)`: Fetches the list of groups the user belongs to.
- `React Router (useNavigate, useLocation)`: Manages URL query synchronization.

### LOGIC
1. **Data Fetching:** The system retrieves memberships for the current `user.id`.
2. **Auto-Selection Effect:**
   - Triggers when `groups` data is populated and `selectedGroupId` is null.
   - Selects `groups[0].id` as the active group.
   - Synchronizes the URL by appending `?groupId=<id>` without adding a new history entry (`replace: true`).
3. **Conditional Rendering:**
   - **Loading State:** Shows "Synchronizing Data..." if `loadingGroups` is true.
   - **Empty State (isNewUser):** Shows "No groups yet" onboarding card ONLY if `groups.length === 0`.
   - **Sync Phase:** Shows "Initializing your group view..." briefly while the auto-selection effect applies the ID to the state.
   - **Dashboard:** Renders the full Group UI once `selectedGroupId` is confirmed.

### EDGE CASES
- **Deep Linking:** If a user visits with a `groupId` already in the URL, the sync logic preserves it and prevents auto-selection from overriding the intended group.
- **Race Conditions:** Guarded by checking both `groups.length` and `loading` states before determining if a user is truly "New".

### DO NOT MODIFY
- The dependency array of the auto-selection `useEffect`.
- The `isNewUser` memo definition (`!loadingGroups && groups.length === 0`).

### LAST UPDATED
2026-04-21 16:00:00
