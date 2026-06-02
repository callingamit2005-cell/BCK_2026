/**
 * PredictiveSpendEngine.ts
 * ────────────────────────
 * Calculates projected month-end expenditure based on current burn rate.
 * Uses integer math (PAISA) to maintain fintech precision standards.
 */

/**
 * Calculates standard deviation for a set of numbers.
 */
const calculateStdDev = (values: number[], mean: number): number => {
  if (values.length < 2) return 0;
  const squareDiffs = values.map(v => Math.pow(v - mean, 2));
  const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / values.length;
  return Math.sqrt(avgSquareDiff);
};

/**
 * Calculates a confidence score (0-1) based on time passed and volatility.
 */
export const calculateConfidenceScore = (daysPassed: number, totalDays: number, values: number[]): number => {
  // Temporal factor: Higher confidence as more days pass in the month
  const temporalFactor = daysPassed / totalDays;
  
  if (values.length < 5) return temporalFactor * 0.5; // Low data penalty

  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const stdDev = calculateStdDev(values, mean);
  
  // Coefficient of Variation: stdDev / mean. 
  // Lower CV means more predictable spending.
  const cv = mean > 0 ? stdDev / mean : 1;
  const volatilityFactor = Math.max(0, 1 - (cv / 2)); // Cap penalty impact
  
  // Balanced score: 60% time-based, 40% stability-based
  return (temporalFactor * 0.6) + (volatilityFactor * 0.4);
};

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

  // 🔒 FINTECH RULE: Keep PAISA unit throughout.
  // We multiply first then divide to maintain precision in integer land.
  const prediction = Math.round((currentMonthSpendPaise * totalDaysInMonth) / daysPassed);

  return prediction;
};

/**
 * Projects spend for each category based on current burn rate.
 */
export const getCategoryPredictions = (
  expenses: { amount: number; category: string }[],
  daysPassed: number,
  totalDays: number
): { category: string; projected: number; current: number; anomaly: boolean }[] => {
  const categoryTotals: Record<string, number> = {};
  const categoryValues: Record<string, number[]> = {};

  expenses.forEach(e => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
    if (!categoryValues[e.category]) categoryValues[e.category] = [];
    categoryValues[e.category].push(e.amount);
  });

  return Object.entries(categoryTotals).map(([category, current]) => {
    const projected = Math.round((current * totalDays) / daysPassed);
    
    // Anomaly check: Simple 95/5 approximation for category burn rate
    // If current projected is > 1.5x of a "normal" distribution of its own values
    const values = categoryValues[category];
    const mean = current / values.length;
    const stdDev = calculateStdDev(values, mean);
    const threshold = mean + (2 * stdDev);
    const isAnomaly = values.some(v => v > threshold) && projected > (current * 1.2);

    return { category, projected, current, anomaly: isAnomaly };
  });
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
  const isOverspending = diff > 100000; // Only flag if > 1000.00 INR variance
  
  return {
    isOverspending,
    variancePaise: Math.abs(diff),
    status: isOverspending ? 'High' : 'Normal'
  };
};
