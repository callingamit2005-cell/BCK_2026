# EMI Loan Intelligence Feature – Testing Guide

This guide helps you manually verify the new EMI loan intelligence functionality. Follow these steps to ensure the feature works correctly and does not break existing functionality.

---

## Prerequisites

### 1. Database Migration

Ensure the `emis` table has a new JSONB column `loan_details`. Run the following SQL in your Supabase SQL editor:

```sql
ALTER TABLE public.emis ADD COLUMN IF NOT EXISTS loan_details JSONB;

COMMENT ON COLUMN public.emis.loan_details IS 'Optional JSON object containing detailed loan information';

CREATE INDEX IF NOT EXISTS idx_emis_loan_type 
ON public.emis USING GIN (loan_details);
```

Or apply the pre-built migration:
- File: `supabase/migrations/20260224_add_loan_details_to_emis.sql`
- Run via Supabase CLI: `supabase db push`

### 2. Dependencies Installed

- ✅ Component: `src/components/EMILoanDetailsBlock.tsx`
- ✅ Types: `src/types/emi.ts`
- ✅ Utilities: `src/utils/loanCalculator.ts`
- ✅ Dashboard: `src/pages/Dashboard.tsx` (updated)

---

## Test Scenarios

### ✅ Test 1: Add Simple EMI (backward compatibility)

**Objective:** Verify that existing EMI functionality still works without loan details.

**Steps:**
1. Navigate to Dashboard → Planning tab
2. Scroll to "EMI & Fixed Bills" section
3. Fill in:
   - Name: "Phone EMI"
   - Amount: "5000"
   - Day: "15"
4. Click "Add Recurring Bill"

**Expected Result:**
- EMI appears in the list below
- Total Monthly EMI updates to ₹5000
- No loan details block is shown (as none were provided)
- ✅ PASS: Basic EMI functionality preserved

---

### ✅ Test 2: Add EMI with Full Loan Details – Standard (Reducing) Interest

**Objective:** Verify detailed EMI with reducing-balance calculations works correctly.

**Steps:**
1. Navigate to Dashboard → Planning tab
2. Click "Add EMI with Loan Details" button
3. Fill modal form:
   - **EMI Name:** "Home Loan"
   - **Amount (monthly payment):** "80000"
   - **Day:** "5"
   - **Provider Name:** "HDFC"
   - **Provider Type:** "BANK" (auto-selected)
   - **Loan Type:** "Home Loan"
   - **Interest Rate:** "8.5"
   - **Interest Type:** "Standard EMI (Reducing)" ← **SELECT**
   - **Tenure Years:** "20"
   - **Tenure Months:** "0"
   - **Start Date:** "2024-01-05" (3 months ago to show progress)
4. Click "Add EMI" button

**Expected Result:**
- EMI is created with loan details stored in JSONB
- EMI card shows:
  - ✅ Basic info: "Home Loan", "₹80000", "Day 5"
  - ✅ Green "Active" badge
  - ✅ Loan Details Block with:
    - Progress bar showing ~15% complete (3 of 240 months)
    - Grid with: Principal, Remaining Balance, Total Interest, Months Remaining
    - Amortization preview table showing first 6 months with:
      - Month 1: Higher interest (₹595), lower principal
      - Month 6: Lower interest, higher principal (reducing pattern ✓)
    - Correct calculations:
      - **Principal remaining:** Should be slightly less than original for 3 months paid

**Manual Calculation Check:**
```
Principal: ₹80,000
Annual Rate: 8.5% = 0.70833% monthly
Tenure: 240 months
Monthly EMI = 80000 × 0.0070833 × (1.0070833)^240 / ((1.0070833)^240 - 1)
           ≈ ₹64,661 (approximate, will show actual in table)
After 3 payments, remaining should be slightly less than ₹80,000
```

- ✅ PASS: Reducing-balance calculations correct

---

### ✅ Test 3: Add EMI with Flat Interest

**Objective:** Verify flat interest EMI calculation differs from reducing balance.

**Steps:**
1. Click "Add EMI with Loan Details"
2. Fill form:
   - **EMI Name:** "Car Loan"
   - **Amount (monthly):** "15000"
   - **Provider Name:** "Maruti Finance"
   - **Provider Type:** "APP"
   - **Loan Type:** "Car Loan"
   - **Interest Rate:** "12"
   - **Interest Type:** "Flat Interest" ← **SELECT**
   - **Tenure Years:** "5"
   - **Tenure Months:** "0"
   - **Start Date:** "2025-12-01" (recent)
