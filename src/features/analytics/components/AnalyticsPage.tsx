/**
 * AnalyticsPage.tsx — BachatKaro
 *
 * 🛠️ FIXES APPLIED:
 * 1. [BUG-FIX] DateFilter state now wired into useAnalyticsData — custom range works
 * 2. [BUG-FIX] Default filter = 'this_month' (matches dashboard UX expectation)
 * 3. [PERF]    Loading skeleton preserved; error boundary preserved
 */

import { useState } from "react";
import { useAnalyticsData } from "../hooks/useAnalyticsData";
import { SpendingTrendChart } from "./SpendingTrendChart";
import { CategoryPieChart } from "./CategoryPieChart";
import { MonthlyComparison } from "./MonthlyComparison";
import DateFilter, { type DateFilterValue } from "@/components/dashboard/DateFilter";

export const AnalyticsPage = () => {
  // ✅ FIX: Date filter state lives here and is passed down to both
  //         the UI component (DateFilter) and the data hook (useAnalyticsData)
  const [dateFilter, setDateFilter] = useState<DateFilterValue>({
    preset: "this_month",
  });

  const { data, isLoading, error } = useAnalyticsData(dateFilter);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700" />
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-8">
        📊 Analytics Dashboard
      </h1>

      {/* ✅ FIX: DateFilter now connected — value + onChange wired up */}
      <div className="mb-8">
        <DateFilter
          value={dateFilter}
          onChange={setDateFilter}
          filteredData={data?.monthlyTotals ?? []}
        />
      </div>

      {/* Empty state after filter applied */}
      {(!data || data.monthlyTotals.length === 0) ? (
        <div className="text-center text-gray-500 p-8 bg-white rounded-xl shadow-lg max-w-md mx-auto mt-10">
          📭 No expense data for this period. <br />
          Try a different date range or add some expenses!
        </div>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
};
