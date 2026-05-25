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

/**
 * Converts a local date to an IST-safe ISO string for Supabase queries.
 * 
 * ⚠️ WHY THIS EXISTS:
 * new Date("2026-05-12") parses as UTC midnight → in IST (+05:30) this is
 * "2026-05-11 18:30:00 IST" — the entire last day gets excluded from the filter.
 * 
 * FIX: We always use startOfDay/endOfDay (local timezone) then call .toISOString()
 * which converts to UTC correctly from the user's local clock.
 */
const toISTSafeStart = (date: Date): string => startOfDay(date).toISOString();
const toISTSafeEnd = (date: Date): string => endOfDay(date).toISOString();

/**
 * Resolves a DateFilterValue into a concrete { from, to } ISO string pair.
 * All times use local midnight/end-of-day to avoid IST timezone boundary bugs.
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
        from: toISTSafeStart(startOfWeek(now, { weekStartsOn: 1 })), // Monday start
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
      // 🛡️ Guard: if custom dates not set yet, fall back to current month
      if (!filter.customFrom && !filter.customTo) {
        return {
          from: toISTSafeStart(startOfMonth(now)),
          to: toISTSafeEnd(endOfMonth(now)),
        };
      }
      return {
        // If only one bound set, use now as the other
        from: filter.customFrom
          ? toISTSafeStart(filter.customFrom)
          : toISTSafeStart(startOfMonth(now)),
        to: filter.customTo
          ? toISTSafeEnd(filter.customTo)   // ← KEY FIX: end of day, not midnight
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

  // 🛡️ Stable cache key — React Query re-fetches whenever date filter changes
  const filterKey =
    dateFilter.preset === "custom"
      ? `custom:${dateFilter.customFrom?.toDateString()}:${dateFilter.customTo?.toDateString()}`
      : dateFilter.preset;

  return useQuery({
    queryKey: ["analytics", session?.user?.id, filterKey],
    queryFn: async (): Promise<AnalyticsData> => {
      if (!session?.user) throw new Error("Not authenticated");

      const { from, to } = resolveDateRange(dateFilter, now);

      // ✅ FIX: Query `transactions` (unified ledger) not stale `expenses` table
      // ✅ FIX: .gte/.lte with IST-safe ISO strings — includes full start & end day
      // ✅ FIX: No .range() limit — fetches all transactions in the date window
      const { data: transactions, error } = await supabase
        .from("transactions")
        .select("amount, category, type, date")
        .eq("user_id", session.user.id)
        .gte("date", from)   // >= start of first day (local midnight → UTC)
        .lte("date", to)     // <= end of last day (local 23:59:59 → UTC)
        .order("date", { ascending: true });

      if (error) throw error;

      if (!transactions || transactions.length === 0) {
        return {
          monthlyTotals: [],
          categoryTotals: [],
          currentMonthTotal: 0,
          previousMonthTotal: 0,
          percentChange: 0,
        };
      }

      const monthlyMap = new Map<string, number>();
      const categoryMap = new Map<string, number>();

      let currentMonthTotal = 0;
      let previousMonthTotal = 0;

      const currentMonth = now.toISOString().slice(0, 7); // "YYYY-MM"
      const prevMonth = subMonths(now, 1).toISOString().slice(0, 7);

      transactions.forEach((tx) => {
        // 🛡️ Only count expenses (not income) in analytics spend totals
        if (tx.type === "income") return;

        const amount = Number(tx.amount) || 0;
        const cat = tx.category || "Uncategorized";

        // tx.date is full ISO string — slice(0,7) gives "YYYY-MM"
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

      const percentChange = previousMonthTotal
        ? ((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100
        : 0;

      return {
        monthlyTotals,
        categoryTotals,
        currentMonthTotal,
        previousMonthTotal,
        percentChange,
      };
    },
    enabled: !!session?.user,
    staleTime: 1000 * 60 * 5,
  });
};