3. Click "Add EMI"

**Expected Result:**
- Flat Interest EMI is added
- Loan Details Block shows:
  - ✅ All months have identical interest amount (flat pattern)
  - ✅ Interest does **NOT** decrease with months
  - ✅ Final month balance = 0

**Comparison with Reducing:**
```
Flat Interest Example:
Month 1: Interest = ₹xxx (fixed)
Month 6: Interest = ₹xxx (same as month 1)

Reducing Interest Example:
Month 1: Interest = ₹622 (highest)
Month 6: Interest = ₹610 (lower than month 1)
```

- ✅ PASS: Flat interest correctly shows constant interest

---

### ✅ Test 4: Zero Interest Rate

**Objective:** Verify division-by-zero edge case is handled.

**Steps:**
1. Click "Add EMI with Loan Details"
2. Fill form with:
   - **Interest Rate:** "0"
   - All other fields normal
3. Click "Add EMI"

**Expected Result:**
- ✅ EMI = Principal ÷ Tenure (no interest calculation)
- ✅ Amortization shows equal principal payments each month
- ✅ Interest column = 0 throughout
- ✅ No errors or NaN values in UI

---

### ✅ Test 5: Invalid/Edge Cases

#### Test 5A: Negative Interest Rate
**Input:** Interest Rate = "-5"

**Expected:**
- ❌ Should show validation error (optional: prevent submit)
- Or treat as 0% if business logic allows

#### Test 5B: Zero Tenure
**Input:** Tenure Years = "0", Tenure Months = "0"

**Expected:**
- ❌ Should show validation error (at least 1 month required)

#### Test 5C: Missing Start Date
**Input:** All fields filled, but Start Date is empty

**Expected:**
- ✅ EMI still created; start date defaults to today (or null is stored)
- ✅ Progress bar calculation uses today's date

#### Test 5D: Very Large Loan
**Input:** Principal = "10,000,000", Tenure = "30 years", Interest = "7.5%"

**Expected:**
- ✅ Calculations remain accurate (no overflow)
- ✅ Loan details block renders without lag
- ✅ Amortization table shows first 6 months correctly

---

### ✅ Test 6: Multiple EMIs with Mixed Details

**Objective:** Verify multiple EMIs coexist and don't interfere.

**Steps:**
1. Add 3 EMIs:
   - Simple: "Phone" ₹5,000 (no details)
   - Reducing: "Home" ₹80,000 with 8.5% interest
   - Flat: "Car" ₹15,000 with 12% interest
2. Verify each in the list

**Expected Result:**
- ✅ Total EMI = ₹100,000
- ✅ Each card shows only its own information
- ✅ Only "Home" and "Car" show loan details blocks
- ✅ "Phone" shows no loan block (backward compatible)
- ✅ Delete one EMI; total updates correctly

---

### ✅ Test 7: Edit & Delete EMI with Loan Details

**Objective:** Verify CRUD operations in modal.

**Steps:**

#### Delete Operation:
1. Find an EMI with loan details
2. Click trash icon on its card
3. Confirm deletion

**Expected:**
- ✅ EMI removed from list
- ✅ Total EMI recalculates
- ✅ No orphaned data in Supabase

#### Edit Operation (Future Enhancement):
- Currently modal only adds; edit would require additional implementation
- Note for later: Add edit dialog that pre-fills form

---

### ✅ Test 8: Data Persistence (Reload & Navigation)

**Objective:** Verify EMI data is persisted in Supabase and survives page reload.

**Steps:**
1. Add EMI with loan details
2. Note the values in loan details block
3. Refresh the page (F5)
4. Navigate away (to Analytics) and back to Dashboard
5. Open Planning tab

**Expected Result:**
- ✅ EMI still present after reload
- ✅ Loan details block renders with same data
- ✅ Calculations are identical (no rounding errors)
- ✅ Progress bar updates based on current date

---

### ✅ Test 9: Mobile Responsiveness

**Objective:** Verify EMI loan details block is mobile-friendly.

**Steps:**
1. Add EMI with loan details
2. Open DevTools (F12)
3. Toggle device toolbar to mobile (375px width)
4. View loan details block at different breakpoints

**Expected Result:**
- ✅ Grid layout switches from 2 columns to 1 column on small screens
- ✅ Amortization table is scrollable horizontally (not cut off)
- ✅ Text sizes remain readable
- ✅ Buttons and inputs are 44px+ tap targets
- ✅ No horizontal overflow

---

### ✅ Test 10: Dark Mode Support

