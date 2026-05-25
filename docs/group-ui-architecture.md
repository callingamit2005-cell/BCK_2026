# Group UI Architecture Documentation

## MODULE: GroupExpenses Single-Page UI

### PURPOSE
To provide a unified, seamless interface for group expense management. This architecture ensures that users never leave the page for primary actions (creating groups, joining groups, switching views), eliminating layout shifts and flashes.

### DEPENDENCIES
- `stableGroups` Memo: Ensures the group list is consistent across re-renders.
- `isNewUser` Memo: Determines if the onboarding or dashboard content should be displayed.
- `selectedGroupId`: The single source of truth for the active group, synchronized with the URL.

### LOGIC
1. **Unified Shell:** The `AppHeader` and the main "Split Bills" header (with the "New Group" button) are rendered unconditionally.
2. **Inline State Branching:**
   - **`loadingGroups`:** Displays a synchronization loader while the initial discovery is active.
   - **`isNewUser`:** Renders an onboarding section with CTAs to create or join a group.
   - **`!selectedGroupId`:** Handles the brief transition period where groups exist but one hasn't been selected yet.
   - **Dashboard:** Renders the full suite of cards (Stats, Settlement, Members, Ledger) once a group is active.
3. **Modal Integration:** Group creation is handled via a global `Dialog` that is accessible from both the header CTA and the onboarding card.

### COMPONENT RESPONSIBILITIES
- **Header:** Global navigation and primary "New Group" entry point.
- **Onboarding Card:** Guides new users through their first interaction without a full-page redirect.
- **Dashboard Area:** Orchestrates the rendering of sub-features (TripAdvisor, SettlementSummary, Activity Ledger).

### DO NOT MODIFY
- The inline conditional structure within the `<main>` tag.
- The "New Group" button's permanent visibility in the header.

### LAST UPDATED
2026-04-21 16:15:00
