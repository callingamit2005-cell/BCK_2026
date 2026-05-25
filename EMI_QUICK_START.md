# EMI Loan Intelligence – Quick Start Testing

## 1️⃣ Apply Database Migration

```bash
# Option A: Using Supabase CLI
cd supabase
supabase db push

# Option B: Manual SQL in Supabase Dashboard
# Go to SQL Editor → New Query → Paste this:
```

```sql
ALTER TABLE public.emis ADD COLUMN IF NOT EXISTS loan_details JSONB;

CREATE INDEX IF NOT EXISTS idx_emis_loan_type 
ON public.emis USING GIN (loan_details);
```

---

## 2️⃣ Verify Files Are in Place

```
✅ src/types/emi.ts                      (Type definitions + calculation logic)
✅ src/utils/loanCalculator.ts           (Legacy file, can be removed if not needed)
✅ src/components/EMILoanDetailsBlock.tsx (Display component)
✅ src/pages/Dashboard.tsx               (Updated with modal + state)
✅ supabase/migrations/20260224_*        (Migration file)
```

---

## 3️⃣ Start the Dev Server

```bash
npm run dev
```

Navigate to: `http://localhost:5173/` → Go to **Dashboard** → **Planning** tab

---

## 4️⃣ Test Basic EMI (Backward Compatibility)

**Steps:**
1. Scroll to "EMI & Fixed Bills" section
2. Fill: Name: "Netflix" | Amount: "500" | Day: "15"
3. Click "Add Recurring Bill"

**Expected:** EMI added without loan details block ✅

---

## 5️⃣ Test EMI with Loan Details – Reducing Interest

**Steps:**
1. Click "+ Add EMI with Loan Details"
2. Fill modal:
   ```
   EMI Name:       Home Loan
   Amount:         80000
   Day:            5
   Provider Name:  HDFC
   Provider Type:  BANK (auto-selected)
   Loan Type:      Home Loan
   Interest Rate:  8.5
   Interest Type:  ✅ Standard EMI (Reducing) — Recommended (SELECT)
   Tenure Years:   20
   Tenure Months:  0
   Start Date:     2024-01-05 (3 months ago)
   ```
3. Click "Add EMI"

**Expected Result:**
```
✅ EMI card shows:
   - Name: "Home Loan", Amount: "₹80,000", Day: "5"
   - Green "Active" badge

✅ Loan Details Block shows:
   - Progress: ~15% (3 of 240 months)
   - Principal: ₹80,000
   - Remaining Balance: Slightly less than ₹80,000 (after 3 payments)
   - Total Interest: High amount (full tenure)
   - Months Remaining: 237
   
✅ Amortization Table (first 6 months):
   - Interest decreases each month (reducing pattern)
   - Principal increases each month
   - Balance decreases
```

**Verify Calculation:**
- After 3 months: OB should be slightly less than principal
- EMI = P × r × (1+r)^n / ((1+r)^n - 1)
- For Month 1: Interest = OB × monthly_rate (highest)
- For Month 6: Interest < Month 1 interest (reducing) ✅

---

## 6️⃣ Test EMI with Flat Interest

**Steps:**
1. Click "+ Add EMI with Loan Details"
2. Fill:
   ```
   EMI Name:       Car Loan
   Amount:         15000
   Provider Name:  Maruti Finance
   Provider Type:  APP
   Loan Type:      Car Loan
   Interest Rate:  12
   Interest Type:  ✅ Flat Interest (SELECT)
   Tenure Years:   5
   Start Date:     2025-01-01 (recent)
   ```
3. Click "Add EMI"

**Expected Result:**
```
✅ Amortization Table:
   - Interest is SAME every month (all rows same interest amt)
   - Interest does NOT decrease (unlike reducing)
   - Month 1 interest = Month 6 interest ✓
   
Flat Interest Formula:
   Total Interest = Principal × (Rate/100) × Years
                  = 15,000 × 0.12 × 5 = ₹9,000
   EMI = (Principal + Total Interest) / Tenure
       = (15,000 + 9,000) / 60 = ₹400
   
Interest per month = ₹9,000 / 60 = ₹150 (constant)
```

