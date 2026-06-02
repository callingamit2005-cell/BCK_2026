/**
 * alertEngine.ts - BachatKaro Intelligence Layer
 * Mandate: Statistical Outlier Detection (95/5 Rule)
 * Goal: Zero alert fatigue. Only notify on meaningful financial anomalies.
 */

import { formatCurrency } from './currencyFormatter';

// 🛡️ [95/5_GOVERNANCE] Minimum amount to consider an alert "Critical"
// Prevents alerting on small spikes (e.g. 10 INR -> 50 INR)
const MIN_CRITICAL_AMOUNT = 50000; // 500.00 INR in paisa

/**
 * Calculates standard deviation for a set of numbers.
 * Used to establish the "95% Confidence Interval" of normal spending.
 */
const calculateStdDev = (values: number[], mean: number): number => {
  if (values.length < 2) return 0;
  const squareDiffs = values.map(v => Math.pow(v - mean, 2));
  const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / values.length;
  return Math.sqrt(avgSquareDiff);
};

export const getOverspendingAlerts = (
  allExpenses: { amount: number; category: string; date: string; sender?: string }[]
): string[] => {
  const alerts: string[] = [];
  
  // Need sufficient data to establish a baseline
  if (allExpenses.length < 8) return [];

  // 1. STATISTICAL ANOMALY DETECTION (95/5 RULE)
  // Establish baseline from the last 20 transactions
  const baseline = allExpenses.slice(0, 20);
  const totalAmount = baseline.reduce((s, e) => s + e.amount, 0);
  const mean = totalAmount / baseline.length;
  const stdDev = calculateStdDev(baseline.map(e => e.amount), mean);
  
  // 95/5 Rule Enforcement:
  // In a normal distribution, 95% of data falls within ~2 standard deviations.
  // We only alert on the remaining 5% of "Extreme Outliers".
  const criticalThreshold = mean + (2 * stdDev);
  const latestTx = allExpenses[0]; 

  if (latestTx && latestTx.amount > criticalThreshold && latestTx.amount > MIN_CRITICAL_AMOUNT) {
    alerts.push(`🚨 Critical anomaly: ${formatCurrency(latestTx.amount)} on ${latestTx.sender || latestTx.category}`);
  }

  // 2. VELOCITY SPIKE DETECTION
  // Identify if a specific category is showing an anomalous trend vs its own history.
  const catTotals: Record<string, number[]> = {};
  allExpenses.forEach(e => {
    if (!catTotals[e.category]) catTotals[e.category] = [];
    catTotals[e.category].push(e.amount);
  });

  Object.entries(catTotals).forEach(([cat, amounts]) => {
    // Only analyze categories with enough history
    if (amounts.length >= 6) {
      const latest = amounts[0];
      const history = amounts.slice(1, 11); // Compare against last 10 historical hits
      const hMean = history.reduce((a, b) => a + b, 0) / history.length;
      const hStdDev = calculateStdDev(history, hMean);
      
      // 95/5 Rule: Alert if latest is outside 2.5 std devs of its own history
      const catThreshold = hMean + (2.5 * hStdDev); 
      if (latest > catThreshold && latest > MIN_CRITICAL_AMOUNT) {
         alerts.push(`🚩 Velocity Spike in ${cat}: ${formatCurrency(latest)}`);
      }
    }
  });

  // 🛡️ [95/5_ENFORCEMENT] Strictly one alert at a time.
  // Prevents overwhelming the user.
  return alerts.slice(0, 1);
};