**Objective:** Verify all new components support dark mode.

**Steps:**
1. Add EMI with loan details
2. Click sun/moon icon in top right
3. Toggle between Light and Dark modes

**Expected Result:**
- ✅ Loan details block has appropriate dark background
- ✅ Text contrast is sufficient in both modes
- ✅ Colors from `dark:` Tailwind classes are applied
- ✅ No white text on light background in dark mode
- ✅ Progress bar is visible in dark mode

---

### ✅ Test 11: Performance – Large Amortization Schedule

**Objective:** Verify utility functions perform well with large tenures.

**Steps:**
1. Add EMI with:
   - Tenure: 30 years (360 months)
   - Start Date: "2000-01-01" (past, so all months completed)
2. Check loan details block loads quickly

**Expected Result:**
- ✅ Block renders in < 500ms
- ✅ Only 6-month preview shown (not full 360)
- ✅ No browser lag or stuttering
- ✅ Memoization working (check React DevTools if available)

---

### ✅ Test 12: Calculations Accuracy – Real Loan Example

**Objective:** Verify calculations match real bank EMI calculator.

**Test Case:** HDFC Home Loan
```
Principal:    ₹50,00,000 (50 lakh)
Rate:         8.5% p.a.
Tenure:       20 years (240 months)
```

**Steps:**
1. Go to HDFC website EMI calculator
2. Enter above values → Note monthly EMI
3. Add same loan in BachatKaro with 8.5% Reducing Interest
4. Compare EMI shown in amortization table

**Expected:**
- ✅ BachatKaro EMI ≈ HDFC calculator (within ±₹1 due to rounding)
- ✅ After 12 months, remaining balance matches reducing-balance formula
- ✅ Total interest = (Monthly EMI × 240) - Principal

**Sample Calculation:**
```
P = 50,00,000
r = 8.5% / 12 = 0.70833% = 0.0070833
n = 240

EMI = 50,00,000 × 0.0070833 × (1.0070833)^240 / ((1.0070833)^240 - 1)
    = ₹47,265 (approx)

Total Payment = ₹47,265 × 240 = ₹1,13,43,600
Total Interest = ₹1,13,43,600 - ₹50,00,000 = ₹63,43,600
```

- ✅ PASS if BachatKaro shows similar values

---

## Regression Testing

### ✅ Test R1: Dashboard Still Loads

**Expected:** No console errors, all tabs render.

### ✅ Test R2: Other Features Work

- Add expense → works
- Add group expense → works
- View analytics → works
- Savings goals → works
- Trip planning → works

### ✅ Test R3: Offline Mode

1. Disconnect internet (DevTools Network tab → Offline)
2. Try to add EMI
3. Reconnect internet

**Expected:**
- Toast showing "Offline Mode 🔴"
- EMI form disabled or shows error
- On reconnect, "Back Online" toast + data syncs

---

## Browser Compatibility

Test on:
- ✅ Chrome/Chromium (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile Safari (iOS)
- ✅ Chrome Mobile (Android)

---

## Final Checklist

- [ ] Migration applied to Supabase
- [ ] All 12 tests passed
- [ ] No console errors
- [ ] Mobile responsive
- [ ] Dark mode working
- [ ] Calculations verified against real data
- [ ] Backward compatibility maintained (simple EMIs work)
- [ ] Performance acceptable (< 1s load time)
- [ ] Ready for production

---

## Troubleshooting

### Problem: "loan_details is not a function"
**Solution:** Ensure `src/types/emi.ts` is imported in components.

### Problem: Amortization table shows NaN
**Solution:** Check that `loanDetails` object has all required fields:
```json
{
  "principal": number,
  "annualInterestRate": number,
  "totalMonths": number,
  "startDate": "YYYY-MM-DD"
}
```

### Problem: EMI not saving to database
**Solution:**
1. Check browser console for errors
2. Verify Supabase connection (check `isOnline` flag)
3. Check RLS policies on `emis` table
4. Verify `loan_details` JSONB column exists

### Problem: Progress bar stuck at 0%
**Solution:** Ensure `startDate` is in the past and valid ISO format.

---

## Next Steps (Future Enhancements)

- [ ] Add edit EMI with details modal
- [ ] Export amortization schedule as CSV/PDF
- [ ] Show overpayment impact (if user pays extra)
- [ ] Prepayment calculator
- [ ] EMI comparison tool
- [ ] Integration with bank APIs for real loan data

---

**Last Updated:** February 24, 2026  
**Status:** Ready for Testing
