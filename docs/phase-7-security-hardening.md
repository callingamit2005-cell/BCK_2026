# Phase 7: Security Hardening

This phase improves security without changing existing business flows, APIs, or layouts.

## What was built

1. Safe post-login redirect handling
- Added `src/security/redirect.ts`.
- Only internal routes (for example `/dashboard`, `/join?groupId=...`) are allowed for `redirectAfterLogin`.
- External/malformed redirect values are blocked.

2. Input validation guards for sensitive flows
- Added `src/security/guards.ts` with Zod schemas:
  - Email
  - UUID
  - Invite token
  - Group invite payload
- Applied validation in:
  - `src/services/api.ts` (`sendGroupInvite`)
  - `src/pages/JoinGroup.tsx` (groupId/token validation)
  - `src/components/auth/LoginForm.tsx` (email format validation)

3. Client-side role guard utility
- Added `src/security/roles.ts`.
- Group admin check is now centralized with `isGroupAdmin`.
- Applied in `src/pages/GroupExpenses.tsx` to guard admin-only actions:
  - Delete group
  - Remove member
  - Invite actions
  - Share invite actions

4. Reduced sensitive production logging
- Updated `src/contexts/AuthContext.tsx`.
- Preference debug logs now run only in development mode (`import.meta.env.DEV`).

## Why this was built

- To prevent unsafe redirects after login.
- To reject malformed input early before sensitive operations.
- To reduce accidental privilege misuse from client-side action calls.
- To avoid exposing user/session preference details in production logs.

## How it works

1. Redirect safety
- Store redirect only through `setRedirectAfterLogin`.
- Read redirect only through `getRedirectAfterLogin`.
- Navigate only if redirect is an internal app path.

2. Validation
- User/link payload is parsed by schema guards.
- If invalid, operation is blocked and a safe error path is used.

3. Role checks
- Admin-only operations now return early when user is not admin.
- UI behavior stays the same; this is a safety guard for function calls too.

## How to test (step by step)

1. Redirect safety
- Open `/auth?returnUrl=https://evil.com`.
- Login should not navigate to external URL.
- Expected: user lands on app route (`/dashboard`).

2. Join link validation
- Open `/join?groupId=invalid`.
- Expected: shows invalid link status/error.

3. Join valid link flow
- Open `/join?groupId=<valid-uuid>`.
- If logged out: user is sent to auth.
- After login: user returns and joins group normally.

4. Login validation
- Try login form with invalid email format.
- Expected: inline error appears, request not sent.

5. Admin action guards
- Login as non-admin member in Group Expenses.
- Trigger admin action paths (delete/remove/share) from UI or console callback.
- Expected: guarded actions do not execute.

6. Logging behavior
- In development: auth preference debug logs still visible.
- In production build: detailed auth debug logs are not printed.

## Files changed

- `src/security/redirect.ts`
- `src/security/guards.ts`
- `src/security/roles.ts`
- `src/App.tsx`
- `src/pages/Auth.tsx`
- `src/contexts/AuthContext.tsx`
- `src/pages/JoinGroup.tsx`
- `src/pages/TripPlanView.tsx`
- `src/services/deepLinkHandler.ts`
- `src/services/api.ts`
- `src/components/auth/LoginForm.tsx`
- `src/pages/GroupExpenses.tsx`
