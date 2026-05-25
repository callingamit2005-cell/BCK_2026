# BachatKaro Critical Protected Architecture Rules

The following systems are **PRODUCTION-LOCKED** and MUST NOT be modified unless the task explicitly requires it.

## Locked Systems

* Settlement engine: `computeBalances()`, `simplifyDebts()`
* Identity architecture: `member_id` as primary identity
* Ghost member handling: `user_id = null` for ghost members
* Database contracts: `insert_group_expense_with_split` RPC contract
* Persistence logic: `expense_splits` persistence
* Financial schema: `group_expenses` schema
* Mathematical logic: Balance normalization and debt simplification

## Strict Mandates

1. **Identity Integrity**: NEVER replace `member_id` with `user_id`. Settlement identity MUST ALWAYS use `member.id` / `member_id`.
2. **Ghost Members**: Support for ghost members is mandatory. They intentionally use `user_id = null`.
3. **RPC Stability**: NEVER modify RPC argument order or existing parameter names in `insert_group_expense_with_split`.
4. **Financial Accuracy**: NEVER modify financial calculations or math engines without absolute forensic justification.
5. **Security Persistence**: NEVER modify working RLS/security logic unless the task explicitly requires it.
6. **Data Flow**: NEVER modify working ledger rendering or established data flow patterns.
7. **Observability**: NEVER remove forensic logs unless explicitly requested by the user.
8. **Anti-Refactoring**: NEVER refactor protected systems for "cleanup", "styling", or "optimization" purposes.
9. **Logic Isolation**: UI and styling changes must remain strictly isolated from financial and business logic.

## Modification Protocol

Before modifying ANY protected system, you MUST:
1. Explain the **exact reason** for the change.
2. Explain the **blast radius** (what else might be affected).
3. Provide a **rollback strategy**.
4. **Verify** that no existing logic or ghost-member support breaks.

**If the task does not explicitly require touching protected systems: DO NOT TOUCH THEM.**

---

# Reference: BK-GOV-PRO-V1
## 14. STRICT AI EXECUTION GOVERNANCE RULES

AI EXECUTION MODE:
* Temperature mindset = 0.0
* Deterministic engineering only
* No creative refactors
* No speculative optimization
* No architecture invention
* No broad modernization
* No unnecessary abstractions
* No hidden side-effect changes
* No automatic dependency rewrites
* No formatting-only rewrites
* No unrelated code cleanup
* No touching unrelated systems

AI must behave as:
* enterprise fintech stabilization engineer
  NOT:
* feature experimenter
* architecture rewriter
* creative optimizer

## 15. SURGICAL CHANGE POLICY

ALL fixes must be:
* surgical
* isolated
* deterministic
* regression-safe

Before changing ANY file:
1. Identify dependency graph
2. Identify blast radius
3. Identify connected financial systems
4. Verify backward compatibility
5. Verify offline-first consistency
6. Verify sync integrity
7. Verify integer paisa safety
8. Verify rollback safety

DO NOT:
* rename systems unnecessarily
* move files unnecessarily
* rewrite stable hooks
* rewrite shared state systems
* alter stable sync flows
* alter settlement math
* alter idempotency logic

## 16. PROTECTED CORE SYSTEMS (LOCKED)

The following systems are considered PROTECTED FINTECH CORE.
DO NOT MODIFY unless absolutely required.

LOCKED SYSTEMS:
* simplifyDebts.ts
* currencyFormatter.ts
* paymentOrchestrator.ts
* sqlite.ts idempotency generation
* AuthContext.tsx
* settlement calculation engine
* transaction integer math logic
* offline queue replay core
* sync recovery core

If modification becomes absolutely necessary:
* explain why
* explain risk
* explain rollback strategy
* explain fintech impact
* minimize change scope

## 17. PHASE-BASED EXECUTION PROTOCOL

Implementation MUST occur PHASE BY PHASE.

NEVER:
* combine multiple unrelated fixes
* continue automatically to next phase
* perform hidden extra work

