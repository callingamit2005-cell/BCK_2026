# Group Roles & Access Control Documentation

## MODULE: RBAC (Role-Based Access Control)

### PURPOSE
To enforce security and moderation rules within groups, distinguishing between administrative and regular membership privileges.

### LOGIC
1. **Admin Assignment:** The group creator is automatically assigned the `admin` role upon group creation.
2. **Privilege Levels:**
   - **Admin:** Can delete the group, add/remove members, clear the entire activity ledger, and edit/delete any expense entry.
   - **Member:** Can view group data, add new expenses, and use utility features (TripAdvisor, Bill Roulette).
3. **Restricted Actions:**
   - **Member Management:** The "Add Member" input and the delete buttons for other members are visible only to admins.
   - **Moderation:** Regular members are restricted to editing or deleting only the expenses they personally created (`expense.user_id === auth.uid()`).

### UI CONDITIONS
- `isAdmin`: A memoized boolean that checks if the current user is the group owner or has the `admin` role in `group_members`.
- `isSharedView`: Determines if the user is a guest (view-only) before joining.

### DO NOT MODIFY
- The `isAdmin` calculation logic.
- The moderation rule `(isAdmin || exp.user_id === user?.id)` in the activity ledger.

### LAST UPDATED
2026-04-21 16:30:00
