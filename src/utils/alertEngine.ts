import { formatCurrency } from './currencyFormatter';

export const getOverspendingAlerts = (
  allExpenses: { amount: number; category: string; date: string; sender?: string }[]
): string[] => {
  const alerts: string[] = [];
  if (allExpenses.length < 5) return [];

  const currentMonth = new Date().getMonth();
  const currentMonthExpenses = allExpenses.filter(e => new Date(e.date).getMonth() === currentMonth);
  
  if (currentMonthExpenses.length === 0) return [];

  const monthlyTotal = currentMonthExpenses.reduce((s, e) => s + e.amount, 0);
  const avgExpense = monthlyTotal / currentMonthExpenses.length;

  // 1. High single transaction alert
  const lastTx = currentMonthExpenses[0];
  if (lastTx && lastTx.amount > avgExpense * 3) {
    alerts.push(`🚨 High expense detected: ${formatCurrency(lastTx.amount)} on ${lastTx.sender || lastTx.category}`);
  }

  // 2. Category spike (compared to previous expenses)
  const catTotals: Record<string, number[]> = {};
  allExpenses.forEach(e => {
    if (!catTotals[e.category]) catTotals[e.category] = [];
    catTotals[e.category].push(e.amount);
  });

  Object.entries(catTotals).forEach(([cat, amounts]) => {
    if (amounts.length > 3) {
      const latest = amounts[0];
      const prevAvg = amounts.slice(1, 4).reduce((a, b) => a + b, 0) / 3;
      if (latest > prevAvg * 2) {
        alerts.push(`🚩 Spike in ${cat}: ${formatCurrency(latest)}`);
      }
    }
  });

  return alerts.slice(0, 2);
};