FOR EACH PHASE:
1. Deep forensic scan
2. Root cause analysis
3. Minimal safe implementation
4. Regression validation
5. Offline validation
6. Sync validation
7. Memory leak validation
8. Documentation update
9. STOP immediately

After each phase output ONLY:
"PHASE COMPLETE — TEST NOW"

WAIT for verification before continuing.

## 18. FORENSIC DEBUGGING REQUIREMENTS

For EVERY bug:
Trace COMPLETE lifecycle:
UI → Hook → Context → Service → SQLite → Queue → Sync → Supabase → UI Refresh

MANDATORY INVESTIGATION:
* stale state
* stale closures
* race conditions
* retry storms
* duplicate sync
* rollback failure
* optimistic update failure
* invalid query invalidation
* memory leaks
* listener leaks
* Android lifecycle failures
* background/foreground corruption
* app restart recovery
* offline replay consistency
* duplicate transaction protection

## 19. MEMORY LEAK + LIFECYCLE GOVERNANCE

ALL systems must be:
* memory-leak free
* lifecycle safe
* Android process recreation safe

VERIFY:
* listener cleanup
* timer cleanup
* subscription cleanup
* WebView cleanup
* microphone cleanup
* React Query cleanup
* cache cleanup
* retry cleanup
* background task cleanup

Prevent:
* render storms
* stale subscriptions
* stale cache growth
* infinite retries
* duplicate listeners
* unbounded memory growth

## 20. ENTERPRISE DOCUMENTATION MODE

Documentation generation is MANDATORY.

For EVERY change:
document:
* root cause
* affected systems
* affected files
* old behavior
* new behavior
* rollback logic
* sync impact
* offline behavior
* fintech impact
* edge cases handled
* regression risks
* future extension guidance
* protected invariants

MANDATORY DOCUMENT FILES:
* SYSTEM_ARCHITECTURE.md
* SQLITE_SYNC_FLOW.md
* OFFLINE_RECOVERY_FLOW.md
* MEMORY_LEAK_PREVENTION.md
* ERROR_HANDLING_MATRIX.md
* FINTECH_SAFETY_RULES.md
* CHANGELOG_STABILIZATION.md

## 21. MANDATORY CODE COMMENTING POLICY

ALL critical code must explain:
* WHY logic exists
* fintech safety assumptions
* sync assumptions
* rollback assumptions
* idempotency assumptions
* lifecycle assumptions
* offline recovery expectations

DO NOT write vague comments.

Comments must help:
* future developers
* future AI systems
* future debugging
* future scalability

## 22. REGRESSION PREVENTION RULES

Before finalizing ANY phase:
VERIFY:
* no duplicate transactions
* no amount corruption
* no floating-point money logic
* no stale UI states
* no duplicate sync queue entries
* no broken offline behavior
* no broken Android lifecycle recovery
* no broken rollback behavior
* no memory leak introduced
* no unnecessary rerenders introduced

## 23. FINAL OUTPUT RULES

After EVERY phase provide:
1. Root cause analysis
2. Exact files modified
3. Exact systems affected
4. Why issue occurred
5. Fix applied
6. Regression checks
7. Offline verification
8. Sync verification
9. Memory leak verification
10. Manual testing checklist
11. Future developer notes

FINAL STOP RULE:
After implementation STOP immediately and output ONLY:
"PHASE COMPLETE — TEST NOW"

DO NOT continue automatically.
WAIT for human verification.

---

# Reference: BK-GOV-PLANNING-V1
## 24. PLANNING ENGINE PRODUCTION LOCK (LOCKED)

The following systems are VERIFIED and considered production-stable.
LOCK DATE: 2026-05-18

