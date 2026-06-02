export interface MonthlyTotal {
  month: string;  // format: "YYYY-MM"
  total: number;
}

export interface CategoryTotal {
  category: string;
  total: number;
  color?: string;
}

export interface CategoryPrediction {
  category: string;
  current: number;
  projected: number;
  anomaly: boolean;
}

export interface PredictiveData {
  projectedTotal: number;
  confidenceScore: number;
  categoryPredictions: CategoryPrediction[];
  insight: {
    isOverspending: boolean;
    variancePaise: number;
    status: string;
  };
}

export interface AnalyticsData {
  monthlyTotals: MonthlyTotal[];
  categoryTotals: CategoryTotal[];
  currentMonthTotal: number;
  previousMonthTotal: number;
  percentChange: number | null;
  predictive?: PredictiveData;
}
