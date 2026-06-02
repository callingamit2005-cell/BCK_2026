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
import { PredictiveAuditCard } from "./PredictiveAuditCard";
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
      <div className="flex flex-col justify-center items-center h-96 gap-6">
        <div className="animate-spin rounded-full h-14 w-14 border-4 border-border/40 border-t-institutional-blue shadow-sm" />
        <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] animate-pulse">Establishing Data Integrity</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-10 bg-surface border border-border/40 rounded-modal max-w-md mx-auto mt-20 shadow-institutional">
        <div className="bg-background border border-border/60 p-4 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-6 shadow-inner">
           <span className="text-institutional-blue text-2xl font-black">!</span>
        </div>
        <h2 className="text-foreground font-black uppercase tracking-tight mb-2">Protocol Failure</h2>
        <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.2em] leading-relaxed">Failed to initialize analytics engine. Verify session and try again.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div className="flex items-center gap-5">
           <div className="h-16 w-16 rounded-full bg-background border border-border/60 flex items-center justify-center shrink-0 shadow-sm transition-transform duration-700 hover:scale-105">
             <span className="text-2xl">📊</span>
           </div>
           <div>
             <h1 className="text-2xl sm:text-4xl font-black text-foreground uppercase tracking-tighter">
               Forensic Analytics
             </h1>
             <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.2em] mt-2 opacity-60">Verified Financial Operations</p>
           </div>
        </div>
      </div>

      {/* ✅ FIX: DateFilter now connected — value + onChange wired up */}
      <div className="mb-12">
        <DateFilter
          value={dateFilter}
          onChange={setDateFilter}
          filteredData={data?.monthlyTotals ?? []}
        />
      </div>

      {/* Empty state after filter applied */}
      {(!data || data.monthlyTotals.length === 0) ? (
        <div className="text-center p-20 bg-surface border border-border/40 rounded-modal max-w-lg mx-auto mt-10 shadow-premium">
          <div className="bg-background w-28 h-28 rounded-premium flex items-center justify-center mx-auto mb-10 border border-border/60 shadow-inner backdrop-blur-md">
            <span className="text-4xl opacity-20">📭</span>
          </div>
          <h3 className="text-foreground text-2xl font-black mb-4 uppercase tracking-tighter">Silent Ledger</h3>
          <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.2em] leading-relaxed">
            No expense telemetry detected for this period. <br />
            Adjust filters to expand the audit scope.
          </p>
        </div>
      ) : (
        <>
          {data.predictive && (
            <PredictiveAuditCard data={data.predictive} />
          )}

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