LOCKED SYSTEMS:
* Income Engine Save Flow
* Safe-Spend Limit Save Flow
* Supabase UPSERT Contract
* SQLite ↔ Supabase Schema Parity
* UNIQUE(user_id, month_year) overwrite model
* Audit-versioning bypass for salaries/budgets
* Paisa storage architecture
* Rupee display normalization
* Monthly Snapshot aggregation logic
* Android ↔ Web Planning parity
* Refresh persistence behavior
* Duplicate prevention logic

## 25. PLANNING ARCHITECTURE CONTRACT

STORAGE STANDARD:
* Format: PAISA INTEGER
* Mandate: DO NOT convert DB storage to rupees.

DISPLAY STANDARD:
* Format: RUPEES
* Mandate: convertToRupees() must occur EXACTLY ONCE at the UI/render edge.

OVERWRITE MODEL:
* Tables: salaries, budgets
* Strategy: UNIQUE(user_id, month_year)
* Logic: Latest overwrite wins; append-only audit logic disabled for these tables.

## 26. PLANNING FORENSIC RULES

Before changing ANY planning-related code:
1. Perform dependency impact scan.
2. Verify no double normalization.
3. Verify no duplicate aggregation (check source === 'salary' exclusion).
4. Verify overwrite semantics preserved.
5. Verify Android + Web parity.
6. Verify no duplicate DB rows.
7. Verify no trigger recursion.
8. Preserve paisa integer storage.

PROHIBITED ACTIONS:
* DO NOT convert planning DB storage to rupees.
* DO NOT remove UNIQUE(user_id, month_year).
* DO NOT re-enable audit append logic for salaries/budgets.
* DO NOT globally rewrite currency utilities.
* DO NOT merge transaction normalization with planning normalization.
* DO NOT modify trigger behavior without forensic proof.

---

# Reference: BK-GOV-AI-V1
## 27. SMART ADVISOR PRODUCTION LOCK (LOCKED)

The following systems are VERIFIED and considered production-stable.
LOCK DATE: 2026-05-18

LOCKED SYSTEMS:
* AI JSON Parsing & Sanitization
* Groq Provider (JSON Mode enforcement)
* AI Router (Timeout & Latency tracking)
* Schema Validation (Strict length & type checks)
* Rule-based Fallback Engine
* AITelemetry Observability Layer

## 28. SMART ADVISOR ARCHITECTURE CONTRACT

BOUNDED PAYLOAD POLICY:
* Max Tokens: 400 (Prevent verbose/hallucinated advice)
* Max String Length: 300 (Strictly enforced in validator)
* Memory Safety: Session-scoped primitive metrics only.

VALIDATION MANDATE:
* Every AI response MUST pass through `validateStructuredAIAdvice`.
* Required keys must be present or filled from fallback logic.
* Truncation at the validator edge is mandatory.

RELIABILITY POLICY:
* Timeout: 15,000ms (Patience for low-end networks).
* Fallback-First: Display rule-based advice immediately on failure/timeout.
* Abort Safety: All fetches must use `AbortSignal` to prevent orphaned sockets.

## 29. SMART ADVISOR FORENSIC RULES

Before changing ANY AI-related code:
1. Perform dependency impact scan.
2. Verify no raw `JSON.parse` (must use `safeJsonParse`).
3. Verify metrics accumulation remains session-scoped.
4. Verify development-only logging is guarded.
5. Verify Android unmount/background fetch safety.
6. Verify no sensitive payload leakage in logs.

PROHIBITED ACTIONS:
* DO NOT remove sanitization regex.
* DO NOT bypass schema validation.
* DO NOT use persistent storage for AI metrics.
* DO NOT reduce timeout below 10s without forensic network proof.
* DO NOT implementation broad AI infrastructure refactors.

---

# Reference: BK-GOV-AI-ORCHESTRATION-V1
## 30. AI ORCHESTRATION & RENDER STABILIZATION LOCK (LOCKED)

The following systems are VERIFIED and considered production-stable.
LOCK DATE: 2026-05-18

