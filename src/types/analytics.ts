export interface MonthlyTotal {
  month: string;  // format: "YYYY-MM"
  total: number;
}

export interface CategoryTotal {
  category: string;
  total: number;
  color?: string;
}

export interface AnalyticsData {
  monthlyTotals: MonthlyTotal[];
  categoryTotals: CategoryTotal[];
  currentMonthTotal: number;
  previousMonthTotal: number;
  percentChange: number;
}