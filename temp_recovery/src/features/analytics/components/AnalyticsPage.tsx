import { useAnalyticsData } from "../hooks/useAnalyticsData";
import { SpendingTrendChart } from "./SpendingTrendChart";
import { CategoryPieChart } from "./CategoryPieChart";
import { MonthlyComparison } from "./MonthlyComparison";

export const AnalyticsPage = () => {
  const { data, isLoading, error } = useAnalyticsData();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-rose-600 p-8 bg-white rounded-xl shadow-lg max-w-md mx-auto mt-20">
        ❌ Failed to load analytics. Please try again later.
      </div>
    );
  }

  if (!data || data.monthlyTotals.length === 0) {
    return (
      <div className="text-center text-gray-500 p-8 bg-white rounded-xl shadow-lg max-w-md mx-auto mt-20">
        📭 No expense data yet. <br /> Add some expenses to see insights!
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-8">
        📊 Analytics Dashboard
      </h1>

      <div className="mb-8">
        <MonthlyComparison
          currentMonthTotal={data.currentMonthTotal}
          previousMonthTotal={data.previousMonthTotal}
          percentChange={data.percentChange}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SpendingTrendChart data={data.monthlyTotals} />
        <CategoryPieChart data={data.categoryTotals} />
      </div>
    </div>
  );
};