LOCKED SYSTEMS:
* AI Fingerprint Gating (Dashboard)
* In-flight AI Request Locking
* Smart Advisor Orchestration Lifecycle
* Groq Request Deduplication
* AI Timeout Governance
* JSON Sanitization Layer
* Structured AI Validation Layer
* Rule-Based AI Fallback Layer
* Dashboard AI Trigger Guards
* Ledger Row Render Stabilization
* React.memo Deep Comparator Strategy
* Android ↔ Web AI Parity
* Enterprise Telemetry Counters
* Render-to-AI Isolation Contract
* Token Burn Mitigation Architecture

## 31. AI ORCHESTRATION GOVERNANCE LOCK

DO NOT:
* DO NOT tie AI execution directly to raw render cycles.
* DO NOT invoke AI from unstable object identities (use fingerprints).
* DO NOT remove in-flight request locks.
* DO NOT trigger AI from passive rerenders (e.g. scroll, tab switch).
* DO NOT replace deterministic orchestration with broad effects.
* DO NOT remove validator enforcement or bypass sanitizer pipeline.
* DO NOT log sensitive financial payloads in production.
* DO NOT remove fallback-first safety architecture.
* DO NOT introduce unbounded memo caches.
* DO NOT remove row-level deep-memoization protections.
* DO NOT optimize render orchestration without forensic profiling proof.

## 32. MANDATORY ARCHITECTURAL PRINCIPLES

AI EXECUTION MUST REMAIN:
* Deterministic & Bounded
* Memory-safe (Session-scoped primitives)
* Request-deduplicated
* Render-isolated
* Fallback-safe & Fintech-safe
* Android-safe & Low-token-burn
* Low-end-device compatible

## 33. MANDATORY PERFORMANCE CONTRACT

Expected Stable Runtime:
* ONE AI request per meaningful financial state mutation.
* ZERO passive AI storms.
* ZERO duplicate concurrent AI calls.
* ZERO render-coupled orchestration loops.
* Bounded rerenders & Bounded token usage.

---

# Reference: BK-GOV-PAGINATION-REPORTING-V1
## 34. PAGINATION & REPORTING PRODUCTION LOCK (LOCKED)

The following systems are VERIFIED and considered production-stable.
LOCK DATE: 2026-05-18

LOCKED SYSTEMS:
* RecentExpenses Pagination Windowing
* 7-Per-Page Transaction Rendering Contract
* Dashboard → DateFilter Export Binding
* Filtered Export Dataflow
* Inclusive End-Date Boundary Logic (endOfDay)
* Custom Date Export Filtering
* Android ↔ Web Pagination Parity
* Report Scope Isolation Contract
* UI-to-Export Filter Consistency
* Bounded Ledger Rendering

## 35. PAGINATION & REPORTING GOVERNANCE LOCK

DO NOT:
* DO NOT increase RecentExpenses page size without profiling proof.
* DO NOT bypass filteredViewData during export generation.
* DO NOT export directly from allUnifiedTransactions.
* DO NOT reintroduce exclusive end-date filtering.
* DO NOT compare customTo using raw midnight boundaries.
* DO NOT break Android ↔ Web pagination parity.
* DO NOT remove bounded ledger rendering protections.
* DO NOT modify pagination slicing without forensic validation.
* DO NOT optimize pagination using speculative virtualization.
* DO NOT refactor export pipeline without report correctness verification.

## 36. MANDATORY ARCHITECTURAL PRINCIPLES

RECENT EXPENSES MUST REMAIN:
* Bounded & Deterministic
* Memory-safe & Low-end-device compatible
* Render-stable & Pagination-safe

EXPORT SYSTEM MUST REMAIN:
* Filter-accurate & Inclusive-date-safe
* Fintech-safe & Scope-correct
* UI-consistent

## 37. MANDATORY PERFORMANCE CONTRACT

Expected Stable Runtime:
* EXACTLY 7 transactions per page.
* Stable pagination navigation.
* Bounded render surface.
* Export reflects active UI filters exactly.
* Custom date exports include same-day transactions.
* ZERO export scope leakage.





