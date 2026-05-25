export interface PredictionResult {
  predictedTotal: number;
  trend: "increasing" | "stable" | "decreasing";
}

export const predictMonthlySpend = (currentMonthExpenses: { amount: number; date: string }[]): PredictionResult => {
  if (currentMonthExpenses.length === 0) return { predictedTotal: 0, trend: "stable" };

  const now = new Date();
  const daysPassed = now.getDate();
  const totalDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  const currentSpend = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const dailyAvg = currentSpend / daysPassed;
  const predictedTotal = Math.round(dailyAvg * totalDays);

  // Simple trend logic
  const halfMonth = totalDays / 2;
  const spendFirstHalf = currentMonthExpenses
    .filter(e => new Date(e.date).getDate() <= halfMonth)
    .reduce((s, e) => s + e.amount, 0);
  
  let trend: "increasing" | "stable" | "decreasing" = "stable";
  if (daysPassed > halfMonth) {
    const spendSecondHalf = currentSpend - spendFirstHalf;
    if (spendSecondHalf > spendFirstHalf * 1.1) trend = "increasing";
    else if (spendSecondHalf < spendFirstHalf * 0.9) trend = "decreasing";
  }

  return { predictedTotal, trend };
};
