/**
 * aiAdvisorEngine.ts
 * 
 * Deterministic AI Advisor Logic for BachatKaro.
 * Analyzes transaction patterns to provide spending insights.
 * 
 * Logic:
 * 1. Identify top spending category for the current month.
 * 2. Compare total spending of current month vs last month.
 * 3. Generate savings suggestions based on spending delta.
 */

import { isThisMonth, subMonths, isSameMonth } from "date-fns";

export interface AIAdvice {
  topCategory: string;
  message: string;
  type: "warning" | "good";
}

/**
 * Generates deterministic financial advice based on transaction history.
 * @param transactions Array of unified transactions (amount in paisa)
 */
export const getAIAdvisorAdvice = (transactions: any[]): AIAdvice => {
  const now = new Date();
  const lastMonth = subMonths(now, 1);

  // 1. Filter expenses
  const expenses = transactions.filter(
    (t) => t.type === "expense" || t.direction === "debit"
  );

  if (expenses.length === 0) {
    return {
      topCategory: "None",
      message: "No expense data detected. Start logging to get AI insights!",
      type: "good",
    };
  }

  // 2. Aggregate current month data
  const currentMonthExpenses = expenses.filter((t) =>
    isThisMonth(new Date(t.date))
  );
  
  const currentMonthTotal = currentMonthExpenses.reduce(
    (sum, t) => sum + (Number(t.amount) || 0),
    0
  );

  // 3. Aggregate last month data
  const lastMonthExpenses = expenses.filter((t) =>
    isSameMonth(new Date(t.date), lastMonth)
  );
  
  const lastMonthTotal = lastMonthExpenses.reduce(
    (sum, t) => sum + (Number(t.amount) || 0),
    0
  );

  // 4. Find Top Category for Current Month
  const categoryMap: Record<string, number> = {};
  currentMonthExpenses.forEach((t) => {
    const cat = t.category || "Others";
    categoryMap[cat] = (categoryMap[cat] || 0) + (Number(t.amount) || 0);
  });

  let topCategory = "Others";
  let maxAmount = 0;
  Object.entries(categoryMap).forEach(([cat, amt]) => {
    if (amt > maxAmount) {
      maxAmount = amt;
      topCategory = cat;
    }
  });

  // 5. Monthly Comparison Logic
  const diffPaisa = currentMonthTotal - lastMonthTotal;
  const diffRupees = Math.abs(Math.floor(diffPaisa / 100));
  const suggestionRupees = Math.floor(diffRupees * 0.75);

  // 6. Generate Deterministic Message
  if (currentMonthTotal > lastMonthTotal && lastMonthTotal > 0) {
    return {
      topCategory,
      message: `${topCategory} spending is ₹${diffRupees} higher than last month. Target a ₹${suggestionRupees} reduction next month.`,
      type: "warning",
    };
  }

  if (currentMonthTotal <= lastMonthTotal && currentMonthTotal > 0) {
    return {
      topCategory,
      message: `Excellent! Your spending is ₹${diffRupees} lower than last month. Keep up the great work!`,
      type: "good",
    };
  }

  return {
    topCategory,
    message: `Your top spending category this month is ${topCategory}. Maintain your budget to stay on track!`,
    type: "good",
  };
};
