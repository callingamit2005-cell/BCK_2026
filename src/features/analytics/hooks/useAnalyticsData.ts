/**
 * useAnalyticsData.ts — BachatKaro
 * 
 * 🛠️ FIXES APPLIED:
 * 1. [BUG-FIX] Accepts dateFilter param — custom range now actually filters data
 * 2. [BUG-FIX] IST-safe end date — endDate set to 23:59:59.999 local time to include full last day
 * 3. [BUG-FIX] Queries `transactions` table (unified ledger) instead of stale `expenses` table
 * 4. [BUG-FIX] queryKey includes dateFilter — React Query re-fetches on date change
 * 5. [BUG-FIX] Removed hardcoded .range(0,99) — fetches all data in window
 * 6. [SECURITY] user_id RLS + .eq() filter — zero cross-user leakage
 * 7. [PHASE_2] Integrated Advanced Predictive Auditing logic
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AnalyticsData, MonthlyTotal, CategoryTotal } from "@/types/analytics";
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subMonths,
} from "date-fns";
import { type DateFilterValue } from "@/components/dashboard/DateFilter";
import {
  calculateProjectedSpend,
  calculateConfidenceScore,
  getCategoryPredictions,
  getSpendInsight
} from "@/utils/PredictiveSpendEngine";

/**
 * Converts a local date to an IST-safe ISO string for Supabase queries.
 */
const toISTSafeStart = (date: Date): string => startOfDay(date).toISOString();
const toISTSafeEnd = (date: Date): string => endOfDay(date).toISOString();

/**
 * Resolves a DateFilterValue into a concrete { from, to } ISO string pair.
 */
const resolveDateRange = (
  filter: DateFilterValue,
  now: Date,
): { from: string; to: string } => {
  switch (filter.preset) {
    case "today":
      return {
        from: toISTSafeStart(now),
        to: toISTSafeEnd(now),
      };

    case "this_week":
      return {
        from: toISTSafeStart(startOfWeek(now, { weekStartsOn: 1 })),
        to: toISTSafeEnd(endOfWeek(now, { weekStartsOn: 1 })),
      };

    case "this_month":
      return {
        from: toISTSafeStart(startOfMonth(now)),
        to: toISTSafeEnd(endOfMonth(now)),
      };

    case "last_month": {
      const lastMonth = subMonths(now, 1);
      return {
        from: toISTSafeStart(startOfMonth(lastMonth)),
        to: toISTSafeEnd(endOfMonth(lastMonth)),
      };
    }

    case "custom": {
      if (!filter.customFrom && !filter.customTo) {
        return {
          from: toISTSafeStart(startOfMonth(now)),
          to: toISTSafeEnd(endOfMonth(now)),
        };
      }
      return {
        from: filter.customFrom
          ? toISTSafeStart(filter.customFrom)
          : toISTSafeStart(startOfMonth(now)),
        to: filter.customTo
          ? toISTSafeEnd(filter.customTo)
          : toISTSafeEnd(now),
      };
    }

    default:
      return {
        from: toISTSafeStart(startOfMonth(now)),
        to: toISTSafeEnd(endOfMonth(now)),
      };
  }
};