---

## 7️⃣ Test Edge Cases

### Zero Interest
```
Principal:   1,00,000
Rate:        0%
Tenure:      12 months

Expected:
- EMI = 100,000 / 12 = ₹8,333.33
- Interest = 0 every month
- All principal paid, no interest ✅
```

### Invalid Input (Negative Rate)
```
Interest Rate: -5

Expected:
- Should either:
  Option A: Show validation error
  Option B: Treat as 0%
- No NaN in calculations ✅
```

---

## 8️⃣ Compare Against Real Calculator

**Home Loan Example:**
```
Principal:  ₹50,00,000 (50 Lakh)
Rate:       8.5% p.a.
Tenure:     20 years (240 months)
```

**Steps:**
1. Go to: https://www.hdfc.com/emi-calculator (or SBI, ICICI)
2. Enter above values → Note the monthly EMI
3. In BachatKaro Dashboard:
   - Add EMI with Reducing Interest
   - Same values as above
   - Compare EMI in amortization table vs HDFC calculator

**Expected:**
- BachatKaro EMI ≈ HDFC calculator (within ±₹1 due to rounding)
- Example: HDFC shows ~₹47,265 → BachatKaro should show similar ✅

---

## 9️⃣ Test Data Persistence

**Steps:**
1. Add EMI with loan details
2. **Refresh page** (F5)
3. **Navigate** away (to Analytics) then back to Dashboard

**Expected:**
- EMI still present ✅
- Loan details block renders with same data ✅
- Calculations consistent (no floating-point errors) ✅
- Progress bar updates correctly ✅

---

## 🔟 Mobile & Dark Mode

**Mobile Test:**
1. Open DevTools (F12)
2. Toggle device toolbar (small screen)
3. View EMI loan details block

**Expected:**
- Text readable ✅
- Amortization table scrollable ✅
- Progress bar visible ✅
- No overflow ✅

**Dark Mode Test:**
1. Click sun/moon icon (top right)
2. Toggle Light ↔ Dark

**Expected:**
- Text contrast sufficient ✅
- Colors from `dark:` classes applied ✅
- No white text on light background ✅

---

## 🔧 Debugging Checklist

| Issue | Solution |
|-------|----------|
| EMI not saving | Check Supabase connection, RLS policies |
| NaN in calculations | Verify all fields populated: principal, rate, tenure, monthsPaid |
| Loan block not showing | Check if `loanDetails` exists in EMI entry |
| Wrong interest values | Verify `interestCalculationType` field is 'REDUCING' or 'FLAT' |
| Progress bar stuck at 0% | Ensure `startDate` is valid ISO format (YYYY-MM-DD) |
| Modal doesn't open | Check browser console for errors |

---

## ✅ Final Checklist Before Production

- [ ] Migration applied (loan_details column exists)
- [ ] Basic EMI works (backward compatible)
- [ ] Reducing interest calculations correct
- [ ] Flat interest calculations correct
- [ ] Edge cases handled (zero interest, invalid data)
- [ ] Data persists after reload
- [ ] Mobile responsive
- [ ] Dark mode working
- [ ] Verified against real bank calculator
- [ ] No console errors
- [ ] Performance acceptable (< 500ms)

---

## 📊 Sample Test Data

```json
{
  "id": "uuid-1",
  "name": "Home Loan",
  "amount": 80000,
  "emi_day": 5,
  "loan_details": {
    "loanAmount": 8000000,
    "loanType": "Home Loan",
    "providerName": "HDFC",
    "providerType": "BANK",
    "interestRateAnnual": 8.5,
    "interestCalculationType": "REDUCING",
    "tenureMonths": 240,
    "startDate": "2024-01-05"
  }
}
```

---

## 🚀 Next Steps

1. **Run tests** ↑ (above)
2. **Fix any issues** (debug using checklist)
3. **Commit changes** to git
4. **Deploy** to staging/production

---

**Last Updated:** Feb 24, 2026  
**Feature Status:** Ready for Testing ✅
