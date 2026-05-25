# Voice Autosave Behavior

This document explains how voice input maps to fields and when auto-save runs.

## Scope

- Dashboard: Add New Expense popup
- Group Expenses: Add Expense card

Manual entry behavior is unchanged.

## Parser File

- `src/services/voiceExpenseParser.ts`

Exports:

- `parseDashboardVoice(text)`
- `parseGroupVoice(text, membersList)`

## Dashboard Mapping Rules

Input fields:

- Amount (required)
- Payment Mode
- Category
- Notes (optional)

How mapping works:

1. Amount is extracted using number regex.
2. Payment mode is detected by keywords (`upi`, `cash`, `card`, `net banking`, etc).
3. Category is detected by keywords (`food`, `petrol/fuel`, `groceries`, etc).
4. Remaining unmatched text is written to `Notes`.
5. If category is not found, free words naturally remain in `Notes`.

Examples:

- `500 UPI petrol` -> amount `500`, payment `UPI`, category `Travel`
- `300 UPI pani` -> amount `300`, payment `UPI`, notes `pani`

## Group Mapping Rules

Input fields:

- Title
- Amount
- Paid By
- Split (kept as existing default logic, not changed by voice)

How mapping works:

1. Amount is extracted using number regex.
2. Member name is detected from `membersList` using exact/prefix/fuzzy match.
3. Remaining words become `Title`.
4. Noise words (`paid`, `by`, `for`, etc.) are removed from title output.

Examples:

- Members: Rahul, Amit
- `Rahul 500 dinner` -> paidBy `Rahul`, amount `500`, title `dinner`
- `500 by Amit petrol` -> paidBy `Amit`, amount `500`, title `petrol`

## 5-Second Auto-Save Timer

### Dashboard

- Every new voice transcript chunk resets a 5-second timer.
- If user stays silent for 5 seconds and amount is valid, auto-save is triggered.
- If user speaks again before timer ends, timer restarts from 5.

### Group Expenses

- Every new voice transcript chunk resets a 5-second timer.
- Auto-save starts only when:
  - amount is valid
  - paidBy is selected/mapped
- If user speaks again before timer ends, timer restarts from 5.

## Fallback Behavior

- Unknown dashboard words go to `Notes`.
- If no reliable member match is found in group mode, `Paid By` is not auto-selected.
- Existing manual save remains available at all times.

## Quick Test Checklist

1. Dashboard:
   - Speak `500 UPI petrol`
   - Check amount/payment/category fill correctly
   - Wait 5s and confirm auto-save fires
2. Dashboard fallback:
   - Speak `300 UPI pani`
   - Check `pani` goes to Notes
3. Group:
   - With members Rahul/Amit, speak `Rahul 500 dinner`
   - Check paidBy/amount/title mapping
   - Wait 5s and confirm auto-save fires
4. Random order:
   - Speak `500 by Amit snacks`
   - Confirm fields still map correctly
