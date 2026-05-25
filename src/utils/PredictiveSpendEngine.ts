/**
 * PredictiveSpendEngine.ts
 * ────────────────────────
 * Calculates projected month-end expenditure based on current burn rate.
 * Uses integer math (PAISA) to maintain fintech precision standards.
 */

/**
 * Calculate Projected Spend
 * Formula: (Total Spend / Days Passed) * Total Days in Month
 * 
 * @param currentMonthSpendPaise - Total spent in current month (in paisa)
 * @returns Projected month-end spend (in paisa)
 */
export const calculateProjectedSpend = (currentMonthSpendPaise: number): number => {
  const now = new Date();
  const daysPassed = now.getDate();
  
  // Get total days in current month
  const totalDaysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  if (daysPassed === 0) return currentMonthSpendPaise;

  // burnRate = currentSpend / daysPassed
  // prediction = burnRate * totalDaysInMonth
  
  // 🔒 FINTECH RULE: Keep PAISA unit throughout.
  // We multiply first then divide to maintain precision in integer land.
  const prediction = Math.round((currentMonthSpendPaise * totalDaysInMonth) / daysPassed);

  return prediction;
};

/**
 * Get Analysis Insight
 * Compares current month projection with historical average.
 * 
 * @param last30DaysSpendPaise - Sum of last 30 days transactions
 * @param projectionPaise - Calculated projection from current month
 */
export const getSpendInsight = (last30DaysSpendPaise: number, projectionPaise: number) => {
  const diff = projectionPaise - last30DaysSpendPaise;
  const isOverspending = diff > 0;
  
  return {
    isOverspending,
    variancePaise: Math.abs(diff),
    status: isOverspending ? 'High' : 'Normal'
  };
};