export const useAnalyticsData = (
  dateFilter: DateFilterValue = { preset: "this_month" },
) => {
  const { session } = useAuth();
  const now = new Date();

  const filterKey =
    dateFilter.preset === "custom"
      ? `custom:${dateFilter.customFrom?.toDateString()}:${dateFilter.customTo?.toDateString()}`
      : dateFilter.preset;

  return useQuery({
    queryKey: ["analytics", session?.user?.id, filterKey],
    queryFn: async (): Promise<AnalyticsData> => {
      if (!session?.user) throw new Error("Not authenticated");

      const { from, to } = resolveDateRange(dateFilter, now);

      // [BUG-FIX Bug 3] Derive the comparison month from the active filter's start date,
      // not from `now`. This ensures "previous month" is always relative to the
      // period the user is actually viewing, not the current calendar month.
      const filterStartDate = new Date(from);
      const currentMonth = filterStartDate.toISOString().slice(0, 7);
      const prevMonth = subMonths(filterStartDate, 1).toISOString().slice(0, 7);

      const { data: transactions, error } = await supabase
        .from("transactions")
        .select("amount, category, type, date")
        .eq("user_id", session.user.id)
        .gte("date", from)
        .lte("date", to)
        .order("date", { ascending: true });

      if (error) throw error;

      if (!transactions || transactions.length === 0) {
        return {
          monthlyTotals: [],
          categoryTotals: [],
          currentMonthTotal: 0,
          previousMonthTotal: 0,
          percentChange: null,
        };
      }

      const monthlyMap = new Map<string, number>();
      const categoryMap = new Map<string, number>();

      let currentMonthTotal = 0;
      let previousMonthTotal = 0;

      // currentMonth and prevMonth are now derived from filterStartDate above

      transactions.forEach((tx) => {
        if (tx.type === "income") return;

        const amount = Number(tx.amount) || 0;
        const cat = tx.category || "Uncategorized";
        const month = (tx.date || "").slice(0, 7);
        if (!month) return;

        monthlyMap.set(month, (monthlyMap.get(month) || 0) + amount);
        categoryMap.set(cat, (categoryMap.get(cat) || 0) + amount);

        if (month === currentMonth) currentMonthTotal += amount;
        if (month === prevMonth) previousMonthTotal += amount;
      });

      const monthlyTotals: MonthlyTotal[] = Array.from(monthlyMap.entries())
        .map(([month, total]) => ({ month, total }))
        .sort((a, b) => String(a.month || "").localeCompare(String(b.month || "")));

      const categoryTotals: CategoryTotal[] = Array.from(categoryMap.entries())
        .map(([category, total]) => ({ category, total }))
        .sort((a, b) => b.total - a.total);

      // [BUG-FIX Bug 4] Return null when no prior period exists.
      // Previously returned 0, which MonthlyComparison rendered as "▲ 0.0%"
      // — implying a prior period with identical spending exists. null means
      // "no comparison available" and the component renders "No Prior Period".
      const percentChange: number | null = previousMonthTotal
        ? ((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100
        : null;

      // [BUG-FIX Bug 2] isCurrentPeriod was inverted — it previously checked
      // `toISTSafeEnd(now) <= to` which is TRUE for future ranges and FALSE for past
      // ranges — the exact opposite of correct. Fixed: check whether `now` falls
      // within the resolved [from, to] window, meaning we are currently inside
      // the period being viewed and projection is meaningful.
      const nowISO = now.toISOString();
      const isCurrentPeriod =
        dateFilter.preset === "this_month" ||
        (dateFilter.preset === "custom" && nowISO >= from && nowISO <= to);

      let predictive;
      if (isCurrentPeriod && currentMonthTotal > 0) {
        const daysPassed = now.getDate();
        const totalDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const currentMonthExpenses = transactions
          .filter(tx => tx.type !== 'income' && (tx.date || "").slice(0, 7) === currentMonth)
          .map(tx => ({ amount: Number(tx.amount), category: tx.category || "Uncategorized" }));

        const projectedTotal = calculateProjectedSpend(currentMonthTotal);
        const confidenceScore = calculateConfidenceScore(daysPassed, totalDays, currentMonthExpenses.map(e => e.amount));
        const categoryPredictions = getCategoryPredictions(currentMonthExpenses, daysPassed, totalDays);
        const insight = getSpendInsight(previousMonthTotal || currentMonthTotal, projectedTotal);

        predictive = {
          projectedTotal,
          confidenceScore,
          categoryPredictions,
          insight
        };
      }

      return {
        monthlyTotals,
        categoryTotals,
        currentMonthTotal,
        previousMonthTotal,
        percentChange,
        predictive
      };
    },
    enabled: !!session?.user,
    staleTime: 1000 * 60 * 5,
  });
};